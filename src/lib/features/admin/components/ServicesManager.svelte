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
    <div class="tabs-intern" style="display:flex; gap:1rem; margin-bottom:2rem;">
        <button class="tab-item" class:activ={subSectiune === 'servicii'} onclick={() => subSectiune = 'servicii'}>🛠️ Servicii</button>
        <button class="tab-item" class:activ={subSectiune === 'parteneri'} onclick={() => subSectiune = 'parteneri'}>🤝 Parteneri</button>
    </div>

    {#if subSectiune === 'servicii'}
        <div class="actiuni-pagina" style="display:flex; justify-content: flex-end; margin-bottom: 2rem;">
            <button class="buton-primar" onclick={() => deschideServiciu()}>+ Serviciu Nou</button>
        </div>
        <div class="table-scroll" style="background: white; border-radius: 12px; border: 1px solid var(--border);">
            <table>
                <thead><tr><th>Img</th><th>Titlu</th><th>Preț</th><th>Categorie</th><th>Acțiuni</th></tr></thead>
                <tbody>
                    {#each servicii as s}
                        <tr>
                            <td><img src={s.image_url} alt="" style="height:3.6rem; border-radius:4px;" /></td>
                            <td><strong>{s.title}</strong></td>
                            <td>{s.price} {s.price_label}</td>
                            <td>{s.category}</td>
                            <td>
                                <button class="btn-icon" onclick={() => deschideServiciu(s)}>✏️</button>
                                <button class="btn-icon btn-sterge" onclick={() => stergeElement('services', s.id)}>🗑️</button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {:else}
        <div class="actiuni-pagina" style="display:flex; justify-content: flex-end; margin-bottom: 2rem;">
            <button class="buton-primar" onclick={() => deschidePartner()}>+ Partener Nou</button>
        </div>
        <div class="table-scroll" style="background: white; border-radius: 12px; border: 1px solid var(--border);">
            <table>
                <thead><tr><th>Img</th><th>Nume</th><th>Website</th><th>Ordine</th><th>Acțiuni</th></tr></thead>
                <tbody>
                    {#each parteneri as p}
                        <tr>
                            <td><img src={p.image_url} alt="" style="height:3.6rem; border-radius:4px;" /></td>
                            <td><strong>{p.name}</strong></td>
                            <td><a href={p.website} target="_blank">{p.website}</a></td>
                            <td>{p.order}</td>
                            <td>
                                <button class="btn-icon" onclick={() => deschidePartner(p)}>✏️</button>
                                <button class="btn-icon btn-sterge" onclick={() => stergeElement('partners', p.id)}>🗑️</button>
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
			<h2>{editMode ? 'Editează' : 'Adaugă'} Serviciu</h2>
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

				<div style="display:flex; gap:1rem; margin-top:2rem;">
					<button type="button" class="buton-iesire" style="flex:1" onclick={() => (showServModal = false)}>Anulează</button>
					<button type="submit" class="buton-primar" style="flex:2">Salvează</button>
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
	<div class="modal-overlay"><div class="login-card" style="max-width: 50rem;">
        <h2>{editMode ? 'Editează' : 'Adaugă'} Partener</h2>
        <form onsubmit={salveazaPartener}>
            <div class="camp"><label>Nume</label><input bind:value={partenerCurent.name} required /></div>
            <div class="camp"><label>Website URL</label><input type="url" bind:value={partenerCurent.website} /></div>
            <div style="display:flex; gap:1rem; margin-top:2rem;"><button type="button" class="buton-iesire" style="flex:1" onclick={() => (showPartnerModal = false)}>Anulează</button><button type="submit" class="buton-primar" style="flex:2">Salvează</button></div>
        </form>
    </div></div>
{/if}

<style>
	.tab-item { background: none; border: none; padding: 1.2rem 2rem; font-size: 1.5rem; font-weight: 500; color: #777; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s; font-family: inherit; }
	.tab-item.activ { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }

	/* Modal serviciu */
	.modal-serviciu { max-width: 72rem; max-height: 90vh; overflow-y: auto; }

	.sectiune-form { border: 1px solid var(--border); border-radius: 10px; padding: 1.8rem 2rem; margin-bottom: 2rem; }
	.sectiune-titlu { font-size: 1.3rem; font-weight: 700; color: var(--primary); margin-bottom: 1.4rem; text-transform: uppercase; letter-spacing: 0.05em; }

	.form-row-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.4rem; }

	.hint { font-size: 1.1rem; color: #999; font-weight: 400; }

	textarea { width: 100%; padding: 1rem 1.2rem; border: 1px solid var(--border); border-radius: 8px; font-family: inherit; font-size: 1.4rem; resize: vertical; }
	textarea:focus { outline: none; border-color: var(--primary); }

	select { width: 100%; padding: 1rem 1.2rem; border: 1px solid var(--border); border-radius: 8px; font-family: inherit; font-size: 1.4rem; background: white; }
	select:focus { outline: none; border-color: var(--primary); }

	/* Toggle switch */
	.camp-toggle { display: flex; flex-direction: column; gap: 0.8rem; }
	.toggle { position: relative; display: inline-block; width: 5rem; height: 2.6rem; }
	.toggle input { opacity: 0; width: 0; height: 0; }
	.slider { position: absolute; inset: 0; background: #ccc; border-radius: 3rem; cursor: pointer; transition: 0.3s; }
	.slider::before { content: ''; position: absolute; height: 2rem; width: 2rem; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
	input:checked + .slider { background: var(--primary); }
	input:checked + .slider::before { transform: translateX(2.4rem); }

	/* Array inputs */
	.array-input { display: flex; gap: 0.8rem; }
	.array-input input { flex: 1; }
	.btn-adauga { padding: 0 1.6rem; background: var(--primary); color: white; border: none; border-radius: 8px; font-size: 2rem; cursor: pointer; line-height: 1; }

	.chips { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 0.8rem; }
	.chip { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 1rem; background: #f0f0f0; border-radius: 2rem; font-size: 1.3rem; }
	.chip button { background: none; border: none; cursor: pointer; font-size: 1.4rem; color: #888; padding: 0; line-height: 1; }
	.chip button:hover { color: #c00; }
	.chip-img { padding: 0.3rem 0.8rem; }
	.chip-img img { height: 2.4rem; width: 3.6rem; object-fit: cover; border-radius: 3px; }

	/* Upload zone */
	.upload-zone { display: block; position: relative; border: 2px dashed var(--border); border-radius: 10px; cursor: pointer; overflow: hidden; transition: border-color 0.2s; }
	.upload-zone:hover { border-color: var(--primary); }
	.upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; padding: 2.4rem; color: #999; font-size: 1.4rem; text-align: center; }
	.upload-placeholder small { font-size: 1.1rem; color: #bbb; }
	.upload-icon { font-size: 2.8rem; }
	.upload-zone-sm .upload-placeholder, .upload-zone-sm { padding: 1.4rem; }
	.upload-zone-sm { display: flex; align-items: center; gap: 1rem; font-size: 1.3rem; color: #888; }
	.img-preview-full { display: block; width: 100%; max-height: 18rem; object-fit: cover; }
	.upload-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 600; opacity: 0; transition: opacity 0.2s; }
	.upload-zone:hover .upload-overlay { opacity: 1; }
</style>
