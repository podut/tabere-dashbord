<script lang="ts">
	let { eveniment = $bindable(), editMode, saving, onClose, onSave, onFileSelected }: {
		eveniment: any;
		editMode: boolean;
		saving: boolean;
		onClose: () => void;
		onSave: (e: SubmitEvent) => void;
		onFileSelected: (e: Event, context: string) => void;
	} = $props();
</script>

<div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-titlu">
	<div class="login-card modal-eveniment">
		<div class="modal-header">
			<h2 id="modal-titlu">{editMode ? 'Editează Eveniment' : 'Eveniment Nou'}</h2>
			<button class="btn-inchide" onclick={onClose} aria-label="Închide">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
			</button>
		</div>

		<form onsubmit={onSave}>
			<div class="camp">
				<label for="ev-titlu">Titlu</label>
				<input id="ev-titlu" bind:value={eveniment.title} required />
			</div>

			<div class="camp">
				<label for="ev-imagine">Imagine Hero (16:9)</label>
				<input id="ev-imagine" type="file" accept="image/*" onchange={(e) => onFileSelected(e, 'event_hero')} />
			</div>
			{#if eveniment.image_url}
				<img src={eveniment.image_url} alt="" class="previzualizare-imagine" />
			{/if}

			<div class="camp">
				<label for="ev-descriere">Descriere</label>
				<textarea id="ev-descriere" bind:value={eveniment.description} class="textarea-descriere"></textarea>
			</div>

			<div class="form-row-2col">
				<div class="camp">
					<label for="ev-tip">Tip Eveniment</label>
					<select id="ev-tip" bind:value={eveniment.type}>
						<option value="Milsim">Milsim</option>
						<option value="Speedsoft">Speedsoft</option>
						<option value="Skirmish">Skirmish</option>
						<option value="Antrenament">Antrenament</option>
						<option value="Privat">Privat</option>
					</select>
				</div>
				<div class="camp">
					<label for="ev-pret">Preț (RON)</label>
					<input id="ev-pret" type="number" min="0" bind:value={eveniment.price} />
				</div>
				<div class="camp">
					<label for="ev-data">Data</label>
					<input id="ev-data" type="date" bind:value={eveniment.date} required />
				</div>
				<div class="camp">
					<label for="ev-ora">Ora Start</label>
					<input id="ev-ora" type="time" bind:value={eveniment.start_time} />
				</div>
				<div class="camp">
					<label for="ev-durata">Durată</label>
					<input id="ev-durata" bind:value={eveniment.duration} />
				</div>
				<div class="camp">
					<label for="ev-max">Max Participanți</label>
					<input id="ev-max" type="number" min="1" bind:value={eveniment.max_participants} />
				</div>
			</div>

			<div class="camp">
				<label for="ev-locatie">Locație</label>
				<input id="ev-locatie" bind:value={eveniment.location} required />
			</div>

			<div class="camp">
				<label for="ev-pozitii">Poziții disponibile (separate prin virgulă)</label>
				<input
					id="ev-pozitii"
					placeholder="ex: Atacant, Apărător, Medic"
					value={eveniment.positions?.join(', ')}
					onchange={(e) => eveniment.positions = e.currentTarget.value.split(',').map((s: string) => s.trim()).filter((s: string) => s)}
				/>
			</div>

			<div class="rand-optiuni">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={eveniment.is_public} />
					<span>Eveniment Public</span>
				</label>
				<div class="camp camp--inline">
					<select bind:value={eveniment.status}>
						<option value="active">Activ</option>
						<option value="pending">În Așteptare</option>
						<option value="finished">Finalizat</option>
					</select>
				</div>
			</div>

			<div class="butoane-modal">
				<button type="button" class="buton-iesire" onclick={onClose}>Anulează</button>
				<button type="submit" class="buton-primar" disabled={saving}>
					{saving ? 'Se salvează...' : 'Salvează'}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.modal-eveniment { max-width: 65rem; max-height: 90vh; overflow-y: auto; }
	.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.4rem; }
	.modal-header h2 { margin-bottom: 0; }
	.btn-inchide { background: none; border: none; cursor: pointer; color: #888; padding: 0.4rem; border-radius: 6px; display: flex; }
	.btn-inchide:hover { background: #f1f3f5; color: var(--dark); }
	.previzualizare-imagine { width: 100%; height: 14rem; object-fit: cover; border-radius: 9px; margin-bottom: 1.6rem; }
	.textarea-descriere { width: 100%; height: 8rem; border-radius: 9px; border: 1px solid var(--border); padding: 1rem; font-family: inherit; font-size: 1.4rem; resize: vertical; }
	.textarea-descriere:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(230, 126, 34, 0.1); }
	.rand-optiuni { display: flex; gap: 2rem; align-items: center; background: var(--primary-tint); padding: 1.2rem 1.6rem; border-radius: 9px; margin-bottom: 2rem; }
	.checkbox-label { display: flex; align-items: center; gap: 0.8rem; cursor: pointer; font-size: 1.4rem; font-weight: 600; }
	.checkbox-label input { width: 1.8rem; height: 1.8rem; cursor: pointer; }
	.camp--inline { margin: 0; flex: 1; }
	.butoane-modal { display: flex; gap: 1rem; margin-top: 0.5rem; }
	.butoane-modal .buton-iesire { flex: 1; }
	.butoane-modal .buton-primar { flex: 2; }
</style>
