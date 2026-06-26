<script lang="ts">
	import DateTimePicker from '$lib/components/DateTimePicker.svelte';
	import type { EventRow } from '$lib/types';

	let { notif = $bindable(), evenimente = [], onClose, onSave, saving, isPast, isSoonPast }: {
		notif: any;
		evenimente: EventRow[];
		onClose: () => void;
		onSave: (e: SubmitEvent) => void;
		saving: boolean;
		isPast: boolean;
		isSoonPast: boolean;
	} = $props();
</script>

<div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="notif-titlu">
	<div class="login-card modal-notif">
		<div class="modal-header">
			<h2 id="notif-titlu">Notificare Nouă</h2>
			<button class="btn-icon" onclick={onClose} aria-label="Închide" style="font-size: 2rem;">×</button>
		</div>

		<form onsubmit={onSave}>
			<div class="camp">
				<label for="notif-titlu-input">Titlu</label>
				<input id="notif-titlu-input" bind:value={notif.title} placeholder="ex: Eveniment săptămâna aceasta" required />
			</div>

			<div class="camp">
				<label for="notif-mesaj">Mesaj</label>
				<textarea id="notif-mesaj" bind:value={notif.body} class="textarea-notif" placeholder="Textul notificării..." required></textarea>
			</div>

			<div class="camp">
				<label for="notif-tip">Tip / Grup Țintă</label>
				<select id="notif-tip" bind:value={notif.target_type}>
					<option value="all">Anunț — Toți userii</option>
					<option value="event">Eveniment — Doar participanții</option>
					<option value="promo">Promoție — Toți userii</option>
					<option value="update">Actualizare — Toți userii</option>
				</select>
				<p class="camp-hint">Tipul controlează cine primește și ce icon/culoare apare pe telefon.</p>
			</div>

			{#if notif.target_type === 'event'}
				<div class="camp">
					<label for="notif-eveniment">Eveniment</label>
					<select id="notif-eveniment" bind:value={notif.target_event_id} required>
						<option value="">— Selectează evenimentul —</option>
						{#each evenimente.filter(e => e.status === 'active') as ev}
							<option value={ev.id}>{ev.title}</option>
						{/each}
					</select>
				</div>
			{/if}

			<div class="rand-repetare">
				<label class="toggle-label">
					<input type="checkbox" id="rec" bind:checked={notif.is_recurring} />
					<span class="toggle-text">Repetă Zilnic</span>
				</label>
			</div>

			{#if notif.is_recurring}
				<div class="camp">
					<label for="notif-ora-zilnica">Ora de trimitere (zilnic)</label>
					<div class="input-cu-unitate">
						<input id="notif-ora-zilnica" type="number" min="0" max="23" bind:value={notif.recurring_hour} class="input-ora" />
						<span class="unitate">H : 00</span>
					</div>
				</div>
			{:else}
				<div class="camp">
					<DateTimePicker bind:value={notif.scheduled_at} label="Data & Ora Trimiterii" />

					{#if isPast}
						<div class="alerta alerta--pericol" style="margin-top:1.2rem">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
							<span><strong>Data e în trecut.</strong> Notificarea va fi marcată ca trimisă dar <strong>NU va apărea ca push</strong> pe telefon.</span>
						</div>
					{:else if isSoonPast}
						<div class="alerta alerta--info" style="margin-top:1.2rem">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
							<span>Data e în trecut. Notificarea va fi trimisă imediat (livrabilă 1h).</span>
						</div>
					{/if}
				</div>
			{/if}

			<div class="butoane-modal">
				<button type="button" class="buton-iesire" onclick={onClose}>Anulează</button>
				<button type="submit" class="buton-primar" disabled={saving}>
					{saving ? 'Se salvează...' : 'Programează'}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.modal-notif { max-width: 55rem !important; max-height: 90vh; overflow-y: auto; }
	.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.4rem; border-bottom: 1px solid var(--border); padding-bottom: 1.6rem; }
	.modal-header h2 { margin-bottom: 0; color: var(--primary); }

	.textarea-notif {
		width: 100%; height: 10rem; border-radius: 10px; border: 1px solid var(--border);
		padding: 1.2rem; font-family: inherit; font-size: 1.45rem; resize: vertical;
		background: var(--bg-card); color: var(--text);
	}
	.textarea-notif:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-tint); }

	.camp-hint { font-size: 1.2rem; color: var(--text-grey); margin-top: 0.6rem; font-style: italic; }

	.rand-repetare {
		background: var(--bg-dark); border-radius: 12px; border: 1px solid var(--border);
		padding: 1.6rem 2rem; margin: 2rem 0;
	}
	.toggle-label { display: flex; align-items: center; gap: 1.2rem; cursor: pointer; }
	.toggle-label input[type="checkbox"] { width: 2.2rem; height: 2.2rem; cursor: pointer; accent-color: var(--primary); }
	.toggle-text { font-size: 1.5rem; font-weight: 800; color: var(--primary); }

	.input-cu-unitate { display: flex; align-items: center; gap: 1.2rem; }
	.input-ora { width: 12rem !important; text-align: center; font-size: 2rem !important; font-weight: 800 !important; color: var(--primary) !important; }
	.unitate { font-size: 1.8rem; font-weight: 700; color: var(--text-grey); }

	.alerta {
		display: flex; align-items: flex-start; gap: 1.2rem;
		padding: 1.4rem 1.8rem; border-radius: 12px; font-size: 1.35rem;
		margin-top: 1.6rem; border-left: 5px solid;
	}
	.alerta svg { flex-shrink: 0; margin-top: 0.2rem; }
	.alerta--pericol { background: rgba(169, 50, 38, 0.1); color: #ec7063; border-left-color: #a93226; }
	.alerta--info { background: rgba(243, 156, 18, 0.1); color: #f5b041; border-left-color: #f39c12; }

	.butoane-modal { display: flex; gap: 1.2rem; margin-top: 3.2rem; }
	.butoane-modal .buton-iesire { flex: 1; }
	.butoane-modal .buton-primar { flex: 2; }
</style>
