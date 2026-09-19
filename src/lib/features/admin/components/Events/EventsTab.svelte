<script lang="ts">
	import type { EventRow, Booking } from '$lib/types';
	import EventPreviewCard from './view/EventPreviewCard.svelte';

	let {
		evenimente,
		rezervari = [],
		tabActiv,
		onEdit,
		onFinalize,
		onDelete,
		onGallery
	}: {
		evenimente: EventRow[];
		rezervari?: Booking[];
		tabActiv: string;
		onEdit: (ev: EventRow) => void;
		onFinalize: (id: string) => void;
		onDelete: (ev: EventRow) => void;
		onGallery: (ev: EventRow) => void;
	} = $props();

	const acum = new Date();

	// View mode: grid (default preview) or table
	let viewMode = $state<'grid' | 'table'>('grid');
	let cautare = $state('');
	let filtruTip = $state('toate');

	// Extract available event types for quick filtering
	const tipuriDisponibile = $derived.by(() => {
		const set = new Set<string>();
		evenimente.forEach((e) => {
			if (e.type) set.add(e.type);
		});
		return Array.from(set);
	});

	// Filtered list
	const listaFiltrata = $derived(
		evenimente
			.filter((e) => e.status === tabActiv)
			.filter((e) => {
				if (filtruTip !== 'toate' && e.type !== filtruTip) return false;
				if (!cautare.trim()) return true;
				const q = cautare.toLowerCase();
				return (
					(e.title || '').toLowerCase().includes(q) ||
					(e.location || '').toLowerCase().includes(q) ||
					(e.type || '').toLowerCase().includes(q) ||
					(e.event_code || '').toLowerCase().includes(q)
				);
			})
	);

	function getConfirmedCount(eventId: string) {
		return rezervari.filter((r) => r.event_id === eventId && r.status === 'confirmat').length;
	}
</script>

<div class="events-tab-wrapper">
	<!-- 1. TOOLBAR: SEARCH, FILTERS & VIEW MODE -->
	<div class="events-toolbar">
		<!-- Search Input -->
		<div class="search-box">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
			<input
				type="text"
				placeholder="Caută eveniment după titlu, locație, tip..."
				bind:value={cautare}
			/>
			{#if cautare}
				<button class="btn-clear-search" onclick={() => (cautare = '')} title="Șterge căutarea">×</button>
			{/if}
		</div>

		<!-- Type Filter Pills -->
		<div class="filter-pills-row">
			<button
				class="filter-pill"
				class:active={filtruTip === 'toate'}
				onclick={() => (filtruTip = 'toate')}
			>
				Toate ({evenimente.filter((e) => e.status === tabActiv).length})
			</button>
			{#each tipuriDisponibile as tip}
				<button
					class="filter-pill"
					class:active={filtruTip === tip}
					onclick={() => (filtruTip = tip)}
				>
					{tip}
				</button>
			{/each}
		</div>

		<!-- View Switcher -->
		<div class="view-toggle">
			<button
				type="button"
				class="toggle-btn"
				class:active={viewMode === 'grid'}
				onclick={() => (viewMode = 'grid')}
				title="Afișare Carduri Preview Senior UI"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
				<span>Carduri</span>
			</button>
			<button
				type="button"
				class="toggle-btn"
				class:active={viewMode === 'table'}
				onclick={() => (viewMode = 'table')}
				title="Afișare Listă Tabelară"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
				<span>Tabel</span>
			</button>
		</div>
	</div>

	<!-- 2. MAIN CONTENT VIEW -->
	{#if listaFiltrata.length === 0}
		<div class="events-empty-state">
			<div class="empty-icon">🎯</div>
			<h3>Niciun eveniment găsit</h3>
			<p>Nu există evenimente corespunzătoare filtrelor selectate.</p>
			<button class="btn-new-empty" onclick={() => onEdit({} as any)}>
				+ Creează Eveniment Nou
			</button>
		</div>
	{:else if viewMode === 'grid'}
		<!-- SENIOR UI PREVIEW CARD GRID -->
		<div class="events-preview-grid">
			{#each listaFiltrata as ev (ev.id)}
				<EventPreviewCard
					{ev}
					{rezervari}
					{onEdit}
					{onFinalize}
					{onDelete}
					{onGallery}
					{acum}
				/>
			{/each}
		</div>
	{:else}
		<!-- UPGRADED TABEL VIEW -->
		<div class="tabel-container table-scroll">
			<table>
				<thead>
					<tr>
						<th>Preview & Eveniment</th>
						<th>Tip</th>
						<th>Dată / Oră</th>
						<th>Durată</th>
						<th>Capacitate & Sloturi</th>
						<th>Preț</th>
						<th>Status</th>
						<th>Acțiuni</th>
					</tr>
				</thead>
				<tbody>
					{#each listaFiltrata as ev (ev.id)}
						{@const isPast = ev.date ? new Date(ev.date) < acum : false}
						{@const isExpiredActive = isPast && ev.status === 'active'}
						{@const confirmed = getConfirmedCount(ev.id)}
						{@const maxC = ev.max_participants || 30}
						<tr class:eveniment-trecut={isExpiredActive}>
							<td>
								<div class="table-event-cell">
									<img
										src={ev.image_url || ev.gallery?.[0] || 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80'}
										alt={ev.title}
										class="table-thumb"
										loading="lazy"
									/>
									<div class="info-ev">
										<strong class="titlu-ev" onclick={() => onEdit(ev)}>{ev.title}</strong>
										<span class="locatie-ev">📍 {ev.location || 'Baza HTCMX'}</span>
									</div>
								</div>
							</td>
							<td><span class="badge-tip">{ev.type || 'MILSIM'}</span></td>
							<td>
								<div class="data-ora">
									<span class="data-text">{ev.date ? new Date(ev.date).toLocaleDateString('ro-RO') : '--'}</span>
									<span class="ora-text">{ev.start_time || '--:--'}</span>
								</div>
							</td>
							<td><span class="durata-text">{ev.duration || '--'}</span></td>
							<td>
								<div class="capacitate-info">
									<span class="max-part"><strong>{confirmed}</strong> / {maxC} pers.</span>
									<span class="age-target">{ev.capacity || 'Toate vârstele'}</span>
								</div>
							</td>
							<td><strong class="price-text">{ev.price || 0} {ev.currency || 'RON'}</strong></td>
							<td>
								{#if isExpiredActive}
									<span class="badge-status status-expired">🔴 Necesită Finalizare</span>
								{:else if ev.status === 'active'}
									<span class="badge-status status-active">🟢 Activ</span>
								{:else}
									<span class="badge-status status-finished">⚪ Finalizat</span>
								{/if}
							</td>
							<td>
								<div class="actiuni-celula">
									{#if isExpiredActive}
										<button class="btn-icon btn-succes" onclick={() => onFinalize(ev.id)} title="Finalizează Misiune">
											<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
										</button>
									{/if}
									<button class="btn-icon" onclick={() => onEdit(ev)} title="Editează">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
									</button>
									<button class="btn-icon btn-galerie" onclick={() => onGallery(ev)} title="Galerie Foto">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
									</button>
									<button class="btn-icon btn-sterge" onclick={() => onDelete(ev)} title="Șterge">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.events-tab-wrapper {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	/* TOOLBAR */
	.events-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.2rem;
		flex-wrap: wrap;
		background: rgba(0, 0, 0, 0.3);
		padding: 1.2rem 1.6rem;
		border-radius: 14px;
		border: 1px solid var(--border);
	}

	.search-box {
		position: relative;
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 24rem;
	}

	.search-box svg {
		position: absolute;
		left: 1.2rem;
		color: var(--text-grey);
		pointer-events: none;
	}

	.search-box input {
		width: 100%;
		padding: 0.9rem 3.2rem 0.9rem 3.6rem;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--bg-card);
		color: var(--text);
		font-size: 1.35rem;
		font-family: inherit;
		outline: none;
		transition: border-color 0.2s;
	}

	.search-box input:focus {
		border-color: var(--primary);
	}

	.btn-clear-search {
		position: absolute;
		right: 1rem;
		background: none;
		border: none;
		color: var(--text-grey);
		font-size: 1.8rem;
		cursor: pointer;
		line-height: 1;
	}

	.filter-pills-row {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.filter-pill {
		background: var(--bg-card);
		border: 1px solid var(--border);
		color: var(--text-grey);
		padding: 0.6rem 1.2rem;
		border-radius: 8px;
		font-size: 1.2rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.filter-pill:hover {
		color: var(--text);
		border-color: var(--border-strong);
	}

	.filter-pill.active {
		background: rgba(197, 160, 48, 0.15);
		border-color: var(--primary);
		color: var(--primary-light);
	}

	.view-toggle {
		display: flex;
		gap: 0.3rem;
		background: var(--bg-dark);
		padding: 0.3rem;
		border-radius: 10px;
		border: 1px solid var(--border);
	}

	.toggle-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1.2rem;
		border-radius: 7px;
		border: none;
		background: transparent;
		color: var(--text-grey);
		font-size: 1.2rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
	}

	.toggle-btn.active {
		background: var(--bg-card);
		color: var(--primary);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	}

	/* PREVIEW GRID */
	.events-preview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 2rem;
	}

	/* EMPTY STATE */
	.events-empty-state {
		text-align: center;
		padding: 6rem 2rem;
		background: var(--bg-card);
		border: 1px dashed var(--border-strong);
		border-radius: 18px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.2rem;
	}

	.empty-icon {
		font-size: 4rem;
	}

	.events-empty-state h3 {
		font-size: 1.8rem;
		color: var(--text);
		font-weight: 800;
	}

	.events-empty-state p {
		font-size: 1.35rem;
		color: var(--text-grey);
		max-width: 40rem;
	}

	.btn-new-empty {
		margin-top: 1rem;
		padding: 1rem 2.2rem;
		border-radius: 10px;
		background: var(--primary);
		color: var(--bg-dark);
		font-size: 1.35rem;
		font-weight: 800;
		border: none;
		cursor: pointer;
		box-shadow: 0 4px 14px rgba(197, 160, 48, 0.35);
	}

	/* TABLE VIEW */
	.table-event-cell {
		display: flex;
		align-items: center;
		gap: 1.2rem;
	}

	.table-thumb {
		width: 5.6rem;
		height: 4.2rem;
		border-radius: 8px;
		object-fit: cover;
		border: 1px solid var(--border);
	}

	.actiuni-celula { display: flex; gap: 0.5rem; align-items: center; }
	.btn-succes { color: #51cf66; border-color: rgba(81, 207, 102, 0.4); }
	.btn-succes:hover { background: rgba(81, 207, 102, 0.15); border-color: #51cf66; }
	.btn-galerie { color: var(--accent-blue); border-color: rgba(111, 169, 196, 0.4); }
	.btn-galerie:hover { background: rgba(111, 169, 196, 0.15); border-color: var(--accent-blue); }
	.eveniment-trecut { background-color: rgba(224, 49, 49, 0.08) !important; }
	
	.info-ev { display: flex; flex-direction: column; gap: 0.2rem; }
	.titlu-ev { font-size: 1.45rem; color: var(--text); cursor: pointer; }
	.titlu-ev:hover { color: var(--primary); }
	.locatie-ev { font-size: 1.15rem; color: var(--text-grey); }
	
	.badge-tip { background: var(--primary-tint); color: var(--primary); padding: 0.3rem 0.8rem; border-radius: 6px; font-size: 1.1rem; font-weight: 700; text-transform: uppercase; border: 1px solid var(--border); }
	
	.data-ora { display: flex; flex-direction: column; }
	.data-text { font-weight: 600; font-size: 1.3rem; }
	.ora-text { font-size: 1.2rem; color: var(--primary); font-weight: 700; }
	
	.durata-text { font-style: italic; color: var(--text-grey); font-size: 1.25rem; }
	
	.capacitate-info { display: flex; flex-direction: column; }
	.max-part { font-size: 1.3rem; color: var(--text); }
	.max-part strong { color: var(--primary); font-weight: 800; }
	.age-target { font-size: 1.1rem; color: var(--accent-blue); font-weight: 700; }
	
	.price-text { font-size: 1.4rem; color: var(--primary); font-weight: 800; }
	
	.badge-status {
		padding: 0.3rem 0.8rem;
		border-radius: 6px;
		font-size: 1.1rem;
		font-weight: 700;
	}
	.status-active { background: rgba(81, 207, 102, 0.15); color: #51cf66; border: 1px solid rgba(81, 207, 102, 0.3); }
	.status-expired { background: rgba(224, 49, 49, 0.18); color: #ff8787; border: 1px solid rgba(224, 49, 49, 0.4); }
	.status-finished { background: rgba(255, 255, 255, 0.08); color: var(--text-grey); border: 1px solid rgba(255, 255, 255, 0.15); }
</style>
