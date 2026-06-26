<script lang="ts">
	let { eveniment = $bindable(), editMode, saving, tipuriExistente = [], onClose, onSave, onFileSelected }: {
		eveniment: any;
		editMode: boolean;
		saving: boolean;
		tipuriExistente: string[];
		onClose: () => void;
		onSave: (e: SubmitEvent) => void;
		onFileSelected: (e: Event, context: string) => void;
	} = $props();

	// Ora Sfârșit — derivată din duration la editare, sau calculată din start→end
	function parseOre(durStr: string): number {
		const m = durStr?.match(/(\d+)\s*(or|h)/i);
		return m ? parseInt(m[1]) : 0;
	}

	function startPlusOre(start: string, ore: number): string {
		if (!start || ore <= 0) return '';
		const [h, min] = start.split(':').map(Number);
		const total = h * 60 + (min || 0) + ore * 60;
		return `${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
	}

	let oraEnd = $state(
		eveniment.end_time ||
		startPlusOre(eveniment.start_time || '09:00', parseOre(eveniment.duration || ''))
		|| ''
	);

	function calculeazaDurata(start: string, end: string): string {
		if (!start || !end) return eveniment.duration || '';
		const [hs, ms] = start.split(':').map(Number);
		const [he, me] = end.split(':').map(Number);
		let diff = (he * 60 + me) - (hs * 60 + ms);
		if (diff <= 0) return eveniment.duration || '';
		const ore = Math.floor(diff / 60);
		const min = diff % 60;
		if (min === 0) return ore === 1 ? '1 oră' : `${ore} ore`;
		return `${ore} ore ${min} min`;
	}

	function onEndTimeChange(val: string) {
		oraEnd = val;
		eveniment.duration = calculeazaDurata(eveniment.start_time || '09:00', val);
		eveniment.end_time = val;
	}

	function onStartTimeChange(val: string) {
		eveniment.start_time = val;
		if (oraEnd) eveniment.duration = calculeazaDurata(val, oraEnd);
	}
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
					<input
						id="ev-tip"
						list="tipuri-eveniment-list"
						bind:value={eveniment.type}
						placeholder="ex: Milsim, Skirmish, Privat..."
						autocomplete="off"
					/>
					<datalist id="tipuri-eveniment-list">
						{#each tipuriExistente as tip}
							<option value={tip} />
						{/each}
					</datalist>
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
					<input id="ev-ora" type="time" value={eveniment.start_time}
						oninput={(e) => onStartTimeChange(e.currentTarget.value)} />
				</div>
				<div class="camp">
					<label for="ev-ora-end">Ora Sfârșit</label>
					<input id="ev-ora-end" type="time" value={oraEnd}
						oninput={(e) => onEndTimeChange(e.currentTarget.value)} />
				</div>
				<div class="camp">
					<label for="ev-durata">Durată <span class="hint-durata">(calculat auto)</span></label>
					<input id="ev-durata" bind:value={eveniment.duration} readonly class="durata-calculata" />
				</div>
				<div class="camp">
					<label for="ev-capacitate">Detalii Capacitate / Vârstă</label>
					<input id="ev-capacitate" bind:value={eveniment.capacity} placeholder="ex: 14+ ani / 10-30 pers" />
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
				<label class="toggle-label">
					<span>Eveniment Public</span>
					<div class="toggle-switch" class:active={eveniment.is_public}>
						<input type="checkbox" bind:checked={eveniment.is_public} hidden />
						<div class="toggle-track" role="switch" aria-checked={eveniment.is_public}
							onclick={() => eveniment.is_public = !eveniment.is_public}
							onkeydown={(e) => e.key === 'Enter' || e.key === ' ' ? eveniment.is_public = !eveniment.is_public : null}
							tabindex="0">
							<div class="toggle-thumb"></div>
						</div>
					</div>
				</label>
				<div class="camp camp--inline">
					<select bind:value={eveniment.status} disabled={eveniment.status === 'finished'}>
						<option value="active">Activ</option>
						{#if eveniment.status === 'finished'}
							<option value="finished">Finalizat (auto)</option>
						{/if}
					</select>
				</div>
			</div>

			{#if !eveniment.is_public}
				<div class="camp cod-privat">
					<label for="ev-cod">Cod Acces Privat</label>
					<div class="cod-input-row">
						<input id="ev-cod" bind:value={eveniment.event_code}
							placeholder="Generat automat dacă lași gol" />
						{#if eveniment.event_code}
							<button type="button" class="buton-copiere"
								onclick={() => navigator.clipboard.writeText(eveniment.event_code)}
								title="Copiază codul">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
							</button>
						{/if}
					</div>
					<span class="hint-cod">Codul este generat automat la salvare dacă nu introduci unul.</span>
				</div>
			{/if}

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
	.rand-optiuni { display: flex; gap: 2rem; align-items: center; background: var(--primary-tint); padding: 1.2rem 1.6rem; border-radius: 9px; margin-bottom: 1.2rem; }
	.toggle-label { display: flex; align-items: center; gap: 1.2rem; cursor: pointer; font-size: 1.4rem; font-weight: 600; }
	.toggle-track { width: 4.4rem; height: 2.4rem; border-radius: 12px; background: #ccc; cursor: pointer; position: relative; transition: background 0.2s; display: flex; align-items: center; padding: 0 0.3rem; outline-offset: 2px; }
	.toggle-track:focus { outline: 2px solid var(--primary); }
	.toggle-switch.active .toggle-track { background: var(--primary); }
	.toggle-thumb { width: 1.8rem; height: 1.8rem; background: #fff; border-radius: 50%; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
	.toggle-switch.active .toggle-thumb { transform: translateX(2rem); }
	.cod-privat { background: #fff8f3; border: 1px solid var(--primary); border-radius: 9px; padding: 1.2rem 1.6rem; margin-bottom: 1.6rem; }
	.cod-privat label { font-weight: 700; color: var(--primary); }
	.cod-input-row { display: flex; gap: 0.8rem; align-items: center; margin-top: 0.6rem; }
	.cod-input-row input { flex: 1; font-family: monospace; font-size: 1.5rem; letter-spacing: 0.1em; text-transform: uppercase; }
	.buton-copiere { background: var(--primary-tint); border: 1px solid var(--primary); border-radius: 7px; padding: 0.6rem 0.8rem; cursor: pointer; color: var(--primary); display: flex; align-items: center; }
	.buton-copiere:hover { background: var(--primary); color: #fff; }
	.hint-cod { font-size: 1.2rem; color: #999; margin-top: 0.4rem; display: block; }
	.camp--inline { margin: 0; flex: 1; }
	.durata-calculata { background: var(--primary-tint); color: var(--primary); font-weight: 700; cursor: default; }
	.hint-durata { font-size: 1.1rem; font-weight: 400; color: #aaa; margin-left: 4px; }
	.butoane-modal { display: flex; gap: 1rem; margin-top: 0.5rem; }
	.butoane-modal .buton-iesire { flex: 1; }
	.butoane-modal .buton-primar { flex: 2; }
</style>
