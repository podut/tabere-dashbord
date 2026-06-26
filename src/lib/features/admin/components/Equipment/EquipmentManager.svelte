<script lang="ts">
	import { supabase, STORAGE_BUCKET } from '$lib/supabase';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import type { Equipment } from '$lib/types';
	import EquipmentMobileCard from './view/EquipmentMobileCard.svelte';
	import EquipmentModal from './EquipmentModal.svelte';
	import CropModal from '../Shared/CropModal.svelte';

	let { echipament = $bindable([]), refreshEquipment }: { 
		echipament: Equipment[],
		refreshEquipment: () => Promise<void>
	} = $props();

	let showEqModal = $state(false);
	let editMode = $state(false);
	let incarcareFoto = $state(false);
	let cropImage = $state<string | null>(null);

	let eqCurent = $state<any>({
		id: '',
		title: '',
		description: '',
		image_url: '',
		category: 'Armament',
		order: 0,
		parent_id: null
	});

	let parents = $derived(echipament ? echipament.filter((e) => !e.parent_id) : []);

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
            parent_id: (eqCurent.parent_id === 'null' || eqCurent.parent_id === '' || !eqCurent.parent_id) ? null : eqCurent.parent_id
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
		if (!(await confirmDialog({
			title: 'Ștergi elementul?',
			message: 'Acțiunea este ireversibilă.',
			confirmLabel: 'Șterge',
			danger: true
		}))) return;

		const { error } = await supabase.from('equipment').delete().eq('id', id);
		if (!error) {
			await refreshEquipment();
			showToast('success', 'Șters.');
		} else {
			showToast('error', error.message);
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

	async function handleFinalizeCrop(blob: Blob) {
		incarcareFoto = true;
		try {
			const fileName = `equipment/${Date.now()}.jpg`;
			const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, blob);
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
	<div class="actiuni-pagina" style="display:flex; justify-content: flex-end; margin-bottom: 2.4rem;">
		<button class="buton-primar" onclick={() => deschideEq()}>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
			Secțiune Nouă
		</button>
	</div>

	<div class="equipment-hierarchy">
		{#each parents as parent}
			<div class="eq-parent-section">
				<div class="eq-parent-header">
					<div class="eq-parent-info">
						{#if parent.image_url}<img src={parent.image_url} alt="" class="eq-parent-img" />{/if}
						<div class="eq-parent-titles">
							<h3>{parent.title}</h3>
							<p class="eq-parent-desc">{parent.description || 'Fără descriere'}</p>
						</div>
					</div>
					<div class="eq-parent-actions">
						<button class="buton-primar btn-sm" onclick={() => deschideEq(null, parent.id)}>+ Produs</button>
						<button class="btn-icon" onclick={() => deschideEq(parent)} title="Editează Secțiune">
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
						</button>
						<button class="btn-icon btn-sterge" onclick={() => stergeEq(parent.id)} title="Șterge Secțiune">
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
						</button>
					</div>
				</div>
				<div class="eq-sub-items">
					{#each echipament.filter((e) => e.parent_id === parent.id) as sub}
						<!-- Desktop View -->
						<div class="eq-sub-card desktop-only">
							{#if sub.image_url}<img src={sub.image_url} alt="" class="eq-sub-img" />{/if}
							<div class="eq-sub-info">
								<h4>{sub.title}</h4>
								<div class="eq-sub-actions">
									<button class="btn-icon btn-xs" onclick={() => deschideEq(sub)} title="Editează">
										<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
									</button>
									<button class="btn-icon btn-sterge btn-xs" onclick={() => stergeEq(sub.id)} title="Șterge">
										<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
									</button>
								</div>
							</div>
						</div>

						<!-- Mobile View -->
						<div class="mobile-only">
							<EquipmentMobileCard {sub} onEdit={deschideEq} onDelete={stergeEq} />
						</div>
					{:else}
						<p class="empty-state">Niciun produs adăugat în această secțiune.</p>
					{/each}
				</div>
			</div>
		{:else}
			<div class="empty-state-global">
				<p>Nu există nicio secțiune de echipament definită.</p>
				<button class="buton-primar" onclick={() => deschideEq()}>Adaugă prima secțiune</button>
			</div>
		{/each}
	</div>
</div>

{#if showEqModal}
	<EquipmentModal
		bind:eq={eqCurent}
		{editMode}
		onClose={() => (showEqModal = false)}
		onSave={salveazaEq}
		{onFileSelected}
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
	.eq-parent-section {
		background: var(--bg-card);
		border-radius: 16px;
		border: 1px solid var(--border);
		margin-bottom: 3.2rem;
		overflow: hidden;
		box-shadow: 0 10px 30px rgba(0,0,0,0.2);
	}

	.eq-parent-header {
		background: linear-gradient(to right, var(--primary-tint), transparent);
		padding: 2rem 2.4rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--border);
	}

	.eq-parent-info {
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	.eq-parent-img {
		height: 6rem;
		width: 6rem;
		object-fit: cover;
		border-radius: 12px;
		border: 1px solid var(--border-strong);
	}

	.eq-parent-titles h3 {
		font-size: 1.8rem;
		color: var(--primary);
		margin: 0;
		font-weight: 700;
	}

	.eq-parent-desc {
		font-size: 1.3rem;
		color: var(--text-grey);
		margin: 0.2rem 0 0 0;
	}

	.eq-parent-actions {
		display: flex;
		gap: 0.8rem;
		align-items: center;
	}

	.eq-sub-items {
		padding: 2rem 2.4rem;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(28rem, 1fr));
		gap: 1.6rem;
		background: rgba(0,0,0,0.15);
	}

	.eq-sub-card {
		background: var(--bg-dark);
		border-radius: 12px;
		border: 1px solid var(--border);
		padding: 1.2rem;
		display: flex;
		gap: 1.2rem;
		align-items: center;
		transition: all 0.2s;
	}

	.eq-sub-card:hover {
		border-color: var(--primary);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0,0,0,0.3);
	}

	.eq-sub-img {
		height: 6.4rem;
		width: 6.4rem;
		object-fit: cover;
		border-radius: 8px;
		background: var(--bg-card);
	}

	.eq-sub-info {
		flex: 1;
		min-width: 0;
	}

	.eq-sub-info h4 {
		font-size: 1.4rem;
		font-weight: 600;
		color: var(--text);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.eq-sub-actions {
		margin-top: 0.6rem;
		display: flex;
		gap: 0.6rem;
	}

	.btn-sm { padding: 0.6rem 1.2rem; font-size: 1.25rem; }
	.btn-xs { padding: 0.4rem; }

	.empty-state {
		grid-column: 1/-1;
		text-align: center;
		color: var(--text-grey);
		font-style: italic;
		padding: 2rem;
		font-size: 1.3rem;
	}

	.empty-state-global {
		text-align: center;
		padding: 8rem 2rem;
		background: var(--bg-card);
		border-radius: 20px;
		border: 1px dashed var(--border-strong);
	}
	.empty-state-global p { font-size: 1.6rem; color: var(--text-grey); margin-bottom: 2rem; }

	.mobile-only { display: none; }
	.desktop-only { display: flex; }

	@media (max-width: 768px) {
		.desktop-only { display: none !important; }
		.mobile-only { display: block; width: 100%; }
		.eq-sub-items { grid-template-columns: 1fr !important; padding: 1.2rem !important; }
		.eq-parent-header { flex-direction: column; align-items: flex-start; gap: 1.6rem; }
		.eq-parent-actions { width: 100%; justify-content: space-between; }
	}
</style>
