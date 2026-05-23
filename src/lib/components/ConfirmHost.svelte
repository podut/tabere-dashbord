<script lang="ts">
	import { confirmStore } from '$lib/admin/notify.svelte';
</script>

{#if confirmStore.current}
	{@const c = confirmStore.current}
	<div class="confirm-overlay" onclick={() => confirmStore.answer(false)} role="presentation">
		<div
			class="confirm-card"
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="confirm-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 id="confirm-title" class="confirm-title">{c.title}</h2>
			<p class="confirm-message">{c.message}</p>
			<div class="confirm-actions">
				<button class="btn-cancel" onclick={() => confirmStore.answer(false)}>
					{c.cancelLabel ?? 'Anulează'}
				</button>
				<button
					class="btn-confirm"
					class:danger={c.danger}
					onclick={() => confirmStore.answer(true)}
				>
					{c.confirmLabel ?? 'Confirmă'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.confirm-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		padding: 2rem;
		animation: fadeIn 0.15s ease-out;
		backdrop-filter: blur(4px);
	}
	.confirm-card {
		background: var(--bg-card);
		border: 1px solid var(--border-strong);
		border-radius: 16px;
		padding: 2.4rem;
		max-width: 44rem;
		width: 100%;
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
		animation: zoomIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
		outline: none;
	}
	.confirm-title {
		font-size: 2rem;
		font-weight: 800;
		color: var(--primary);
		margin-bottom: 1.2rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.confirm-message {
		font-size: 1.45rem;
		color: var(--text);
		line-height: 1.5;
		margin-bottom: 2.4rem;
	}
	.confirm-actions {
		display: flex;
		gap: 1.2rem;
		justify-content: flex-end;
	}
	.btn-cancel,
	.btn-confirm {
		padding: 1rem 2rem;
		border-radius: 10px;
		border: 1px solid var(--border);
		font-size: 1.4rem;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
		transition: all 0.2s;
	}
	.btn-cancel {
		background: var(--bg-dark);
		color: var(--text-grey);
	}
	.btn-cancel:hover {
		border-color: var(--text-grey);
		color: var(--text);
	}
	.btn-confirm {
		background: var(--primary);
		color: var(--bg-dark);
		border-color: var(--primary);
	}
	.btn-confirm:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(197, 160, 48, 0.3);
	}
	.btn-confirm.danger {
		background: var(--danger);
		color: white;
		border-color: var(--danger);
	}
	.btn-confirm.danger:hover {
		background: #c0392b;
		box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
	}

	@media (max-width: 600px) {
		.confirm-card { padding: 2rem; }
		.confirm-actions { flex-direction: column; }
		.btn-cancel, .btn-confirm { width: 100%; padding: 1.4rem; }
		.btn-confirm { order: -1; } /* Primary action on top for mobile */
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@keyframes zoomIn {
		from { opacity: 0; transform: scale(0.95); }
		to { opacity: 1; transform: scale(1); }
	}
</style>
