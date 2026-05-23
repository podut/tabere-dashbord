<script lang="ts">
	import type { Product } from '$lib/types';
    let { p, onEdit, onGallery, onDelete } = $props<{
        p: Product;
        onEdit: (p: Product) => void;
        onGallery: (p: Product) => void;
        onDelete: (id: string) => void;
    }>();
</script>

<div class="product-mobile-card">
    <div class="card-side-img">
        <img src={p.image_url} alt="" />
    </div>
    <div class="card-main">
        <div class="prod-header">
            <strong class="name">{p.name}</strong>
            <span class="stock-badge" class:low-stock={p.stock <= 5}>{p.stock} in stoc</span>
        </div>
        <p class="price">{p.price} {p.currency || 'lei'}</p>
        
        <div class="card-actions">
            <button class="btn-icon" onclick={() => onGallery(p)}>🖼️</button>
            <button class="btn-icon" onclick={() => onEdit(p)}>✏️</button>
            <button class="btn-icon danger" onclick={() => onDelete(p.id)}>🗑️</button>
        </div>
    </div>
</div>

<style>
    .product-mobile-card {
        display: flex; gap: 1.2rem; background: var(--bg-card);
        border: 1px solid var(--border); border-radius: 12px;
        padding: 1.2rem; margin-bottom: 1rem; align-items: center;
    }
    
    .card-side-img { width: 8rem; height: 8rem; flex-shrink: 0; }
    .card-side-img img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-strong); }
    
    .card-main { flex: 1; min-width: 0; }
    .prod-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem; }
    .name { font-size: 1.4rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
    .stock-badge { font-size: 1rem; padding: 0.2rem 0.6rem; border-radius: 4px; background: var(--bg-dark); color: var(--text-grey); font-weight: 700; }
    .stock-badge.low-stock { color: var(--danger); background: var(--danger-tint); }
    
    .price { font-size: 1.5rem; font-weight: 800; color: var(--primary); margin: 0 0 1rem; }
    
    .card-actions { display: flex; gap: 0.8rem; }
    .btn-icon { 
        width: 3.6rem; height: 3.6rem; border-radius: 6px; border: 1px solid var(--border);
        background: var(--bg-dark); display: flex; align-items: center; justify-content: center;
        cursor: pointer; font-size: 1.4rem;
    }
    .btn-icon.danger { color: var(--danger); border-color: rgba(231, 76, 60, 0.2); }
</style>
