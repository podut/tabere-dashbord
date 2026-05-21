<script lang="ts">
	import type { Booking, EventRow } from '$lib/types';

	let { confirmati, evenimente }: {
		confirmati: Booking[];
		evenimente: EventRow[];
	} = $props();

	const eventIds = $derived([...new Set(confirmati.map(r => r.event_id).filter(Boolean))]);
	const faraEveniment = $derived(confirmati.filter(r => !r.event_id));
</script>

{#if confirmati.length === 0}
	<div class="tabel-container">
		<div class="td-gol">Niciun participant confirmat încă.</div>
	</div>
{:else}
	{#each eventIds as eid}
		{@const evGrup = evenimente.find(e => e.id === eid)}
		{@const participanti = confirmati.filter(r => r.event_id === eid)}
		<div class="grup-eveniment">
			<div class="grup-header">
				<span class="grup-titlu">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
					{evGrup?.title ?? 'Eveniment necunoscut'}
				</span>
				<span class="grup-meta">
					{evGrup ? new Date(evGrup.date).toLocaleDateString('ro-RO') : ''}
					&middot; <strong>{participanti.length}</strong> participanți
				</span>
			</div>
			<div class="tabel-container table-scroll">
				<table>
					<thead>
						<tr><th>Participant</th><th>Telefon</th><th>Poziție</th><th>Activitate</th></tr>
					</thead>
					<tbody>
						{#each participanti as r}
							<tr>
								<td><strong>{r.nume_client}</strong></td>
								<td>{r.telefon}</td>
								<td><span class="badge-status status-confirmat">{r.selected_position || '—'}</span></td>
								<td class="text-gri">{r.activity_title}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
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
	.grup-eveniment { margin-bottom: 1.6rem; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
	.grup-header {
		display: flex; align-items: center; justify-content: space-between;
		padding: 1.4rem 2rem; background: var(--primary-tint);
		border-bottom: 1px solid var(--border);
	}
	.grup-header--servicii { background: #f8f9fa; }
	.grup-titlu { font-weight: 700; font-size: 1.5rem; display: flex; align-items: center; gap: 0.8rem; color: var(--dark); }
	.grup-meta { font-size: 1.3rem; color: #666; }
	.text-gri { color: #666; }
	.td-gol { text-align: center; padding: 4rem; color: #999; }
	.tabel-container { border: none; border-radius: 0; box-shadow: none; }
</style>
