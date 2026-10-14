<script lang="ts">
	import { zipSync, strToU8 } from 'fflate';
	import { createClient, type SupabaseClient } from '@supabase/supabase-js';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
	import { supabase } from '$lib/supabase';
	import { showToast } from '$lib/admin/notify.svelte';

	type StorageItem = { bucket: string; name: string; size: number; mimetype: string | null };

	let loading = $state(false);
	let password = $state('');
	let phase = $state('');
	let done = $state(0);
	let total = $state(0);
	let lastBackup = $state<{ name: string; mb: string; at: string; files: number; failed: number } | null>(null);

	let lastMail = $state<{ name: string; mb: string; at: string; messages: number; failed: number } | null>(null);

	const CONCURRENCY = 6;

	function stamp(d: Date) {
		const p = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
	}

	function saveBlob(blob: Blob, name: string) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = name;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 30_000);
	}

	// Backup-ul cere autentificare cu parola RECENTA (verificat si in baza de date,
	// nu doar aici): folosim un client separat, ca sesiunea curenta sa ramana
	// neschimbata, iar la final il inchidem.
	async function reauthClient(): Promise<SupabaseClient> {
		const { data: u } = await supabase.auth.getUser();
		const email = u.user?.email;
		if (!email) throw new Error('Sesiune expirată: reautentifică-te în panou');
		if (!password) throw new Error('Introdu parola contului de admin');

		const client = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			auth: {
				persistSession: false,
				autoRefreshToken: false,
				detectSessionInUrl: false,
				storageKey: 'htcmx-backup-reauth'
			}
		});
		const { error } = await client.auth.signInWithPassword({ email, password });
		password = '';
		if (error) throw new Error('Parolă incorectă');
		return client;
	}

	async function fetchDump(client: SupabaseClient): Promise<string> {
		const { data, error } = await client.rpc('admin_backup_dump');
		if (error) throw error;
		const dump = data as unknown as string;
		if (typeof dump !== 'string' || dump.length === 0) throw new Error('Backup gol');
		return dump;
	}

	async function fetchStorageIndex(client: SupabaseClient): Promise<StorageItem[]> {
		const { data, error } = await client.rpc('admin_backup_storage_index');
		if (error) throw error;
		return (data ?? []) as StorageItem[];
	}

	const README = (at: string) => `HTCMX - backup complet (${at})

Continut:
  database.sql          schema + date (public), conturi (auth.users/identities), bucket-uri Storage
  storage/<bucket>/...  toate fisierele din Storage (imagini, avatare etc.)
  storage_manifest.json lista fisierelor + eventualele erori la descarcare
  restore_storage.py    reincarca fisierele in Storage (vezi mai jos)

RESTAURARE
1) Baza de date (pe un Supabase/Postgres proaspat, cu schema auth existenta):
     psql "$DATABASE_URL" -f database.sql
2) Fisiere:
     set SUPABASE_URL=https://<proiect>.supabase.co
     set SUPABASE_SERVICE_ROLE_KEY=<cheia service_role>
     python restore_storage.py

ATENTIE: arhiva contine date personale si hash-uri de parole. Pastreaz-o criptata / intr-un loc sigur.
`;

	const RESTORE_PY = `#!/usr/bin/env python3
"""Reincarca fisierele din folderul storage/ in Supabase Storage (cu service_role)."""
import mimetypes, os, sys, urllib.parse, urllib.request

url = os.environ.get("SUPABASE_URL", "").rstrip("/")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not url or not key:
    sys.exit("Seteaza SUPABASE_URL si SUPABASE_SERVICE_ROLE_KEY")

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "storage")
ok = bad = 0
for bucket in sorted(os.listdir(root)):
    for dirpath, _, files in os.walk(os.path.join(root, bucket)):
        for fn in files:
            path = os.path.join(dirpath, fn)
            name = os.path.relpath(path, os.path.join(root, bucket)).replace(os.sep, "/")
            req = urllib.request.Request(
                f"{url}/storage/v1/object/{bucket}/{urllib.parse.quote(name)}",
                data=open(path, "rb").read(), method="POST",
                headers={"Authorization": f"Bearer {key}", "apikey": key, "x-upsert": "true",
                         "Content-Type": mimetypes.guess_type(fn)[0] or "application/octet-stream"})
            try:
                urllib.request.urlopen(req, timeout=120); ok += 1
            except Exception as e:
                bad += 1; print("EROARE", bucket, name, e)
print(f"Gata: {ok} incarcate, {bad} erori")
`;

	async function backupComplet() {
		if (loading) return;
		loading = true;
		done = 0;
		total = 0;
		let client: SupabaseClient | null = null;
		try {
			phase = 'Se verifică parola…';
			client = await reauthClient();
			phase = 'Se exportă baza de date…';
			const [dump, index] = await Promise.all([fetchDump(client), fetchStorageIndex(client)]);
			const sb = client;

			total = index.length;
			phase = `Se descarcă fișierele (0/${total})…`;
			const files: Record<string, Uint8Array> = {};
			const failed: { bucket: string; name: string; error: string }[] = [];

			let next = 0;
			async function worker() {
				while (next < index.length) {
					const item = index[next++];
					try {
						const { data, error } = await sb.storage.from(item.bucket).download(item.name);
						if (error || !data) throw error ?? new Error('fără conținut');
						files[`storage/${item.bucket}/${item.name}`] = new Uint8Array(await data.arrayBuffer());
					} catch (e: any) {
						failed.push({ bucket: item.bucket, name: item.name, error: String(e?.message ?? e) });
					}
					done++;
					phase = `Se descarcă fișierele (${done}/${total})…`;
				}
			}
			await Promise.all(Array.from({ length: CONCURRENCY }, worker));

			phase = 'Se creează arhiva…';
			const now = new Date();
			const manifest = {
				created_at: now.toISOString(),
				files: index.length - failed.length,
				failed,
				items: index
			};
			const entries: Record<string, [Uint8Array, { level: 0 | 6 }]> = {
				'database.sql': [strToU8(dump), { level: 6 }],
				'README.txt': [strToU8(README(now.toLocaleString('ro-RO'))), { level: 6 }],
				'restore_storage.py': [strToU8(RESTORE_PY), { level: 6 }],
				'storage_manifest.json': [strToU8(JSON.stringify(manifest, null, 2)), { level: 6 }]
			};
			// imaginile sunt deja comprimate: doar le stocam
			for (const [k, v] of Object.entries(files)) entries[k] = [v, { level: 0 }];

			const archive = zipSync(entries);
			const name = `htcmx-backup-${stamp(now)}.zip`;
			const blob = new Blob([archive as unknown as BlobPart], { type: 'application/zip' });
			saveBlob(blob, name);

			lastBackup = {
				name,
				mb: (blob.size / 1048576).toFixed(1),
				at: now.toLocaleString('ro-RO'),
				files: index.length - failed.length,
				failed: failed.length
			};
			showToast(
				failed.length ? 'error' : 'success',
				failed.length
					? `Backup descărcat, dar ${failed.length} fișiere n-au putut fi citite`
					: 'Backup complet descărcat'
			);
		} catch (e: any) {
			console.error('Backup eșuat', e);
			showToast('error', `Backup eșuat: ${e?.message ?? 'eroare necunoscută'}`);
		} finally {
			await client?.auth.signOut({ scope: 'local' }).catch(() => {});
			loading = false;
			phase = '';
		}
	}

	// Backup email: serverul panoului citește căsuțele (IMAP, cont dedicat backup@) și întoarce
	// un .zip cu fișiere .eml. Aceeași parolă recentă ca la backup-ul complet.
	async function backupEmail() {
		if (loading) return;
		loading = true;
		done = 0;
		total = 0;
		phase = 'Se verifică parola…';
		let client: SupabaseClient | null = null;
		try {
			client = await reauthClient();
			const { data: s } = await client.auth.getSession();
			phase = 'Se citesc căsuțele de email…';
			const res = await fetch('/api/admin/mail-backup', {
				method: 'POST',
				headers: { Authorization: `Bearer ${s.session?.access_token}` }
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error ?? `Eroare ${res.status}`);
			}
			const blob = await res.blob();
			const messages = Number(res.headers.get('X-Mail-Messages') ?? 0);
			const failed = Number(res.headers.get('X-Mail-Failed') ?? 0);
			const now = new Date();
			const name = `htcmx-mail-${stamp(now)}.zip`;
			saveBlob(blob, name);
			lastMail = { name, mb: (blob.size / 1048576).toFixed(1), at: now.toLocaleString('ro-RO'), messages, failed };
			showToast(failed ? 'error' : 'success', failed ? `Backup email descărcat, dar ${failed} căsuțe nu au putut fi citite` : 'Backup email descărcat');
		} catch (e: any) {
			showToast('error', `Backup email eșuat: ${e?.message ?? 'eroare necunoscută'}`);
		} finally {
			await client?.auth.signOut({ scope: 'local' }).catch(() => {});
			loading = false;
			phase = '';
		}
	}

	async function doarSql() {
		if (loading) return;
		loading = true;
		phase = 'Se verifică parola…';
		let client: SupabaseClient | null = null;
		try {
			client = await reauthClient();
			phase = 'Se exportă baza de date…';
			const dump = await fetchDump(client);
			const name = `htcmx-db-${stamp(new Date())}.sql`;
			saveBlob(new Blob([dump], { type: 'application/sql;charset=utf-8' }), name);
			showToast('success', 'Backup SQL descărcat');
		} catch (e: any) {
			showToast('error', `Backup eșuat: ${e?.message ?? 'eroare necunoscută'}`);
		} finally {
			await client?.auth.signOut({ scope: 'local' }).catch(() => {});
			loading = false;
			phase = '';
		}
	}
</script>

<div class="backup-manager">
	<p class="subtitle-text">
		Un singur click: descarcă pe calculatorul tău tot ce ai nevoie ca să refaci aplicația dacă se întâmplă ceva.
	</p>

	<div class="backup-card">
		<div class="backup-card-head">
			<h3 class="backup-title">Backup complet</h3>
			<p class="backup-desc">
				Arhivă <code>.zip</code> cu: baza de date (schema + toate datele), <strong>conturile utilizatorilor</strong>
				și <strong>toate fișierele</strong> din Storage (imagini galerie, avatare, bannere), plus instrucțiuni și
				scriptul de restaurare.
			</p>
		</div>

		<label class="pw-field">
			<span>Parola contului de admin (confirmare)</span>
			<input
				type="password"
				autocomplete="current-password"
				placeholder="••••••••"
				bind:value={password}
				disabled={loading}
				onkeydown={(e) => e.key === 'Enter' && password && backupComplet()}
			/>
		</label>

		<button class="btn-backup" onclick={backupComplet} disabled={loading || !password}>
			{loading ? 'Se pregătește…' : '💾 Descarcă backup complet'}
		</button>

		{#if loading}
			<div class="progress" role="status" aria-live="polite">
				<p class="progress-text">{phase}</p>
				{#if total > 0}
					<progress max={total} value={done}></progress>
				{/if}
			</div>
		{/if}

		{#if lastBackup && !loading}
			<p class="backup-last">
				Ultimul backup: <strong>{lastBackup.name}</strong> · {lastBackup.mb} MB · {lastBackup.files} fișiere
				{#if lastBackup.failed > 0}· <span class="warn">{lastBackup.failed} nereușite (vezi storage_manifest.json)</span>{/if}
				· {lastBackup.at}
			</p>
		{/if}

		<button class="btn-link" onclick={doarSql} disabled={loading || !password}>Doar baza de date (.sql, fără fișiere)</button>
	</div>

	<div class="backup-card mail-card">
		<div class="backup-card-head">
			<h3 class="backup-title">Backup email</h3>
			<p class="backup-desc">
				Arhivă <code>.zip</code> cu toate mesajele din căsuțele <code>@taberehtcmx.ro</code> (câte un fișier
				<code>.eml</code> per mesaj, pe cont și dosar), plus scriptul de restaurare. Folosește parola de admin
				introdusă mai sus.
			</p>
		</div>

		<button class="btn-backup" onclick={backupEmail} disabled={loading || !password}>
			{loading ? 'Se pregătește…' : '✉️ Descarcă backup email'}
		</button>

		{#if lastMail && !loading}
			<p class="backup-last">
				Ultimul backup email: <strong>{lastMail.name}</strong> · {lastMail.mb} MB · {lastMail.messages} mesaje
				{#if lastMail.failed > 0}· <span class="warn">{lastMail.failed} căsuțe nereușite</span>{/if}
				· {lastMail.at}
			</p>
		{/if}
	</div>

	<div class="backup-note">
		<h4>Restaurare</h4>
		<p>
			Instrucțiunile sunt în <code>README.txt</code> din arhivă: <code>psql … -f database.sql</code> pentru date și
			conturi, apoi <code>python restore_storage.py</code> pentru fișiere.
		</p>
		<h4>De ce cere parola</h4>
		<p>
			Backup-ul conține toate datele, așa că cere reintroducerea parolei de admin (verificată și în baza de date,
			valabilă 5 minute). O sesiune lăsată deschisă sau furată nu poate genera backup fără parolă.
		</p>
		<h4>Păstrează arhiva în siguranță</h4>
		<p>
			Conține date personale (rezervări, comenzi, conturi) și hash-uri de parole. Nu o trimite pe email/chat;
			salveaz-o pe un disc criptat sau într-un loc cu acces limitat. Fă backup periodic (de ex. săptămânal).
		</p>
	</div>
</div>

<style>
	.subtitle-text { color: var(--text-grey); font-size: 1.4rem; margin-bottom: 2.4rem; font-weight: 500; }
	.backup-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 2.4rem; display: flex; flex-direction: column; gap: 1.6rem; align-items: flex-start; margin-bottom: 2.4rem; }
	.mail-card { margin-top: 2rem; }
	.backup-title { font-size: 2rem; font-weight: 700; color: var(--text); margin: 0 0 0.4rem; }
	.backup-desc { font-size: 1.3rem; color: var(--text-grey); margin: 0; }
	.btn-backup { background: var(--primary); color: var(--bg-dark); border: none; border-radius: 10px; padding: 1.2rem 2.4rem; font-size: 1.6rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
	.btn-backup:hover { opacity: 0.85; }
	.btn-backup:disabled { opacity: 0.5; cursor: progress; }
	.pw-field { display: flex; flex-direction: column; gap: 0.6rem; width: min(100%, 36rem); font-size: 1.3rem; color: var(--text-grey); }
	.pw-field input { background: var(--bg-dark); color: var(--text); border: 1px solid var(--border); border-radius: 10px; padding: 1rem 1.2rem; font-size: 1.5rem; }
	.btn-link { background: none; border: none; color: var(--text-grey); font-size: 1.3rem; text-decoration: underline; cursor: pointer; padding: 0; }
	.btn-link:disabled { opacity: 0.5; cursor: default; }
	.progress { width: 100%; }
	.progress-text { font-size: 1.3rem; color: var(--text-grey); margin: 0 0 0.6rem; }
	progress { width: 100%; height: 1rem; accent-color: var(--primary); }
	.backup-last { font-size: 1.3rem; color: var(--text-grey); margin: 0; }
	.warn { color: #e0a030; }
	.backup-note { font-size: 1.3rem; color: var(--text-grey); }
	.backup-note h4 { color: var(--text); font-size: 1.5rem; margin: 1.2rem 0 0.6rem; }
	.backup-note p { margin: 0; }
	code { background: rgba(255, 255, 255, 0.06); padding: 0.1rem 0.5rem; border-radius: 6px; font-size: 1.2rem; word-break: break-word; }
	@media (max-width: 600px) {
		.backup-card { padding: 1.6rem; }
		.btn-backup { width: 100%; }
	}
</style>
