<script lang="ts">
	import { UserRepository } from '$lib/data/repositories/UserRepository';
	import { ParticipantProfileRepository } from '$lib/data/repositories/ParticipantProfileRepository';
	import { confirmDialog } from '$lib/admin/notify.svelte';
	import type { Profile, ParticipantProfile } from '$lib/types';
	import UserMobileCard from './view/UserMobileCard.svelte';

	let { utilizatori = $bindable([]), utilTotal = $bindable(0) } = $props();

	// ─── Tab activ ───────────────────────────────────────────────
	let tab = $state<'inregistrati' | 'anonimi'>('inregistrati');

	// ─── Utilizatori înregistrați ────────────────────────────────
	let utilPagina = $state(1);
	let utilPerPagina = $state(10);
	let utilCautare = $state('');
	let utilIncarcare = $state(false);
	let totalPaginiUtil = $derived(Math.ceil(utilTotal / utilPerPagina));

	async function incarcaUtilizatori(resetPagina = false) {
		if (resetPagina) utilPagina = 1;
		utilIncarcare = true;
		try {
			const { users, total } = await UserRepository.getUsers(utilPagina, utilPerPagina, utilCautare);
			utilizatori = users;
			utilTotal = total;
		} catch (err) {
			console.error('Error loading users:', err);
		} finally {
			utilIncarcare = false;
		}
	}

	// ─── Participanți anonimi ────────────────────────────────────
	let participanti = $state<ParticipantProfile[]>([]);
	let partTotal = $state(0);
	let partPagina = $state(1);
	let partPerPagina = $state(10);
	let partCautare = $state('');
	let partIncarcare = $state(false);
	let totalPaginiPart = $derived(Math.ceil(partTotal / partPerPagina));

	async function incarcaParticipanti(resetPagina = false) {
		if (resetPagina) partPagina = 1;
		partIncarcare = true;
		try {
			const { participants, total } = await ParticipantProfileRepository.getParticipants(
				partPagina, partPerPagina, partCautare
			);
			participanti = participants;
			partTotal = total;
		} catch (err) {
			console.error('Error loading participants:', err);
		} finally {
			partIncarcare = false;
		}
	}

	async function stergeParticipant(deviceId: string, name: string) {
		const ok = await confirmDialog({
			title: 'Ștergi participantul?',
			message: `Participantul anonim „${name || deviceId.slice(0, 8)}" va fi șters definitiv.`,
			confirmLabel: 'Șterge',
			danger: true
		});
		if (!ok) return;
		try {
			await ParticipantProfileRepository.deleteParticipant(deviceId);
			await incarcaParticipanti();
		} catch (err) {
			console.error('Error deleting participant:', err);
		}
	}

	// ─── Efecte ──────────────────────────────────────────────────
	$effect(() => { if (tab === 'inregistrati') incarcaUtilizatori(); });
	$effect(() => { if (tab === 'anonimi') incarcaParticipanti(); });
</script>

<div class="users-manager">
	<!-- Tabs -->
	<div class="tabs-utilizatori">
		<button class:activ={tab === 'inregistrati'} onclick={() => tab = 'inregistrati'}>
			👤 Înregistrați
			{#if utilTotal > 0}<span class="badge-count">{utilTotal}</span>{/if}
		</button>
		<button class:activ={tab === 'anonimi'} onclick={() => tab = 'anonimi'}>
			🎭 Anonimi (fără cont)
			{#if partTotal > 0}<span class="badge-count">{partTotal}</span>{/if}
		</button>
	</div>

	<!-- ═══════════════ TAB: ÎNREGISTRAȚI ═══════════════ -->
	{#if tab === 'inregistrati'}
		<div class="bara-filtrare-util">
			<div class="search-util">
				<input
					type="search"
					placeholder="Caută nume sau email..."
					bind:value={utilCautare}
					onkeydown={(e) => e.key === 'Enter' && incarcaUtilizatori(true)}
				/>
				<button class="buton-primar" onclick={() => incarcaUtilizatori(true)}>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
				</button>
			</div>
			<div class="per-pagina">
				<span class="label-gri">Per pagină:</span>
				<select bind:value={utilPerPagina} onchange={() => incarcaUtilizatori(true)}>
					<option value={10}>10</option><option value={50}>50</option><option value={100}>100</option>
				</select>
			</div>
		</div>

		<div class="table-scroll users-table-container desktop-only-table">
			{#if utilIncarcare}<div class="incarcare-overlay">Se încarcă...</div>{/if}
			<table>
				<thead><tr><th>#</th><th>Nume</th><th>Email</th><th>Rol</th><th>Înregistrat</th></tr></thead>
				<tbody>
					{#each utilizatori as u, i}
						<tr>
							<td class="col-index">{(utilPagina - 1) * utilPerPagina + i + 1}</td>
							<td>
								<div class="user-info-cell">
									{#if u.avatar_url}
										<img src={u.avatar_url} alt={u.name} class="avatar-mic" />
									{:else}
										<div class="avatar-initiale">{(u.name || '?').charAt(0).toUpperCase()}</div>
									{/if}
									<strong class="user-name">{u.name || '—'}</strong>
								</div>
							</td>
							<td class="user-email-col">{u.email || '—'}</td>
							<td><span class="badge-status status-{u.role}">{u.role}</span></td>
							<td class="col-date">{u.created_at ? new Date(u.created_at).toLocaleDateString('ro-RO') : '—'}</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="td-gol">Niciun utilizator găsit.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Mobile -->
		<div class="mobile-only-grid">
			{#if utilIncarcare}<div class="incarcare-overlay" style="position:static;padding:2rem;">Se încarcă...</div>{/if}
			{#each utilizatori as u, i}
				<UserMobileCard {u} index={(utilPagina - 1) * utilPerPagina + i + 1} />
			{:else}
				{#if !utilIncarcare}<div class="td-gol">Niciun utilizator găsit.</div>{/if}
			{/each}
		</div>

		{#if utilTotal > 0}
			<div class="pagination-footer">
				<span class="pagination-info">{(utilPagina - 1) * utilPerPagina + 1}–{Math.min(utilPagina * utilPerPagina, utilTotal)} din {utilTotal}</span>
				<div class="pagination-controls">
					<button class="btn-pag" disabled={utilPagina === 1} onclick={() => { utilPagina--; incarcaUtilizatori(); }}>← Înapoi</button>
					{#each Array.from({ length: totalPaginiUtil }, (_, k) => k + 1) as p}
						{#if totalPaginiUtil <= 7 || p === 1 || p === totalPaginiUtil || Math.abs(p - utilPagina) <= 1}
							<button class="btn-nr" class:activ={p === utilPagina} onclick={() => { utilPagina = p; incarcaUtilizatori(); }}>{p}</button>
						{:else if Math.abs(p - utilPagina) === 2}
							<span class="pag-dots">...</span>
						{/if}
					{/each}
					<button class="btn-pag" disabled={utilPagina === totalPaginiUtil} onclick={() => { utilPagina++; incarcaUtilizatori(); }}>Înainte →</button>
				</div>
			</div>
		{/if}

	<!-- ═══════════════ TAB: ANONIMI ═══════════════ -->
	{:else}
		<div class="bara-filtrare-util">
			<div class="search-util">
				<input
					type="search"
					placeholder="Caută după nume..."
					bind:value={partCautare}
					onkeydown={(e) => e.key === 'Enter' && incarcaParticipanti(true)}
				/>
				<button class="buton-primar" onclick={() => incarcaParticipanti(true)}>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
				</button>
			</div>
			<div class="per-pagina">
				<span class="label-gri">Per pagină:</span>
				<select bind:value={partPerPagina} onchange={() => incarcaParticipanti(true)}>
					<option value={10}>10</option><option value={50}>50</option><option value={100}>100</option>
				</select>
			</div>
		</div>

		<div class="info-anonimi">
			<span>🔒</span>
			<p>Participanți fără cont Supabase — identificați prin <strong>Device ID</strong>. Pot fi asociați cu un cont la login via <code>claim_device_bookings</code>.</p>
		</div>

		<div class="table-scroll users-table-container desktop-only-table">
			{#if partIncarcare}<div class="incarcare-overlay">Se încarcă...</div>{/if}
			<table>
				<thead><tr><th>#</th><th>Nume</th><th>Device ID</th><th>Ultima activitate</th><th></th></tr></thead>
				<tbody>
					{#each participanti as p, i}
						<tr>
							<td class="col-index">{(partPagina - 1) * partPerPagina + i + 1}</td>
							<td>
								<div class="user-info-cell">
									{#if p.avatar_url}
										<img src={p.avatar_url} alt={p.name} class="avatar-mic" />
									{:else}
										<div class="avatar-initiale anon">{(p.name || '?').charAt(0).toUpperCase()}</div>
									{/if}
									<strong class="user-name">{p.name || '(fără nume)'}</strong>
								</div>
							</td>
							<td class="col-device-id">{p.device_id}</td>
							<td class="col-date">{p.updated_at ? new Date(p.updated_at).toLocaleDateString('ro-RO') : '—'}</td>
							<td>
								<button class="btn-icon btn-sterge" onclick={() => stergeParticipant(p.device_id, p.name)} title="Șterge">🗑</button>
							</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="td-gol">Niciun participant anonim.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Mobile -->
		<div class="mobile-only-grid">
			{#if partIncarcare}<div class="incarcare-overlay" style="position:static;padding:2rem;">Se încarcă...</div>{/if}
			{#each participanti as p, i}
				<div class="anon-mobile-card">
					<div class="anon-card-left">
						{#if p.avatar_url}
							<img src={p.avatar_url} alt={p.name} class="avatar-mic" />
						{:else}
							<div class="avatar-initiale anon">{(p.name || '?').charAt(0).toUpperCase()}</div>
						{/if}
						<div class="anon-card-info">
							<strong>{p.name || '—'}</strong>
							<small class="col-device-id">{p.device_id.slice(0, 16)}…</small>
							<small>{p.updated_at ? new Date(p.updated_at).toLocaleDateString('ro-RO') : '—'}</small>
						</div>
					</div>
					<button class="btn-icon btn-sterge" onclick={() => stergeParticipant(p.device_id, p.name)}>🗑</button>
				</div>
			{:else}
				{#if !partIncarcare}<div class="td-gol">Niciun participant anonim.</div>{/if}
			{/each}
		</div>

		{#if partTotal > 0}
			<div class="pagination-footer">
				<span class="pagination-info">{(partPagina - 1) * partPerPagina + 1}–{Math.min(partPagina * partPerPagina, partTotal)} din {partTotal}</span>
				<div class="pagination-controls">
					<button class="btn-pag" disabled={partPagina === 1} onclick={() => { partPagina--; incarcaParticipanti(); }}>← Înapoi</button>
					{#each Array.from({ length: totalPaginiPart }, (_, k) => k + 1) as pg}
						{#if totalPaginiPart <= 7 || pg === 1 || pg === totalPaginiPart || Math.abs(pg - partPagina) <= 1}
							<button class="btn-nr" class:activ={pg === partPagina} onclick={() => { partPagina = pg; incarcaParticipanti(); }}>{pg}</button>
						{:else if Math.abs(pg - partPagina) === 2}
							<span class="pag-dots">...</span>
						{/if}
					{/each}
					<button class="btn-pag" disabled={partPagina === totalPaginiPart} onclick={() => { partPagina++; incarcaParticipanti(); }}>Înainte →</button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.tabs-utilizatori {
		display: flex; gap: 0.4rem; margin-bottom: 2.4rem;
		border-bottom: 1px solid var(--border); padding-bottom: 0;
	}
	.tabs-utilizatori button {
		background: none; border: none; border-bottom: 3px solid transparent;
		padding: 1.2rem 2rem; font-size: 1.45rem; font-weight: 600;
		color: var(--text-grey); cursor: pointer; transition: all 0.2s;
		display: flex; align-items: center; gap: 0.8rem; margin-bottom: -1px;
	}
	.tabs-utilizatori button:hover { color: var(--primary); }
	.tabs-utilizatori button.activ { color: var(--primary); border-bottom-color: var(--primary); }

	.badge-count {
		background: var(--primary-tint2); color: var(--primary);
		font-size: 1.1rem; font-weight: 700; padding: 0.2rem 0.7rem;
		border-radius: 100px; min-width: 2rem; text-align: center;
	}

	.bara-filtrare-util { display: flex; align-items: center; gap: 2rem; margin-bottom: 2.4rem; flex-wrap: wrap; }
	.search-util { display: flex; flex: 1; min-width: 25rem; gap: 0.8rem; }
	.search-util input { flex: 1; padding: 1.2rem 1.6rem; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text); font-size: 1.45rem; }
	.search-util input:focus { border-color: var(--primary); outline: none; }
	.per-pagina { display: flex; align-items: center; gap: 1rem; }
	.per-pagina select { padding: 1rem; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border); color: var(--text); font-weight: 600; cursor: pointer; }
	.label-gri { color: var(--text-grey); font-size: 1.3rem; font-weight: 600; }

	.info-anonimi {
		display: flex; align-items: flex-start; gap: 1.2rem;
		background: var(--primary-tint); border: 1px solid var(--border-strong);
		border-radius: 12px; padding: 1.4rem 1.8rem; margin-bottom: 2rem; font-size: 1.35rem;
	}
	.info-anonimi span { font-size: 2rem; flex-shrink: 0; }
	.info-anonimi p { color: var(--text-grey); line-height: 1.5; }
	.info-anonimi code { background: rgba(197,160,48,0.15); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 1.25rem; color: var(--primary); }

	.users-table-container { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border); position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.25); }
	.incarcare-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 10; font-weight: 700; color: var(--primary); }

	.user-info-cell { display: flex; align-items: center; gap: 1.2rem; }
	.avatar-mic { width: 3.2rem; height: 3.2rem; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); flex-shrink: 0; }
	.avatar-initiale {
		width: 3.2rem; height: 3.2rem; border-radius: 50%; flex-shrink: 0;
		background: var(--primary-tint2); border: 2px solid var(--border-strong);
		display: flex; align-items: center; justify-content: center;
		font-size: 1.4rem; font-weight: 800; color: var(--primary);
	}
	.avatar-initiale.anon { background: rgba(240,237,230,0.06); color: var(--text-grey); border-color: var(--border); }

	.col-index { color: var(--text-grey); font-family: monospace; font-size: 1.3rem; }
	.user-name { font-size: 1.5rem; color: var(--text); }
	.user-email-col { color: var(--text-grey); font-size: 1.4rem; }
	.col-date { color: var(--text-grey); font-size: 1.3rem; }
	.col-device-id { color: var(--text-grey); font-size: 1.2rem; font-family: monospace; }
	.td-gol { text-align: center; padding: 6rem; color: var(--text-grey); font-size: 1.5rem; font-style: italic; }

	/* Mobile cards anonimi */
	.anon-mobile-card {
		display: flex; justify-content: space-between; align-items: center;
		background: var(--bg-card); border: 1px solid var(--border);
		border-radius: 14px; padding: 1.4rem 1.6rem; margin-bottom: 1.2rem;
	}
	.anon-card-left { display: flex; align-items: center; gap: 1.2rem; }
	.anon-card-info { display: flex; flex-direction: column; gap: 0.3rem; }
	.anon-card-info strong { font-size: 1.5rem; color: var(--text); }
	.anon-card-info small { font-size: 1.2rem; color: var(--text-grey); }

	.pagination-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 2.4rem; border-top: 1px solid var(--border); padding-top: 2rem; }
	.pagination-info { color: var(--text-grey); font-size: 1.35rem; font-weight: 600; }
	.pagination-controls { display: flex; gap: 0.6rem; align-items: center; }
	.btn-pag { padding: 0.8rem 1.6rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text); cursor: pointer; font-weight: 600; transition: all 0.2s; }
	.btn-pag:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
	.btn-pag:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn-nr { min-width: 3.6rem; height: 3.6rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-card); color: var(--text); cursor: pointer; font-weight: 700; transition: all 0.2s; }
	.btn-nr:hover { border-color: var(--primary); color: var(--primary); }
	.btn-nr.activ { background: var(--primary); color: var(--bg-dark); border-color: var(--primary); box-shadow: 0 4px 12px rgba(197,160,48,0.2); }
	.pag-dots { color: var(--text-grey); padding: 0 0.4rem; }

	.mobile-only-grid { display: none; }

	@media (max-width: 768px) {
		.desktop-only-table { display: none !important; }
		.mobile-only-grid { display: block; }
	}

	@media (max-width: 600px) {
		.tabs-utilizatori button { padding: 1rem 1.4rem; font-size: 1.3rem; }
	}
</style>
