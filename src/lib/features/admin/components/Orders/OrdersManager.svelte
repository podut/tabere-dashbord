<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { showToast } from '$lib/admin/notify.svelte';
	import type { OrderRow } from '$lib/types';

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

	<div class="table-scroll orders-table-container">
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
	
	.detalii-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.4rem; border-bottom: 1px solid var(--border); padding-bottom: 1.6rem; }
	.info-grid { background: var(--bg-dark); border-radius: 12px; border: 1px solid var(--border); padding: 2rem; margin-bottom: 2.4rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2.4rem; }
	.info-label { font-size: 1.1rem; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.8rem; display: block; }
	.info-val { font-size: 1.6rem; font-weight: 700; color: var(--text); display: block; }
	.item-row { display: flex; align-items: center; gap: 1.6rem; padding: 1.6rem; border-bottom: 1px solid var(--border); }
	.item-img { width: 6rem; height: 6rem; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-strong); }
	.total-bara { display: flex; justify-content: flex-end; align-items: center; gap: 3rem; padding: 2rem; background: var(--bg-dark); border-radius: 12px; margin-bottom: 2.4rem; border: 1px solid var(--border); }
</style>

<!-- MODAL DETALII COMANDA -->
{#if comenziDetalii}
	<div class="modal-overlay" style="z-index:1500;">
		<div class="login-card" style="max-width:75rem; max-height:90vh; overflow-y:auto;">
			<div class="detalii-header">
				<h2 style="margin:0;">Comandă <span style="color:var(--primary);">#{comenziDetalii.id.slice(0,8).toUpperCase()}</span></h2>
				<button class="btn-icon" onclick={() => comenziDetalii = null} style="font-size: 2rem;">×</button>
			</div>

			<div class="info-grid">
				<div>
					<span class="info-label">CLIENT</span>
					<span class="info-val">{comenziDetalii.client_name}</span>
					<p style="margin-top: 0.4rem; color: var(--text-grey);">📞 {comenziDetalii.client_phone}</p>
				</div>
				<div>
					<span class="info-label">LIVRARE</span>
					<p style="color: var(--text); font-weight: 600;">{comenziDetalii.client_address}</p>
					<p style="color: var(--text-grey);">{comenziDetalii.client_city}, {comenziDetalii.client_county}</p>
				</div>
			</div>

			<div style="border:1px solid var(--border); border-radius:12px; overflow:hidden; margin-bottom:2.4rem; background: var(--bg-dark);">
				{#each comenziDetalii.order_items || [] as item}
					<div class="item-row">
						{#if item.image_url}<img src={item.image_url} alt="" class="item-img" />{/if}
						<div style="flex:1;">
							<p style="font-weight:700; font-size: 1.5rem; color: var(--text);">{item.product_name}</p>
							<p style="font-size:1.3rem; color:var(--text-grey);">{item.quantity} x {Number(item.price).toLocaleString()} lei</p>
						</div>
						<p style="font-weight:800; font-size: 1.6rem; color: var(--primary);">{(item.quantity * item.price).toLocaleString()} lei</p>
					</div>
				{/each}
			</div>

			<div class="total-bara">
				<span style="font-size: 1.4rem; color: var(--text-grey); font-weight: 700; text-transform: uppercase;">Total Comandă</span>
				<span style="font-size:2.8rem; font-weight:900; color:var(--primary); line-height: 1;">{Number(comenziDetalii.total_price).toLocaleString()} <small style="font-size: 1.4rem;">RON</small></span>
			</div>

			<div style="display:flex; gap:1.2rem;">
				{#if comenziDetalii.status === 'nou'}
					<button class="buton-primar" style="flex:1; background:#3498db; border-color: #2980b9;" onclick={() => updateStatusComanda(comenziDetalii.id,'confirmat')}>Confirmă Comanda</button>
				{:else if comenziDetalii.status === 'confirmat'}
					<button class="buton-primar" style="flex:1; background:#27ae60; border-color: #219150;" onclick={() => updateStatusComanda(comenziDetalii.id,'finalizat')}>Marchează Finalizată</button>
				{/if}
				<button class="buton-iesire" style="flex:1; background:#e74c3c; border: none;" onclick={() => updateStatusComanda(comenziDetalii.id,'anulat')}>Anulează</button>
			</div>
		</div>
	</div>
{/if}
