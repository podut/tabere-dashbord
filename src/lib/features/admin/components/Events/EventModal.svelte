<script lang="ts">
	import EventPreviewCard from './view/EventPreviewCard.svelte';

	let {
		eveniment = $bindable(),
		editMode,
		saving,
		tipuriExistente = [],
		onClose,
		onSave,
		onFileSelected
	}: {
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
		return m ? Number.parseInt(m[1], 10) : 0;
	}

	function startPlusOre(start: string, ore: number): string {
		if (!start || ore <= 0) return '';
		const [h, min] = start.split(':').map(Number);
		const total = h * 60 + (min || 0) + ore * 60;
		return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
	}

	let oraEnd = $state(
		eveniment.end_time ||
		startPlusOre(eveniment.start_time || '09:00', parseOre(eveniment.duration || '')) ||
		''
	);

	function calculeazaDurata(start: string, end: string): string {
		if (!start || !end) return eveniment.duration || '';
		const [hs, ms] = start.split(':').map(Number);
		const [he, me] = end.split(':').map(Number);
		const diff = he * 60 + me - (hs * 60 + ms);
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

	// Dynamic reactive preview object
	const livePreviewEvent = $derived({
		id: eveniment.id || 'preview-id',
		title: eveniment.title || 'Titlu Eveniment / Misiune',
		type: eveniment.type || 'Milsim',
		description: eveniment.description || 'Descrierea tactică a evenimentului va fi afișată aici pe card.',
		date: eveniment.date || new Date().toISOString().slice(0, 10),
		start_time: eveniment.start_time || '10:00',
		duration: eveniment.duration || '6 ore',
		location: eveniment.location || 'Baza HTCMX Airsoft',
		price: eveniment.price || 0,
		currency: eveniment.currency || 'RON',
		status: eveniment.status || 'active',
		is_public: eveniment.is_public ?? true,
		event_code: eveniment.event_code || '',
		max_participants: eveniment.max_participants || 30,
		capacity: eveniment.capacity || 'Toate Nivelurile',
		positions: eveniment.positions || [],
		image_url: eveniment.image_url || '',
		gallery: eveniment.gallery || []
	});

	// Mobile sub-tab between form & preview
	let tabMobil = $state<'form' | 'preview'>('form');
</script>

<div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-titlu">
	<div class="modal-card modal-eveniment-live">
		<!-- HEADER -->
		<div class="modal-header">
			<div class="modal-title-group">
				<h2 id="modal-titlu">{editMode ? 'Editează Eveniment' : 'Eveniment Nou'}</h2>
				<span class="live-indicator-badge">
					<span class="live-pulse"></span> Preview în Timp Real
				</span>
			</div>

			<!-- Mobile view switch -->
			<div class="mobile-tabs-switch">
				<button
					type="button"
					class="m-tab-btn"
					class:active={tabMobil === 'form'}
					onclick={() => (tabMobil = 'form')}
				>
					📝 Formular
				</button>
				<button
					type="button"
					class="m-tab-btn"
					class:active={tabMobil === 'preview'}
					onclick={() => (tabMobil = 'preview')}
				>
					👁️ Live Preview
				</button>
			</div>

			<button type="button" class="btn-inchide" onclick={onClose} aria-label="Închide">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
			</button>
		</div>

		<!-- DUAL COLUMN SPLIT VIEW -->
		<div class="modal-split-layout">
			<!-- LEFT COLUMN: FORM EDITING -->
			<div class="form-column" class:mobile-hidden={tabMobil === 'preview'}>
				<form onsubmit={onSave} id="eventForm">
					<div class="camp">
						<label for="ev-titlu">Titlu Eveniment / Misiune *</label>
						<input id="ev-titlu" bind:value={eveniment.title} placeholder="ex: Operațiunea: Night Stalker" required />
					</div>

					<div class="camp">
						<label for="ev-imagine">Imagine Hero (16:9)</label>
						<div class="upload-field-row">
							<input id="ev-imagine" type="file" accept="image/*" onchange={(e) => onFileSelected(e, 'event_hero')} />
							{#if eveniment.image_url}
								<button type="button" class="btn-clear-photo" onclick={() => (eveniment.image_url = '')} title="Elimină imaginea">
									✕
								</button>
							{/if}
						</div>
					</div>

					<div class="camp">
						<label for="ev-descriere">Descriere Scurtă & Obiective</label>
						<textarea id="ev-descriere" bind:value={eveniment.description} class="textarea-descriere" placeholder="Descrie pe scurt misiunea, regulamentul sau echipamentul necesar..."></textarea>
					</div>

					<div class="form-row-2col">
						<div class="camp">
							<label for="ev-tip">Tip Eveniment</label>
							<input
								id="ev-tip"
								list="tipuri-eveniment-list"
								bind:value={eveniment.type}
								placeholder="ex: Milsim, Skirmish, CQB..."
								autocomplete="off"
							/>
							<datalist id="tipuri-eveniment-list">
								{#each tipuriExistente as tip}
									<option value={tip} />
								{/each}
							</datalist>
						</div>
						<div class="camp">
							<label for="ev-pret">Tarif / Participant (RON)</label>
							<input id="ev-pret" type="number" min="0" bind:value={eveniment.price} />
						</div>
						<div class="camp">
							<label for="ev-data">Data Desfășurare *</label>
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
						<label for="ev-locatie">Locație Misiune *</label>
						<input id="ev-locatie" bind:value={eveniment.location} placeholder="ex: Baza HTCMX Airsoft, Maramureș" required />
					</div>

					<div class="camp">
						<label for="ev-pozitii">Poziții disponibile în echipă (separate prin virgulă)</label>
						<input
							id="ev-pozitii"
							placeholder="ex: Asalt, Sniper, Medic, Support, Team Leader"
							value={eveniment.positions?.join(', ')}
							oninput={(e) => (eveniment.positions = e.currentTarget.value.split(',').map((s: string) => s.trim()).filter((s: string) => s))}
						/>
					</div>

					<!-- Public / Private Options -->
					<div class="rand-optiuni">
						<label class="toggle-label">
							<span>Eveniment Public</span>
							<div class="toggle-switch" class:active={eveniment.is_public}>
								<input type="checkbox" bind:checked={eveniment.is_public} hidden />
								<div class="toggle-track" role="switch" aria-checked={eveniment.is_public}
									onclick={() => (eveniment.is_public = !eveniment.is_public)}
									onkeydown={(e) => e.key === 'Enter' || e.key === ' ' ? (eveniment.is_public = !eveniment.is_public) : null}
									tabindex="0">
									<div class="toggle-thumb"></div>
								</div>
							</div>
						</label>
						<div class="camp camp--inline">
							<select bind:value={eveniment.status} disabled={eveniment.status === 'finished'}>
								<option value="active">Status: Activ</option>
								{#if eveniment.status === 'finished'}
									<option value="finished">Status: Finalizat (auto)</option>
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
				</form>
			</div>

			<!-- RIGHT COLUMN: REAL-TIME LIVE PREVIEW -->
			<div class="preview-column" class:mobile-hidden={tabMobil === 'form'}>
				<div class="preview-sticky-box">
					<div class="preview-box-header">
						<div class="preview-box-title">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
							<span>Cum va arăta Cardul în Aplicație & Site:</span>
						</div>
						<span class="preview-chip">Live HUD</span>
					</div>

					<!-- THE LIVE PREVIEW CARD -->
					<div class="preview-card-viewport">
						<EventPreviewCard
							ev={livePreviewEvent as any}
							rezervari={[]}
							acum={new Date()}
							onEdit={() => {}}
							onFinalize={() => {}}
							onDelete={() => {}}
							onGallery={() => {}}
						/>
					</div>

					<!-- POSITION ROLES BREAKDOWN PREVIEW -->
					{#if eveniment.positions && eveniment.positions.length > 0}
						<div class="positions-preview-box">
							<div class="pos-title">🪖 Poziții / Roluri Tactice ({eveniment.positions.length}):</div>
							<div class="pos-pills-list">
								{#each eveniment.positions as pos}
									<span class="pos-pill">{pos}</span>
								{/each}
							</div>
						</div>
					{/if}

					<div class="preview-hint-note">
						💡 Orice modificare făcută în formular se actualizează instantaneu în cardul de mai sus.
					</div>
				</div>
			</div>
		</div>

		<!-- MODAL FOOTER BUTTONS -->
		<div class="modal-footer-bar">
			<button type="button" class="btn-cancel" onclick={onClose}>Anulează</button>
			<button type="submit" form="eventForm" class="btn-submit" disabled={saving}>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
				{saving ? 'Se salvează misiunea...' : (editMode ? 'Actualizează Eveniment' : 'Creează Eveniment')}
			</button>
		</div>
	</div>
</div>

<style>
	.modal-eveniment-live {
		max-width: 118rem;
		width: 95vw;
		max-height: 92vh;
		display: flex;
		flex-direction: column;
		background: linear-gradient(180deg, #0d250d 0%, #081608 100%);
		border: 1px solid var(--border-strong);
		border-radius: 20px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(197, 160, 48, 0.15);
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.8rem 2.4rem;
		background: rgba(0, 0, 0, 0.4);
		border-bottom: 1px solid var(--border);
	}

	.modal-title-group {
		display: flex;
		align-items: center;
		gap: 1.4rem;
	}

	.modal-title-group h2 {
		margin: 0;
		font-size: 2rem;
		font-weight: 800;
		color: var(--text);
	}

	.live-indicator-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		background: rgba(81, 207, 102, 0.15);
		border: 1px solid rgba(81, 207, 102, 0.4);
		color: #51cf66;
		padding: 0.3rem 0.9rem;
		border-radius: 20px;
		font-size: 1.15rem;
		font-weight: 700;
	}

	.live-pulse {
		width: 7px;
		height: 7px;
		background: #51cf66;
		border-radius: 50%;
		box-shadow: 0 0 8px #51cf66;
		animation: pulseDot 1.5s infinite;
	}

	@keyframes pulseDot {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(1.3); }
	}

	.mobile-tabs-switch {
		display: none;
		background: rgba(0, 0, 0, 0.5);
		padding: 0.3rem;
		border-radius: 8px;
		border: 1px solid var(--border);
	}

	.m-tab-btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-grey);
		font-size: 1.2rem;
		font-weight: 700;
		cursor: pointer;
	}

	.m-tab-btn.active {
		background: var(--bg-card);
		color: var(--primary);
	}

	.btn-inchide {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border);
		cursor: pointer;
		color: var(--text-grey);
		padding: 0.6rem;
		border-radius: 8px;
		display: flex;
		transition: all 0.2s;
	}

	.btn-inchide:hover {
		background: rgba(224, 49, 49, 0.2);
		color: #ff8787;
		border-color: var(--danger);
	}

	/* SPLIT LAYOUT */
	.modal-split-layout {
		display: grid;
		grid-template-columns: 1.15fr 0.95fr;
		gap: 2.4rem;
		padding: 2.4rem;
		overflow-y: auto;
		flex: 1;
	}

	/* FORM COLUMN */
	.form-column {
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
	}

	.upload-field-row {
		display: flex;
		gap: 0.8rem;
		align-items: center;
	}

	.btn-clear-photo {
		background: rgba(224, 49, 49, 0.2);
		border: 1px solid var(--danger);
		color: #ff8787;
		width: 3.4rem;
		height: 3.4rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1.4rem;
		font-weight: bold;
	}

	.textarea-descriere {
		width: 100%;
		height: 7.5rem;
		border-radius: 9px;
		border: 1px solid var(--border);
		background: var(--bg-card);
		color: var(--text);
		padding: 1rem;
		font-family: inherit;
		font-size: 1.35rem;
		resize: vertical;
	}

	.textarea-descriere:focus {
		outline: none;
		border-color: var(--primary);
	}

	.rand-optiuni {
		display: flex;
		gap: 2rem;
		align-items: center;
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid var(--border);
		padding: 1.2rem 1.6rem;
		border-radius: 12px;
		margin-bottom: 0.8rem;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 1.2rem;
		cursor: pointer;
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--text);
	}

	.toggle-track {
		width: 4.4rem;
		height: 2.4rem;
		border-radius: 12px;
		background: #333;
		cursor: pointer;
		position: relative;
		transition: background 0.2s;
		display: flex;
		align-items: center;
		padding: 0 0.3rem;
	}

	.toggle-switch.active .toggle-track {
		background: var(--primary);
	}

	.toggle-thumb {
		width: 1.8rem;
		height: 1.8rem;
		background: #fff;
		border-radius: 50%;
		transition: transform 0.2s;
	}

	.toggle-switch.active .toggle-thumb {
		transform: translateX(2rem);
	}

	.cod-privat {
		background: rgba(197, 160, 48, 0.08);
		border: 1px solid var(--border-strong);
		border-radius: 12px;
		padding: 1.2rem 1.6rem;
	}

	.cod-input-row {
		display: flex;
		gap: 0.8rem;
		align-items: center;
		margin-top: 0.6rem;
	}

	.cod-input-row input {
		flex: 1;
		font-family: monospace;
		font-size: 1.45rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.buton-copiere {
		background: var(--primary-tint);
		border: 1px solid var(--primary);
		border-radius: 8px;
		padding: 0.8rem;
		cursor: pointer;
		color: var(--primary);
		display: flex;
		align-items: center;
	}

	.hint-cod {
		font-size: 1.15rem;
		color: var(--text-grey);
		margin-top: 0.4rem;
		display: block;
	}

	.camp--inline {
		margin: 0;
		flex: 1;
	}

	.durata-calculata {
		background: rgba(197, 160, 48, 0.1) !important;
		color: var(--primary-light) !important;
		font-weight: 800;
	}

	.hint-durata {
		font-size: 1.1rem;
		color: var(--text-grey);
		margin-left: 4px;
	}

	/* PREVIEW COLUMN */
	.preview-column {
		display: flex;
		flex-direction: column;
	}

	.preview-sticky-box {
		position: sticky;
		top: 0;
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 1.6rem;
		display: flex;
		flex-direction: column;
		gap: 1.6rem;
	}

	.preview-box-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--border);
		padding-bottom: 1rem;
	}

	.preview-box-title {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		font-size: 1.3rem;
		font-weight: 700;
		color: var(--primary-light);
	}

	.preview-chip {
		background: rgba(197, 160, 48, 0.15);
		border: 1px solid var(--primary);
		color: var(--primary);
		font-size: 1.05rem;
		font-weight: 800;
		padding: 0.2rem 0.7rem;
		border-radius: 6px;
		text-transform: uppercase;
	}

	.preview-card-viewport {
		max-width: 440px;
		margin: 0 auto;
		width: 100%;
	}

	.positions-preview-box {
		background: rgba(15, 43, 15, 0.6);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.2rem;
	}

	.pos-title {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--text);
		margin-bottom: 0.8rem;
	}

	.pos-pills-list {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
	}

	.pos-pill {
		background: rgba(197, 160, 48, 0.12);
		border: 1px solid var(--border-strong);
		color: var(--primary-light);
		padding: 0.3rem 0.8rem;
		border-radius: 6px;
		font-size: 1.15rem;
		font-weight: 700;
	}

	.preview-hint-note {
		font-size: 1.15rem;
		color: var(--text-grey);
		line-height: 1.4;
		text-align: center;
	}

	/* MODAL FOOTER */
	.modal-footer-bar {
		display: flex;
		justify-content: flex-end;
		gap: 1.2rem;
		padding: 1.6rem 2.4rem;
		background: rgba(0, 0, 0, 0.4);
		border-top: 1px solid var(--border);
	}

	.btn-cancel {
		padding: 1rem 2rem;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--bg-card);
		color: var(--text-grey);
		font-size: 1.35rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-cancel:hover {
		color: var(--text);
		border-color: var(--text-grey);
	}

	.btn-submit {
		display: inline-flex;
		align-items: center;
		gap: 0.8rem;
		padding: 1rem 2.4rem;
		border-radius: 10px;
		background: var(--primary);
		color: var(--bg-dark);
		font-size: 1.35rem;
		font-weight: 800;
		border: none;
		cursor: pointer;
		box-shadow: 0 4px 16px rgba(197, 160, 48, 0.35);
		transition: all 0.2s;
	}

	.btn-submit:hover:not(:disabled) {
		background: var(--primary-light);
		transform: translateY(-1px);
	}

	.btn-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 900px) {
		.modal-split-layout {
			grid-template-columns: 1fr;
		}
		.mobile-tabs-switch {
			display: flex;
		}
		.mobile-hidden {
			display: none !important;
		}
	}
</style>
