<script lang="ts">
	import type { Profile } from '$lib/types';
    let { u, index } = $props<{
        u: Profile;
        index: number;
    }>();
</script>

<div class="user-mobile-card">
    <div class="card-header">
        <span class="index">#{index}</span>
        <span class="badge-status status-{u.role}">{u.role}</span>
    </div>
    
    <div class="card-body">
        <strong class="name">{u.name || 'Fără nume'}</strong>
        <span class="email">{u.email}</span>
        <p class="date">📅 Înregistrat: {u.created_at ? new Date(u.created_at).toLocaleDateString('ro-RO') : '—'}</p>
    </div>
</div>

<style>
    .user-mobile-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 1.2rem;
        margin-bottom: 1rem;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    
    .card-header { display: flex; justify-content: space-between; margin-bottom: 0.8rem; align-items: center; }
    .index { font-family: monospace; color: var(--text-grey); font-weight: 700; }
    
    .card-body { display: flex; flex-direction: column; gap: 0.4rem; }
    .name { font-size: 1.5rem; color: var(--text); }
    .email { font-size: 1.2rem; color: var(--text-grey); }
    .date { font-size: 1.1rem; color: var(--text-grey); margin: 0.4rem 0 0; }
</style>
