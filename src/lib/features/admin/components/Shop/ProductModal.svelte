<script lang="ts">
	let { produs = $bindable(), editMode, saving, onClose, onSave, onFileSelected }: {
		produs: any;
		editMode: boolean;
		saving: boolean;
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
				<div class="camp"><label>Preț (RON)</label><input type="number" bind:value={produs.price} required step="0.01" /></div>
				<div class="camp"><label>Stoc Disponibil</label><input type="number" bind:value={produs.stock} required /></div>
			</div>

			<div class="camp">
				<label>Mărimi (separate prin virgulă)</label>
				<input placeholder="ex: S, M, L, XL" value={produs.sizes?.join(', ')} onchange={(e) => produs.sizes = e.currentTarget.value.split(',').map(s => s.trim()).filter(s => s)} />
			</div>

			<div style="display:flex; gap:1.2rem; margin-top:2.4rem;">
				<button type="button" class="buton-iesire" style="flex:1" onclick={onClose}>Anulează</button>
				<button type="submit" class="buton-primar" style="flex:2" disabled={saving}>{saving ? 'Se salvează...' : 'Salvează Produs'}</button>
			</div>
		</form>
	</div>
</div>
