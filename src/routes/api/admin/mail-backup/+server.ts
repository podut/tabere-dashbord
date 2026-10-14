import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { ImapFlow } from 'imapflow';
import { strToU8, zipSync } from 'fflate';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { RequestHandler } from './$types';

// Backup al căsuțelor de email (Stalwart) ca arhivă .zip de fișiere .eml, câte un folder
// per cont și per dosar. Accesul la căsuțe se face cu un cont dedicat (`backup@…`) care are
// doar permisiunea de impersonare IMAP (login "cont%backup@…"), nu parola adminului Stalwart.
//
// Ca la backup-ul bazei de date, apelantul trebuie să fie admin și să se fi autentificat
// recent cu parola (verificat în baza de date cu JWT-ul lui).

const DEFAULT_ACCOUNTS = [
	'contact@taberehtcmx.ro',
	'rezervari@taberehtcmx.ro',
	'noreply@taberehtcmx.ro',
	'admin@taberehtcmx.ro'
];

const RESTORE_PY = `#!/usr/bin/env python3
"""Reincarca mesajele din folderul mail/ in casutele Stalwart (IMAP APPEND, cu contul backup)."""
import imaplib, os, sys, ssl, email.utils, time

host = os.environ.get("MAIL_HOST", "mail.taberehtcmx.ro")
user = os.environ.get("MAIL_BACKUP_USER", "backup@taberehtcmx.ro")
pw = os.environ.get("MAIL_BACKUP_PASSWORD", "")
if not pw:
    sys.exit("Seteaza MAIL_BACKUP_PASSWORD (parola contului backup@)")

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mail")
ok = bad = 0
for account in sorted(os.listdir(root)):
    m = imaplib.IMAP4_SSL(host, 993, ssl_context=ssl.create_default_context())
    m.login(account + "%" + user, pw)
    for dirpath, _, files in os.walk(os.path.join(root, account)):
        folder = os.path.relpath(dirpath, os.path.join(root, account)).replace(os.sep, "/")
        if folder == "." or not files:
            continue
        m.create('"' + folder + '"')
        for fn in sorted(files):
            if not fn.endswith(".eml"):
                continue
            try:
                m.append('"' + folder + '"', None, None, open(os.path.join(dirpath, fn), "rb").read())
                ok += 1
            except Exception as e:
                bad += 1
                print("EROARE", account, folder, fn, e)
    m.logout()
print("Gata: %d mesaje incarcate, %d erori" % (ok, bad))
`;

const README = (at: string, accounts: string[], messages: number) => `HTCMX - backup email (${at})

Continut:
  mail/<cont>/<dosar>/<uid>.eml   fiecare mesaj, in format RFC 822 (poate fi deschis cu orice client)
  manifest.json                   lista mesajelor (cont, dosar, uid, data, flaguri) + eventuale erori
  restore_mail.py                 reincarca mesajele in casutele Stalwart

Conturi incluse: ${accounts.join(', ')}
Mesaje: ${messages}

RESTAURARE
  set MAIL_HOST=mail.taberehtcmx.ro
  set MAIL_BACKUP_PASSWORD=<parola contului backup@>
  python restore_mail.py

ATENTIE: arhiva contine corespondenta privata. Pastreaz-o criptata / intr-un loc sigur.
`;

export const POST: RequestHandler = async ({ request }) => {
	const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
	if (!token) return json({ error: 'Neautentificat' }, { status: 401 });

	const caller = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: { headers: { Authorization: `Bearer ${token}` } },
		auth: { persistSession: false, autoRefreshToken: false }
	});

	const { data: isAdmin, error: adminErr } = await caller.rpc('is_admin');
	if (adminErr || isAdmin !== true) return json({ error: 'Doar adminii pot face backup' }, { status: 403 });

	const { error: freshErr } = await (caller as any).rpc('require_recent_login');
	if (freshErr) return json({ error: 'Reintroduceți parola contului de admin' }, { status: 403 });

	const password = env.MAIL_BACKUP_PASSWORD;
	if (!password) return json({ error: 'MAIL_BACKUP_PASSWORD nu este setat pe server' }, { status: 500 });

	const host = env.MAIL_IMAP_HOST || 'mail.taberehtcmx.ro';
	const backupUser = env.MAIL_BACKUP_USER || 'backup@taberehtcmx.ro';
	const accounts = (env.MAIL_BACKUP_ACCOUNTS || DEFAULT_ACCOUNTS.join(','))
		.split(',')
		.map((a) => a.trim())
		.filter(Boolean);
	const maxBytes = Number(env.MAIL_BACKUP_MAX_MB || 300) * 1048576;

	const files: Record<string, [Uint8Array, { level: 0 | 6 }]> = {};
	const items: { account: string; folder: string; uid: number; date: string | null; flags: string[]; size: number }[] = [];
	const failed: { account: string; folder?: string; error: string }[] = [];
	let bytes = 0;

	for (const account of accounts) {
		const client = new ImapFlow({
			host,
			port: 993,
			secure: true,
			auth: { user: `${account}%${backupUser}`, pass: password },
			logger: false
		});
		client.on('error', () => {});
		try {
			await client.connect();
			const boxes = await client.list();
			for (const box of boxes) {
				if (box.flags.has('\\Noselect') || box.flags.has('\\NonExistent')) continue;
				const lock = await client.getMailboxLock(box.path, { readOnly: true });
				try {
					if (!client.mailbox || (client.mailbox as any).exists === 0) continue;
					for await (const msg of client.fetch('1:*', { uid: true, source: true, flags: true, internalDate: true })) {
						if (!msg.source) continue;
						bytes += msg.source.length;
						if (bytes > maxBytes) {
							throw new Error(`Arhiva depășește ${Math.round(maxBytes / 1048576)} MB (MAIL_BACKUP_MAX_MB)`);
						}
						files[`mail/${account}/${box.path}/${msg.uid}.eml`] = [new Uint8Array(msg.source), { level: 0 }];
						items.push({
							account,
							folder: box.path,
							uid: msg.uid,
							date: msg.internalDate ? new Date(msg.internalDate).toISOString() : null,
							flags: [...(msg.flags ?? [])],
							size: msg.source.length
						});
					}
				} finally {
					lock.release();
				}
			}
		} catch (e: any) {
			if (String(e?.message ?? '').includes('MAIL_BACKUP_MAX_MB')) {
				return json({ error: e.message }, { status: 413 });
			}
			failed.push({ account, error: String(e?.message ?? e) });
		} finally {
			await client.logout().catch(() => {});
		}
	}

	if (failed.length === accounts.length) {
		return json({ error: `Nu m-am putut conecta la căsuțe: ${failed[0]?.error ?? 'eroare necunoscută'}` }, { status: 502 });
	}

	const now = new Date();
	const manifest = { created_at: now.toISOString(), accounts, messages: items.length, failed, items };
	files['manifest.json'] = [strToU8(JSON.stringify(manifest, null, 2)), { level: 6 }];
	files['README.txt'] = [strToU8(README(now.toLocaleString('ro-RO'), accounts, items.length)), { level: 6 }];
	files['restore_mail.py'] = [strToU8(RESTORE_PY), { level: 6 }];

	const archive = zipSync(files);
	const stamp = now.toISOString().slice(0, 16).replace(/[:T]/g, '-');
	return new Response(archive as unknown as BodyInit, {
		status: 200,
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="htcmx-mail-${stamp}.zip"`,
			'X-Mail-Messages': String(items.length),
			'X-Mail-Failed': String(failed.length),
			'Cache-Control': 'no-store'
		}
	});
};
