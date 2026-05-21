<script lang="ts">
	let { eveniment, onClose, onFileSelected, onDeletePhoto }: {
		eveniment: any;
		onClose: () => void;
		onFileSelected: (e: Event, context: string) => void;
		onDeletePhoto: (url: string) => void;
	} = $props();
</script>

<div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="gal-titlu">
	<div class="login-card modal-galerie">
		<div class="modal-header">
			<h2 id="gal-titlu">Galerie: {eveniment.title}</h2>
			<button class="buton-iesire" onclick={onClose}>Închide</button>
		</div>

		<div class="camp">
			<label for="gal-upload">Încarcă poze noi (16:9)</label>
			<input id="gal-upload" type="file" accept="image/*" onchange={(e) => onFileSelected(e, 'event_gallery')} />
		</div>

		<div class="galerie-grid galerie-eveniment">
			{#each eveniment.gallery || [] as url}
				<div class="foto-card">
					<img src={url} alt="" class="foto-img" />
					<div class="foto-info">
						<button class="btn-sterge-foto" onclick={() => onDeletePhoto(url)}>Șterge</button>
					</div>
				</div>
			{:else}
				<p class="gal-goala">Nicio fotografie adăugată.</p>
			{/each}
		</div>
	</div>
</div>

<style>
	.modal-galerie { max-width: 80rem; max-height: 85vh; display: flex; flex-direction: column; }
	.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
	.modal-header h2 { margin-bottom: 0; }
	.galerie-eveniment { flex: 1; overflow-y: auto; }
	.gal-goala { color: #999; font-size: 1.4rem; grid-column: 1 / -1; text-align: center; padding: 3rem 0; }
</style>
