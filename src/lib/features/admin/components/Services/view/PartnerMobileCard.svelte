<script lang="ts">
	import type { Partner } from '$lib/types';
    let { p, onEdit, onDelete } = $props<{
        p: Partner;
        onEdit: (p: Partner) => void;
        onDelete: (id: string) => void;
    }>();
</script>

<div class="partner-mobile-card">
    <img src={p.image_url} alt="" class="img" />
    <div class="info">
        <strong class="name">{p.name}</strong>
        <a href={p.website} target="_blank" class="link">{p.website}</a>
        <div class="actions">
            <button class="btn" onclick={() => onEdit(p)}>✏️</button>
            <button class="btn danger" onclick={() => onDelete(p.id)}>🗑️</button>
        </div>
    </div>
</div>

<style>
    .partner-mobile-card { display: flex; gap: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; margin-bottom: 1rem; align-items: center; }
    .img { width: 6rem; height: 6rem; object-fit: cover; border-radius: 8px; }
    .info { flex: 1; min-width: 0; }
    .name { font-size: 1.4rem; display: block; margin-bottom: 0.2rem; }
    .link { font-size: 1.1rem; color: var(--accent-blue); text-decoration: none; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 0.6rem; }
    .actions { display: flex; gap: 0.6rem; }
    .btn { padding: 0.4rem 1.2rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-dark); cursor: pointer; }
    .btn.danger { color: var(--danger); }
</style>
