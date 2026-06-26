<script lang="ts">
	let { comanda = $bindable(), onClose, onUpdateStatus }: {
		comanda: any;
		onClose: () => void;
		onUpdateStatus: (id: string, status: string) => void;
	} = $props();
</script>

<div class="modal-overlay" style="z-index:1500;">
	<div class="login-card" style="max-width:75rem; max-height:90vh; overflow-y:auto;">
		<div class="detalii-header">
			<h2 style="margin:0;">Comandă <span style="color:var(--primary);">#{comanda.id.slice(0,8).toUpperCase()}</span></h2>
			<button class="btn-icon" onclick={onClose} style="font-size: 2rem;">×</button>
		</div>

		<div class="info-grid">
			<div>
				<span class="info-label">CLIENT</span>
				<span class="info-val">{comanda.client_name}</span>
				<p style="margin-top: 0.4rem; color: var(--text-grey);">📞 {comanda.client_phone}</p>
			</div>
			<div>
				<span class="info-label">LIVRARE</span>
				<p style="color: var(--text); font-weight: 600;">{comanda.client_address}</p>
				<p style="color: var(--text-grey);">{comanda.client_city}, {comanda.client_county}</p>
			</div>
		</div>

		<div style="border:1px solid var(--border); border-radius:12px; overflow:hidden; margin-bottom:2.4rem; background: var(--bg-dark);">
			{#each comanda.order_items || [] as item}
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
			<span style="font-size:2.8rem; font-weight:900; color:var(--primary); line-height: 1;">{Number(comanda.total_price).toLocaleString()} <small style="font-size: 1.4rem;">RON</small></span>
		</div>

		<div style="display:flex; gap:1.2rem;">
			{#if comanda.status === 'nou'}
				<button class="buton-primar" style="flex:1; background:#3498db; border-color: #2980b9;" onclick={() => onUpdateStatus(comanda.id,'confirmat')}>Confirmă Comanda</button>
			{:else if comanda.status === 'confirmat'}
				<button class="buton-primar" style="flex:1; background:#27ae60; border-color: #219150;" onclick={() => onUpdateStatus(comanda.id,'finalizat')}>Marchează Finalizată</button>
			{/if}
			<button class="buton-iesire" style="flex:1; background:#e74c3c; border: none;" onclick={() => onUpdateStatus(comanda.id,'anulat')}>Anulează</button>
		</div>
	</div>
</div>

<style>
	.detalii-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.4rem; border-bottom: 1px solid var(--border); padding-bottom: 1.6rem; }
	.info-grid { background: var(--bg-dark); border-radius: 12px; border: 1px solid var(--border); padding: 2rem; margin-bottom: 2.4rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2.4rem; }
	.info-label { font-size: 1.1rem; color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.8rem; display: block; }
	.info-val { font-size: 1.6rem; font-weight: 700; color: var(--text); display: block; }
	.item-row { display: flex; align-items: center; gap: 1.6rem; padding: 1.6rem; border-bottom: 1px solid var(--border); }
	.item-img { width: 6rem; height: 6rem; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-strong); }
	.total-bara { display: flex; justify-content: flex-end; align-items: center; gap: 3rem; padding: 2rem; background: var(--bg-dark); border-radius: 12px; margin-bottom: 2.4rem; border: 1px solid var(--border); }
</style>
