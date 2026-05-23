<script lang="ts">
    import type { NotificationRow } from '$lib/types';
    let { n, deliveryState, onDelete } = $props<{
        n: NotificationRow;
        deliveryState: (n: NotificationRow) => string;
        onDelete: (id: string) => void;
    }>();

    const ds = $derived(deliveryState(n));
</script>

<div class="notif-mobile-card" class:randul-expirat={ds === 'expired'}>
    <div class="card-header">
        <span class="badge-livrare" 
            class:badge-livrare--activa={ds === 'active'}
            class:badge-livrare--expirata={ds === 'expired' && !(n.status === 'trimis' || n.status === 'sent')}
            class:badge-livrare--finalizata={ds === 'expired' && (n.status === 'trimis' || n.status === 'sent')}
            class:badge-livrare--programata={ds === 'pending'}
        >
            {#if ds === 'active'}Activă
            {:else if ds === 'expired'}
                {#if n.status === 'trimis' || n.status === 'sent'}Finalizată
                {:else}Expirată{/if}
            {:else}Programată{/if}
        </span>
        <span class="badge-status status-{n.status}">{n.status}</span>
    </div>
    
    <div class="card-body">
        <strong class="title">{n.title}</strong>
        <p class="message">{n.body}</p>
        <div class="meta">
            <span class="date">📅 {new Date(n.scheduled_at).toLocaleString('ro-RO')}</span>
        </div>
    </div>
    
    <div class="card-actions">
        <button class="btn-delete" onclick={() => onDelete(n.id)}>🗑️ Șterge Notificare</button>
    </div>
</div>

<style>
    .notif-mobile-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 1.4rem;
        margin-bottom: 1.2rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .randul-expirat { opacity: 0.7; }
    
    .card-header { display: flex; justify-content: space-between; margin-bottom: 1rem; align-items: center; }
    
    .card-body { display: flex; flex-direction: column; gap: 0.4rem; }
    .title { font-size: 1.5rem; color: var(--text); }
    .message { font-size: 1.25rem; color: var(--text-grey); line-height: 1.4; margin: 0.4rem 0 0.8rem; }
    
    .meta { border-top: 1px solid var(--border); padding-top: 0.8rem; }
    .date { font-size: 1.1rem; color: var(--text-grey); font-family: monospace; font-weight: 600; }
    
    .card-actions { margin-top: 1.2rem; }
    .btn-delete { width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid rgba(224, 49, 49, 0.2); background: var(--danger-tint); color: var(--danger); font-weight: 700; cursor: pointer; }

    .badge-livrare { padding: 0.3rem 0.8rem; border-radius: 4px; font-size: 0.9rem; font-weight: 800; text-transform: uppercase; }
    .badge-livrare--activa { background: #2b8a3e; color: white; }
    .badge-livrare--finalizata { background: var(--bg-dark); color: var(--text-grey); }
    .badge-livrare--expirata { background: #a93226; color: white; }
    .badge-livrare--programata { background: #f39c12; color: white; }
</style>
