<script lang="ts">
	import type { Service } from '$lib/types';
    let { s, onEdit, onDelete } = $props<{
        s: Service;
        onEdit: (s: Service) => void;
        onDelete: (id: string) => void;
    }>();
</script>

<div class="service-mobile-card">
    <div class="card-side">
        <img src={s.image_url} alt="" />
    </div>
    <div class="card-main">
        <div class="header">
            <strong class="title">{s.title}</strong>
            <span class="badge-tip">{s.category}</span>
        </div>
        <p class="price">{s.price} {s.price_label || 'RON'}</p>
        <div class="actions">
            <button class="btn" onclick={() => onEdit(s)}>✏️</button>
            <button class="btn danger" onclick={() => onDelete(s.id)}>🗑️</button>
        </div>
    </div>
</div>

<style>
    .service-mobile-card { display: flex; gap: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.2rem; margin-bottom: 1rem; }
    .card-side { width: 7rem; height: 7rem; flex-shrink: 0; }
    .card-side img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
    .card-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem; }
    .title { font-size: 1.4rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .badge-tip { font-size: 0.9rem; padding: 0.2rem 0.6rem; background: var(--primary-tint); color: var(--primary); border-radius: 4px; font-weight: 700; text-transform: uppercase; }
    .price { font-weight: 700; color: var(--primary); font-size: 1.4rem; margin: 0.2rem 0 0.8rem; }
    .actions { display: flex; gap: 0.8rem; }
    .btn { padding: 0.6rem 1.2rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-dark); cursor: pointer; }
    .btn.danger { color: var(--danger); border-color: rgba(224, 49, 49, 0.2); }
</style>
