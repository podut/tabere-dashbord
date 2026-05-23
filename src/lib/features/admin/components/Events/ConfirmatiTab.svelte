<script lang="ts">
	import type { Booking, EventRow } from '$lib/types';

	let { confirmati, evenimente, onMutaParticipant, onElibereazaPozitia }: {
		confirmati: Booking[];
		evenimente: EventRow[];
		onMutaParticipant: (bookingId: string, newPosition: string) => Promise<void>;
		onElibereazaPozitia: (bookingId: string) => Promise<void>;
	} = $props();

	const eventIds = $derived([...new Set(confirmati.map(r => r.event_id).filter(Boolean))]);
	const faraEveniment = $derived(confirmati.filter(r => !r.event_id));

	let dragOverKey = $state<string | null>(null);
	let draggingId = $state<string | null>(null);

	function onDragStart(e: DragEvent, bookingId: string) {
		draggingId = bookingId;
		e.dataTransfer!.setData('text/plain', bookingId);
		e.dataTransfer!.effectAllowed = 'move';
	}

	function onDragEnd() {
		draggingId = null;
		dragOverKey = null;
	}

	function onDragEnter(e: DragEvent, key: string) {
		e.preventDefault();
		dragOverKey = key;
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
	}

	function onDragLeave(e: DragEvent, key: string) {
		const target = e.currentTarget as HTMLElement;
		if (!target.contains(e.relatedTarget as Node)) {
			if (dragOverKey === key) dragOverKey = null;
		}
	}

	async function onDrop(e: DragEvent, pozitie: string, key: string) {
		e.preventDefault();
		dragOverKey = null;
		const bookingId = e.dataTransfer!.getData('text/plain');
		if (bookingId && bookingId !== draggingId?.toString()) {
			await onMutaParticipant(bookingId, pozitie);
		} else if (bookingId) {
			await onMutaParticipant(bookingId, pozitie);
		}
		draggingId = null;
	}
</script>

{#if confirmati.length === 0}
	<div class="tabel-container">
		<div class="td-gol">Niciun participant confirmat încă.</div>
	</div>
{:else}
	{#each eventIds as eid}
		{@const evGrup = evenimente.find(e => e.id === eid)}
		{@const participantiEv = confirmati.filter(r => r.event_id === eid)}
		{@const pozitii = (evGrup?.positions as string[] | undefined) ?? []}

		<div class="grup-eveniment">
			<div class="grup-header">
				<span class="grup-titlu">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
					{evGrup?.title ?? 'Eveniment necunoscut'}
				</span>
				<span class="grup-meta">
					{evGrup ? new Date(evGrup.date).toLocaleDateString('ro-RO') : ''}
					&middot; <strong>{participantiEv.length}</strong> participanți
				</span>
			</div>

			{#if pozitii.length > 0}
				<div class="kanban-board">
					{#each pozitii as pozitie}
						{@const participantiPozitie = participantiEv.filter(p => p.selected_position === pozitie)}
						{@const colKey = `${eid}::${pozitie}`}
						<div
							class="pozitie-col"
							class:drop-over={dragOverKey === colKey}
							ondragenter={(e) => onDragEnter(e, colKey)}
							ondragover={onDragOver}
							ondragleave={(e) => onDragLeave(e, colKey)}
							ondrop={(e) => onDrop(e, pozitie, colKey)}
						>
							<div class="pozitie-col-header">
								<span class="pozitie-name">{pozitie}</span>
								<span class="pozitie-badge">{participantiPozitie.length}</span>
							</div>
							<div class="pozitie-col-body">
								{#if participantiPozitie.length === 0}
									<div class="drop-hint">
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></svg>
										Trage aici
									</div>
								{:else}
									{#each participantiPozitie as booking}
										<div
											class="participant-chip"
											class:is-dragging={draggingId === booking.id}
											draggable="true"
											ondragstart={(e) => onDragStart(e, booking.id)}
											ondragend={onDragEnd}
										>
											<div class="chip-info">
												<span class="chip-name">{booking.nume_client}</span>
												<span class="chip-phone">{booking.telefon}</span>
											</div>
											<button
												class="chip-delete"
												onclick={() => onElibereazaPozitia(booking.id)}
												title="Scoate din poziție"
											>×</button>
										</div>
									{/each}
								{/if}
							</div>
						</div>
					{/each}

					{@const neasignati = participantiEv.filter(p => !p.selected_position || !pozitii.includes(p.selected_position))}
					{#if neasignati.length > 0}
						<div class="pozitie-col pozitie-col--unassigned">
							<div class="pozitie-col-header">
								<span class="pozitie-name pozitie-name--warn">Fără poziție</span>
								<span class="pozitie-badge pozitie-badge--warn">{neasignati.length}</span>
							</div>
							<div class="pozitie-col-body">
								{#each neasignati as booking}
									<div
										class="participant-chip participant-chip--unassigned"
										class:is-dragging={draggingId === booking.id}
										draggable="true"
										ondragstart={(e) => onDragStart(e, booking.id)}
										ondragend={onDragEnd}
									>
										<div class="chip-info">
											<span class="chip-name">{booking.nume_client}</span>
											<span class="chip-phone">{booking.telefon}</span>
										</div>
										<button
											class="chip-delete"
											onclick={() => onElibereazaPozitia(booking.id)}
											title="Scoate din poziție"
										>×</button>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<div class="tabel-container table-scroll" style="border-radius: 0; border: none; box-shadow: none;">
					<table>
						<thead>
							<tr><th>Participant</th><th>Telefon</th><th>Poziție</th><th></th></tr>
						</thead>
						<tbody>
							{#each participantiEv as r}
								<tr>
									<td><strong>{r.nume_client}</strong></td>
									<td>{r.telefon}</td>
									<td><span class="badge-status status-confirmat">{r.selected_position || '—'}</span></td>
									<td>
										<button class="btn-scoate" onclick={() => onElibereazaPozitia(r.id)}>Scoate</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/each}

	{#if faraEveniment.length > 0}
		<div class="grup-eveniment">
			<div class="grup-header grup-header--servicii">
				<span class="grup-titlu">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
					Servicii confirmate
				</span>
			</div>
			<div class="tabel-container table-scroll">
				<table>
					<thead>
						<tr><th>Client</th><th>Telefon</th><th>Activitate</th></tr>
					</thead>
					<tbody>
						{#each faraEveniment as r}
							<tr>
								<td><strong>{r.nume_client}</strong></td>
								<td>{r.telefon}</td>
								<td>{r.activity_title}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
{/if}

<style>
	.grup-eveniment {
		margin-bottom: 1.6rem;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid var(--border);
		background: var(--bg-card);
	}
	.grup-header {
		display: flex; align-items: center; justify-content: space-between;
		padding: 1.4rem 2rem;
		background: var(--primary-tint);
		border-bottom: 1px solid var(--border);
	}
	.grup-header--servicii { background: rgba(255,255,255,0.02); }
	.grup-titlu {
		font-weight: 700; font-size: 1.5rem;
		display: flex; align-items: center; gap: 0.8rem;
		color: var(--primary);
	}
	.grup-meta { font-size: 1.3rem; color: var(--text-grey); }
	.td-gol { text-align: center; padding: 4rem; color: var(--text-grey); }
	.tabel-container { border: none; border-radius: 0; box-shadow: none; }

	/* ── Kanban board ── */
	.kanban-board {
		display: flex;
		gap: 1.2rem;
		padding: 1.6rem;
		overflow-x: auto;
		flex-wrap: wrap;
		background: rgba(0,0,0,0.15);
		align-items: flex-start;
	}

	.pozitie-col {
		min-width: 17rem;
		flex: 1;
		max-width: 22rem;
		border-radius: 10px;
		border: 1.5px solid var(--border);
		background: rgba(0,0,0,0.25);
		display: flex;
		flex-direction: column;
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	.pozitie-col.drop-over {
		border-color: var(--primary);
		box-shadow: 0 0 0 2px rgba(197, 160, 48, 0.2);
		background: rgba(197, 160, 48, 0.04);
	}

	.pozitie-col--unassigned {
		border-color: rgba(255, 180, 0, 0.2);
		background: rgba(255, 140, 0, 0.04);
	}

	.pozitie-col-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.9rem 1.2rem;
		border-bottom: 1px solid var(--border);
	}

	.pozitie-name {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--primary);
		text-transform: uppercase;
		letter-spacing: 0.6px;
	}

	.pozitie-name--warn { color: #ffb400; }

	.pozitie-badge {
		background: var(--primary-tint);
		color: var(--primary);
		font-size: 1.1rem;
		font-weight: 700;
		padding: 0.15rem 0.6rem;
		border-radius: 100px;
		min-width: 1.8rem;
		text-align: center;
	}

	.pozitie-badge--warn {
		background: rgba(255, 180, 0, 0.12);
		color: #ffb400;
	}

	.pozitie-col-body {
		flex: 1;
		padding: 0.8rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		min-height: 7rem;
	}

	.drop-hint {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 1.2rem;
		color: var(--text-grey);
		padding: 1.4rem 0;
		border: 1px dashed var(--border);
		border-radius: 8px;
		user-select: none;
		pointer-events: none;
	}

	/* ── Participant chip ── */
	.participant-chip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		background: var(--primary-tint);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.7rem 0.9rem;
		cursor: grab;
		transition: background 0.15s, border-color 0.15s, opacity 0.15s;
		user-select: none;
	}

	.participant-chip:hover {
		background: var(--primary-tint2);
		border-color: var(--border-strong);
	}

	.participant-chip.is-dragging {
		opacity: 0.35;
		cursor: grabbing;
	}

	.participant-chip--unassigned {
		background: rgba(255, 140, 0, 0.06);
		border-color: rgba(255, 180, 0, 0.2);
	}

	.chip-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
		flex: 1;
	}

	.chip-name {
		font-size: 1.3rem;
		font-weight: 700;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.chip-phone {
		font-size: 1.1rem;
		color: var(--text-grey);
		font-family: monospace;
		letter-spacing: 0.3px;
	}

	.chip-delete {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-grey);
		font-size: 1.8rem;
		line-height: 1;
		padding: 0.1rem 0.3rem;
		border-radius: 4px;
		transition: background 0.15s, color 0.15s;
		flex-shrink: 0;
		font-family: inherit;
	}

	.chip-delete:hover {
		background: var(--danger-tint);
		color: var(--danger);
	}

	/* ── Fallback table actions ── */
	.btn-scoate {
		background: none;
		border: 1px solid var(--border);
		color: var(--text-grey);
		font-size: 1.2rem;
		padding: 0.4rem 0.9rem;
		border-radius: 6px;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.15s, border-color 0.15s, color 0.15s;
	}

	.btn-scoate:hover {
		background: var(--danger-tint);
		border-color: var(--danger);
		color: var(--danger);
	}
</style>
