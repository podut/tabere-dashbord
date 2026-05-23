<script lang="ts">
	import type { EventRow } from '$lib/types';
	import EventMobileCard from './view/EventMobileCard.svelte';

	let { evenimente, tabActiv, onEdit, onFinalize, onDelete, onGallery }: {
		evenimente: EventRow[];
		tabActiv: string;
		onEdit: (ev: EventRow) => void;
		onFinalize: (id: string) => void;
		onDelete: (ev: EventRow) => void;
		onGallery: (ev: EventRow) => void;
	} = $props();

	const listaFiltrata = $derived(evenimente.filter(e => e.status === tabActiv));
	const acum = new Date();
</script>

<!-- Mobile View -->
<div class="mobile-only-grid">
	{#each listaFiltrata as ev}
		<EventMobileCard {ev} {onEdit} {onFinalize} {onDelete} {onGallery} {acum} />
	{:else}
		<div class="td-gol">Niciun eveniment găsit.</div>
	{/each}
</div>

<div class="tabel-container table-scroll desktop-only-table">
	<table>
		<thead>
			<tr>
				<th>Eveniment</th>
				<th>Tip</th>
				<th>Dată / Oră</th>
				<th>Durată</th>
				<th>Capacitate</th>
				<th>Preț</th>
				<th>Status</th>
				<th>Acțiuni</th>
			</tr>
		</thead>
		<tbody>
			{#each listaFiltrata as ev}
				<tr class:eveniment-trecut={new Date(ev.date) < acum && ev.status === 'active'}>
					<td>
						<div class="info-ev">
							<strong class="titlu-ev">{ev.title}</strong>
							<span class="locatie-ev">{ev.location}</span>
						</div>
					</td>
					<td><span class="badge-tip">{ev.type}</span></td>
					<td>
						<div class="data-ora">
							<span class="data-text">{new Date(ev.date).toLocaleDateString('ro-RO')}</span>
							<span class="ora-text">{ev.start_time || '--:--'}</span>
						</div>
					</td>
					<td><span class="durata-text">{ev.duration || '--'}</span></td>
					<td>
						<div class="capacitate-info">
							<span class="max-part">{ev.max_participants || 0} pers.</span>
							<span class="age-target">{ev.capacity || 'N/A'}</span>
						</div>
					</td>
					<td><strong>{ev.price} {ev.currency || 'lei'}</strong></td>
					<td><span class="badge-status status-{ev.status}">{ev.status}</span></td>
					<td>
						<div class="actiuni-celula">
							{#if ev.status === 'active' && new Date(ev.date) < acum}
								<button class="btn-icon btn-succes" onclick={() => onFinalize(ev.id)} title="Finalizează">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
								</button>
							{/if}
							<button class="btn-icon" onclick={() => onEdit(ev)} title="Editează">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
							</button>
							<button class="btn-icon btn-galerie" onclick={() => onGallery(ev)} title="Galerie">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
							</button>
							<button class="btn-icon btn-sterge" onclick={() => onDelete(ev)} title="Șterge">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
							</button>
						</div>
					</td>
				</tr>
			{:else}
				<tr><td colspan="5" class="td-gol">Niciun eveniment găsit.</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.actiuni-celula { display: flex; gap: 0.5rem; align-items: center; }
	.btn-succes { color: #2b8a3e; border-color: #b2f2bb; }
	.btn-succes:hover { background: #d3f9d8; border-color: #2b8a3e; }
	.btn-galerie { color: #1971c2; border-color: #a5d8ff; }
	.btn-galerie:hover { background: #e7f5ff; border-color: #1971c2; }
	.eveniment-trecut { background-color: rgba(224, 49, 49, 0.05) !important; }
	.eveniment-trecut td { color: var(--text-grey); }
	
	.info-ev { display: flex; flex-direction: column; gap: 0.2rem; }
	.titlu-ev { font-size: 1.5rem; color: var(--text); }
	.locatie-ev { font-size: 1.1rem; color: var(--text-grey); }
	
	.badge-tip { background: var(--primary-tint); color: var(--primary); padding: 0.2rem 0.8rem; border-radius: 4px; font-size: 1.1rem; font-weight: 700; text-transform: uppercase; }
	
	.data-ora { display: flex; flex-direction: column; }
	.data-text { font-weight: 600; }
	.ora-text { font-size: 1.2rem; color: var(--primary); font-weight: 700; }
	
	.durata-text { font-style: italic; color: var(--text-grey); }
	
	.capacitate-info { display: flex; flex-direction: column; }
	.max-part { font-weight: 600; color: var(--text); }
	.age-target { font-size: 1.1rem; color: var(--accent-blue); font-weight: 700; }
	
	.td-gol { text-align: center; padding: 4rem; color: #999; }

	.mobile-only-grid { display: none; }

	@media (max-width: 768px) {
		.desktop-only-table { display: none; }
		.mobile-only-grid { display: block; padding: 0.5rem; }
	}
</style>
