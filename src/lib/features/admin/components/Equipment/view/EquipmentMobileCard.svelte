<script lang="ts">
	import type { Equipment } from '$lib/types';
    let { sub, onEdit, onDelete } = $props<{
        sub: Equipment;
        onEdit: (e: Equipment) => void;
        onDelete: (id: string) => void;
    }>();
</script>

<div class="eq-mobile-sub-card">
    <img src={sub.image_url} alt="" class="img" />
    <div class="info">
        <h4 class="title">{sub.title}</h4>
        <div class="actions">
            <button class="btn" onclick={() => onEdit(sub)}>✏️</button>
            <button class="btn danger" onclick={() => onDelete(sub.id)}>🗑️</button>
        </div>
    </div>
</div>

<style>
    .eq-mobile-sub-card {
        display: flex; gap: 1rem; background: var(--bg-dark);
        border: 1px solid var(--border); border-radius: 12px;
        padding: 0.8rem; align-items: center;
    }
    .img { width: 5rem; height: 5rem; border-radius: 8px; object-fit: cover; }
    .info { flex: 1; min-width: 0; }
    .title { font-size: 1.3rem; margin: 0 0 0.6rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .actions { display: flex; gap: 0.6rem; }
    .btn { padding: 0.4rem 1rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; }
    .btn.danger { color: var(--danger); }
</style>
