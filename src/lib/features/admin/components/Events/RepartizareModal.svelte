<script lang="ts">
	import type { Booking, EventRow } from '$lib/types';

	let { booking, eveniment, pozitii, pozitiaSelectata = $bindable(''), saving, onSave, onClose }: {
		booking: Booking;
		eveniment: EventRow | null;
		pozitii: string[];
		pozitiaSelectata: string;
		saving: boolean;
		onSave: () => void;
		onClose: () => void;
	} = $props();
</script>

<div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="rep-titlu">
	<div class="login-card modal-repartizare">
		<div class="modal-header">
			<h2 id="rep-titlu">Repartizare Poziție</h2>
		</div>

		<div class="info-booking">
			<div class="info-rand"><span class="info-label">Client:</span> {booking.nume_client}</div>
			<div class="info-rand"><span class="info-label">Telefon:</span> {booking.telefon}</div>
			<div class="info-rand"><span class="info-label">Activitate:</span> {booking.activity_title}</div>
			{#if eveniment}
				<div class="info-rand"><span class="info-label">Eveniment:</span> {eveniment.title}</div>
			{/if}
		</div>

		{#if pozitii.length > 0}
			<div class="camp">
				<label for="selectie-pozitie">Selectează Poziția</label>
				<select id="selectie-pozitie" bind:value={pozitiaSelectata}>
					<option value="">-- alege poziția --</option>
					{#each pozitii as poz}
						<option value={poz}>{poz}</option>
					{/each}
				</select>
			</div>
		{:else}
			<div class="avertisment-pozitii">
				<p class="avertisment-text">Evenimentul nu are poziții definite. Introdu manual:</p>
				<input bind:value={pozitiaSelectata} placeholder="ex: Atacant, Medic, Apărător..." />
			</div>
		{/if}

		<div class="butoane-modal">
			<button type="button" class="buton-iesire" onclick={onClose}>Anulează</button>
			<button
				type="button"
				class="buton-primar"
				disabled={saving || !pozitiaSelectata}
				onclick={onSave}
			>
				{saving ? 'Se salvează...' : 'Confirmă Repartizare'}
			</button>
		</div>
	</div>
</div>

<style>
	.modal-repartizare { max-width: 50rem; }
	.modal-header { margin-bottom: 2rem; }
	.modal-header h2 { margin-bottom: 0; }
	.info-booking {
		background: var(--primary-tint); border-radius: 9px;
		padding: 1.5rem 1.8rem; margin-bottom: 2rem;
		display: flex; flex-direction: column; gap: 0.6rem;
	}
	.info-rand { font-size: 1.4rem; }
	.info-label { font-weight: 600; }
	.avertisment-pozitii { background: #fff3cd; padding: 1.5rem; border-radius: 9px; margin-bottom: 2rem; }
	.avertisment-text { margin: 0 0 1rem; font-size: 1.3rem; color: #856404; }
	.avertisment-pozitii input {
		width: 100%; padding: 1.2rem; border-radius: 9px; border: 1px solid var(--border);
		font-size: 1.4rem; font-family: inherit; box-sizing: border-box;
	}
	.butoane-modal { display: flex; gap: 1rem; margin-top: 2rem; }
	.butoane-modal .buton-iesire { flex: 1; }
	.butoane-modal .buton-primar { flex: 2; }
</style>
