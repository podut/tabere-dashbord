import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { getSupabaseAdmin } from '$lib/server/supabase.server';
import type { RequestHandler } from './$types';

// Creeaza un cont nou de echipa (moderator sau admin). Folosește cheia
// service_role (doar pe server). Apelantul trebuie sa fie admin SI sa se fi
// autentificat recent cu parola (aceeasi verificare ca la backup, facuta in
// baza de date cu JWT-ul lui, deci nu poate fi ocolita din browser).

const AREAS = new Set([
	'events', 'bookings', 'services', 'equipment', 'gallery', 'partners',
	'products', 'orders', 'blog', 'notifications', 'site'
]);

export const POST: RequestHandler = async ({ request }) => {
	const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
	if (!token) return json({ error: 'Neautentificat' }, { status: 401 });

	const caller = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: { headers: { Authorization: `Bearer ${token}` } },
		auth: { persistSession: false, autoRefreshToken: false }
	});

	const { data: isAdmin, error: adminErr } = await caller.rpc('is_admin');
	if (adminErr || isAdmin !== true) return json({ error: 'Doar adminii pot crea conturi' }, { status: 403 });

	const { error: freshErr } = await (caller as any).rpc('require_recent_login');
	if (freshErr) return json({ error: 'Reintroduceți parola contului de admin' }, { status: 403 });

	let body: any;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Cerere invalidă' }, { status: 400 });
	}

	const email = String(body.email ?? '').trim().toLowerCase();
	const name = String(body.name ?? '').trim().slice(0, 120);
	const password = String(body.password ?? '');
	const role = body.role === 'admin' ? 'admin' : 'client';
	const permissions: string[] = Array.isArray(body.permissions)
		? [...new Set<string>(body.permissions.filter((p: unknown): p is string => typeof p === 'string' && AREAS.has(p)))]
		: [];

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Email invalid' }, { status: 400 });
	if (password.length < 10) return json({ error: 'Parola temporară trebuie să aibă minim 10 caractere' }, { status: 400 });
	if (role !== 'admin' && permissions.length === 0) {
		return json({ error: 'Alege cel puțin o secțiune pentru moderator' }, { status: 400 });
	}

	const admin = getSupabaseAdmin();
	const created = await admin.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
		user_metadata: { name }
	});
	if (created.error || !created.data.user) {
		const msg = created.error?.message ?? 'Crearea contului a eșuat';
		return json({ error: msg }, { status: /already|exist|registered/i.test(msg) ? 409 : 400 });
	}

	const id = created.data.user.id;
	// Rândul din profiles e creat de triggerul handle_new_user; upsert ca să fim siguri.
	const { error: profErr } = await admin
		.from('profiles')
		.upsert({ id, email, name, role, permissions } as any, { onConflict: 'id' });
	if (profErr) {
		await admin.auth.admin.deleteUser(id).catch(() => {});
		return json({ error: `Profil: ${profErr.message}` }, { status: 500 });
	}

	return json({ id, email, role, permissions }, { status: 201 });
};
