<script lang="ts">
	import { supabase, STORAGE_BUCKET } from '$lib/supabase';
	import Cropper from 'svelte-easy-crop';
	import { getCroppedImg } from '$lib/utils/image';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import type { Product } from '$lib/types';

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
				name: produsCurent.name,
				price: produsCurent.price,
				stock: produsCurent.stock,
				category: produsCurent.category,
				description: produsCurent.description,
				full_desc: produsCurent.full_desc,
				image_url: produsCurent.image_url,
				images: produsCurent.images || []
			};

			const { error } = editMode
				? await supabase.from('products').update(payload).eq('id', produsCurent.id)
				: await supabase.from('products').insert([payload]);

			if (!error) {
				showProdModal = false;
				await refreshProducts();
				showToast('success', editMode ? 'Produs actualizat.' : 'Produs creat.');
			} else throw error;
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
			const { error } = await supabase.from('products').delete().eq('id', id);
			if (!error) {
				await refreshProducts();
				showToast('success', 'Produs șters.');
			}
		}
	}

	async function stergeFotoProdus(url: string) {
		const newImages = produsCurent.images.filter((item: string) => item !== url);
		const { error } = await supabase.from('products').update({ images: newImages }).eq('id', produsCurent.id);
		if (!error) {
			produsCurent.images = newImages;
			await refreshProducts();
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
				await supabase.from('products').update({ images: newImages }).eq('id', produsCurent.id);
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
	<div class="actiuni-pagina" style="display:flex; justify-content: flex-end; margin-bottom: 2rem;">
		<button class="buton-primar" onclick={() => deschideProdus()}>+ Produs Nou</button>
	</div>

	<div class="table-scroll" style="background: white; border-radius: 12px; border: 1px solid var(--border);">
		<table>
			<thead><tr><th>Img</th><th>Nume</th><th>Preț</th><th>Stoc</th><th>Acțiuni</th></tr></thead>
			<tbody>
				{#each produse as p}
					<tr>
						<td><img src={p.image_url} alt="" style="height:3.6rem; width:3.6rem; object-fit:cover; border-radius:4px;" /></td>
						<td><strong>{p.name}</strong></td>
						<td>{p.price} lei</td>
						<td>{p.stock}</td>
						<td style="display:flex; gap:0.5rem;">
							<button class="btn-icon" style="background:#27ae60; color:white; border:none;" onclick={() => { produsCurent = { ...p, images: p.images || [] }; showProdGalModal = true; }} title="Galerie">🖼️</button>
							<button class="btn-icon" onclick={() => deschideProdus(p)} title="Editează">✏️</button>
							<button class="btn-icon btn-sterge" onclick={() => stergeProdus(p.id)} title="Șterge">🗑️</button>
						</td>
					</tr>
				{:else}
					<tr><td colspan="5" style="text-align:center; padding: 4rem; color: #999;">Niciun produs în magazin.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- MODAL PRODUS -->
{#if showProdModal}
	<div class="modal-overlay">
		<div class="login-card" style="max-width: 50rem; max-height: 90vh; overflow-y: auto;">
			<h2>{editMode ? 'Editează' : 'Adaugă'} Produs</h2>
			<form onsubmit={salveazaProdus}>
				<div class="camp"><label>Nume</label><input bind:value={produsCurent.name} required /></div>
				<div class="camp"><label>Imagine Principală</label><input type="file" accept="image/*" onchange={(e) => onFileSelected(e, 'product')} /></div>
				{#if produsCurent.image_url}
					<img src={produsCurent.image_url} alt="" style="width:100%; height:12rem; object-fit:cover; border-radius:8px; margin-bottom:1rem;" />
				{/if}
				<div class="camp"><label>Descriere scurtă</label><input bind:value={produsCurent.description} /></div>
				<div class="camp"><label>Descriere Detaliată</label><textarea bind:value={produsCurent.full_desc} style="width:100%; height:10rem; border-radius:9px; border:1px solid var(--border); padding:1rem; resize:vertical;"></textarea></div>
				
				<div class="form-row-2col">
					<div class="camp"><label>Preț (lei)</label><input type="number" bind:value={produsCurent.price} required /></div>
					<div class="camp"><label>Stoc</label><input type="number" bind:value={produsCurent.stock} required /></div>
				</div>

				<div class="camp">
					<label>Mărimi (separate prin virgulă)</label>
					<input value={produsCurent.sizes?.join(', ')} onchange={(e) => produsCurent.sizes = e.currentTarget.value.split(',').map(s => s.trim()).filter(s => s)} />
				</div>

				<div style="display:flex; gap:1rem; margin-top:2rem;">
					<button type="button" class="buton-iesire" style="flex:1" onclick={() => (showProdModal = false)}>Anulează</button>
					<button type="submit" class="buton-primar" style="flex:2" disabled={saving}>{saving ? 'Se salvează...' : 'Salvează'}</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL GALERIE PRODUS -->
{#if showProdGalModal}
	<div class="modal-overlay">
		<div class="login-card" style="max-width: 80rem; max-height: 85vh; display: flex; flex-direction: column;">
			<div style="display:flex; justify-content:space-between; margin-bottom:2rem;">
				<h2>Galerie Produs: {produsCurent.name}</h2>
				<button class="buton-iesire" onclick={() => showProdGalModal = false}>Închide</button>
			</div>
			<div class="camp"><label>Încarcă poze noi (1:1)</label><input type="file" accept="image/*" onchange={(e) => onFileSelected(e, 'product_gallery')} /></div>
			<div class="galerie-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 1rem; overflow-y: auto; flex: 1;">
				{#each produsCurent.images || [] as url}
					<div class="foto-card" style="position:relative;">
						<img src={url} alt="" style="width:100%; height:14rem; object-fit:cover; border-radius:8px;" />
						<button class="btn-sterge-foto" style="position:absolute; top:0.5rem; right:0.5rem; background:rgba(231,76,60,0.8); color:white; border:none; border-radius:50%; width:2.4rem; height:2.4rem;" onclick={() => stergeFotoProdus(url)}>×</button>
					</div>
				{/each}
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
