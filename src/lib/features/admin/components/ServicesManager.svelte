<script lang="ts">
	import { supabase, STORAGE_BUCKET } from '$lib/supabase';
	import Cropper from 'svelte-easy-crop';
	import { getCroppedImg } from '$lib/utils/image';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import type { Service, Partner } from '$lib/types';

	let { servicii = $bindable([]), parteneri = $bindable([]), refreshServices, refreshPartners }: {
        servicii: Service[],
        parteneri: Partner[],
        refreshServices: () => Promise<void>,
        refreshPartners: () => Promise<void>
    } = $props();

	const CATEGORII = ['General', 'Inchiriere', 'Service', 'Evenimente', 'Antrenament'];

    let subSectiune = $state('servicii');
	let showServModal = $state(false);
	let showPartnerModal = $state(false);
	let editMode = $state(false);

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
	let crop = $state({ x: 0, y: 0 });
	let zoom = $state(1);
	let croppedAreaPixels = $state<any>(null);
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

	async function finalizeazaCrop() {
		if (!cropImage || !croppedAreaPixels) return;
		incarcareFoto = true;
		try {
			const blob = await getCroppedImg(cropImage, croppedAreaPixels);
			if (!blob) throw new Error('Eroare la procesare.');
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
        <div class="table-scroll srv-table-container">
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
        <div class="table-scroll srv-table-container">
            <table>
                <thead><tr><th>Img</th><th>Nume</th><th>Website</th><th>Ordine</th><th>Acțiuni</th></tr></thead>
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
	<div class="modal-overlay">
		<div class="login-card modal-serviciu">
			<h2 style="margin-bottom: 2.4rem;">{editMode ? 'Editează' : 'Adaugă'} Serviciu</h2>
			<form onsubmit={salveazaServiciu}>

				<!-- Secțiunea 1: Informații de bază -->
				<div class="sectiune-form">
					<div class="sectiune-titlu">Informații de bază</div>
					<div class="form-row-2col">
						<div class="camp" style="flex:2">
							<label>Titlu *</label>
							<input bind:value={serviciuCurent.title} required placeholder="ex: Închiriere Echipament Complet" />
						</div>
						<div class="camp" style="flex:1">
							<label>Etichetă (tag)</label>
							<input bind:value={serviciuCurent.tag} placeholder="ex: Popular, Nou" />
						</div>
					</div>
					<div class="form-row-3col">
						<div class="camp">
							<label>Categorie</label>
							<select bind:value={serviciuCurent.category}>
								{#each CATEGORII as cat}
									<option value={cat}>{cat}</option>
								{/each}
							</select>
						</div>
						<div class="camp">
							<label>Ordine afișare</label>
							<input type="number" bind:value={serviciuCurent.order} min="0" />
						</div>
						<div class="camp camp-toggle">
							<label>Activ</label>
							<label class="toggle">
								<input type="checkbox" bind:checked={serviciuCurent.active} />
								<span class="slider"></span>
							</label>
						</div>
					</div>
				</div>

				<!-- Secțiunea 2: Preț & Disponibilitate -->
				<div class="sectiune-form">
					<div class="sectiune-titlu">Preț & Disponibilitate</div>
					<div class="form-row-3col">
						<div class="camp">
							<label>Preț (RON) *</label>
							<input type="number" bind:value={serviciuCurent.price} min="0" step="0.01" required />
						</div>
						<div class="camp">
							<label>Label preț</label>
							<input bind:value={serviciuCurent.price_label} placeholder="ex: 120 RON / sesiune" />
						</div>
						<div class="camp">
							<label>Durată</label>
							<input bind:value={serviciuCurent.duration} placeholder="ex: 4-6 ore" />
						</div>
					</div>
					<div class="form-row-2col">
						<div class="camp">
							<label>Vârstă țintă</label>
							<input bind:value={serviciuCurent.age_target} placeholder="ex: 14+ ani" />
						</div>
						<div class="camp">
							<label>Capacitate</label>
							<input bind:value={serviciuCurent.capacity} placeholder="ex: 10-30 persoane" />
						</div>
					</div>
				</div>

				<!-- Secțiunea 3: Descrieri -->
				<div class="sectiune-form">
					<div class="sectiune-titlu">Descrieri</div>
					<div class="camp">
						<label>Descriere scurtă <span class="hint">(afișată pe card)</span></label>
						<textarea bind:value={serviciuCurent.short_desc} rows="2" placeholder="1-2 rânduri, vizibile pe cardul serviciului"></textarea>
					</div>
					<div class="camp">
						<label>Descriere</label>
						<textarea bind:value={serviciuCurent.description} rows="3" placeholder="Descriere generală a serviciului"></textarea>
					</div>
					<div class="camp">
						<label>Descriere completă <span class="hint">(pagina de detalii)</span></label>
						<textarea bind:value={serviciuCurent.full_desc} rows="4" placeholder="Text detaliat afișat pe pagina serviciului"></textarea>
					</div>
				</div>

				<!-- Secțiunea 4: Media -->
				<div class="sectiune-form">
					<div class="sectiune-titlu">Media</div>
					<div class="camp">
						<label>Imagine principală</label>
						<label class="upload-zone">
							<input type="file" accept="image/*" onchange={onFotoSelectata} style="display:none" />
							{#if serviciuCurent.image_url}
								<img src={serviciuCurent.image_url} alt="preview" class="img-preview-full" />
								<span class="upload-overlay">Schimbă imaginea</span>
							{:else}
								<div class="upload-placeholder">
									<span class="upload-icon">📷</span>
									<span>Apasă pentru a încărca imaginea principală</span>
									<small>16:9 recomandat</small>
								</div>
							{/if}
						</label>
					</div>
					<div class="camp">
						<label>Galerie imagini
							{#if incarcareGalerie}<span class="hint"> — se încarcă...</span>{/if}
						</label>
						<label class="upload-zone upload-zone-sm">
							<input type="file" accept="image/*" multiple onchange={onFotoGalerieSelectata} style="display:none" />
							<span class="upload-icon">🖼️</span>
							<span>Adaugă imagini în galerie (multiple)</span>
						</label>
						<div class="chips">
							{#each serviciuCurent.gallery as url, i}
								<span class="chip chip-img">
									<img src={url} alt="" />
									<button type="button" onclick={() => stergedinArray('gallery', i)}>×</button>
								</span>
							{/each}
						</div>
					</div>
				</div>

				<!-- Secțiunea 5: Ce include & Poziții -->
				<div class="sectiune-form">
					<div class="sectiune-titlu">Ce include & Poziții</div>
					<div class="form-row-2col">
						<div class="camp">
							<label>Ce include</label>
							<div class="array-input">
								<input
									bind:value={inputIncludes}
									placeholder="ex: Mască protecție, apasă Enter"
									onkeydown={(e) => handleArrayKeydown(e, 'includes', inputIncludes)}
								/>
								<button type="button" class="btn-adauga" onclick={() => adaugaInArray('includes', inputIncludes)}>+</button>
							</div>
							<div class="chips">
								{#each serviciuCurent.includes as item, i}
									<span class="chip">
										{item}
										<button type="button" onclick={() => stergedinArray('includes', i)}>×</button>
									</span>
								{/each}
							</div>
						</div>
						<div class="camp">
							<label>Poziții disponibile</label>
							<div class="array-input">
								<input
									bind:value={inputPositions}
									placeholder="ex: Sniper, apasă Enter"
									onkeydown={(e) => handleArrayKeydown(e, 'positions', inputPositions)}
								/>
								<button type="button" class="btn-adauga" onclick={() => adaugaInArray('positions', inputPositions)}>+</button>
							</div>
							<div class="chips">
								{#each serviciuCurent.positions as pos, i}
									<span class="chip">
										{pos}
										<button type="button" onclick={() => stergedinArray('positions', i)}>×</button>
									</span>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<div style="display:flex; gap:1.2rem; margin-top:2.4rem;">
					<button type="button" class="buton-iesire" style="flex:1" onclick={() => (showServModal = false)}>Anulează</button>
					<button type="submit" class="buton-primar" style="flex:2">Salvează Serviciu</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if cropImage}
	<div class="modal-overlay" style="z-index: 2000;">
		<div class="login-card" style="max-width: 90rem; height: 80vh; display: flex; flex-direction: column;">
			<h2>Decupează Imaginea</h2>
			<div style="flex: 1; position: relative; background: #222; border-radius: 12px; overflow: hidden; margin-bottom: 2rem;">
				<Cropper image={cropImage} bind:crop bind:zoom aspect={16/9} oncropcomplete={({ pixels }) => (croppedAreaPixels = pixels)} />
			</div>
			<div style="display: flex; gap: 1rem;">
				<button class="buton-iesire" style="flex: 1" onclick={() => cropImage = null}>Anulează</button>
				<button class="buton-primar" style="flex: 2" onclick={finalizeazaCrop} disabled={incarcareFoto}>
					{incarcareFoto ? 'Se salvează...' : 'Finalizează'}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showPartnerModal}
	<div class="modal-overlay"><div class="login-card" style="max-width: 55rem;">
        <h2>{editMode ? 'Editează' : 'Adaugă'} Partener</h2>
        <form onsubmit={salveazaPartener}>
            <div class="camp"><label>Nume Partener</label><input bind:value={partenerCurent.name} required /></div>
            <div class="camp"><label>Website URL</label><input type="url" bind:value={partenerCurent.website} placeholder="https://..." /></div>
            <div style="display:flex; gap:1.2rem; margin-top:2.4rem;">
				<button type="button" class="buton-iesire" style="flex:1" onclick={() => (showPartnerModal = false)}>Anulează</button>
				<button type="submit" class="buton-primar" style="flex:2">Salvează Partener</button>
			</div>
        </form>
    </div></div>
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

	/* Modal serviciu */
	.modal-serviciu { max-width: 75rem !important; max-height: 90vh; overflow-y: auto; }

	.sectiune-form { border: 1px solid var(--border); border-radius: 12px; padding: 2rem; margin-bottom: 2.4rem; background: var(--bg-dark); }
	.sectiune-titlu { font-size: 1.2rem; font-weight: 800; color: var(--primary); margin-bottom: 1.6rem; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; }

	.form-row-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.6rem; }
	.form-row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.6rem; }

	.hint { font-size: 1.15rem; color: var(--text-grey); font-weight: 400; font-style: italic; }

	textarea, input:not([type="checkbox"]), select { width: 100%; padding: 1.2rem; border: 1px solid var(--border); border-radius: 10px; font-family: inherit; font-size: 1.45rem; background: var(--bg-card); color: var(--text); }
	textarea:focus, input:not([type="checkbox"]):focus, select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-tint); }

	/* Toggle switch */
	.camp-toggle { display: flex; flex-direction: column; gap: 0.8rem; align-items: flex-start; }
	.toggle { position: relative; display: inline-block; width: 5.2rem; height: 2.8rem; }
	.toggle input { opacity: 0; width: 0; height: 0; }
	.slider { position: absolute; inset: 0; background: var(--border-strong); border-radius: 3rem; cursor: pointer; transition: 0.3s; }
	.slider::before { content: ''; position: absolute; height: 2rem; width: 2rem; left: 4px; bottom: 4px; background: white; border-radius: 50%; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
	input:checked + .slider { background: var(--primary); }
	input:checked + .slider::before { transform: translateX(2.4rem); }

	/* Array inputs */
	.array-input { display: flex; gap: 0.8rem; }
	.array-input input { flex: 1; }
	.btn-adauga { padding: 0 1.8rem; background: var(--primary); color: var(--bg-dark); border: none; border-radius: 10px; font-size: 2.2rem; cursor: pointer; line-height: 1; font-weight: 800; }

	.chips { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-top: 1rem; }
	.chip { display: inline-flex; align-items: center; gap: 0.6rem; padding: 0.5rem 1.2rem; background: var(--bg-card); border-radius: 8px; font-size: 1.3rem; border: 1px solid var(--border); font-weight: 600; }
	.chip button { background: none; border: none; cursor: pointer; font-size: 1.8rem; color: var(--text-grey); padding: 0; line-height: 1; display: flex; align-items: center; }
	.chip button:hover { color: var(--danger); }
	.chip-img { padding: 0.4rem; }
	.chip-img img { height: 3.2rem; width: 4.8rem; object-fit: cover; border-radius: 4px; border: 1px solid var(--border); }

	/* Upload zone */
	.upload-zone { display: block; position: relative; border: 2px dashed var(--border-strong); border-radius: 14px; cursor: pointer; overflow: hidden; transition: all 0.2s; background: var(--bg-card); }
	.upload-zone:hover { border-color: var(--primary); background: var(--primary-tint); }
	.upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3.2rem; color: var(--text-grey); font-size: 1.45rem; text-align: center; }
	.upload-placeholder small { font-size: 1.2rem; opacity: 0.7; }
	.upload-icon { font-size: 3.2rem; }
	.upload-zone-sm .upload-placeholder, .upload-zone-sm { padding: 1.6rem; }
	.upload-zone-sm { display: flex; align-items: center; gap: 1.2rem; font-size: 1.35rem; color: var(--text-grey); font-weight: 600; }
	.img-preview-full { display: block; width: 100%; max-height: 22rem; object-fit: cover; }
	.upload-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; opacity: 0; transition: opacity 0.2s; backdrop-filter: blur(4px); }
	.upload-zone:hover .upload-overlay { opacity: 1; }
</style>
