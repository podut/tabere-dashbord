<script lang="ts">
	let { produs = $bindable(), onClose, onFileSelected, onDeletePhoto }: {
		produs: any;
		onClose: () => void;
		onFileSelected: (e: Event, context: string) => void;
		onDeletePhoto: (url: string) => void;
	} = $props();
</script>

<div class="modal-overlay">
	<div class="login-card" style="max-width: 85rem; max-height: 85vh; display: flex; flex-direction: column;">
		<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2.4rem; border-bottom: 1px solid var(--border); padding-bottom: 1.6rem;">
			<h2 style="margin:0;">Galerie: <span style="color:var(--primary);">{produs.name}</span></h2>
			<button class="btn-icon" onclick={onClose} style="font-size: 2rem;">×</button>
		</div>
		
		<div class="camp">
			<label>Adaugă imagini noi în galerie</label>
			<input type="file" accept="image/*" onchange={(e) => onFileSelected(e, 'product_gallery')} />
		</div>

		<div class="galerie-grid">
			{#each produs.images || [] as url}
				<div class="foto-card-prod">
					<img src={url} alt="" />
					<button class="btn-sterge-foto" onclick={() => onDeletePhoto(url)}>×</button>
				</div>
			{:else}
				<p class="td-gol" style="grid-column: 1/-1;">Nicio imagine în galerie.</p>
			{/each}
		</div>
		
		<div style="margin-top: 2.4rem; display: flex; justify-content: flex-end;">
			<button class="buton-iesire" style="min-width: 15rem;" onclick={onClose}>Închide</button>
		</div>
	</div>
</div>

<style>
	.galerie-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
		gap: 1.6rem;
		padding: 1.6rem;
		background: rgba(0,0,0,0.2);
		border-radius: 12px;
	}

	.foto-card-prod {
		position: relative;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid var(--border);
		aspect-ratio: 1/1;
	}

	.foto-card-prod img { width: 100%; height: 100%; object-fit: cover; }

	.btn-sterge-foto {
		position: absolute;
		top: 0.8rem;
		right: 0.8rem;
		background: var(--danger);
		color: white;
		border: none;
		border-radius: 50%;
		width: 2.8rem;
		height: 2.8rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 1.8rem;
		box-shadow: 0 2px 8px rgba(0,0,0,0.4);
		transition: all 0.2s;
	}

	.btn-sterge-foto:hover { transform: scale(1.1); background: #c0392b; }
    
	.td-gol { text-align: center; padding: 6rem; color: var(--text-grey); font-size: 1.5rem; font-style: italic; }
</style>
