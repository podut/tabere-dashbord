<script lang="ts">
	import { supabase, STORAGE_BUCKET } from '$lib/supabase';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import type { Service, Partner } from '$lib/types';

	let { servicii = $bindable([]), parteneri = $bindable([]), refreshServices, refreshPartners }: {
        servicii: Service[],
        parteneri: Partner[],
        refreshServices: () => Promise<void>,
        refreshPartners: () => Promise<void>
    } = $props();

    let subSectiune = $state('servicii'); // servicii | parteneri
	let showServModal = $state(false);
	let showPartnerModal = $state(false);
	let editMode = $state(false);

	let serviciuCurent = $state<any>({
		id: '', title: '', short_desc: '', description: '', full_desc: '', tag: '', price: 0, price_label: '', duration: '', age_target: '', capacity: '', category: 'General', image_url: '', active: true, order: 0
	});

	let partenerCurent = $state<any>({
		id: '', name: '', website: '', image_url: '', order: 0
	});

	function deschideServiciu(s: any = null) {
		editMode = !!s;
		serviciuCurent = s ? { ...s } : { title: '', short_desc: '', description: '', full_desc: '', tag: '', price: 0, price_label: '', duration: '', age_target: '', capacity: '', category: 'General', image_url: '', active: true, order: 0 };
		showServModal = true;
	}

	function deschidePartner(p: any = null) {
		editMode = !!p;
		partenerCurent = p ? { ...p } : { name: '', website: '', image_url: '', order: 0 };
		showPartnerModal = true;
	}

	async function salveazaServiciu(e: SubmitEvent) {
		e.preventDefault();
		const { error } = editMode
			? await supabase.from('services').update(serviciuCurent).eq('id', serviciuCurent.id)
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
	<div class="modal-overlay"><div class="login-card" style="max-width: 65rem;">
        <h2>{editMode ? 'Editează' : 'Adaugă'} Serviciu</h2>
        <form onsubmit={salveazaServiciu}>
            <div class="camp"><label>Titlu</label><input bind:value={serviciuCurent.title} required /></div>
            <div class="form-row-2col">
                <div class="camp"><label>Preț</label><input type="number" bind:value={serviciuCurent.price} required /></div>
                <div class="camp"><label>Label (ex: pe zi)</label><input bind:value={serviciuCurent.price_label} /></div>
            </div>
            <div style="display:flex; gap:1rem; margin-top:2rem;"><button type="button" class="buton-iesire" style="flex:1" onclick={() => (showServModal = false)}>Anulează</button><button type="submit" class="buton-primar" style="flex:2">Salvează</button></div>
        </form>
    </div></div>
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
</style>
