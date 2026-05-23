<script lang="ts">
	import { supabase } from '$lib/supabase';
	import type { Profile } from '$lib/types';

	let { utilizatori = $bindable([]), utilTotal = $bindable(0) } = $props();

	let utilPagina = $state(1);
	let utilPerPagina = $state(10);
	let utilCautare = $state('');
	let utilIncarcare = $state(false);

	let totalPagini = $derived(Math.ceil(utilTotal / utilPerPagina));

	async function incarcaUtilizatori(resetPagina = false) {
		if (resetPagina) utilPagina = 1;
		utilIncarcare = true;
		const from = (utilPagina - 1) * utilPerPagina;
		const to = from + utilPerPagina - 1;
		
		let query = supabase
			.from('profiles')
			.select('*', { count: 'exact' })
			.order('created_at', { ascending: false })
			.range(from, to);

		if (utilCautare.trim()) {
			query = query.or(`name.ilike.%${utilCautare.trim()}%,email.ilike.%${utilCautare.trim()}%`);
		}

		const { data, count } = await query;
		utilizatori = data || [];
		utilTotal = count || 0;
		utilIncarcare = false;
	}

	$effect(() => {
		incarcaUtilizatori();
	});
</script>

<div class="users-manager">
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

	<div class="table-scroll users-table-container">
		{#if utilIncarcare}
			<div class="incarcare-overlay">Se încarcă...</div>
		{/if}
		<table>
			<thead><tr><th>#</th><th>Nume</th><th>Email</th><th>Rol</th><th>Înregistrat</th></tr></thead>
			<tbody>
				{#each utilizatori as u, i}
					<tr>
						<td class="col-index">{(utilPagina - 1) * utilPerPagina + i + 1}</td>
						<td><strong class="user-name">{u.name || '—'}</strong></td>
						<td class="user-email-col">{u.email}</td>
						<td><span class="badge-status status-{u.role}">{u.role}</span></td>
						<td class="col-date">{u.created_at ? new Date(u.created_at).toLocaleDateString('ro-RO') : '—'}</td>
					</tr>
				{:else}
					<tr><td colspan="5" class="td-gol">Niciun utilizator găsit.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if utilTotal > 0}
		<div class="pagination-footer">
			<span class="pagination-info">{(utilPagina - 1) * utilPerPagina + 1}–{Math.min(utilPagina * utilPerPagina, utilTotal)} din {utilTotal}</span>
			<div class="pagination-controls">
				<button class="btn-pag" disabled={utilPagina === 1} onclick={() => { utilPagina--; incarcaUtilizatori(); }}>← Înapoi</button>
				{#each Array.from({ length: totalPagini }, (_, k) => k + 1) as p}
					{#if totalPagini <= 7 || p === 1 || p === totalPagini || Math.abs(p - utilPagina) <= 1}
						<button class="btn-nr" class:activ={p === utilPagina} onclick={() => { utilPagina = p; incarcaUtilizatori(); }}>{p}</button>
					{:else if Math.abs(p - utilPagina) === 2}
						<span class="pag-dots">...</span>
					{/if}
				{/each}
				<button class="btn-pag" disabled={utilPagina === totalPagini} onclick={() => { utilPagina++; incarcaUtilizatori(); }}>Înainte →</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.bara-filtrare-util { display: flex; align-items: center; gap: 2rem; margin-bottom: 2.4rem; flex-wrap: wrap; }
	.search-util { display: flex; flex: 1; min-width: 25rem; gap: 0.8rem; }
	.search-util input { flex: 1; padding: 1.2rem 1.6rem; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text); font-size: 1.45rem; }
	.search-util input:focus { border-color: var(--primary); outline: none; }
	
	.per-pagina { display: flex; align-items: center; gap: 1rem; }
	.per-pagina select { padding: 1rem; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border); color: var(--text); font-weight: 600; cursor: pointer; }
	
	.label-gri { color: var(--text-grey); font-size: 1.3rem; font-weight: 600; }

	.users-table-container { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border); position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.25); }
	
	.incarcare-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 10; font-weight: 700; color: var(--primary); }
	
	.col-index { color: var(--text-grey); font-family: monospace; font-size: 1.3rem; }
	.user-name { font-size: 1.5rem; color: var(--text); }
	.user-email-col { color: var(--text-grey); font-size: 1.4rem; }
	.col-date { color: var(--text-grey); font-size: 1.3rem; }
	.td-gol { text-align: center; padding: 6rem; color: var(--text-grey); font-size: 1.5rem; font-style: italic; }

	.pagination-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 2.4rem; border-top: 1px solid var(--border); padding-top: 2rem; }
	.pagination-info { color: var(--text-grey); font-size: 1.35rem; font-weight: 600; }
	.pagination-controls { display: flex; gap: 0.6rem; align-items: center; }
	
	.btn-pag { padding: 0.8rem 1.6rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text); cursor: pointer; font-weight: 600; transition: all 0.2s; }
	.btn-pag:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
	.btn-pag:disabled { opacity: 0.4; cursor: not-allowed; }
	
	.btn-nr { min-width: 3.6rem; height: 3.6rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-card); color: var(--text); cursor: pointer; font-weight: 700; transition: all 0.2s; }
	.btn-nr:hover { border-color: var(--primary); color: var(--primary); }
	.btn-nr.activ { background: var(--primary); color: var(--bg-dark); border-color: var(--primary); box-shadow: 0 4px 12px rgba(197, 160, 48, 0.2); }
	.pag-dots { color: var(--text-grey); padding: 0 0.4rem; }
</style>
