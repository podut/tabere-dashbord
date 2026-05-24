<script lang="ts">
	import { STORAGE_BUCKET, supabase } from '$lib/supabase';
	import Cropper from 'svelte-easy-crop';
	import { getCroppedImg } from '$lib/utils/image';
	import { ProductRepository } from '$lib/data/repositories/ProductRepository';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import type { Product } from '$lib/types';
	import ProductMobileCard from './view/ProductMobileCard.svelte';

	let { produse = $bindable([]), refreshProducts }: { 
		produse: Product[],
		refreshProducts: () => Promise<void>
	} = $props();

	let showProdModal = $state(false);
	let showProdGalModal = $state(false);
	let editMode = $state(false);
	let saving = $state(false);
	let incarcareFoto = $state(false);

	let produsCurent = $state<any>({
		id: '',
		name: '',
		price: 0,
		category: 'echipament',
		stock: 10,
		description: '',
		full_desc: '',
		sizes: [],
		colors: [],
		image_url: '',
		images: []
	});

	// --- CROP STATE ---
	let cropImage = $state<string | null>(null);
	let crop = $state({ x: 0, y: 0 });
	let zoom = $state(1);
	let croppedAreaPixels = $state<any>(null);
	let cropContext = $state<string | null>(null);

	function deschideProdus(p: any = null) {
		editMode = !!p;
		produsCurent = p
			? { ...p, images: p.images || [] }
			: { name: '', price: 0, category: 'echipament', stock: 10, description: '', full_desc: '', image_url: '', images: [] };
		showProdModal = true;
	}

	async function salveazaProdus(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		try {
			const payload = {
				id: editMode ? produsCurent.id : undefined,
				name: produsCurent.name,
				price: produsCurent.price,
				stock: produsCurent.stock,
				category: produsCurent.category,
				description: produsCurent.description,
				full_desc: produsCurent.full_desc,
				image_url: produsCurent.image_url,
				images: produsCurent.images || []
			};

			await ProductRepository.saveProduct(payload as any);
			showProdModal = false;
			await refreshProducts();
			showToast('success', editMode ? 'Produs actualizat.' : 'Produs creat.');
		} catch (err: any) {
			showToast('error', err.message);
		} finally {
			saving = false;
		}
	}

	async function stergeProdus(id: string) {
		if (await confirmDialog({
			title: 'Ștergi produsul?',
			message: 'Produsul va fi eliminat definitiv din magazin.',
			confirmLabel: 'Șterge',
			danger: true
		})) {
			try {
				await ProductRepository.deleteProduct(id);
				await refreshProducts();
				showToast('success', 'Produs șters.');
			} catch (err: any) {
				showToast('error', err.message);
			}
		}
	}

	async function stergeFotoProdus(url: string) {
		try {
			const newImages = produsCurent.images.filter((item: string) => item !== url);
			await ProductRepository.saveProduct({ id: produsCurent.id, images: newImages });
			produsCurent.images = newImages;
			await refreshProducts();
		} catch (err: any) {
			showToast('error', err.message);
		}
	}

	// --- LOGICA IMAGINI ---
	function onFileSelected(e: Event, context: any) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			cropContext = context;
			const reader = new FileReader();
			reader.onload = () => { cropImage = reader.result as string; };
			reader.readAsDataURL(target.files[0]);
		}
	}

	async function handleFinalizeCrop() {
		if (!cropImage || !croppedAreaPixels) return;
		incarcareFoto = true;
		try {
			const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
			if (!croppedBlob) throw new Error('Eroare la procesare.');
			const fileName = `${Date.now()}.jpg`;
			const filePath = `product/${fileName}`;
			const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, croppedBlob);
			if (uploadError) throw uploadError;
			const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
			const publicUrl = data.publicUrl;

			if (cropContext === 'product') {
				produsCurent.image_url = publicUrl;
			} else if (cropContext === 'product_gallery') {
				const newImages = [...(produsCurent.images || []), publicUrl];
				await ProductRepository.saveProduct({ id: produsCurent.id, images: newImages });
				produsCurent.images = newImages;
			}

			cropImage = null;
			await refreshProducts();
		} catch (err: any) {
			showToast('error', 'Eroare: ' + err.message);
		} finally {
			incarcareFoto = false;
		}
	}
</script>

<div class="shop-manager">
	<div class="actiuni-pagina" style="display:flex; justify-content: flex-end; margin-bottom: 2.4rem;">
		<button class="buton-primar" onclick={() => deschideProdus()}>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
			Produs Nou
		</button>
	</div>

	<!-- Mobile View -->
	<div class="mobile-only-grid">
		{#each produse as p}
			<ProductMobileCard 
				{p} 
				onEdit={deschideProdus} 
				onGallery={(p) => { produsCurent = { ...p, images: p.images || [] }; showProdGalModal = true; }} 
				onDelete={stergeProdus} 
			/>
		{:else}
			<div class="td-gol">Niciun produs în magazin.</div>
		{/each}
	</div>

	<div class="table-scroll shop-table-container desktop-only-table">
		<table>
			<thead><tr><th>Img</th><th>Nume</th><th>Preț</th><th>Stoc</th><th>Acțiuni</th></tr></thead>
			<tbody>
				{#each produse as p}
					<tr>
						<td class="col-img"><img src={p.image_url} alt="" class="prod-img-thumb" /></td>
						<td><strong class="prod-name">{p.name}</strong></td>
						<td class="col-price">{p.price} {p.currency || 'lei'}</td>
						<td class="col-stock"><span class="stock-badge" class:low-stock={p.stock <= 5}>{p.stock}</span></td>
						<td>
							<div class="actiuni-celula">
								<button class="btn-icon btn-galerie" onclick={() => { produsCurent = { ...p, images: p.images || [] }; showProdGalModal = true; }} title="Galerie">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
								</button>
								<button class="btn-icon" onclick={() => deschideProdus(p)} title="Editează">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
								</button>
								<button class="btn-icon btn-sterge" onclick={() => stergeProdus(p.id)} title="Șterge">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
								</button>
							</div>
						</td>
					</tr>
				{:else}
					<tr><td colspan="5" class="td-gol">Niciun produs în magazin.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.shop-table-container {
		background: var(--bg-card);
		border-radius: 16px;
		border: 1px solid var(--border);
		box-shadow: 0 10px 30px rgba(0,0,0,0.25);
		overflow: hidden;
	}

	.prod-img-thumb {
		height: 4.8rem;
		width: 4.8rem;
		object-fit: cover;
		border-radius: 8px;
		border: 1px solid var(--border-strong);
	}

	.prod-name { font-size: 1.5rem; color: var(--text); }
	.col-price { font-weight: 700; color: var(--primary); font-size: 1.5rem; }
	.col-stock { text-align: center; }
	
	.stock-badge {
		background: var(--bg-dark);
		color: var(--text);
		padding: 0.4rem 1.2rem;
		border-radius: 6px;
		font-weight: 700;
		border: 1px solid var(--border);
	}

	.stock-badge.low-stock {
		color: var(--danger);
		border-color: var(--danger);
		background: var(--danger-tint);
	}

	.actiuni-celula { display: flex; gap: 0.6rem; }
	.btn-galerie { color: var(--accent-blue); border-color: rgba(52, 152, 219, 0.3); }
	.btn-galerie:hover { background: rgba(52, 152, 219, 0.1); border-color: var(--accent-blue); }

	.td-gol { text-align: center; padding: 6rem; color: var(--text-grey); font-size: 1.5rem; font-style: italic; }

	.mobile-only-grid { display: none; }

	@media (max-width: 768px) {
		.desktop-only-table { display: none; }
		.mobile-only-grid { display: block; padding: 0.5rem; }
	}

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
</style>

<!-- MODAL PRODUS -->
{#if showProdModal}
	<div class="modal-overlay">
		<div class="login-card" style="max-width: 55rem; max-height: 90vh; overflow-y: auto;">
			<h2>{editMode ? 'Editează' : 'Adaugă'} Produs</h2>
			<form onsubmit={salveazaProdus}>
				<div class="camp"><label>Nume Produs</label><input bind:value={produsCurent.name} required /></div>
				
				<div class="camp">
					<label>Imagine Principală</label>
					<div class="upload-zone-wrapper" style="margin-bottom: 1.6rem;">
						<input type="file" accept="image/*" onchange={(e) => onFileSelected(e, 'product')} id="prod-file" style="display:none" />
						<label for="prod-file" class="buton-iesire" style="display:inline-block; width:100%; text-align:center; padding: 2.4rem; border-style: dashed; cursor: pointer;">
							{produsCurent.image_url ? 'Schimbă Imaginea' : 'Încarcă Imagine Produs'}
						</label>
					</div>
				</div>

				{#if produsCurent.image_url}
					<div style="margin-bottom: 2.4rem;">
						<img src={produsCurent.image_url} alt="" style="width:100%; height:18rem; object-fit:cover; border-radius:12px; border: 1px solid var(--border);" />
					</div>
				{/if}

				<div class="camp"><label>Descriere Scurtă</label><input bind:value={produsCurent.description} placeholder="Apare în lista de produse" /></div>
				<div class="camp"><label>Descriere Detaliată</label><textarea bind:value={produsCurent.full_desc} style="width:100%; height:12rem; border-radius:9px; border:1px solid var(--border); padding:1rem; resize:vertical; font-family:inherit;"></textarea></div>
				
				<div class="form-row-2col">
					<div class="camp"><label>Preț (RON)</label><input type="number" bind:value={produsCurent.price} required step="0.01" /></div>
					<div class="camp"><label>Stoc Disponibil</label><input type="number" bind:value={produsCurent.stock} required /></div>
				</div>

				<div class="camp">
					<label>Mărimi (separate prin virgulă)</label>
					<input placeholder="ex: S, M, L, XL" value={produsCurent.sizes?.join(', ')} onchange={(e) => produsCurent.sizes = e.currentTarget.value.split(',').map(s => s.trim()).filter(s => s)} />
				</div>

				<div style="display:flex; gap:1.2rem; margin-top:2.4rem;">
					<button type="button" class="buton-iesire" style="flex:1" onclick={() => (showProdModal = false)}>Anulează</button>
					<button type="submit" class="buton-primar" style="flex:2" disabled={saving}>{saving ? 'Se salvează...' : 'Salvează Produs'}</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL GALERIE PRODUS -->
{#if showProdGalModal}
	<div class="modal-overlay">
		<div class="login-card" style="max-width: 85rem; max-height: 85vh; display: flex; flex-direction: column;">
			<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2.4rem; border-bottom: 1px solid var(--border); padding-bottom: 1.6rem;">
				<h2 style="margin:0;">Galerie: <span style="color:var(--primary);">{produsCurent.name}</span></h2>
				<button class="btn-icon" onclick={() => showProdGalModal = false} style="font-size: 2rem;">×</button>
			</div>
			
			<div class="camp">
				<label>Adaugă imagini noi în galerie</label>
				<input type="file" accept="image/*" onchange={(e) => onFileSelected(e, 'product_gallery')} />
			</div>

			<div class="galerie-grid">
				{#each produsCurent.images || [] as url}
					<div class="foto-card-prod">
						<img src={url} alt="" />
						<button class="btn-sterge-foto" onclick={() => stergeFotoProdus(url)}>×</button>
					</div>
				{:else}
					<p class="td-gol" style="grid-column: 1/-1;">Nicio imagine în galerie.</p>
				{/each}
			</div>
			
			<div style="margin-top: 2.4rem; display: flex; justify-content: flex-end;">
				<button class="buton-iesire" style="min-width: 15rem;" onclick={() => showProdGalModal = false}>Închide</button>
			</div>
		</div>
	</div>
{/if}

{#if cropImage}
	<div class="modal-overlay" style="z-index: 2000;">
		<div class="login-card" style="max-width: 90rem; height: 90vh; display: flex; flex-direction: column;">
			<h2>Decupează Imaginea</h2>
			<div style="flex: 1; position: relative; background: #222; border-radius: 12px; overflow: hidden; margin-bottom: 2rem;">
				<Cropper image={cropImage} bind:crop bind:zoom aspect={1/1} oncropcomplete={({ pixels }) => (croppedAreaPixels = pixels)} />
			</div>
			<div style="display: flex; gap: 1rem;">
				<button class="buton-iesire" style="flex: 1" onclick={() => cropImage = null}>Anulează</button>
				<button class="buton-primar" style="flex: 2" onclick={handleFinalizeCrop} disabled={incarcareFoto}>{incarcareFoto ? 'Se salvează...' : 'Finalizează'}</button>
			</div>
		</div>
	</div>
{/if}
