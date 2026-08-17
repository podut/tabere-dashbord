<script lang="ts">
	let { produs = $bindable(), editMode, saving, categoriiProduse = [], onClose, onSave, onFileSelected }: {
		produs: any;
		editMode: boolean;
		saving: boolean;
		categoriiProduse: string[];
		onClose: () => void;
		onSave: (e: SubmitEvent) => void;
		onFileSelected: (e: Event, context: string) => void;
	} = $props();
</script>

<div class="modal-overlay">
	<div class="login-card" style="max-width: 55rem; max-height: 90vh; overflow-y: auto;">
		<h2>{editMode ? 'Editează' : 'Adaugă'} Produs</h2>
		<form onsubmit={onSave}>
			<div class="camp"><label>Nume Produs</label><input bind:value={produs.name} required /></div>
			
			<div class="camp">
				<label>Imagine Principală</label>
				<div class="upload-zone-wrapper" style="margin-bottom: 1.6rem;">
					<input type="file" accept="image/*" onchange={(e) => onFileSelected(e, 'product')} id="prod-file" style="display:none" />
					<label for="prod-file" class="buton-iesire" style="display:inline-block; width:100%; text-align:center; padding: 2.4rem; border-style: dashed; cursor: pointer;">
						{produs.image_url ? 'Schimbă Imaginea' : 'Încarcă Imagine Produs'}
					</label>
				</div>
			</div>

			{#if produs.image_url}
				<div style="margin-bottom: 2.4rem;">
					<img src={produs.image_url} alt="" style="width:100%; height:18rem; object-fit:cover; border-radius:12px; border: 1px solid var(--border);" />
				</div>
			{/if}

			<div class="camp"><label>Descriere Scurtă</label><input bind:value={produs.description} placeholder="Apare în lista de produse" /></div>
			<div class="camp"><label>Descriere Detaliată</label><textarea bind:value={produs.full_desc} style="width:100%; height:12rem; border-radius:9px; border:1px solid var(--border); padding:1rem; resize:vertical; font-family:inherit;"></textarea></div>
			
			<div class="form-row-2col">
				<div class="camp">
					<label>Categorie</label>
					<input
						list="categorii-produse-list"
						bind:value={produs.category}
						placeholder="ex: echipament, imbracaminte..."
						autocomplete="off"
					/>
					<datalist id="categorii-produse-list">
						{#each categoriiProduse as cat}
							<option value={cat} />
						{/each}
					</datalist>
				</div>
				<div class="camp camp-toggle">
					<label>În stoc</label>
					<label class="toggle">
						<input type="checkbox" bind:checked={produs.in_stock} />
						<span class="slider"></span>
					</label>
				</div>
			</div>

			<div class="form-row-2col">
				<div class="camp"><label>Preț (RON)</label><input type="number" bind:value={produs.price} required step="0.01" /></div>
				<div class="camp">
					<label>Stoc Disponibil (-1 = nelimitat)</label>
					<input type="number" bind:value={produs.stock} required />
				</div>
			</div>

			<div class="form-row-2col">
				<div class="camp">
					<label>Mărimi (separate prin virgulă)</label>
					<input placeholder="ex: S, M, L, XL" value={produs.sizes?.join(', ')} onchange={(e) => produs.sizes = e.currentTarget.value.split(',').map(s => s.trim()).filter(s => s)} />
				</div>
				<div class="camp">
					<label>Culori (separate prin virgulă)</label>
					<input placeholder="ex: Negru, OD Green, Tan" value={produs.colors?.join(', ')} onchange={(e) => produs.colors = e.currentTarget.value.split(',').map(s => s.trim()).filter(s => s)} />
				</div>
			</div>

			<div style="display:flex; gap:1.2rem; margin-top:2.4rem;">
				<button type="button" class="buton-iesire" style="flex:1" onclick={onClose}>Anulează</button>
				<button type="submit" class="buton-primar" style="flex:2" disabled={saving}>{saving ? 'Se salvează...' : 'Salvează Produs'}</button>
			</div>
		</form>
	</div>
</div>

<style>
	/* Copiate din ServiceModal.svelte — stilurile de toggle sunt scoped per
	   componenta in Svelte, nu exista global in admin.css. */
	.camp-toggle { display: flex; flex-direction: column; gap: 0.8rem; align-items: flex-start; }
	.toggle { position: relative; display: inline-block; width: 5.2rem; height: 2.8rem; }
	.toggle input { opacity: 0; width: 0; height: 0; }
	.slider { position: absolute; inset: 0; background: var(--border-strong); border-radius: 3rem; cursor: pointer; transition: 0.3s; }
	.slider::before { content: ''; position: absolute; height: 2rem; width: 2rem; left: 4px; bottom: 4px; background: white; border-radius: 50%; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
	input:checked + .slider { background: var(--primary); }
	input:checked + .slider::before { transform: translateX(2.4rem); }
</style>
