<script lang="ts">
	import { onMount } from 'svelte';
	import { createClient, type SupabaseClient } from '@supabase/supabase-js';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
	import { supabase } from '$lib/supabase';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';

	type Member = {
		id: string;
		name: string | null;
		email: string | null;
		role: 'client' | 'admin';
		permissions: string[];
	};

	const AREAS: { id: string; label: string; hint: string }[] = [
		{ id: 'events', label: 'Evenimente', hint: 'creează / editează evenimente' },
		{ id: 'bookings', label: 'Programări', hint: 'vede și gestionează rezervările' },
		{ id: 'services', label: 'Servicii', hint: 'gestionează serviciile' },
		{ id: 'equipment', label: 'Echipament', hint: 'inventar echipament' },
		{ id: 'products', label: 'Produse', hint: 'magazin' },
		{ id: 'orders', label: 'Comenzi', hint: 'comenzi magazin' },
		{ id: 'gallery', label: 'Galerie', hint: 'poze galerie' },
		{ id: 'blog', label: 'Blog', hint: 'articole' },
		{ id: 'notifications', label: 'Notificări', hint: 'notificări push' },
		{ id: 'site', label: 'Aplicație mobilă', hint: 'bannere și texte' },
		{ id: 'partners', label: 'Parteneri', hint: 'parteneri' }
	];

	let members = $state<Member[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let password = $state(''); // parola adminului curent (confirmare)

	// Formular: contul pe care îl editezi / creezi
	let editing = $state<{ id?: string; email: string; name: string; role: 'client' | 'admin'; permissions: string[]; tempPassword: string } | null>(null);

	async function load() {
		loading = true;
		const cols = 'id, name, email, role, permissions';
		const [admins, mods] = await Promise.all([
			supabase.from('profiles').select(cols).eq('role', 'admin'),
			supabase.from('profiles').select(cols).neq('permissions', '{}')
		]);
		const error = admins.error ?? mods.error;
		if (error) showToast('error', `Nu am putut încărca echipa: ${error.message}`);
		const byId = new Map<string, Member>();
		for (const m of [...(admins.data ?? []), ...(mods.data ?? [])] as unknown as Member[]) {
			byId.set(m.id, { ...m, permissions: m.permissions ?? [] });
		}
		members = [...byId.values()].sort((a, b) =>
			a.role === b.role ? (a.name ?? '').localeCompare(b.name ?? '') : a.role === 'admin' ? -1 : 1
		);
		loading = false;
	}

	onMount(load);

	function newMember() {
		editing = { email: '', name: '', role: 'client', permissions: [], tempPassword: '' };
	}

	function edit(m: Member) {
		editing = { id: m.id, email: m.email ?? '', name: m.name ?? '', role: m.role, permissions: [...m.permissions], tempPassword: '' };
	}

	function toggle(area: string) {
		if (!editing) return;
		editing.permissions = editing.permissions.includes(area)
			? editing.permissions.filter((a) => a !== area)
			: [...editing.permissions, area];
	}

	// Client separat, autentificat cu parola: modificarea de roluri/permisiuni
	// cere parola recenta (verificat si in baza de date).
	async function reauth(): Promise<SupabaseClient> {
		const { data: u } = await supabase.auth.getUser();
		const email = u.user?.email;
		if (!email) throw new Error('Sesiune expirată: reautentifică-te în panou');
		if (!password) throw new Error('Introdu parola ta de admin pentru confirmare');
		const client = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'htcmx-team-reauth' }
		});
		const { error } = await client.auth.signInWithPassword({ email, password });
		password = '';
		if (error) throw new Error('Parolă incorectă');
		return client;
	}

	async function save() {
		if (!editing || saving) return;
		const e = editing;
		if (e.role !== 'admin' && e.permissions.length === 0) {
			showToast('error', 'Alege cel puțin o secțiune (sau rol Admin)');
			return;
		}
		saving = true;
		let client: SupabaseClient | null = null;
		try {
			client = await reauth();
			if (e.id) {
				const { error } = await client
					.from('profiles')
					.update({ role: e.role, permissions: e.role === 'admin' ? [] : e.permissions } as any)
					.eq('id', e.id);
				if (error) throw error;
				showToast('success', 'Accesul a fost actualizat');
			} else {
				const { data: s } = await client.auth.getSession();
				const res = await fetch('/api/admin/staff', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.session?.access_token}` },
					body: JSON.stringify({
						email: e.email,
						name: e.name,
						password: e.tempPassword,
						role: e.role,
						permissions: e.role === 'admin' ? [] : e.permissions
					})
				});
				const body = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(body.error ?? `Eroare ${res.status}`);
				showToast('success', `Cont creat pentru ${body.email}. Trimite-i parola temporară în siguranță.`);
			}
			editing = null;
			await load();
		} catch (err: any) {
			showToast('error', err?.message ?? 'Salvarea a eșuat');
		} finally {
			await client?.auth.signOut({ scope: 'local' }).catch(() => {});
			saving = false;
		}
	}

	async function revoke(m: Member) {
		const ok = await confirmDialog({
			title: 'Retrage accesul',
			message: `${m.name || m.email} va redeveni utilizator obișnuit (fără acces în panou). Continui?`,
			confirmLabel: 'Retrage',
			danger: true
		});
		if (!ok) return;
		editing = { id: m.id, email: m.email ?? '', name: m.name ?? '', role: 'client', permissions: [], tempPassword: '' };
		// Salvarea reală cere parola: o facem prin formular (parola + Salvează).
		showToast('success', 'Introdu parola ta și apasă Salvează pentru a confirma retragerea.');
	}

	const label = (id: string) => AREAS.find((a) => a.id === id)?.label ?? id;
</script>

<div class="team">
	<p class="subtitle-text">
		Adaugă moderatori care gestionează doar anumite secțiuni (de ex. servicii și programări) sau alți administratori.
	</p>

	<div class="actions">
		<button class="btn-primary" onclick={newMember}>➕ Adaugă membru nou</button>
	</div>

	{#if editing}
		<div class="card">
			<h3>{editing.id ? 'Editează accesul' : 'Cont nou de echipă'}</h3>

			{#if !editing.id}
				<div class="grid">
					<label>Nume
						<input bind:value={editing.name} placeholder="Ion Popescu" autocomplete="off" />
					</label>
					<label>Email
						<input type="email" bind:value={editing.email} placeholder="ion@exemplu.ro" autocomplete="off" />
					</label>
					<label>Parolă temporară (min. 10 caractere)
						<input type="text" bind:value={editing.tempPassword} placeholder="trimite-i-o în siguranță" autocomplete="off" />
					</label>
				</div>
			{:else}
				<p class="who"><strong>{editing.name || editing.email}</strong> · {editing.email}</p>
			{/if}

			<fieldset>
				<legend>Rol</legend>
				<label class="radio"><input type="radio" bind:group={editing.role} value="client" /> Moderator (doar secțiunile bifate)</label>
				<label class="radio"><input type="radio" bind:group={editing.role} value="admin" /> <strong>Administrator</strong> (acces total, inclusiv utilizatori, backup și echipă)</label>
			</fieldset>

			{#if editing.role !== 'admin'}
				<fieldset>
					<legend>Secțiuni permise</legend>
					<div class="areas">
						{#each AREAS as a}
							<label class="area" class:on={editing.permissions.includes(a.id)}>
								<input type="checkbox" checked={editing.permissions.includes(a.id)} onchange={() => toggle(a.id)} />
								<span><strong>{a.label}</strong><small>{a.hint}</small></span>
							</label>
						{/each}
					</div>
				</fieldset>
			{/if}

			<label class="pw">Parola ta de admin (confirmare)
				<input type="password" autocomplete="current-password" bind:value={password} placeholder="••••••••" />
			</label>

			<div class="row">
				<button class="btn-primary" onclick={save} disabled={saving || !password}>
					{saving ? 'Se salvează…' : 'Salvează'}
				</button>
				<button class="btn-ghost" onclick={() => (editing = null)} disabled={saving}>Anulează</button>
			</div>
		</div>
	{/if}

	<h3 class="list-title">Echipa curentă</h3>
	{#if loading}
		<p class="muted">Se încarcă…</p>
	{:else if members.length === 0}
		<p class="muted">Nu există membri.</p>
	{:else}
		<ul class="members">
			{#each members as m (m.id)}
				<li>
					<div class="info">
						<strong>{m.name || '—'}</strong>
						<span class="muted">{m.email}</span>
						<div class="chips">
							{#if m.role === 'admin'}
								<span class="chip admin">Administrator</span>
							{:else}
								{#each m.permissions as p}<span class="chip">{label(p)}</span>{/each}
							{/if}
						</div>
					</div>
					<div class="row">
						<button class="btn-ghost" onclick={() => edit(m)}>Editează</button>
						<button class="btn-ghost danger" onclick={() => revoke(m)}>Retrage accesul</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}

	<p class="note">
		Pentru siguranță, orice modificare de acces cere parola ta (verificată și în baza de date) și nu poți retrage
		rolul ultimului administrator. Un moderator nu poate vedea utilizatorii, backup-ul sau veniturile.
	</p>
</div>

<style>
	.subtitle-text { color: var(--text-grey); font-size: 1.4rem; margin-bottom: 1.6rem; font-weight: 500; }
	.actions { margin-bottom: 1.6rem; }
	.card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 2.4rem; margin-bottom: 2.4rem; display: flex; flex-direction: column; gap: 1.6rem; }
	.card h3 { margin: 0; font-size: 1.9rem; color: var(--text); }
	.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr)); gap: 1.2rem; }
	label { display: flex; flex-direction: column; gap: 0.5rem; font-size: 1.3rem; color: var(--text-grey); }
	input[type='text'], input[type='email'], input[type='password'], input:not([type]) {
		background: var(--bg-dark); color: var(--text); border: 1px solid var(--border); border-radius: 10px; padding: 1rem 1.2rem; font-size: 1.4rem;
	}
	fieldset { border: 1px solid var(--border); border-radius: 12px; padding: 1.2rem 1.6rem; margin: 0; }
	legend { color: var(--text); font-size: 1.3rem; padding: 0 0.6rem; }
	.radio { flex-direction: row; align-items: center; gap: 0.8rem; color: var(--text); margin: 0.4rem 0; }
	.areas { display: grid; grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr)); gap: 0.8rem; }
	.area { flex-direction: row; align-items: flex-start; gap: 0.8rem; padding: 0.9rem 1.1rem; border: 1px solid var(--border); border-radius: 10px; cursor: pointer; color: var(--text); }
	.area.on { border-color: var(--primary); background: rgba(197, 160, 48, 0.08); }
	.area small { display: block; color: var(--text-grey); font-size: 1.1rem; }
	.who { color: var(--text); margin: 0; font-size: 1.4rem; }
	.pw { max-width: 36rem; }
	.row { display: flex; gap: 1rem; flex-wrap: wrap; }
	.btn-primary { background: var(--primary); color: var(--bg-dark); border: none; border-radius: 10px; padding: 1rem 2rem; font-size: 1.4rem; font-weight: 700; cursor: pointer; }
	.btn-primary:disabled { opacity: 0.5; cursor: default; }
	.btn-ghost { background: transparent; color: var(--text); border: 1px solid var(--border); border-radius: 10px; padding: 0.8rem 1.4rem; font-size: 1.3rem; cursor: pointer; }
	.btn-ghost.danger { color: #e06a5a; border-color: rgba(224, 106, 90, 0.4); }
	.list-title { font-size: 1.7rem; color: var(--text); margin: 0 0 1rem; }
	.members { list-style: none; margin: 0 0 2rem; padding: 0; display: flex; flex-direction: column; gap: 1rem; }
	.members li { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.4rem 1.6rem; display: flex; gap: 1.2rem; justify-content: space-between; align-items: center; flex-wrap: wrap; }
	.info { display: flex; flex-direction: column; gap: 0.4rem; min-width: 0; }
	.info strong { color: var(--text); font-size: 1.5rem; }
	.muted { color: var(--text-grey); font-size: 1.3rem; }
	.chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.4rem; }
	.chip { background: rgba(255, 255, 255, 0.07); color: var(--text); border-radius: 999px; padding: 0.2rem 1rem; font-size: 1.2rem; }
	.chip.admin { background: var(--primary); color: var(--bg-dark); font-weight: 700; }
	.note { color: var(--text-grey); font-size: 1.25rem; }
	@media (max-width: 600px) {
		.card { padding: 1.6rem; }
		.members li { flex-direction: column; align-items: flex-start; }
	}
</style>
