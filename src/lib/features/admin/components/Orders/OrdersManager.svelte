<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { showToast } from '$lib/admin/notify.svelte';
	import type { OrderRow } from '$lib/types';
	import OrderMobileCard from './view/OrderMobileCard.svelte';
	import OrderDetailsModal from './OrderDetailsModal.svelte';

	let { comenzi = $bindable([]), refreshOrders }: { 
		comenzi: OrderRow[],
		refreshOrders: () => Promise<void>
	} = $props();

	let subSectiuneCmd = $state('nou');
	let cmdCautare = $state('');
	let comenziDetalii = $state<any>(null);

	async function updateStatusComanda(id: string, status: string) {
		const { error } = await supabase.from('orders').update({ status: status as any }).eq('id', id);
		if (!error) {
			await refreshOrders();
			if (comenziDetalii?.id === id) comenziDetalii = { ...comenziDetalii, status };
			showToast('success', `Status actualizat: ${status}`);
		} else {
			showToast('error', error.message);
		}
	}

	let comenziFiltrate = $derived(
		comenzi
			.filter(c => c.status === subSectiuneCmd)
			.filter(c => !cmdCautare.trim() ||
				c.client_name?.toLowerCase().includes(cmdCautare.toLowerCase()) ||
				c.client_phone?.includes(cmdCautare))
	);

	let cmdStats = $derived({
		nou: comenzi.filter(c => c.status === 'nou').length,
		confirmat: comenzi.filter(c => c.status === 'confirmat').length,
		finalizat: comenzi.filter(c => c.status === 'finalizat').length,
		anulat: comenzi.filter(c => c.status === 'anulat').length,
		venituriAzi: comenzi
			.filter(c => c.status === 'finalizat' && new Date(c.created_at).toDateString() === new Date().toDateString())
			.reduce((s, c) => s + Number(c.total_price), 0)
	});
</script>

<div class="orders-manager">
	<!-- Tabs + Search -->
	<div class="bara-filtrare">
		<div class="tabs-intern">
			{#each [
				{ key:'nou', label:'🆕 Noi', count: cmdStats.nou },
				{ key:'confirmat', label:'📦 Confirmate', count: cmdStats.confirmat },
				{ key:'finalizat', label:'✅ Finalizat', count: cmdStats.finalizat },
				{ key:'anulat', label:'✖ Anulate', count: cmdStats.anulat }
			] as tab}
				<button 
					onclick={() => subSectiuneCmd = tab.key}
					class="tab-item-orders"
					class:activ={subSectiuneCmd === tab.key}
				>
					{tab.label} <span class="count-bubble">{tab.count}</span>
				</button>
			{/each}
		</div>

		<div class="search-wrapper">
			<input 
				type="search" 
				placeholder="Caută client sau telefon..." 
				bind:value={cmdCautare}
			/>
		</div>
	</div>

	<!-- Mobile View -->
	<div class="mobile-only-grid">
		{#each comenziFiltrate as c}
			<OrderMobileCard order={c} onClick={() => comenziDetalii = c} onUpdateStatus={updateStatusComanda} />
		{:else}
			<div class="td-gol">Niciun comandă găsită.</div>
		{/each}
	</div>

	<div class="table-scroll orders-table-container desktop-only-table">
		<table>
			<thead>
				<tr>
					<th>#ID</th><th>Client</th><th>Produse</th><th>Total</th><th>Dată</th><th>Status</th><th>Acțiuni</th>
				</tr>
			</thead>
			<tbody>
				{#each comenziFiltrate as c}
					<tr onclick={() => comenziDetalii = c} class="row-clickable">
						<td class="col-id">#{c.id.slice(0,8).toUpperCase()}</td>
						<td>
							<div class="client-info">
								<strong class="client-name">{c.client_name}</strong>
								<span class="client-phone">{c.client_phone}</span>
							</div>
						</td>
						<td style="text-align:center;"><span class="badge-count">{(c.order_items||[]).length}</span></td>
						<td><strong class="total-price">{Number(c.total_price).toLocaleString()} lei</strong></td>
						<td class="col-date">{new Date(c.created_at).toLocaleDateString('ro-RO')}</td>
						<td><span class="badge-status status-{c.status}">{c.status}</span></td>
						<td onclick={(e) => e.stopPropagation()}>
							<div class="actiuni-celula">
								{#if c.status === 'nou'}
									<button class="btn-icon btn-confirma" onclick={() => updateStatusComanda(c.id, 'confirmat')} title="Confirmă">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
									</button>
								{:else if c.status === 'confirmat'}
									<button class="btn-icon btn-finaliza" onclick={() => updateStatusComanda(c.id, 'finalizat')} title="Finalizează">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11"/></svg>
									</button>
								{/if}
								<button class="btn-icon btn-anula" onclick={() => updateStatusComanda(c.id, 'anulat')} title="Anulează">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
								</button>
							</div>
						</td>
					</tr>
				{:else}
					<tr><td colspan="7" class="td-gol">Nicio comandă găsită.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

{#if comenziDetalii}
	<OrderDetailsModal
		bind:comanda={comenziDetalii}
		onClose={() => comenziDetalii = null}
		onUpdateStatus={updateStatusComanda}
	/>
{/if}

<style>
	.bara-filtrare { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 2rem; margin-bottom: 2.4rem; }

	.tabs-intern { display: flex; background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 12px; border: 1px solid var(--border); gap: 0.5rem; }
	
	.tab-item-orders {
		padding: 0.8rem 1.6rem; border-radius: 8px; border: none; cursor: pointer;
		font-weight: 700; font-size: 1.3rem; transition: all 0.2s;
		background: transparent; color: var(--text-grey);
		display: flex; align-items: center; gap: 0.8rem;
		font-family: inherit;
	}

	.tab-item-orders:hover { background: rgba(255,255,255,0.05); color: var(--text); }
	.tab-item-orders.activ { background: var(--bg-card); color: var(--primary); box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1px solid var(--border); }

	.count-bubble { background: var(--bg-dark); color: var(--text-grey); padding: 0.1rem 0.6rem; border-radius: 100px; font-size: 1.1rem; }
	.activ .count-bubble { background: var(--primary); color: var(--bg-dark); font-weight: 800; }

	.search-wrapper { flex: 1; max-width: 40rem; }
	.search-wrapper input { 
		width: 100%; padding: 1.2rem 1.6rem; border-radius: 12px; 
		border: 1px solid var(--border); background: var(--bg-card); color: var(--text); 
		font-size: 1.45rem; transition: all 0.2s;
	}
	.search-wrapper input:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 4px var(--primary-tint); }

	.orders-table-container { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.25); overflow: hidden; }

	.row-clickable:hover { background: rgba(197, 160, 48, 0.04) !important; }
	.col-id { font-family: monospace; font-weight: 700; color: var(--primary); font-size: 1.4rem; }
	.client-info { display: flex; flex-direction: column; gap: 0.2rem; }
	.client-name { font-size: 1.5rem; color: var(--text); }
	.client-phone { font-size: 1.2rem; color: var(--text-grey); }
	.badge-count { background: var(--bg-dark); padding: 0.3rem 0.8rem; border-radius: 4px; font-weight: 700; font-size: 1.2rem; }
	.total-price { font-size: 1.5rem; color: var(--primary); font-weight: 800; }
	.col-date { color: var(--text-grey); font-size: 1.3rem; }

	.actiuni-celula { display: flex; gap: 0.6rem; }
	.btn-confirma { color: #3498db; border-color: rgba(52, 152, 219, 0.3); }
	.btn-confirma:hover { background: rgba(52, 152, 219, 0.1); border-color: #3498db; }
	.btn-finaliza { color: #27ae60; border-color: rgba(39, 174, 96, 0.3); }
	.btn-finaliza:hover { background: rgba(39, 174, 96, 0.1); border-color: #27ae60; }
	.btn-anula { color: var(--danger); border-color: rgba(231, 76, 60, 0.3); }
	.btn-anula:hover { background: var(--danger-tint); border-color: var(--danger); }

	.td-gol { text-align: center; padding: 6rem; color: var(--text-grey); font-size: 1.5rem; font-style: italic; }

	.mobile-only-grid { display: none; }

	@media (max-width: 768px) {
		.desktop-only-table { display: none; }
		.mobile-only-grid { display: block; padding: 0.5rem; }
	}
</style>
