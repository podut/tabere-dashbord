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
		background: rgba(0, 0, 0, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		padding: 2rem;
		animation: fadeIn 0.15s ease-out;
	}
	.confirm-card {
		background: white;
		border-radius: 14px;
		padding: 2.4rem;
		max-width: 48rem;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: zoomIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.confirm-title {
		font-size: 1.9rem;
		font-weight: 700;
		color: #222;
		margin-bottom: 1rem;
	}
	.confirm-message {
		font-size: 1.4rem;
		color: #555;
		line-height: 1.5;
		margin-bottom: 2.4rem;
	}
	.confirm-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}
	.btn-cancel,
	.btn-confirm {
		padding: 1rem 1.8rem;
		border-radius: 9px;
		border: none;
		font-size: 1.35rem;
		font-weight: 700;
		cursor: pointer;
		font-family: inherit;
		transition: transform 0.1s, box-shadow 0.1s;
	}
	.btn-cancel {
		background: #e0e0e0;
		color: #333;
	}
	.btn-confirm {
		background: #2ecc71;
		color: white;
	}
	.btn-confirm.danger {
		background: #e74c3c;
	}
	.btn-cancel:hover,
	.btn-confirm:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes zoomIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
