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

	async function onOnboardingImagesSelected(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;
		saving = true;
		try {
			const row = continutSite.find((c: any) => c.section_id === 'onboarding');
			const existingImages: string[] = row?.images || [];
			const newUrls: string[] = [];

			for (const file of Array.from(target.files)) {
				const fileName = `site/onboarding_${Date.now()}_${file.name}`;
				const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file);
				if (uploadError) { showToast('error', uploadError.message); continue; }
				const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
				newUrls.push(data.publicUrl);
			}

			const updatedImages = [...existingImages, ...newUrls];
			await supabase.from('website_content').upsert(
				{ section_id: 'onboarding', images: updatedImages },
				{ onConflict: 'section_id' }
			);
			await refreshSite();
			showToast('success', `${newUrls.length} imagine(i) adăugate.`);
		} finally {
			saving = false;
			target.value = '';
		}
	}

	async function removeOnboardingImage(url: string) {
		const row = continutSite.find((c: any) => c.section_id === 'onboarding');
		if (!row) return;
		const updatedImages = (row.images || []).filter((u: string) => u !== url);
		await supabase.from('website_content').upsert(
			{ section_id: 'onboarding', images: updatedImages },
			{ onConflict: 'section_id' }
		);
		await refreshSite();
	}

	const onboardingSection = $derived(continutSite.find((s: any) => s.section_id === 'onboarding'));
</script>

<div class="site-content-manager">
	<p class="subtitle-text">Gerează imaginile de tip "Hero" și textele principale ale paginilor din aplicația mobilă.</p>

	<!-- Secțiunea Onboarding (poze site) -->
	<div class="onboarding-section">
		<div class="onboarding-header">
			<div>
				<h3 class="onboarding-title">Poze Onboarding</h3>
				<p class="onboarding-desc">Imagini afișate la prima lansare a aplicației mobile. Poți adăuga mai multe imagini pentru un slideshow.</p>
			</div>
			<label class="btn-add-photos" title="Adaugă imagini" class:disabled={saving}>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
				{saving ? 'Se încarcă...' : 'Adaugă Poze'}
				<input type="file" accept="image/*" multiple style="display:none;" onchange={onOnboardingImagesSelected} disabled={saving} />
			</label>
		</div>
		<div class="onboarding-images">
			{#each onboardingSection?.images ?? [] as imgUrl (imgUrl)}
				<div class="onboarding-img-card">
					<img src={imgUrl} alt="" class="onboarding-img" />
					<button class="btn-remove-img" onclick={() => removeOnboardingImage(imgUrl)} title="Elimină">✕</button>
				</div>
			{:else}
				<div class="onboarding-empty">Nicio imagine adăugată. Aplicația va folosi imaginile de rezervă.</div>
			{/each}
		</div>
	</div>

	<div class="site-grid">
		{#each continutSite.filter((s: any) => ['home_hero', 'services_hero', 'events_hero'].includes(s.section_id)) as sec}
			{@const previewImg = sec.content?.image || sec.images?.[0] || null}
			<div class="site-card">
				{#if previewImg}
					<img src={previewImg} alt="" class="site-card-img" />
				{:else}
					<div class="site-card-no-img">Fără imagine</div>
				{/if}
				<div class="site-card-body">
					<code class="section-id-code">{sec.section_id}</code>
					<h4 class="site-card-title">{sec.title || '(fără titlu)'}</h4>
					<p class="site-card-desc">{sec.description?.slice(0, 100) || 'Fără descriere...'}</p>

					<div class="site-card-actions">
						<button class="btn-icon" onclick={() => deschideSiteSectiune(sec)} title="Editează Text">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
						</button>
						<label class="btn-icon btn-upload" title="Încarcă Imagine Nouă">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
							<input type="file" style="display:none;" onchange={(e) => onFileSelected(e, sec.section_id)} />
						</label>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.subtitle-text { color: var(--text-grey); font-size: 1.4rem; margin-bottom: 2.4rem; font-weight: 500; }

	.onboarding-section { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border); padding: 2.4rem; margin-bottom: 3rem; }
	.onboarding-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.6rem; margin-bottom: 2rem; }
	.onboarding-title { font-size: 2rem; font-weight: 700; color: var(--text); margin: 0 0 0.4rem; }
	.onboarding-desc { font-size: 1.3rem; color: var(--text-grey); margin: 0; }
	.btn-add-photos { display: flex; align-items: center; gap: 0.6rem; background: var(--primary); color: var(--bg-dark); padding: 0.9rem 1.8rem; border-radius: 10px; font-size: 1.4rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: opacity 0.2s; }
	.btn-add-photos:hover { opacity: 0.85; }
	.btn-add-photos.disabled { opacity: 0.5; pointer-events: none; }
	.onboarding-images { display: flex; flex-wrap: wrap; gap: 1.2rem; }
	.onboarding-img-card { position: relative; width: 14rem; height: 10rem; border-radius: 10px; overflow: hidden; border: 1px solid var(--border); }
	.onboarding-img { width: 100%; height: 100%; object-fit: cover; }
	.btn-remove-img { position: absolute; top: 0.4rem; right: 0.4rem; background: rgba(0,0,0,0.65); color: #fff; border: none; border-radius: 50%; width: 2.2rem; height: 2.2rem; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
	.btn-remove-img:hover { background: rgba(220,53,69,0.85); }
	.onboarding-empty { color: var(--text-grey); font-style: italic; font-size: 1.3rem; padding: 1rem 0; }
	.site-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(32rem, 1fr)); gap: 2.4rem; }
	
	.site-card {
		background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border);
		overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); transition: all 0.2s;
	}
	.site-card:hover { border-color: var(--primary); transform: translateY(-3px); }
	
	.site-card-img { width: 100%; height: 18rem; object-fit: cover; border-bottom: 1px solid var(--border); }
	.site-card-no-img { width: 100%; height: 18rem; background: var(--bg-dark); display: flex; align-items: center; justify-content: center; color: var(--text-grey); font-style: italic; border-bottom: 1px solid var(--border); }
	
	.site-card-body { padding: 2rem; }
	
	.section-id-code { background: var(--bg-dark); color: var(--primary); padding: 0.3rem 0.8rem; border-radius: 4px; font-size: 1.1rem; font-family: monospace; font-weight: 700; border: 1px solid var(--border); }
	
	.site-card-title { margin: 1.2rem 0 0.6rem; font-size: 1.8rem; color: var(--text); font-weight: 700; }
	.site-card-desc { font-size: 1.3rem; color: var(--text-grey); margin-bottom: 2rem; line-height: 1.5; }
	
	.site-card-actions { display: flex; gap: 0.8rem; }
	.site-card-actions button, .site-card-actions label { flex: 1; height: 3.8rem; border-radius: 8px; }
	
	.btn-upload { background: rgba(39, 174, 96, 0.1); color: #27ae60; border: 1px solid rgba(39, 174, 96, 0.3); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
	.btn-upload:hover { background: rgba(39, 174, 96, 0.2); border-color: #27ae60; }
</style>

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
