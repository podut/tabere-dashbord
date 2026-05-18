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
	<div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.6rem; flex-wrap:wrap;">
		<div style="display:flex; flex:1; min-width:20rem; gap:0.6rem;">
			<input
				type="search"
				placeholder="Caută nume sau email..."
				bind:value={utilCautare}
				style="flex:1; padding:1rem 1.2rem; border-radius:9px; border:1px solid var(--border);"
				onkeydown={(e) => e.key === 'Enter' && incarcaUtilizatori(true)}
			/>
			<button class="buton-primar" onclick={() => incarcaUtilizatori(true)}>Caută</button>
		</div>
		<div style="display:flex; align-items:center; gap:0.8rem;">
			<span>Per pagină:</span>
			<select bind:value={utilPerPagina} onchange={() => incarcaUtilizatori(true)} style="padding:0.8rem; border-radius:9px;">
				<option value={10}>10</option><option value={50}>50</option><option value={100}>100</option>
			</select>
		</div>
	</div>

	<div class="table-scroll" style="background:white; border-radius:12px; border:1px solid var(--border); position:relative;">
		{#if utilIncarcare}
			<div style="position:absolute; inset:0; background:rgba(255,255,255,0.7); display:flex; align-items:center; justify-content:center; z-index:10;">Se încarcă...</div>
		{/if}
		<table>
			<thead><tr><th>#</th><th>Nume</th><th>Email</th><th>Rol</th><th>Înregistrat</th></tr></thead>
			<tbody>
				{#each utilizatori as u, i}
					<tr>
						<td style="color:#bbb;">{(utilPagina - 1) * utilPerPagina + i + 1}</td>
						<td><strong>{u.name || '—'}</strong></td>
						<td>{u.email}</td>
						<td><span class="badge-status status-{u.role}">{u.role}</span></td>
						<td>{u.created_at ? new Date(u.created_at).toLocaleDateString('ro-RO') : '—'}</td>
					</tr>
				{:else}
					<tr><td colspan="5" style="text-align:center; padding:3rem; color:#999;">Niciun utilizator găsit.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if utilTotal > 0}
		<div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.6rem;">
			<span style="color:#666;">{(utilPagina - 1) * utilPerPagina + 1}–{Math.min(utilPagina * utilPerPagina, utilTotal)} din {utilTotal}</span>
			<div style="display:flex; gap:0.4rem;">
				<button disabled={utilPagina === 1} onclick={() => { utilPagina--; incarcaUtilizatori(); }}>← Înapoi</button>
				{#each Array.from({ length: totalPagini }, (_, k) => k + 1) as p}
					{#if totalPagini <= 7 || p === 1 || p === totalPagini || Math.abs(p - utilPagina) <= 1}
						<button style="min-width:3rem; background:{p === utilPagina ? 'var(--primary)' : 'white'}; color:{p === utilPagina ? 'white' : 'black'}; border:1px solid var(--border); border-radius:6px; cursor:pointer;" onclick={() => { utilPagina = p; incarcaUtilizatori(); }}>{p}</button>
					{:else if Math.abs(p - utilPagina) === 2}
						<span>...</span>
					{/if}
				{/each}
				<button disabled={utilPagina === totalPagini} onclick={() => { utilPagina++; incarcaUtilizatori(); }}>Înainte →</button>
			</div>
		</div>
	{/if}
</div>
