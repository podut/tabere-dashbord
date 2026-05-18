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
	<!-- Stats mini -->
	<div class="orders-stats-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(15rem, 1fr)); gap:1.6rem; margin-bottom:2.4rem;">
		<div class="stat-card" style="border-left:5px solid #f39c12; background: white;">
			<span class="valoare" style="color:#f39c12; font-size: 2.4rem;">{cmdStats.nou}</span>
			<span class="eticheta">Comenzi Noi</span>
		</div>
		<div class="stat-card" style="border-left:5px solid #3498db; background: white;">
			<span class="valoare" style="color:#3498db; font-size: 2.4rem;">{cmdStats.confirmat}</span>
			<span class="eticheta">Confirmate</span>
		</div>
		<div class="stat-card" style="border-left:5px solid #27ae60; background: white;">
			<span class="valoare" style="color:#27ae60; font-size: 2.4rem;">{cmdStats.finalizat}</span>
			<span class="eticheta">Finalizate</span>
		</div>
		<div class="stat-card" style="border-left:5px solid var(--primary); background: #f1f8e9;">
			<span class="valoare" style="color:var(--primary); font-size: 2.4rem;">{cmdStats.venituriAzi.toLocaleString()} lei</span>
			<span class="eticheta">Venituri Azi</span>
		</div>
	</div>

	<!-- Tabs + Search -->
	<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1.6rem; margin-bottom:2rem;">
		<div class="tabs-intern" style="display:flex; background: #e0e0e0; padding: 0.4rem; border-radius: 12px; gap: 0.4rem;">
			{#each [
				{ key:'nou', label:'🆕 Noi', count: cmdStats.nou },
				{ key:'confirmat', label:'📦 Confirmate', count: cmdStats.confirmat },
				{ key:'finalizat', label:'✅ Finalizat', count: cmdStats.finalizat },
				{ key:'anulat', label:'✖ Anulate', count: cmdStats.anulat }
			] as tab}
				<button 
					onclick={() => subSectiuneCmd = tab.key}
					class="tab-item-orders"
					style="background: {subSectiuneCmd === tab.key ? 'white' : 'transparent'};
					color: {subSectiuneCmd === tab.key ? 'var(--dark)' : '#666'};"
				>
					{tab.label} ({tab.count})
				</button>
			{/each}
		</div>

		<div style="position:relative; flex: 1; max-width: 35rem;">
			<input 
				type="search" 
				placeholder="Caută client sau telefon..." 
				bind:value={cmdCautare}
				style="width: 100%; padding: 1.1rem 1.2rem; border-radius: 12px; border: 1px solid var(--border); font-size: 1.4rem;"
			/>
		</div>
	</div>

	<div class="table-scroll" style="background:white; border-radius:16px; border: 1px solid var(--border);">
		<table>
			<thead>
				<tr>
					<th>#ID</th><th>Client</th><th>Produse</th><th>Total</th><th>Dată</th><th>Status</th><th>Acțiuni</th>
				</tr>
			</thead>
			<tbody>
				{#each comenziFiltrate as c}
					<tr style="cursor:pointer;" onclick={() => comenziDetalii = c}>
						<td style="font-family:monospace; font-weight:700;">#{c.id.slice(0,8).toUpperCase()}</td>
						<td><strong>{c.client_name}</strong><br><small>{c.client_phone}</small></td>
						<td style="text-align:center;">{ (c.order_items||[]).length }</td>
						<td><strong>{Number(c.total_price).toLocaleString()} lei</strong></td>
						<td>{new Date(c.created_at).toLocaleDateString('ro-RO')}</td>
						<td><span class="badge-status status-{c.status}">{c.status.toUpperCase()}</span></td>
						<td onclick={(e) => e.stopPropagation()}>
							<div style="display:flex; gap:0.5rem;">
								{#if c.status === 'nou'}
									<button class="buton-primar" style="background:#3498db; padding:0.4rem 0.8rem; font-size:1.1rem;" onclick={() => updateStatusComanda(c.id, 'confirmat')}>Confirmă</button>
								{:else if c.status === 'confirmat'}
									<button class="buton-primar" style="background:#27ae60; padding:0.4rem 0.8rem; font-size:1.1rem;" onclick={() => updateStatusComanda(c.id, 'finalizat')}>Finalizează</button>
								{/if}
								<button class="buton-iesire" style="background:#e74c3c; color:white; padding:0.4rem 0.8rem; font-size:1.1rem; border:none;" onclick={() => updateStatusComanda(c.id, 'anulat')}>Anulează</button>
							</div>
						</td>
					</tr>
				{:else}
					<tr><td colspan="7" style="text-align:center; padding: 4rem; color: #bbb;">Nicio comandă găsită.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- MODAL DETALII COMANDA -->
{#if comenziDetalii}
	<div class="modal-overlay" style="z-index:1500;">
		<div class="login-card" style="max-width:70rem; max-height:90vh; overflow-y:auto;">
			<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
				<h2>Comandă #{comenziDetalii.id.slice(0,8).toUpperCase()}</h2>
				<button class="buton-iesire" onclick={() => comenziDetalii = null}>×</button>
			</div>

			<div style="background:var(--primary-tint); border-radius:10px; padding:1.6rem; margin-bottom:2rem; display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
				<div>
					<p style="font-size:1.2rem; color:#888;">CLIENT</p>
					<p style="font-size:1.5rem; font-weight:700;">{comenziDetalii.client_name}</p>
					<p>📞 {comenziDetalii.client_phone}</p>
				</div>
				<div>
					<p style="font-size:1.2rem; color:#888;">LIVRARE</p>
					<p>{comenziDetalii.client_address}</p>
					<p>{comenziDetalii.client_city}, {comenziDetalii.client_county}</p>
				</div>
			</div>

			<div style="border:1px solid var(--border); border-radius:10px; overflow:hidden; margin-bottom:2rem;">
				{#each comenziDetalii.order_items || [] as item}
					<div style="display:flex; align-items:center; gap:1.4rem; padding:1.2rem; border-bottom:1px solid var(--border);">
						{#if item.image_url}<img src={item.image_url} alt="" style="width:5rem; height:5rem; object-fit:cover; border-radius:8px;" />{/if}
						<div style="flex:1;">
							<p style="font-weight:600;">{item.product_name}</p>
							<p style="font-size:1.2rem; color:#888;">{item.quantity} x {Number(item.price).toLocaleString()} lei</p>
						</div>
						<p style="font-weight:700;">{(item.quantity * item.price).toLocaleString()} lei</p>
					</div>
				{/each}
			</div>

			<div style="display:flex; justify-content:flex-end; align-items:center; gap:2rem; padding:1.2rem; background:#f9f9f9; border-radius:10px; margin-bottom:2rem;">
				<span>Total comandă</span>
				<span style="font-size:2.4rem; font-weight:800; color:var(--primary);">{Number(comenziDetalii.total_price).toLocaleString()} lei</span>
			</div>

			<div style="display:flex; gap:1rem;">
				{#if comenziDetalii.status === 'nou'}
					<button class="buton-primar" style="flex:1; background:#3498db;" onclick={() => updateStatusComanda(comenziDetalii.id,'confirmat')}>Confirmă Comanda</button>
				{:else if comenziDetalii.status === 'confirmat'}
					<button class="buton-primar" style="flex:1; background:#27ae60;" onclick={() => updateStatusComanda(comenziDetalii.id,'finalizat')}>Marchează Finalizată</button>
				{/if}
				<button class="buton-iesire" style="flex:1; background:#e74c3c; color:white; border:none;" onclick={() => updateStatusComanda(comenziDetalii.id,'anulat')}>Anulează</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.tab-item-orders { padding: 0.8rem 1.6rem; border-radius: 10px; border:none; cursor:pointer; font-weight:700; font-size:1.3rem; transition: all 0.2s; }
</style>
