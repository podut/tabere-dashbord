<script lang="ts">
	import { supabase, STORAGE_BUCKET } from '$lib/supabase';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import type { WebsiteContent } from '$lib/types';

	let { continutSite = $bindable([]), refreshSite }: { 
		continutSite: WebsiteContent[],
		refreshSite: () => Promise<void>
	} = $props();

	let showSiteModal = $state(false);
	let editMode = $state(false);
	let saving = $state(false);

	let siteSectiuneCurenta = $state<any>({
		section_id: '',
		title: '',
		subtitle: '',
		description: '',
		content: { image: '' },
		images: [] as string[]
	});

	function deschideSiteSectiune(sec: any = null) {
		editMode = !!sec;
		siteSectiuneCurenta = sec
			? { ...sec, content: sec.content || { image: '' }, images: sec.images || [] }
			: { section_id: '', title: '', subtitle: '', description: '', content: { image: '' }, images: [] };
		showSiteModal = true;
	}

	async function salveazaSiteSectiune(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		try {
			const payload = {
				section_id: siteSectiuneCurenta.section_id.trim(),
				title: siteSectiuneCurenta.title || '',
				subtitle: siteSectiuneCurenta.subtitle || '',
				description: siteSectiuneCurenta.description || '',
				content: siteSectiuneCurenta.content || {},
				images: siteSectiuneCurenta.images || []
			};
			const { error } = await supabase.from('website_content').upsert(payload, { onConflict: 'section_id' });
			if (!error) {
				showSiteModal = false;
				await refreshSite();
				showToast('success', 'Secțiune actualizată.');
			} else throw error;
		} catch (err: any) {
			showToast('error', err.message);
		} finally {
			saving = false;
		}
	}

	async function stergeSiteSectiune(sectionId: string) {
		if (!(await confirmDialog({
			title: 'Stergi sectiunea?',
			message: `Sectiunea "${sectionId}" va fi stearsa definitiv.`,
			confirmLabel: 'Sterge',
			danger: true
		}))) return;
		const { error } = await supabase.from('website_content').delete().eq('section_id', sectionId);
		if (!error) {
			await refreshSite();
			showToast('success', 'Sters.');
		}
	}

	async function onFileSelected(e: Event, sectionId: string) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			const file = target.files[0];
			const fileName = `site/${sectionId}_${Date.now()}.jpg`;
			const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file);
			if (uploadError) { showToast('error', uploadError.message); return; }
			
			const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
			const publicUrl = data.publicUrl;
			
			const row = continutSite.find((c: any) => c.section_id === sectionId);
			const updatedContent = { ...(row?.content || {}), image: publicUrl };
			await supabase.from('website_content').upsert({ section_id: sectionId, content: updatedContent }, { onConflict: 'section_id' });
			await refreshSite();
		}
	}
</script>

<div class="site-content-manager">
	<p style="color:#666; font-size:1.3rem; margin-bottom:2rem;">Editează imaginile și textele principale ale aplicației.</p>

	<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(30rem, 1fr)); gap: 2rem;">
		{#each continutSite.filter((s: any) => ['home_hero', 'services_hero', 'events_hero'].includes(s.section_id)) as sec}
			{@const previewImg = sec.content?.image || sec.images?.[0] || null}
			<div style="background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.02);">
				{#if previewImg}
					<img src={previewImg} alt="" style="width:100%; height:15rem; object-fit:cover;" />
				{:else}
					<div style="width:100%; height:15rem; background:#f0f0f0; display:flex; align-items:center; justify-content:center; color:#ccc;">Fără imagine</div>
				{/if}
				<div style="padding: 1.5rem;">
					<code style="background:var(--primary-tint); color:var(--primary); padding:0.2rem 0.6rem; border-radius:4px; font-size:1.1rem;">{sec.section_id}</code>
					<h4 style="margin: 0.8rem 0 0.4rem; font-size:1.6rem;">{sec.title || '(fără titlu)'}</h4>
					<p style="font-size:1.2rem; color:#888; margin-bottom:1.5rem;">{sec.description?.slice(0, 100) || 'Fără descriere...'}</p>

					<div style="display:flex; gap:0.5rem;">
						<button class="btn-icon" style="flex:1;" onclick={() => deschideSiteSectiune(sec)}>✏️</button>
						<label class="btn-icon" style="flex:1; background:#27ae60; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer;">
							📷
							<input type="file" style="display:none;" onchange={(e) => onFileSelected(e, sec.section_id)} />
						</label>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

{#if showSiteModal}
	<div class="modal-overlay">
		<div class="login-card" style="max-width: 60rem;">
			<h2>{editMode ? 'Editează' : 'Adaugă'} Secțiune Site</h2>
			<form onsubmit={salveazaSiteSectiune}>
				<div class="camp">
					<label>Section ID (ex: home_hero)</label>
					<input bind:value={siteSectiuneCurenta.section_id} required readonly={editMode} />
				</div>
				<div class="camp"><label>Titlu</label><input bind:value={siteSectiuneCurenta.title} /></div>
				<div class="camp"><label>Subtitlu</label><input bind:value={siteSectiuneCurenta.subtitle} /></div>
				<div class="camp"><label>Descriere</label><textarea bind:value={siteSectiuneCurenta.description} style="width:100%; height:8rem; border-radius:9px; border:1px solid var(--border); padding:1rem;"></textarea></div>
				
				<div style="display:flex; gap:1rem; margin-top:2rem;">
					<button type="button" class="buton-iesire" style="flex:1" onclick={() => (showSiteModal = false)}>Anulează</button>
					<button type="submit" class="buton-primar" style="flex:2" disabled={saving}>{saving ? 'Se salvează...' : 'Salvează'}</button>
				</div>
			</form>
		</div>
	</div>
{/if}
