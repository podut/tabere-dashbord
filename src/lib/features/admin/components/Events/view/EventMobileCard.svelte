<script lang="ts">
	import type { EventRow } from '$lib/types';
    let { ev, onEdit, onFinalize, onDelete, onGallery, acum } = $props<{
        ev: EventRow;
        onEdit: (ev: EventRow) => void;
        onFinalize: (id: string) => void;
        onDelete: (ev: EventRow) => void;
        onGallery: (ev: EventRow) => void;
        acum: Date;
    }>();
</script>

<div class="mobile-card" class:eveniment-trecut={new Date(ev.date) < acum && ev.status === 'active'}>
    <div class="card-header">
        <span class="badge-tip">{ev.type}</span>
        <span class="badge-status status-{ev.status}">{ev.status}</span>
    </div>
    
    <div class="card-body">
        <h3 class="titlu-ev">{ev.title}</h3>
        <p class="locatie-ev">📍 {ev.location}</p>
        
        <div class="info-row">
            <div class="info-item">
                <span class="label">Dată</span>
                <span class="val">{new Date(ev.date).toLocaleDateString('ro-RO')}</span>
            </div>
            <div class="info-item">
                <span class="label">Oră</span>
                <span class="val">{ev.start_time || '--:--'}</span>
            </div>
        </div>
        
        <div class="info-row">
            <div class="info-item">
                <span class="label">Preț</span>
                <span class="val primary">{ev.price} {ev.currency || 'lei'}</span>
            </div>
            <div class="info-item">
                <span class="label">Locuri</span>
                <span class="val">{ev.max_participants || 0} max</span>
            </div>
        </div>
    </div>
    
    <div class="card-actions">
        <button class="btn-action" onclick={() => onGallery(ev)}>🖼️ Galerie</button>
        <button class="btn-action" onclick={() => onEdit(ev)}>✏️ Editează</button>
        {#if ev.status === 'active' && new Date(ev.date) < acum}
            <button class="btn-action success" onclick={() => onFinalize(ev.id)}>✅ Finalizează</button>
        {/if}
        <button class="btn-action danger" onclick={() => onDelete(ev)}>🗑️ Șterge</button>
    </div>
</div>

<style>
    .mobile-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 1.6rem;
        margin-bottom: 1.2rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .eveniment-trecut { border-left: 4px solid var(--danger); background: rgba(224, 49, 49, 0.05); }
    
    .card-header { display: flex; justify-content: space-between; margin-bottom: 1.2rem; }
    
    .badge-tip { background: var(--primary-tint); color: var(--primary); padding: 0.2rem 0.8rem; border-radius: 4px; font-size: 1rem; font-weight: 700; text-transform: uppercase; }
    
    .titlu-ev { font-size: 1.6rem; color: var(--text); margin: 0 0 0.4rem; font-weight: 800; }
    .locatie-ev { font-size: 1.2rem; color: var(--text-grey); margin-bottom: 1.2rem; }
    
    .info-row { display: flex; gap: 2rem; margin-bottom: 1rem; }
    .info-item { display: flex; flex-direction: column; }
    .label { font-size: 1rem; color: var(--text-grey); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.2rem; }
    .val { font-size: 1.3rem; font-weight: 700; color: var(--text); }
    .val.primary { color: var(--primary); }
    
    .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-top: 1.6rem; border-top: 1px solid var(--border); padding-top: 1.2rem; }
    
    .btn-action {
        padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-dark);
        color: var(--text); font-size: 1.2rem; font-weight: 700; cursor: pointer;
    }
    .btn-action.success { color: #27ae60; border-color: rgba(39, 174, 96, 0.3); }
    .btn-action.danger { color: var(--danger); border-color: rgba(231, 76, 60, 0.3); }
</style>
