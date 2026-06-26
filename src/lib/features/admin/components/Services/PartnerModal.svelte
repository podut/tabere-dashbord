<script lang="ts">
	let { partner = $bindable(), editMode, onClose, onSave }: {
		partner: any;
		editMode: boolean;
		onClose: () => void;
		onSave: (e: SubmitEvent) => void;
	} = $props();
</script>

<div class="modal-overlay">
	<div class="login-card" style="max-width: 55rem;">
		<h2>{editMode ? 'Editează' : 'Adaugă'} Partener</h2>
		<form onsubmit={onSave}>
			<div class="camp"><label>Nume Partener</label><input bind:value={partner.name} required /></div>
			<div class="camp"><label>Website URL</label><input type="url" bind:value={partner.website} placeholder="https://..." /></div>
			<div style="display:flex; gap:1.2rem; margin-top:2.4rem;">
				<button type="button" class="buton-iesire" style="flex:1" onclick={onClose}>Anulează</button>
				<button type="submit" class="buton-primar" style="flex:2">Salvează Partener</button>
			</div>
		</form>
	</div>
</div>
