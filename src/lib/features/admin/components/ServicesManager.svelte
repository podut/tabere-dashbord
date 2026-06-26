<script lang="ts">
	import { supabase, STORAGE_BUCKET } from '$lib/supabase';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import type { Service, Partner } from '$lib/types';
	import ServiceMobileCard from './Services/view/ServiceMobileCard.svelte';
	import PartnerMobileCard from './Services/view/PartnerMobileCard.svelte';
	import ServiceModal from './Services/ServiceModal.svelte';
	import PartnerModal from './Services/PartnerModal.svelte';
	import CropModal from './Shared/CropModal.svelte';

	let { servicii = $bindable([]), parteneri = $bindable([]), refreshServices, refreshPartners }: {
        servicii: Service[],
        parteneri: Partner[],
        refreshServices: () => Promise<void>,
        refreshPartners: () => Promise<void>
    } = $props();

    let subSectiune = $state('servicii');
	let showServModal = $state(false);
	let showPartnerModal = $state(false);
	let editMode = $state(false);

	// Categorii din DB + fallback defaults
	let categoriiExistente = $state<string[]>(['General', 'Inchiriere', 'Service', 'Evenimente', 'Antrenament']);

	async function incarcaCategorii() {
		try {
			const { data } = await supabase
				.from('services')
				.select('category')
				.not('category', 'is', null);
			if (data) {
				const dinDb = [...new Set((data as { category: string }[]).map(r => r.category).filter(Boolean))];
				const noi = dinDb.filter(c => !categoriiExistente.includes(c));
				categoriiExistente = [...new Set([...categoriiExistente, ...noi])];
			}
		} catch (_) { /* pastreaza defaults */ }
	}

	$effect(() => { incarcaCategorii(); });

	const serviciuGol = () => ({
		id: '', title: '', short_desc: '', description: '', full_desc: '',
		tag: '', price: 0, price_label: '', duration: '4-6 ore',
		age_target: '', capacity: '', category: 'General',
		image_url: '', gallery: [] as string[], includes: [] as string[],
		positions: [] as string[], active: true, order: 0
	});

	let serviciuCurent = $state<any>(serviciuGol());
	let partenerCurent = $state<any>({ id: '', name: '', website: '', image_url: '', order: 0 });

	// Inputuri temporare pentru includes/positions
	let inputIncludes = $state('');
	let inputPositions = $state('');

	// Crop imagine principală
	let cropImage = $state<string | null>(null);
	let incarcareFoto = $state(false);
	let incarcareGalerie = $state(false);

	function deschideServiciu(s: any = null) {
		editMode = !!s;
		serviciuCurent = s
			? { ...s, gallery: [...(s.gallery ?? [])], includes: [...(s.includes ?? [])], positions: [...(s.positions ?? [])] }
			: serviciuGol();
		inputIncludes = '';
		inputPositions = '';
		showServModal = true;
	}

	function deschidePartner(p: any = null) {
		editMode = !!p;
		partenerCurent = p ? { ...p } : { name: '', website: '', image_url: '', order: 0 };
		showPartnerModal = true;
	}

	function onFotoSelectata(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			const reader = new FileReader();
			reader.onload = () => { cropImage = reader.result as string; };
			reader.readAsDataURL(target.files[0]);
			target.value = '';
		}
	}

	async function finalizeazaCrop(blob: Blob) {
		incarcareFoto = true;
		try {
			const fileName = `services/${Date.now()}.jpg`;
			const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, blob);
			if (uploadError) throw uploadError;
			const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
			serviciuCurent.image_url = data.publicUrl;
			cropImage = null;
		} catch (err: any) {
			showToast('error', err.message);
		} finally {
			incarcareFoto = false;
		}
	}

	async function onFotoGalerieSelectata(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;
		incarcareGalerie = true;
		try {
			for (const file of Array.from(target.files)) {
				const fileName = `services/gallery/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
				const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file);
				if (uploadError) throw uploadError;
				const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
				serviciuCurent.gallery = [...serviciuCurent.gallery, data.publicUrl];
			}
		} catch (err: any) {
			showToast('error', err.message);
		} finally {
			incarcareGalerie = false;
			target.value = '';
		}
	}

	function adaugaInArray(camp: 'includes' | 'positions', valoare: string) {
		const v = valoare.trim();
		if (!v) return;
		serviciuCurent[camp] = [...serviciuCurent[camp], v];
		if (camp === 'includes') inputIncludes = '';
		if (camp === 'positions') inputPositions = '';
	}

	function stergedinArray(camp: 'gallery' | 'includes' | 'positions', idx: number) {
		serviciuCurent[camp] = serviciuCurent[camp].filter((_: any, i: number) => i !== idx);
	}

	function handleArrayKeydown(e: KeyboardEvent, camp: 'includes' | 'positions', valoare: string) {
		if (e.key === 'Enter') { e.preventDefault(); adaugaInArray(camp, valoare); }
	}

	async function salveazaServiciu(e: SubmitEvent) {
		e.preventDefault();
		const payload = { ...serviciuCurent };
		if (editMode) delete payload.id;
		const { error } = editMode
			? await supabase.from('services').update(payload).eq('id', serviciuCurent.id)
			: await supabase.from('services').insert([serviciuCurent]);
		if (!error) { showServModal = false; await refreshServices(); showToast('success', 'Serviciu salvat.'); }
		else showToast('error', error.message);
	}

	async function salveazaPartener(e: SubmitEvent) {
		e.preventDefault();
		const { error } = editMode
			? await supabase.from('partners').update(partenerCurent).eq('id', partenerCurent.id)
			: await supabase.from('partners').insert([partenerCurent]);
		if (!error) { showPartnerModal = false; await refreshPartners(); showToast('success', 'Partener salvat.'); }
		else showToast('error', error.message);
	}

    async function stergeElement(tabela: string, id: string) {
        if (await confirmDialog({ title: 'Stergi?', message: 'Esti sigur?', confirmLabel: 'Sterge', danger: true })) {
            const { error } = await supabase.from(tabela as any).delete().eq('id', id);
            if (!error) {
                if (tabela === 'services') await refreshServices();
                else await refreshPartners();
                showToast('success', 'Sters.');
            }
        }
    }
</script>

<div class="services-manager">
    <div class="tabs-intern-servicii">
        <button class="tab-item-srv" class:activ={subSectiune === 'servicii'} onclick={() => subSectiune = 'servicii'}>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.6rem;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
			Servicii
		</button>
        <button class="tab-item-srv" class:activ={subSectiune === 'parteneri'} onclick={() => subSectiune = 'parteneri'}>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.6rem;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
			Parteneri
		</button>
    </div>

    {#if subSectiune === 'servicii'}
        <div class="actiuni-pagina" style="display:flex; justify-content: flex-end; margin-bottom: 2.4rem;">
            <button class="buton-primar" onclick={() => deschideServiciu()}>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
				Serviciu Nou
			</button>
        </div>

		<!-- Mobile View -->
		<div class="mobile-only-grid">
			{#each servicii as s}
				<ServiceMobileCard {s} onEdit={deschideServiciu} onDelete={(id) => stergeElement('services', id)} />
			{:else}
				<div class="td-gol">Niciun serviciu definit.</div>
			{/each}
		</div>

        <div class="table-scroll srv-table-container desktop-only-table">
            <table>
                <thead><tr><th>Img</th><th>Titlu</th><th>Preț</th><th>Categorie</th><th>Acțiuni</th></tr></thead>
                <tbody>
                    {#each servicii as s}
                        <tr>
                            <td class="col-img"><img src={s.image_url} alt="" class="srv-img-thumb" /></td>
                            <td><strong class="srv-name">{s.title}</strong></td>
                            <td class="col-price">{s.price} {s.price_label || 'RON'}</td>
                            <td><span class="badge-tip">{s.category}</span></td>
                            <td>
								<div class="actiuni-celula">
									<button class="btn-icon" onclick={() => deschideServiciu(s)} title="Editează">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
									</button>
									<button class="btn-icon btn-sterge" onclick={() => stergeElement('services', s.id)} title="Șterge">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
									</button>
								</div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {:else}
        <div class="actiuni-pagina" style="display:flex; justify-content: flex-end; margin-bottom: 2.4rem;">
            <button class="buton-primar" onclick={() => deschidePartner()}>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
				Partener Nou
			</button>
			</div>

			<!-- Mobile View -->
			<div class="mobile-only-grid">
			{#each parteneri as p}
			<PartnerMobileCard {p} onEdit={deschidePartner} onDelete={(id) => stergeElement('partners', id)} />
			{:else}
			<div class="td-gol">Niciun partener definit.</div>
			{/each}
			</div>

			<div class="table-scroll srv-table-container desktop-only-table">
			<table>                <thead><tr><th>Img</th><th>Nume</th><th>Website</th><th>Ordine</th><th>Acțiuni</th></tr></thead>
                <tbody>
                    {#each parteneri as p}
                        <tr>
                            <td class="col-img"><img src={p.image_url} alt="" class="srv-img-thumb" /></td>
                            <td><strong class="srv-name">{p.name}</strong></td>
                            <td><a href={p.website} target="_blank" class="srv-link">{p.website}</a></td>
                            <td style="text-align:center;"><span class="badge-count">{p.order}</span></td>
                            <td>
								<div class="actiuni-celula">
									<button class="btn-icon" onclick={() => deschidePartner(p)} title="Editează">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
									</button>
									<button class="btn-icon btn-sterge" onclick={() => stergeElement('partners', p.id)} title="Șterge">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
									</button>
								</div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

{#if showServModal}
	<ServiceModal
		bind:service={serviciuCurent}
		{editMode}
		{categoriiExistente}
		onClose={() => (showServModal = false)}
		onSave={salveazaServiciu}
		{onFotoSelectata}
		{onFotoGalerieSelectata}
		{stergedinArray}
		{adaugaInArray}
		{handleArrayKeydown}
		bind:inputIncludes
		bind:inputPositions
		{incarcareGalerie}
	/>
{/if}

{#if cropImage}
	<CropModal
		{cropImage}
		aspect={16/9}
		saving={incarcareFoto}
		onFinish={finalizeazaCrop}
		onCancel={() => (cropImage = null)}
	/>
{/if}

{#if showPartnerModal}
	<PartnerModal
		bind:partner={partenerCurent}
		{editMode}
		onClose={() => (showPartnerModal = false)}
		onSave={salveazaPartener}
	/>
{/if}

<style>
	.tabs-intern-servicii { display: flex; background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 12px; border: 1px solid var(--border); gap: 0.5rem; margin-bottom: 2.4rem; width: fit-content; }
	
	.tab-item-srv {
		background: none; border: none; padding: 1rem 2.4rem; font-size: 1.45rem; font-weight: 700; color: var(--text-grey); cursor: pointer; border-radius: 8px; transition: all 0.2s; font-family: inherit; display: flex; align-items: center;
	}
	.tab-item-srv.activ { background: var(--bg-card); color: var(--primary); box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1px solid var(--border); }
	.tab-item-srv:hover:not(.activ) { background: rgba(255,255,255,0.05); color: var(--text); }

	.srv-table-container { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.25); overflow: hidden; }

	.srv-img-thumb { height: 4.4rem; width: 4.4rem; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-strong); }
	.srv-name { font-size: 1.5rem; color: var(--text); }
	.col-price { font-weight: 700; color: var(--primary); font-size: 1.5rem; }
	.badge-tip { background: var(--primary-tint); color: var(--primary); padding: 0.2rem 0.8rem; border-radius: 4px; font-size: 1.1rem; font-weight: 700; text-transform: uppercase; border: 1px solid rgba(197, 160, 48, 0.2); }
	.badge-count { background: var(--bg-dark); padding: 0.3rem 0.8rem; border-radius: 4px; font-weight: 700; font-size: 1.2rem; }
	.srv-link { color: var(--accent-blue); text-decoration: none; font-size: 1.3rem; }
	.srv-link:hover { text-decoration: underline; }
	.actiuni-celula { display: flex; gap: 0.6rem; }

	.td-gol { text-align: center; padding: 6rem; color: var(--text-grey); font-size: 1.5rem; font-style: italic; }

	.mobile-only-grid { display: none; }

	@media (max-width: 768px) {
		.desktop-only-table { display: none; }
		.mobile-only-grid { display: block; padding: 0.5rem; }
		.tabs-intern-servicii { width: 100%; justify-content: space-between; }
		.tab-item-srv { flex: 1; justify-content: center; padding: 1rem; }
	}
</style>
