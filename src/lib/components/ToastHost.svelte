<script lang="ts">
	import { toast, type ToastKind } from '$lib/admin/notify.svelte';

	const palette: Record<ToastKind, { bg: string; fg: string; icon: string }> = {
		success: { bg: '#1b5e20', fg: '#fff', icon: '✓' },
		error: { bg: '#a93226', fg: '#fff', icon: '⚠' },
		info: { bg: '#1565c0', fg: '#fff', icon: 'ℹ' }
	};
</script>

<div class="toast-host" role="status" aria-live="polite">
	{#each toast.items as t (t.id)}
		<button
			class="toast"
			style="background: {palette[t.kind].bg}; color: {palette[t.kind].fg};"
			onclick={() => toast.dismiss(t.id)}
			title="Click pentru a închide"
		>
			<span class="toast-icon">{palette[t.kind].icon}</span>
			<span class="toast-msg">{t.message}</span>
		</button>
	{/each}
</div>

<style>
	.toast-host {
		position: fixed;
		top: 2rem;
		right: 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		z-index: 9999;
		pointer-events: none;
		max-width: 42rem;
	}
	.toast {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.2rem 1.6rem;
		border-radius: 10px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
		font-size: 1.4rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		pointer-events: auto;
		text-align: left;
		font-family: inherit;
		animation: slideIn 0.2s ease-out;
		max-width: 100%;
	}
	.toast-icon {
		font-size: 1.7rem;
		flex-shrink: 0;
	}
	.toast-msg {
		flex: 1;
		line-height: 1.4;
	}
	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
</style>
