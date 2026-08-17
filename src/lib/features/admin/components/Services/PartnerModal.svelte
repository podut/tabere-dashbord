<script lang="ts">
	let { partner = $bindable(), editMode, onClose, onSave, onFotoSelectata, incarcareLogo }: {
		partner: any;
		editMode: boolean;
		onClose: () => void;
		onSave: (e: SubmitEvent) => void;
		onFotoSelectata: (e: Event) => void;
		incarcareLogo: boolean;
	} = $props();
</script>

<div class="modal-overlay">
	<div class="login-card" style="max-width: 55rem;">
		<h2>{editMode ? 'Editează' : 'Adaugă'} Partener</h2>
		<form onsubmit={onSave}>
			<div class="camp"><label>Nume Partener</label><input bind:value={partner.name} required /></div>
			<div class="camp"><label>Website URL</label><input type="url" bind:value={partner.website} placeholder="https://..." /></div>

			<div class="camp">
				<label>Logo Partener</label>
				<div class="upload-zone-wrapper" style="margin-bottom: 1.6rem;">
					<input type="file" accept="image/*" onchange={onFotoSelectata} id="partner-file" style="display:none" disabled={incarcareLogo} />
					<label for="partner-file" class="buton-iesire" style="display:inline-block; width:100%; text-align:center; padding: 2.4rem; border-style: dashed; cursor: pointer;">
						{incarcareLogo ? 'Se încarcă...' : partner.image_url ? 'Schimbă Logo-ul' : 'Încarcă Logo'}
					</label>
				</div>
			</div>

			{#if partner.image_url}
				<div style="margin-bottom: 2.4rem;">
					<img src={partner.image_url} alt="" style="max-width:16rem; max-height:10rem; object-fit:contain; border-radius:12px; border: 1px solid var(--border);" />
				</div>
			{/if}
			<div style="display:flex; gap:1.2rem; margin-top:2.4rem;">
				<button type="button" class="buton-iesire" style="flex:1" onclick={onClose}>Anulează</button>
				<button type="submit" class="buton-primar" style="flex:2">Salvează Partener</button>
			</div>
		</form>
	</div>
</div>
