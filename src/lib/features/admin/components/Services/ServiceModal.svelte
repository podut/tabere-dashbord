<script lang="ts">
	let { service = $bindable(), editMode, categoriiExistente = [], onClose, onSave, onFotoSelectata, onFotoGalerieSelectata, stergedinArray, adaugaInArray, handleArrayKeydown, inputIncludes = $bindable(), inputPositions = $bindable(), incarcareGalerie }: {
		service: any;
		editMode: boolean;
		categoriiExistente: string[];
		onClose: () => void;
		onSave: (e: SubmitEvent) => void;
		onFotoSelectata: (e: Event) => void;
		onFotoGalerieSelectata: (e: Event) => void;
		stergedinArray: (camp: 'gallery' | 'includes' | 'positions', idx: number) => void;
		adaugaInArray: (camp: 'includes' | 'positions', valoare: string) => void;
		handleArrayKeydown: (e: KeyboardEvent, camp: 'includes' | 'positions', valoare: string) => void;
		inputIncludes: string;
		inputPositions: string;
		incarcareGalerie: boolean;
	} = $props();
</script>

<div class="modal-overlay">
	<div class="login-card modal-serviciu">
		<h2 style="margin-bottom: 2.4rem;">{editMode ? 'Editează' : 'Adaugă'} Serviciu</h2>
		<form onsubmit={onSave}>

			<!-- Secțiunea 1: Informații de bază -->
			<div class="sectiune-form">
				<div class="sectiune-titlu">Informații de bază</div>
				<div class="form-row-2col">
					<div class="camp" style="flex:2">
						<label>Titlu *</label>
						<input bind:value={service.title} required placeholder="ex: Închiriere Echipament Complet" />
					</div>
					<div class="camp" style="flex:1">
						<label>Etichetă (tag)</label>
						<input bind:value={service.tag} placeholder="ex: Popular, Nou" />
					</div>
				</div>
				<div class="form-row-3col">
					<div class="camp">
						<label>Categorie</label>
						<input
							list="categorii-servicii-list"
							bind:value={service.category}
							placeholder="ex: General, Inchiriere, Service..."
							autocomplete="off"
						/>
						<datalist id="categorii-servicii-list">
							{#each categoriiExistente as cat}
								<option value={cat} />
							{/each}
						</datalist>
					</div>
					<div class="camp">
						<label>Ordine afișare</label>
						<input type="number" bind:value={service.order} min="0" />
					</div>
					<div class="camp camp-toggle">
						<label>Activ</label>
						<label class="toggle">
							<input type="checkbox" bind:checked={service.active} />
							<span class="slider"></span>
						</label>
					</div>
				</div>
			</div>

			<!-- Secțiunea 2: Preț & Disponibilitate -->
			<div class="sectiune-form">
				<div class="sectiune-titlu">Preț & Disponibilitate</div>
				<div class="form-row-3col">
					<div class="camp">
						<label>Preț (RON) *</label>
						<input type="number" bind:value={service.price} min="0" step="0.01" required />
					</div>
					<div class="camp">
						<label>Label preț</label>
						<input bind:value={service.price_label} placeholder="ex: 120 RON / sesiune" />
					</div>
					<div class="camp">
						<label>Durată</label>
						<input bind:value={service.duration} placeholder="ex: 4-6 ore" />
					</div>
				</div>
				<div class="form-row-2col">
					<div class="camp">
						<label>Vârstă țintă</label>
						<input bind:value={service.age_target} placeholder="ex: 14+ ani" />
					</div>
					<div class="camp">
						<label>Capacitate</label>
						<input bind:value={service.capacity} placeholder="ex: 10-30 persoane" />
					</div>
				</div>
			</div>

			<!-- Secțiunea 3: Descrieri -->
			<div class="sectiune-form">
				<div class="sectiune-titlu">Descrieri</div>
				<div class="camp">
					<label>Descriere scurtă <span class="hint">(afișată pe card)</span></label>
					<textarea bind:value={service.short_desc} rows="2" placeholder="1-2 rânduri, vizibile pe cardul serviciului"></textarea>
				</div>
				<div class="camp">
					<label>Descriere</label>
					<textarea bind:value={service.description} rows="3" placeholder="Descriere generală a serviciului"></textarea>
				</div>
				<div class="camp">
					<label>Descriere completă <span class="hint">(pagina de detalii)</span></label>
					<textarea bind:value={service.full_desc} rows="4" placeholder="Text detaliat afișat pe pagina serviciului"></textarea>
				</div>
			</div>

			<!-- Secțiunea 4: Media -->
			<div class="sectiune-form">
				<div class="sectiune-titlu">Media</div>
				<div class="camp">
					<label>Imagine principală</label>
					<label class="upload-zone">
						<input type="file" accept="image/*" onchange={onFotoSelectata} style="display:none" />
						{#if service.image_url}
							<img src={service.image_url} alt="preview" class="img-preview-full" />
							<span class="upload-overlay">Schimbă imaginea</span>
						{:else}
							<div class="upload-placeholder">
								<span class="upload-icon">📷</span>
								<span>Apasă pentru a încărca imaginea principală</span>
								<small>16:9 recomandat</small>
							</div>
						{/if}
					</label>
				</div>
				<div class="camp">
					<label>Galerie imagini
						{#if incarcareGalerie}<span class="hint"> — se încarcă...</span>{/if}
					</label>
					<label class="upload-zone upload-zone-sm">
						<input type="file" accept="image/*" multiple onchange={onFotoGalerieSelectata} style="display:none" />
						<span class="upload-icon">🖼️</span>
						<span>Adaugă imagini în galerie (multiple)</span>
					</label>
					<div class="chips">
						{#each service.gallery as url, i}
							<span class="chip chip-img">
								<img src={url} alt="" />
								<button type="button" onclick={() => stergedinArray('gallery', i)}>×</button>
							</span>
						{/each}
					</div>
				</div>
			</div>

			<!-- Secțiunea 5: Ce include & Poziții -->
			<div class="sectiune-form">
				<div class="sectiune-titlu">Ce include & Poziții</div>
				<div class="form-row-2col">
					<div class="camp">
						<label>Ce include</label>
						<div class="array-input">
							<input
								bind:value={inputIncludes}
								placeholder="ex: Mască protecție, apasă Enter"
								onkeydown={(e) => handleArrayKeydown(e, 'includes', inputIncludes)}
							/>
							<button type="button" class="btn-adauga" onclick={() => adaugaInArray('includes', inputIncludes)}>+</button>
						</div>
						<div class="chips">
							{#each service.includes as item, i}
								<span class="chip">
									{item}
									<button type="button" onclick={() => stergedinArray('includes', i)}>×</button>
								</span>
							{/each}
						</div>
					</div>
					<div class="camp">
						<label>Poziții disponibile</label>
						<div class="array-input">
							<input
								bind:value={inputPositions}
								placeholder="ex: Sniper, apasă Enter"
								onkeydown={(e) => handleArrayKeydown(e, 'positions', inputPositions)}
							/>
							<button type="button" class="btn-adauga" onclick={() => adaugaInArray('positions', inputPositions)}>+</button>
						</div>
						<div class="chips">
							{#each service.positions as pos, i}
								<span class="chip">
									{pos}
									<button type="button" onclick={() => stergedinArray('positions', i)}>×</button>
								</span>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<div style="display:flex; gap:1.2rem; margin-top:2.4rem;">
				<button type="button" class="buton-iesire" style="flex:1" onclick={onClose}>Anulează</button>
				<button type="submit" class="buton-primar" style="flex:2">Salvează Serviciu</button>
			</div>
		</form>
	</div>
</div>

<style>
	.modal-serviciu { max-width: 75rem !important; max-height: 90vh; overflow-y: auto; }
	.sectiune-form { border: 1px solid var(--border); border-radius: 12px; padding: 2rem; margin-bottom: 2.4rem; background: var(--bg-dark); }
	.sectiune-titlu { font-size: 1.2rem; font-weight: 800; color: var(--primary); margin-bottom: 1.6rem; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; }
	.form-row-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.6rem; }
	.form-row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.6rem; }
	.hint { font-size: 1.15rem; color: var(--text-grey); font-weight: 400; font-style: italic; }
	.camp-toggle { display: flex; flex-direction: column; gap: 0.8rem; align-items: flex-start; }
	.toggle { position: relative; display: inline-block; width: 5.2rem; height: 2.8rem; }
	.toggle input { opacity: 0; width: 0; height: 0; }
	.slider { position: absolute; inset: 0; background: var(--border-strong); border-radius: 3rem; cursor: pointer; transition: 0.3s; }
	.slider::before { content: ''; position: absolute; height: 2rem; width: 2rem; left: 4px; bottom: 4px; background: white; border-radius: 50%; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
	input:checked + .slider { background: var(--primary); }
	input:checked + .slider::before { transform: translateX(2.4rem); }
	.array-input { display: flex; gap: 0.8rem; }
	.array-input input { flex: 1; }
	.btn-adauga { padding: 0 1.8rem; background: var(--primary); color: var(--bg-dark); border: none; border-radius: 10px; font-size: 2.2rem; cursor: pointer; line-height: 1; font-weight: 800; }
	.chips { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-top: 1rem; }
	.chip { display: inline-flex; align-items: center; gap: 0.6rem; padding: 0.5rem 1.2rem; background: var(--bg-card); border-radius: 8px; font-size: 1.3rem; border: 1px solid var(--border); font-weight: 600; }
	.chip button { background: none; border: none; cursor: pointer; font-size: 1.8rem; color: var(--text-grey); padding: 0; line-height: 1; display: flex; align-items: center; }
	.chip button:hover { color: var(--danger); }
	.chip-img { padding: 0.4rem; }
	.chip-img img { height: 3.2rem; width: 4.8rem; object-fit: cover; border-radius: 4px; border: 1px solid var(--border); }
	.upload-zone { display: block; position: relative; border: 2px dashed var(--border-strong); border-radius: 14px; cursor: pointer; overflow: hidden; transition: all 0.2s; background: var(--bg-card); }
	.upload-zone:hover { border-color: var(--primary); background: var(--primary-tint); }
	.upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3.2rem; color: var(--text-grey); font-size: 1.45rem; text-align: center; }
	.upload-placeholder small { font-size: 1.2rem; opacity: 0.7; }
	.upload-icon { font-size: 3.2rem; }
	.upload-zone-sm .upload-placeholder, .upload-zone-sm { padding: 1.6rem; }
	.upload-zone-sm { display: flex; align-items: center; gap: 1.2rem; font-size: 1.35rem; color: var(--text-grey); font-weight: 600; }
	.img-preview-full { display: block; width: 100%; max-height: 22rem; object-fit: cover; }
	.upload-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; opacity: 0; transition: opacity 0.2s; backdrop-filter: blur(4px); }
	.upload-zone:hover .upload-overlay { opacity: 1; }
</style>
