<script lang="ts">
	let { eq = $bindable(), editMode, onClose, onSave, onFileSelected }: {
		eq: any;
		editMode: boolean;
		onClose: () => void;
		onSave: (e: SubmitEvent) => void;
		onFileSelected: (e: Event) => void;
	} = $props();
</script>

<div class="modal-overlay">
	<div class="login-card" style="max-width: 60rem;">
		<h2>{editMode ? 'Editează' : 'Adaugă'} {eq.parent_id ? 'Produs' : 'Secțiune'}</h2>
		<form onsubmit={onSave}>
			<div class="camp"><label for="eq-title">Denumire</label><input id="eq-title" bind:value={eq.title} required /></div>
			<div class="camp"><label for="eq-desc">Descriere</label><textarea id="eq-desc" bind:value={eq.description} style="width:100%; height:8rem; border-radius:9px; border:1px solid var(--border); padding:1rem;"></textarea></div>

			<div class="form-row-2col">
				<div class="camp">
					<label for="eq-cat">Categorie</label>
					<select id="eq-cat" bind:value={eq.category} style="width:100%; padding:1.2rem; border-radius:9px; border:1px solid var(--border);">
						<option value="Armament">Armament</option><option value="Protectie">Protecție</option><option value="Accesorii">Accesorii</option><option value="Sub-item">Produs</option>
					</select>
				</div>
				<div class="camp"><label for="eq-order">Ordine</label><input id="eq-order" type="number" bind:value={eq.order} /></div>
			</div>

			<div class="camp">
				<label>Imagine</label>
				<div class="upload-zone-wrapper">
					<input type="file" accept="image/*" onchange={onFileSelected} id="eq-file-input" style="display:none" />
					<label for="eq-file-input" class="buton-iesire" style="display:inline-block; width:100%; text-align:center; padding: 2rem; border-style: dashed; cursor: pointer;">
						{eq.image_url ? 'Schimbă Imaginea' : 'Apasă pentru a încărca imagine'}
					</label>
				</div>
			</div>
			
			{#if eq.image_url}
				<div style="margin-bottom: 2rem;">
					<img src={eq.image_url} alt="" style="width:100%; height:16rem; object-fit:cover; border-radius:12px; border: 1px solid var(--border);" />
				</div>
			{/if}

			<div style="display:flex; gap: 1rem; margin-top: 2rem;">
				<button type="button" class="buton-iesire" style="flex: 1" onclick={onClose}>Anulează</button>
				<button type="submit" class="buton-primar" style="flex: 2">Salvează</button>
			</div>
		</form>
	</div>
</div>

<style>
	.upload-zone-wrapper {
		margin-bottom: 1.6rem;
	}
</style>
