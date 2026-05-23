<script lang="ts">
	import { supabase, STORAGE_BUCKET } from '$lib/supabase';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import type { Gallery } from '$lib/types';

	let { galerie = $bindable([]), refreshGallery }: {
        galerie: Gallery[],
        refreshGallery: () => Promise<void>
    } = $props();

	let showGalModal = $state(false);
	let showGalEditModal = $state(false);
	let galFotoEdit = $state({ id: '', label: '' });
	let dragGalIdx = $state(-1);
    let nouaFoto = $state({ label: '', url: '', file: null as File | null });

	function reorderGalerie(toIdx: number) {
		if (dragGalIdx === -1 || dragGalIdx === toIdx) { dragGalIdx = -1; return; }
		const arr = [...galerie];
		const [item] = arr.splice(dragGalIdx, 1);
		arr.splice(toIdx, 0, item);
		galerie = arr.map((g, i) => ({ ...g, order: i + 1 }));
		dragGalIdx = -1;
		Promise.all(galerie.map(g => supabase.from('gallery').update({ order: g.order }).eq('id', g.id)));
	}

	async function salveazaLabelGalerie() {
		await supabase.from('gallery').update({ label: galFotoEdit.label }).eq('id', galFotoEdit.id);
		galerie = galerie.map(g => g.id === galFotoEdit.id ? { ...g, label: galFotoEdit.label } : g);
		showGalEditModal = false;
		showToast('success', 'Actualizat.');
	}

    async function stergeFoto(id: string) {
        if (await confirmDialog({ title: 'Stergi poza?', message: 'Esti sigur?', confirmLabel: 'Sterge', danger: true })) {
            const { error } = await supabase.from('gallery').delete().eq('id', id);
            if (!error) { await refreshGallery(); showToast('success', 'Sters.'); }
        }
    }

    async function handleFileUpload(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            const file = target.files[0];
            const fileName = `gallery/${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file);
            if (uploadError) { showToast('error', uploadError.message); return; }
            const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
            await supabase.from('gallery').insert([{ label: nouaFoto.label || 'Imagine', url: data.publicUrl, order: galerie.length + 1 }]);
            showGalModal = false;
            await refreshGallery();
            showToast('success', 'Imagine adaugata.');
        }
    }
</script>

<div class="gallery-manager">
    <div class="actiuni-pagina" style="display:flex; justify-content: flex-end; margin-bottom: 2rem;">
        <button class="buton-primar" onclick={() => showGalModal = true}>+ Imagine Nouă</button>
    </div>

    <div class="galerie-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr)); gap: 2rem;">
        {#each galerie as g, i}
            <div 
                class="foto-card" 
                draggable="true"
                ondragstart={() => dragGalIdx = i}
                ondragover={(e) => e.preventDefault()}
                ondrop={() => reorderGalerie(i)}
            >
                <img src={g.url} alt="" class="foto-img" />
                <div class="foto-info">
                    <span class="foto-label">{g.label || 'Fără titlu'}</span>
                    <div class="foto-actions">
                        <button class="btn-icon" onclick={() => { galFotoEdit = { id: g.id, label: g.label || '' }; showGalEditModal = true; }}>✏️</button>
                        <button class="btn-icon btn-sterge" onclick={() => stergeFoto(g.id)}>🗑️</button>
                    </div>
                </div>
            </div>
        {/each}
    </div>
</div>

{#if showGalModal}
	<div class="modal-overlay"><div class="login-card" style="max-width: 40rem;">
        <h2>Adaugă în Galerie</h2>
        <div class="camp"><label>Titlu / Etichetă</label><input bind:value={nouaFoto.label} placeholder="ex: Meci Duminică" /></div>
        <div class="camp"><label>Imagine</label><input type="file" accept="image/*" onchange={handleFileUpload} /></div>
        <button class="buton-iesire" style="width:100%; margin-top:1rem;" onclick={() => showGalModal = false}>Anulează</button>
    </div></div>
{/if}

{#if showGalEditModal}
	<div class="modal-overlay"><div class="login-card" style="max-width: 40rem;">
        <h2>Editează Etichetă</h2>
        <div class="camp"><label>Etichetă</label><input bind:value={galFotoEdit.label} /></div>
        <div style="display:flex; gap:1rem; margin-top:2rem;">
            <button class="buton-iesire" style="flex:1" onclick={() => showGalEditModal = false}>Anulează</button>
            <button class="buton-primar" style="flex:2" onclick={salveazaLabelGalerie}>Salvează</button>
        </div>
    </div></div>
{/if}
