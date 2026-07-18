<script lang="ts">
	import { ProductRepository } from '$lib/data/repositories/ProductRepository';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import { supabase, STORAGE_BUCKET } from '$lib/supabase';
	import type { Product } from '$lib/types';
	import ProductMobileCard from './view/ProductMobileCard.svelte';
	import ProductModal from './ProductModal.svelte';
	import ProductGalleryModal from './ProductGalleryModal.svelte';
	import CropModal from '../Shared/CropModal.svelte';

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
	function onFileSelected(e: Event, context: string) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			cropContext = context;
			const reader = new FileReader();
			reader.onload = () => { cropImage = reader.result as string; };
			reader.readAsDataURL(target.files[0]);
		}
	}

	async function handleFinalizeCrop(blob: Blob) {
		incarcareFoto = true;
		try {
			const fileName = `${Date.now()}.jpg`;
			const filePath = `product/${fileName}`;
			const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, blob);
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
						<td class="col-stock"><span class="stock-badge" class:low-stock={(p.stock ?? 0) <= 5}>{p.stock}</span></td>
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

{#if showProdModal}
	<ProductModal
		bind:produs={produsCurent}
		{editMode}
		{saving}
		onClose={() => (showProdModal = false)}
		onSave={salveazaProdus}
		{onFileSelected}
	/>
{/if}

{#if showProdGalModal}
	<ProductGalleryModal
		bind:produs={produsCurent}
		onClose={() => (showProdGalModal = false)}
		{onFileSelected}
		onDeletePhoto={stergeFotoProdus}
	/>
{/if}

{#if cropImage}
	<CropModal
		{cropImage}
		aspect={1/1}
		saving={incarcareFoto}
		onFinish={handleFinalizeCrop}
		onCancel={() => (cropImage = null)}
	/>
{/if}

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
</style>
