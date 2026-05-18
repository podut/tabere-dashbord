<script lang="ts">
	import { supabase, STORAGE_BUCKET } from '$lib/supabase';
	import Cropper from 'svelte-easy-crop';
	import { getCroppedImg } from '$lib/utils/image';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import type { Equipment } from '$lib/types';

	let { echipament = $bindable([]), refreshEquipment }: { 
		echipament: Equipment[],
		refreshEquipment: () => Promise<void>
	} = $props();

	let showEqModal = $state(false);
	let editMode = $state(false);
	let incarcareFoto = $state(false);
	let cropImage = $state<string | null>(null);
	let crop = $state({ x: 0, y: 0 });
	let zoom = $state(1);
	let croppedAreaPixels = $state<any>(null);

	let eqCurent = $state<any>({
		id: '',
		title: '',
		description: '',
		image_url: '',
		category: 'Armament',
		order: 0,
		parent_id: null
	});

	let parents = $derived(echipament.filter((e) => !e.parent_id));

	function deschideEq(item: any = null, parentId: string | null = null) {
		editMode = !!item;
		eqCurent = item
			? { ...item }
			: {
					title: '',
					description: '',
					image_url: '',
					category: parentId ? 'Sub-item' : 'Armament',
					order: 0,
					parent_id: parentId
				};
		showEqModal = true;
	}

	async function salveazaEq(e: SubmitEvent) {
		e.preventDefault();
		const payload = { 
            title: eqCurent.title,
            description: eqCurent.description,
            image_url: eqCurent.image_url,
            category: eqCurent.category,
            order: eqCurent.order,
            parent_id: eqCurent.parent_id === 'null' || eqCurent.parent_id === '' ? null : eqCurent.parent_id
        };

		const { error } = editMode
			? await supabase.from('equipment').update(payload).eq('id', eqCurent.id)
			: await supabase.from('equipment').insert([payload]);

		if (!error) {
			showEqModal = false;
			await refreshEquipment();
			showToast('success', 'Salvat cu succes.');
		} else showToast('error', error.message);
	}

	async function stergeEq(id: string) {
		if (await confirmDialog({
			title: 'Stergi elementul?',
			message: 'Actiunea este ireversibila.',
			confirmLabel: 'Sterge',
			danger: true
		})) {
			const { error } = await supabase.from('equipment').delete().eq('id', id);
			if (!error) {
				await refreshEquipment();
				showToast('success', 'Sters.');
			}
		}
	}

	function onFileSelected(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
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
			const fileName = `equipment/${Date.now()}.jpg`;
			const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, croppedBlob);
			if (uploadError) throw uploadError;
			const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
			eqCurent.image_url = data.publicUrl;
			cropImage = null;
		} catch (err: any) {
			showToast('error', err.message);
		} finally {
			incarcareFoto = false;
		}
	}
</script>

<div class="equipment-manager">
	<div class="actiuni-pagina" style="display:flex; justify-content: flex-end; margin-bottom: 2rem;">
		<button class="buton-primar" onclick={() => deschideEq()}>+ Secțiune Nouă</button>
	</div>

	<div class="equipment-hierarchy">
		{#each parents as parent}
			<div class="eq-parent-section" style="background: white; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 3rem; overflow: hidden;">
				<div class="eq-parent-header" style="background: var(--primary-tint); padding: 1.5rem; display:flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border);">
					<div style="display:flex; gap:1.5rem; align-items:center;">
						{#if parent.image_url}<img src={parent.image_url} alt="" style="height: 5rem; width: 5rem; object-fit: cover; border-radius: 8px;" />{/if}
						<div>
							<h3 style="margin:0;">{parent.title}</h3>
							<small style="color:#666;">{parent.description || 'Fără descriere'}</small>
						</div>
					</div>
					<div style="display:flex; gap:0.5rem;">
						<button class="buton-primar" style="font-size: 1.2rem; padding: 0.5rem 1rem;" onclick={() => deschideEq(null, parent.id)}>+ Produs</button>
						<button class="btn-icon" onclick={() => deschideEq(parent)}>✏️</button>
						<button class="btn-icon btn-sterge" onclick={() => stergeEq(parent.id)}>🗑️</button>
					</div>
				</div>
				<div class="eq-sub-items" style="padding: 1.5rem; display:grid; grid-template-columns: repeat(auto-fill, minmax(25rem, 1fr)); gap: 1rem;">
					{#each echipament.filter((e) => e.parent_id === parent.id) as sub}
						<div class="stat-card" style="flex-direction: row; gap: 1rem; align-items: center; padding: 1rem; background: #fdfdfd;">
							{#if sub.image_url}<img src={sub.image_url} alt="" style="height: 6rem; width: 6rem; object-fit: cover; border-radius: 6px;" />{/if}
							<div style="flex: 1;">
								<h4 style="margin:0; font-size: 1.4rem;">{sub.title}</h4>
								<div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
									<button class="btn-icon" style="padding:0.3rem;" onclick={() => deschideEq(sub)}>✏️</button>
									<button class="btn-icon btn-sterge" style="padding:0.3rem;" onclick={() => stergeEq(sub.id)}>🗑️</button>
								</div>
							</div>
						</div>
					{:else}
						<p style="grid-column: 1/-1; text-align: center; color: #bbb; font-style: italic;">Niciun produs adăugat.</p>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

{#if showEqModal}
	<div class="modal-overlay">
		<div class="login-card" style="max-width: 60rem;">
			<h2>{editMode ? 'Editează' : 'Adaugă'} {eqCurent.parent_id ? 'Produs' : 'Secțiune'}</h2>
			<form onsubmit={salveazaEq}>
				<div class="camp"><label>Denumire</label><input bind:value={eqCurent.title} required /></div>
				<div class="camp"><label>Descriere</label><textarea bind:value={eqCurent.description} style="width:100%; height:8rem; border-radius:9px; border:1px solid var(--border); padding:1rem;"></textarea></div>

				<div class="form-row-2col">
					<div class="camp">
						<label>Categorie</label>
						<select bind:value={eqCurent.category} style="width:100%; padding:1.2rem; border-radius:9px; border:1px solid var(--border);">
							<option value="Armament">Armament</option><option value="Protectie">Protecție</option><option value="Accesorii">Accesorii</option><option value="Sub-item">Produs</option>
						</select>
					</div>
					<div class="camp"><label>Ordine</label><input type="number" bind:value={eqCurent.order} /></div>
				</div>

				<div class="camp"><label>Imagine</label><input type="file" accept="image/*" onchange={onFileSelected} /></div>
				{#if eqCurent.image_url}<img src={eqCurent.image_url} alt="" style="width:100%; height:12rem; object-fit:cover; border-radius:8px; margin-bottom:1rem;" />{/if}

				<div style="display:flex; gap: 1rem; margin-top: 2rem;">
					<button type="button" class="buton-iesire" style="flex: 1" onclick={() => (showEqModal = false)}>Anulează</button>
					<button type="submit" class="buton-primar" style="flex: 2">Salvează</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if cropImage}
	<div class="modal-overlay" style="z-index: 2000;">
		<div class="login-card" style="max-width: 80rem; height: 80vh; display: flex; flex-direction: column;">
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
