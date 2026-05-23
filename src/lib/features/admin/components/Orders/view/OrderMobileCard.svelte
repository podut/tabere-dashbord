<script lang="ts">
	import type { OrderRow } from '$lib/types';
    let { order, onClick, onUpdateStatus } = $props<{
        order: OrderRow;
        onClick: () => void;
        onUpdateStatus: (id: string, status: string) => void;
    }>();
</script>

<div class="order-mobile-card" onclick={onClick}>
    <div class="card-header">
        <span class="order-id">#{order.id.slice(0,8).toUpperCase()}</span>
        <span class="badge-status status-{order.status}">{order.status}</span>
    </div>
    
    <div class="card-body">
        <div class="client-info">
            <strong class="name">{order.client_name}</strong>
            <span class="phone">📞 {order.client_phone}</span>
        </div>
        
        <div class="order-details">
            <div class="detail-item">
                <span class="label">Produse</span>
                <span class="val">{(order.order_items || []).length}</span>
            </div>
            <div class="detail-item">
                <span class="label">Total</span>
                <span class="val total">{Number(order.total_price).toLocaleString()} lei</span>
            </div>
        </div>
        
        <p class="order-date">📅 {new Date(order.created_at).toLocaleDateString('ro-RO')}</p>
    </div>
    
    <div class="card-actions" onclick={(e) => e.stopPropagation()}>
        {#if order.status === 'nou'}
            <button class="btn-action primary" onclick={() => onUpdateStatus(order.id, 'confirmat')}>Confirmă</button>
        {:else if order.status === 'confirmat'}
            <button class="btn-action success" onclick={() => onUpdateStatus(order.id, 'finalizat')}>Finalizează</button>
        {/if}
        <button class="btn-action danger" onclick={() => onUpdateStatus(order.id, 'anulat')}>Anulează</button>
    </div>
</div>

<style>
    .order-mobile-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 1.6rem;
        margin-bottom: 1.2rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .card-header { display: flex; justify-content: space-between; margin-bottom: 1.2rem; align-items: center; }
    .order-id { font-family: monospace; font-weight: 800; color: var(--primary); font-size: 1.4rem; }
    
    .client-info { display: flex; flex-direction: column; gap: 0.2rem; margin-bottom: 1.2rem; }
    .name { font-size: 1.5rem; color: var(--text); }
    .phone { font-size: 1.2rem; color: var(--text-grey); }
    
    .order-details { display: flex; justify-content: space-between; background: var(--bg-dark); padding: 1rem; border-radius: 10px; margin-bottom: 1rem; }
    .detail-item { display: flex; flex-direction: column; }
    .label { font-size: 0.9rem; color: var(--text-grey); text-transform: uppercase; }
    .val { font-size: 1.2rem; font-weight: 700; }
    .val.total { color: var(--primary); font-size: 1.4rem; }
    
    .order-date { font-size: 1.1rem; color: var(--text-grey); margin: 0; }
    
    .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-top: 1.6rem; border-top: 1px solid var(--border); padding-top: 1.2rem; }
    
    .btn-action {
        padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-dark);
        color: var(--text); font-size: 1.2rem; font-weight: 700; cursor: pointer;
    }
    .btn-action.primary { color: #3498db; border-color: rgba(52, 152, 219, 0.3); }
    .btn-action.success { color: #27ae60; border-color: rgba(39, 174, 96, 0.3); }
    .btn-action.danger { color: var(--danger); border-color: rgba(231, 76, 60, 0.3); }
</style>
