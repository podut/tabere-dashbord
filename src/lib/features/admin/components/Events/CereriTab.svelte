<script lang="ts">
	import type { Booking, EventRow } from '$lib/types';

	let { cereri, evenimente, onRepartizare, onConverteste, onDelete }: {
		cereri: Booking[];
		evenimente: EventRow[];
		onRepartizare: (booking: Booking) => void;
		onConverteste: (booking: Booking) => void;
		onDelete: (id: string) => void;
	} = $props();
</script>

<div class="tabel-container table-scroll">
	<table>
		<thead>
			<tr>
				<th>Client</th>
				<th>Activitate</th>
				<th>Telefon</th>
				<th>Eveniment / Cod</th>
				<th>Poziție</th>
				<th>Data Cererii</th>
				<th>Acțiuni</th>
			</tr>
		</thead>
		<tbody>
			{#each cereri as r}
				{@const evAsociat = r.event_id ? evenimente.find(e => e.id === r.event_id) : null}
				<tr>
					<td><strong>{r.nume_client}</strong></td>
					<td>{r.activity_title}</td>
					<td>{r.telefon}</td>
					<td>
						{#if evAsociat}
							<span class="ev-asociat">{evAsociat.title}</span>
						{:else}
							<span class="text-gri">—</span>
						{/if}
						{#if r.is_private && r.private_code}
							<div class="cod-privat-badge" title="Cerere privată">
								🔒 <code>{r.private_code}</code>
							</div>
						{/if}
					</td>
					<td>
						{#if r.selected_position}
							<span class="badge-status status-confirmat">{r.selected_position}</span>
						{:else}
							<span class="text-gri">—</span>
						{/if}
					</td>
					<td>{new Date(r.created_at).toLocaleDateString('ro-RO')}</td>
					<td>
						<div class="actiuni-celula">
							{#if r.event_id}
								<button class="btn-icon btn-repartizare" onclick={() => onRepartizare(r)} title="Repartizează poziție">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
								</button>
							{:else}
								<button class="btn-icon btn-converteste" onclick={() => onConverteste(r)} title="Convertește în Eveniment">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
								</button>
							{/if}
							<button class="btn-icon btn-sterge" onclick={() => onDelete(r.id)} title="Șterge">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
							</button>
						</div>
					</td>
				</tr>
			{:else}
				<tr><td colspan="7" class="td-gol">Nicio cerere în așteptare.</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.actiuni-celula { display: flex; gap: 0.5rem; align-items: center; }
	.ev-asociat { font-size: 1.3rem; color: #1971c2; font-weight: 600; }
	.text-gri { color: #bbb; }
	.btn-repartizare { color: #1971c2; border-color: #a5d8ff; }
	.btn-repartizare:hover { background: #e7f5ff; border-color: #1971c2; }
	.btn-converteste { color: var(--primary); border-color: var(--border); }
	.btn-converteste:hover { background: var(--primary-tint); border-color: var(--primary); }
	.td-gol { text-align: center; padding: 4rem; color: #999; }
	.cod-privat-badge { margin-top: 4px; font-size: 1.1rem; color: #6741d9; }
	.cod-privat-badge code { background: #f3f0ff; border-radius: 4px; padding: 1px 5px; letter-spacing: 0.05em; font-weight: 600; }
</style>
