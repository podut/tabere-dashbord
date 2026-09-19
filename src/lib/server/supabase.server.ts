import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import type { Database } from '$lib/types/database';

// Bypass-eaza RLS. Foloseste DOAR server-side, pentru validari care trebuie
// sa vada toate randurile (ex: verificare capacitate booking-uri).
// NU importa acest fisier din cod care poate ajunge in bundle-ul de browser.
//
// Foloseste $env/dynamic/private (citit la runtime), nu $env/static/private,
// ca sa nu ajunga secretul copt in imaginea Docker la build-time — se seteaza
// direct in mediul containerului (docker-compose "environment:").
//
// Initializare lazy: SvelteKit importa toate rutele +server.ts la build time
// (postbuild analyse) ca sa le detecteze optiunile de prerender - o verificare
// eager aici ar arunca eroare si ar pica build-ul, desi variabila chiar nu
// trebuie sa existe decat la runtime.
let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
	if (!_supabaseAdmin) {
		if (!env.SUPABASE_SERVICE_ROLE_KEY) {
			throw new Error('SUPABASE_SERVICE_ROLE_KEY nu este setat in mediul serverului');
		}
		_supabaseAdmin = createClient<Database>(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
			auth: { persistSession: false }
		});
	}
	return _supabaseAdmin;
}
