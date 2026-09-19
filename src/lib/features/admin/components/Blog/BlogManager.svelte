<script lang="ts">
	import { supabase, STORAGE_BUCKET } from '$lib/supabase';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import { PostRepository } from '$lib/data/repositories/PostRepository';
	import type { Post } from '$lib/types';
	import ArticlePreviewHUD from './view/ArticlePreviewHUD.svelte';

	let { articole = $bindable([]), refreshPosts }: {
		articole: Post[],
		refreshPosts: () => Promise<void>
	} = $props();

	let showModal = $state(false);
	let editMode = $state(false);
	let saving = $state(false);
	let uploadingImage = $state(false);
	let activeTab = $state<'content' | 'image' | 'seo'>('content');
	let previewMode = $state(false);
	let mobileModalTab = $state<'editor' | 'preview'>('editor');

	// Filtre
	let searchFilter = $state('');
	let categoryFilter = $state('all');
	let statusFilter = $state<'all' | 'published' | 'draft'>('all');

	// Categorii sugerate
	const categoriiSugerate = [
		'Ghid Supraviețuire',
		'Evenimente & Tabere',
		'Echipament',
		'Team Building',
		'Tehnici Airsoft',
		'Noutăți'
	];

	// Model articol curent
	const articolGol = () => ({
		id: '',
		title: '',
		slug: '',
		excerpt: '',
		content: '',
		featured_image: '',
		category: 'Ghid Supraviețuire',
		tags: [] as string[],
		author: 'Echipa HTCMX',
		reading_time_min: 3,
		is_published: true,
		published_at: new Date().toISOString(),
		meta_title: '',
		meta_description: ''
	});

	let postCurent = $state<any>(articolGol());
	let tagsInput = $state('');

	function slugify(text: string): string {
		return text
			.toString()
			.toLowerCase()
			.trim()
			.replace(/ă|â/g, 'a')
			.replace(/î/g, 'i')
			.replace(/ș|ş/g, 's')
			.replace(/ț|ţ/g, 't')
			.replace(/\s+/g, '-')
			.replace(/[^\w\-]+/g, '')
			.replace(/\-\-+/g, '-')
			.replace(/^-+/, '')
			.replace(/-+$/, '');
	}

	function onTitleChange() {
		if (!editMode || !postCurent.slug) {
			postCurent.slug = slugify(postCurent.title);
		}
		if (!postCurent.meta_title) {
			postCurent.meta_title = postCurent.title ? `${postCurent.title} — HTCMX` : '';
		}
	}

	function onContentChange() {
		const words = (postCurent.content || '').trim().split(/\s+/).filter(Boolean).length;
		postCurent.reading_time_min = Math.max(1, Math.ceil(words / 200));
	}

	function deschideModal(post: Post | null = null) {
		editMode = !!post;
		activeTab = 'content';
		previewMode = false;
		if (post) {
			postCurent = {
				...post,
				tags: Array.isArray(post.tags) ? [...post.tags] : []
			};
			tagsInput = (postCurent.tags || []).join(', ');
		} else {
			postCurent = articolGol();
			tagsInput = '';
		}
		showModal = true;
	}

	function inserareMarkdown(prefix: string, sufix: string = '') {
		const textarea = document.getElementById('post-content-area') as HTMLTextAreaElement;
		if (!textarea) return;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const text = textarea.value;
		const selected = text.substring(start, end) || 'text';
		const replacement = prefix + selected + sufix;
		postCurent.content = text.substring(0, start) + replacement + text.substring(end);
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
		}, 50);
		onContentChange();
	}

	async function onImageUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;
		uploadingImage = true;
		try {
			const file = target.files[0];
			const cleanName = slugify(file.name.replace(/\.[^/.]+$/, ''));
			const ext = file.name.split('.').pop();
			const filePath = `blog/${cleanName}_${Date.now()}.${ext}`;

			const { error: uploadError } = await supabase.storage
				.from(STORAGE_BUCKET)
				.upload(filePath, file);

			if (uploadError) throw uploadError;

			const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
			postCurent.featured_image = data.publicUrl;
			showToast('success', 'Imaginea a fost încărcată.');
		} catch (err: any) {
			showToast('error', err.message || 'Eroare la încărcarea imaginii.');
		} finally {
			uploadingImage = false;
			target.value = '';
		}
	}

	async function salveazaArticol(e: SubmitEvent) {
		e.preventDefault();
		if (!postCurent.title.trim()) {
			showToast('error', 'Titlul este obligatoriu.');
			return;
		}

		if (!postCurent.slug.trim()) {
			postCurent.slug = slugify(postCurent.title);
		}

		// Parsare tags
		postCurent.tags = tagsInput
			.split(',')
			.map(t => t.trim())
			.filter(Boolean);

		saving = true;
		try {
			await PostRepository.savePost(postCurent);
			await refreshPosts();
			showModal = false;
			showToast('success', editMode ? 'Articol actualizat cu succes.' : 'Articol adăugat cu succes.');
		} catch (err: any) {
			showToast('error', err.message || 'Eroare la salvare.');
		} finally {
			saving = false;
		}
	}

	async function stergeArticol(post: Post) {
		if (!(await confirmDialog({
			title: 'Ștergi articolul?',
			message: `Articolul "${post.title}" va fi șters definitiv.`,
			confirmLabel: 'Șterge Articol',
			danger: true
		}))) return;

		try {
			await PostRepository.deletePost(post.id);
			await refreshPosts();
			showToast('success', 'Articol șters.');
		} catch (err: any) {
			showToast('error', err.message || 'Eroare la ștergere.');
		}
	}

	async function toggleStarePublicare(post: Post) {
		const willPublish = !post.is_published;
		const actionTitle = willPublish ? 'Publicare Articol Live' : 'Retragere ca Ciornă (Draft)';
		const actionMessage = willPublish
			? `Ești sigur că vrei să publici articolul "${post.title}"? Acesta va deveni vizibil imediat pentru toți vizitatorii pe site.`
			: `Ești sigur că vrei să retragi articolul "${post.title}" ca ciornă? Nu va mai apărea pe site până la o nouă publicare.`;

		if (!(await confirmDialog({
			title: actionTitle,
			message: actionMessage,
			confirmLabel: willPublish ? 'Publică Articolul' : 'Retrage ca Ciornă',
			danger: !willPublish
		}))) return;

		try {
			await PostRepository.togglePublish(post.id, willPublish);
			await refreshPosts();
			showToast('success', willPublish ? 'Articolul a fost publicat pe site.' : 'Articolul a fost retras ca ciornă.');
		} catch (err: any) {
			showToast('error', err.message || 'Eroare la schimbarea stării.');
		}
	}

	// Articole filtrate
	const articoleFiltrate = $derived(
		articole.filter(p => {
			const matchSearch = searchFilter === '' ||
				p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
				p.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
				p.slug.toLowerCase().includes(searchFilter.toLowerCase());

			const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
			const matchStatus = statusFilter === 'all' ||
				(statusFilter === 'published' && p.is_published) ||
				(statusFilter === 'draft' && !p.is_published);

			return matchSearch && matchCat && matchStatus;
		})
	);

	// Helper rezoluție imagine cu fallback
	function resolveImage(url: string | null | undefined): string {
		if (!url) return 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80';
		if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
			return url;
		}
		return 'http://localhost:8080/' + url.replace(/^\//, '');
	}

	// Statistici
	const totalArticole = $derived(articole.length);
	const articolePublicate = $derived(articole.filter(a => a.is_published).length);
	const articoleCiorna = $derived(articole.filter(a => !a.is_published).length);
</script>

<div class="blog-manager">
	<div class="titlu-pagina">
		<div>
			<h1>Gestiune Blog & Articole</h1>
			<p class="subtitle-text">Publică ghiduri tactice, tutoriale de supraviețuire, recenzii de echipament și știri HTCMX.</p>
		</div>
		<div class="actiuni-pagina">
			<button class="btn btn-primary" onclick={() => deschideModal(null)}>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
				Adaugă Articol Nou
			</button>
		</div>
	</div>

	<!-- Stats bar -->
	<div class="stats-mini-grid">
		<div class="stat-mini-card">
			<span class="stat-mini-val">{totalArticole}</span>
			<span class="stat-mini-lbl">Total Articole</span>
		</div>
		<div class="stat-mini-card stat-success">
			<span class="stat-mini-val">{articolePublicate}</span>
			<span class="stat-mini-lbl">Publicate Live</span>
		</div>
		<div class="stat-mini-card stat-draft">
			<span class="stat-mini-val">{articoleCiorna}</span>
			<span class="stat-mini-lbl">Ciorne (Draft)</span>
		</div>
	</div>

	<!-- Controls / Filters -->
	<div class="filtre-bara">
		<div class="cautare-box">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
			<input type="text" placeholder="Caută după titlu, slug sau categorie..." bind:value={searchFilter} />
			{#if searchFilter}
				<button class="btn-clear" onclick={() => searchFilter = ''}>&times;</button>
			{/if}
		</div>

		<div class="select-group">
			<select bind:value={categoryFilter}>
				<option value="all">Toate Categoriile</option>
				{#each categoriiSugerate as cat}
					<option value={cat}>{cat}</option>
				{/each}
			</select>

			<select bind:value={statusFilter}>
				<option value="all">Toate Stările</option>
				<option value="published">Doar Publicate</option>
				<option value="draft">Doar Ciorne</option>
			</select>
		</div>
	</div>

	<!-- Posts Table / Cards -->
	{#if articoleFiltrate.length === 0}
		<div class="empty-state">
			<p>Nu s-a găsit niciun articol conform filtrelor selectate.</p>
		</div>
	{:else}
		<div class="tabel-container">
			<table class="tabel-admin">
				<thead>
					<tr>
						<th style="width:70px">Copertă</th>
						<th>Titlu & Detalii</th>
						<th>Categorie</th>
						<th>Autor</th>
						<th>Timp Citire</th>
						<th>Stare</th>
						<th>Data Publicării</th>
						<th style="width:140px; text-align:right">Acțiuni</th>
					</tr>
				</thead>
				<tbody>
					{#each articoleFiltrate as post (post.id)}
						<tr>
							<td>
								{#if post.featured_image}
									<img src={resolveImage(post.featured_image)} alt={post.title} class="thumb-post" onerror={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80'; }} />
								{:else}
									<div class="thumb-placeholder">📰</div>
								{/if}
							</td>
							<td>
								<div class="post-title-row">
									<strong>{post.title}</strong>
								</div>
								<div class="post-slug-row">
									<code>/{post.slug}</code>
								</div>
							</td>
							<td>
								<span class="badge-cat">{post.category || 'General'}</span>
							</td>
							<td>{post.author || 'HTCMX'}</td>
							<td>⏱ {post.reading_time_min || 3} min</td>
							<td>
								<button 
									class="badge-status-btn" 
									class:status-pub={post.is_published}
									class:status-draft={!post.is_published}
									onclick={() => toggleStarePublicare(post)}
									title="Apasă pentru a schimba starea"
								>
									{post.is_published ? '● Publicat' : '○ Ciornă'}
								</button>
							</td>
							<td class="text-muted">
								{post.published_at ? new Date(post.published_at).toLocaleDateString('ro-RO') : '—'}
							</td>
							<td style="text-align:right">
								<div class="btn-group-actions">
									<button class="btn-action edit" onclick={() => deschideModal(post)} title="Editează">
										✏️
									</button>
									<button class="btn-action delete" onclick={() => stergeArticol(post)} title="Șterge">
										🗑️
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

<!-- ==================== MODAL EDITARE ARTICOL (DUAL SPLIT-SCREEN & LIVE PREVIEW HUD) ==================== -->
{#if showModal}
	<div class="modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) showModal = false; }}>
		<div class="modal-card modal-article-live">
			<!-- MODAL HEADER -->
			<div class="modal-header">
				<div class="modal-title-group">
					<h2>{editMode ? 'Editează Articol' : 'Adaugă Articol Nou'}</h2>
					<span class="live-indicator-badge">
						<span class="live-pulse"></span> Preview în Timp Real
					</span>
				</div>

				<!-- Mobile switch -->
				<div class="mobile-tabs-switch">
					<button
						type="button"
						class="m-tab-btn"
						class:active={mobileModalTab === 'editor'}
						onclick={() => (mobileModalTab = 'editor')}
					>
						📝 Editor
					</button>
					<button
						type="button"
						class="m-tab-btn"
						class:active={mobileModalTab === 'preview'}
						onclick={() => (mobileModalTab = 'preview')}
					>
						👁️ Live Preview
					</button>
				</div>

				<button type="button" class="btn-close" onclick={() => showModal = false}>&times;</button>
			</div>

			<!-- DUAL COLUMN LAYOUT -->
			<div class="article-modal-split">
				<!-- LEFT COLUMN: FORM EDITOR -->
				<div class="article-form-col" class:mobile-hidden={mobileModalTab === 'preview'}>
					<!-- Tabs Navigation -->
					<div class="modal-tabs">
						<button type="button" class:activ={activeTab === 'content'} onclick={() => activeTab = 'content'}>📝 Conținut</button>
						<button type="button" class:activ={activeTab === 'image'} onclick={() => activeTab = 'image'}>🖼️ Imagine Copertă</button>
						<button type="button" class:activ={activeTab === 'seo'} onclick={() => activeTab = 'seo'}>🔍 SEO & Social</button>
					</div>

					<form id="articleForm" onsubmit={salveazaArticol} class="modal-form">
						<div class="modal-body-content">
							{#if activeTab === 'content'}
								<div class="form-group">
									<label for="post-title">Titlu Articol *</label>
									<input 
										id="post-title" 
										type="text" 
										required 
										placeholder="ex: Ghid de Supraviețuire în Sălbăticie" 
										bind:value={postCurent.title} 
										oninput={onTitleChange} 
									/>
								</div>

								<div class="form-row">
									<div class="form-group">
										<label for="post-slug">Slug URL (automat din titlu) *</label>
										<div class="input-with-prefix">
											<span class="prefix">/blog/</span>
											<input id="post-slug" type="text" required bind:value={postCurent.slug} />
										</div>
									</div>
									<div class="form-group">
										<label for="post-cat">Categorie</label>
										<select id="post-cat" bind:value={postCurent.category}>
											{#each categoriiSugerate as cat}
												<option value={cat}>{cat}</option>
											{/each}
										</select>
									</div>
								</div>

								<div class="form-row">
									<div class="form-group">
										<label for="post-author">Autor</label>
										<input id="post-author" type="text" bind:value={postCurent.author} placeholder="ex: Instructor Radu V." />
									</div>
									<div class="form-group">
										<label for="post-reading">Timp de citire (minute)</label>
										<input id="post-reading" type="number" min="1" max="60" bind:value={postCurent.reading_time_min} />
									</div>
									<div class="form-group">
										<label for="post-tags">Tag-uri (separate prin virgulă)</label>
										<input id="post-tags" type="text" placeholder="supravietuire, foc, munte" bind:value={tagsInput} />
									</div>
								</div>

								<div class="form-group">
									<label for="post-excerpt">Rezumat scurt (Excerpt / descriere scurtă)</label>
									<textarea id="post-excerpt" rows="2" placeholder="O scurtă introducere afișată pe cardul articolului..." bind:value={postCurent.excerpt}></textarea>
								</div>

								<!-- Editor Markdown cu toolbar -->
								<div class="editor-wrapper">
									<div class="editor-header">
										<label for="post-content-area">Conținut Articol (Markdown / HTML)</label>
										<div class="editor-toolbar">
											<button type="button" onclick={() => inserareMarkdown('**', '**')} title="Bold"><b>B</b></button>
											<button type="button" onclick={() => inserareMarkdown('*', '*')} title="Italic"><i>I</i></button>
											<button type="button" onclick={() => inserareMarkdown('## ', '\n')} title="Titlu Secțiune (H2)">H2</button>
											<button type="button" onclick={() => inserareMarkdown('### ', '\n')} title="Subtitlu (H3)">H3</button>
											<button type="button" onclick={() => inserareMarkdown('> ', '\n')} title="Citat / Notă">❝</button>
											<button type="button" onclick={() => inserareMarkdown('- ', '\n')} title="Listă Bullets">• Listă</button>
											<button type="button" onclick={() => inserareMarkdown('1. ', '\n')} title="Listă Numerotată">1. Listă</button>
											<button type="button" onclick={() => inserareMarkdown('[', '](https://)')} title="Link">🔗</button>
										</div>
									</div>

									<textarea 
										id="post-content-area" 
										rows="14" 
										placeholder="Scrie articolul aici folosind Markdown sau HTML..." 
										bind:value={postCurent.content}
										oninput={onContentChange}
									></textarea>
								</div>

							{:else if activeTab === 'image'}
								<div class="image-tab-content">
									<div class="form-group">
										<label for="post-image-url">URL Imagine Reprezentativă</label>
										<input id="post-image-url" type="text" placeholder="assets/images/blog/nume-poza.jpg sau https://..." bind:value={postCurent.featured_image} />
									</div>

									<div class="upload-zone">
										<p>Sau încarcă o poză direct din calculator în Supabase Storage:</p>
										<label class="btn btn-outline" class:disabled={uploadingImage}>
											<input type="file" accept="image/*" style="display:none" onchange={onImageUpload} disabled={uploadingImage} />
											{uploadingImage ? 'Se încarcă...' : 'Alege Fișier Imagine'}
										</label>
									</div>

									{#if postCurent.featured_image}
										<div class="image-preview-box">
											<p class="preview-label">Previzualizare Copertă:</p>
											<img src={resolveImage(postCurent.featured_image)} alt="Copertă articol" class="cover-preview" onerror={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80'; }} />
										</div>
									{/if}
								</div>

							{:else if activeTab === 'seo'}
								<div class="seo-tab-content">
									<div class="form-group">
										<label for="post-meta-title">Meta Titlu (SEO)</label>
										<input id="post-meta-title" type="text" placeholder="Titlul afișat în rezultatele motoarelor de căutare" bind:value={postCurent.meta_title} />
									</div>

									<div class="form-group">
										<label for="post-meta-desc">Meta Descriere (SEO)</label>
										<textarea id="post-meta-desc" rows="3" placeholder="Descrierea afișată în motoarele de căutare (recomandat 150-160 caractere)" bind:value={postCurent.meta_description}></textarea>
									</div>
								</div>
							{/if}
						</div>
					</form>
				</div>

				<!-- RIGHT COLUMN: ARTICLE PREVIEW HUD -->
				<div class="article-preview-col" class:mobile-hidden={mobileModalTab === 'editor'}>
					<ArticlePreviewHUD post={postCurent} />
				</div>
			</div>

			<!-- MODAL FOOTER -->
			<div class="modal-footer">
				<div class="publish-switch-group">
					<label class="switch-label">
						<input type="checkbox" bind:checked={postCurent.is_published} />
						<span class="switch-text">{postCurent.is_published ? 'Publicat imediat pe site' : 'Salvează ca Ciornă (Draft)'}</span>
					</label>
				</div>

				<div class="modal-actions">
					<button type="button" class="btn btn-secondary" onclick={() => showModal = false}>Anulează</button>
					<button type="submit" form="articleForm" class="btn btn-primary" disabled={saving}>
						{saving ? 'Se salvează...' : (editMode ? 'Actualizează Articolul' : 'Publică Articolul')}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.blog-manager {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.subtitle-text {
		color: var(--text-grey);
		font-size: 1.3rem;
		margin-top: 0.4rem;
	}

	.stats-mini-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
		gap: 1.6rem;
	}

	.stat-mini-card {
		background: rgba(197, 160, 48, 0.05);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 1.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.stat-mini-val {
		font-size: 2.4rem;
		font-weight: 700;
		color: var(--primary);
	}

	.stat-mini-lbl {
		font-size: 1.1rem;
		text-transform: uppercase;
		color: var(--text-grey);
		letter-spacing: 0.5px;
	}

	.stat-success .stat-mini-val { color: var(--success); }
	.stat-draft .stat-mini-val { color: var(--text-grey); }

	.filtre-bara {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1.6rem;
		flex-wrap: wrap;
		background: var(--bg-card);
		padding: 1.2rem 1.6rem;
		border-radius: 8px;
		border: 1px solid var(--border);
	}

	.cautare-box {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		background: rgba(0,0,0,0.3);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.6rem 1.2rem;
		flex: 1;
		min-width: 26rem;
	}

	.cautare-box input {
		background: none;
		border: none;
		outline: none;
		color: var(--text);
		font-size: 1.3rem;
		width: 100%;
	}

	.btn-clear {
		background: none;
		border: none;
		color: var(--text-grey);
		cursor: pointer;
		font-size: 1.6rem;
	}

	.select-group {
		display: flex;
		gap: 1rem;
	}

	.select-group select {
		background: rgba(0,0,0,0.3);
		color: var(--text);
		border: 1px solid var(--border);
		padding: 0.6rem 1.2rem;
		border-radius: 6px;
		font-size: 1.3rem;
	}

	.tabel-container {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 8px;
		overflow-x: auto;
	}

	.tabel-admin {
		width: 100%;
		border-collapse: collapse;
		font-size: 1.3rem;
		text-align: left;
	}

	.tabel-admin th {
		background: rgba(0,0,0,0.3);
		padding: 1.2rem 1.6rem;
		color: var(--primary);
		font-weight: 600;
		border-bottom: 1px solid var(--border);
	}

	.tabel-admin td {
		padding: 1.2rem 1.6rem;
		border-bottom: 1px solid rgba(197, 160, 48, 0.08);
		vertical-align: middle;
	}

	.thumb-post {
		width: 50px;
		height: 38px;
		object-fit: cover;
		border-radius: 4px;
		border: 1px solid var(--border);
	}

	.thumb-placeholder {
		width: 50px;
		height: 38px;
		background: rgba(197, 160, 48, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
	}

	.post-title-row { font-size: 1.4rem; color: var(--text); }
	.post-slug-row code { font-size: 1.1rem; color: var(--text-grey); }

	.badge-cat {
		background: rgba(197, 160, 48, 0.15);
		color: var(--primary);
		padding: 0.2rem 0.8rem;
		border-radius: 4px;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.badge-status-btn {
		background: none;
		border: 1px solid transparent;
		padding: 0.3rem 0.8rem;
		border-radius: 12px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.status-pub {
		background: var(--success-tint);
		color: var(--success);
		border-color: rgba(81, 207, 102, 0.3);
	}

	.status-draft {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-grey);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.btn-group-actions {
		display: flex;
		gap: 0.6rem;
		justify-content: flex-end;
	}

	.btn-action {
		background: rgba(197, 160, 48, 0.08);
		border: 1px solid var(--border);
		padding: 0.4rem 0.8rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1.2rem;
		color: var(--text);
		transition: all 0.2s;
	}

	.btn-action:hover {
		background: var(--primary);
		color: var(--bg-dark);
	}

	.btn-action.delete:hover {
		background: var(--danger);
		border-color: var(--danger);
		color: #fff;
	}

	/* MODAL */
	.modal-backdrop {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0,0,0,0.85);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 2rem;
	}

	.modal-article-live {
		background: linear-gradient(180deg, #0d250d 0%, #081608 100%);
		border: 1px solid var(--border-strong);
		border-radius: 20px;
		width: 95vw;
		max-width: 125rem;
		max-height: 92vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(197, 160, 48, 0.15);
		overflow: hidden;
	}

	.modal-header {
		padding: 1.6rem 2.4rem;
		border-bottom: 1px solid var(--border);
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-title-group {
		display: flex;
		align-items: center;
		gap: 1.4rem;
	}

	.modal-title-group h2 {
		font-size: 2rem;
		font-weight: 800;
		color: var(--primary);
		margin: 0;
	}

	.live-indicator-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		background: rgba(81, 207, 102, 0.15);
		border: 1px solid rgba(81, 207, 102, 0.4);
		color: #51cf66;
		padding: 0.3rem 0.9rem;
		border-radius: 20px;
		font-size: 1.15rem;
		font-weight: 700;
	}

	.live-pulse {
		width: 7px;
		height: 7px;
		background: #51cf66;
		border-radius: 50%;
		box-shadow: 0 0 8px #51cf66;
		animation: pulseDot 1.5s infinite;
	}

	@keyframes pulseDot {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(1.3); }
	}

	.mobile-tabs-switch {
		display: none;
		background: rgba(0, 0, 0, 0.5);
		padding: 0.3rem;
		border-radius: 8px;
		border: 1px solid var(--border);
	}

	.m-tab-btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-grey);
		font-size: 1.2rem;
		font-weight: 700;
		cursor: pointer;
	}

	.m-tab-btn.active {
		background: var(--bg-card);
		color: var(--primary);
	}

	.btn-close {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border);
		color: var(--text-grey);
		font-size: 2.2rem;
		cursor: pointer;
		border-radius: 8px;
		padding: 0.2rem 0.8rem;
		line-height: 1;
		transition: all 0.2s;
	}

	.btn-close:hover {
		background: rgba(224, 49, 49, 0.2);
		color: #ff8787;
		border-color: var(--danger);
	}

	/* ARTICLE SPLIT LAYOUT */
	.article-modal-split {
		display: grid;
		grid-template-columns: 1.15fr 0.95fr;
		gap: 2.4rem;
		padding: 2.4rem;
		overflow-y: auto;
		flex: 1;
	}

	.article-form-col {
		display: flex;
		flex-direction: column;
		gap: 1.4rem;
	}

	.article-preview-col {
		display: flex;
		flex-direction: column;
	}

	.modal-tabs {
		display: flex;
		border-bottom: 1px solid var(--border);
		background: rgba(0,0,0,0.3);
		border-radius: 10px 10px 0 0;
	}

	.modal-tabs button {
		background: none;
		border: none;
		padding: 1.2rem 2rem;
		color: var(--text-grey);
		font-size: 1.3rem;
		font-weight: 700;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
	}

	.modal-tabs button.activ {
		color: var(--primary);
		border-bottom-color: var(--primary);
		background: rgba(197, 160, 48, 0.1);
	}

	.modal-body-content {
		display: flex;
		flex-direction: column;
		gap: 1.6rem;
		padding-top: 1.2rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.form-group label {
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.form-group input, .form-group select, .form-group textarea {
		background: rgba(0,0,0,0.4);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.8rem 1.2rem;
		color: var(--text);
		font-size: 1.4rem;
		font-family: inherit;
		outline: none;
	}

	.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
		border-color: var(--primary);
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
		gap: 1.6rem;
	}

	.input-with-prefix {
		display: flex;
		align-items: center;
		background: rgba(0,0,0,0.4);
		border: 1px solid var(--border);
		border-radius: 6px;
		overflow: hidden;
	}

	.input-with-prefix .prefix {
		padding: 0.8rem 1rem;
		background: rgba(197, 160, 48, 0.08);
		color: var(--text-grey);
		font-size: 1.2rem;
		border-right: 1px solid var(--border);
	}

	.input-with-prefix input {
		border: none;
		background: none;
		flex: 1;
	}

	/* EDITOR */
	.editor-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 1.2rem;
		background: rgba(0,0,0,0.25);
	}

	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.8rem;
		border-bottom: 1px solid var(--border);
		padding-bottom: 0.8rem;
	}

	.editor-toolbar {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.editor-toolbar button {
		background: rgba(255,255,255,0.06);
		border: 1px solid var(--border);
		color: var(--text);
		padding: 0.4rem 0.8rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1.2rem;
	}

	.editor-toolbar button:hover {
		background: var(--primary);
		color: var(--bg-dark);
	}

	.btn-toggle-preview {
		background: var(--primary-tint) !important;
		color: var(--primary) !important;
		font-weight: 600;
	}

	.markdown-preview {
		padding: 1.6rem;
		background: rgba(0,0,0,0.4);
		border-radius: 6px;
		min-height: 20rem;
		color: var(--text);
		font-size: 1.4rem;
		line-height: 1.6;
	}

	.preview-note {
		font-size: 1.1rem;
		color: var(--primary);
		text-transform: uppercase;
		margin-bottom: 1rem;
	}

	.upload-zone {
		border: 2px dashed var(--border);
		padding: 2rem;
		text-align: center;
		border-radius: 8px;
		background: rgba(0,0,0,0.2);
	}

	.cover-preview {
		max-width: 100%;
		max-height: 240px;
		object-fit: cover;
		border-radius: 8px;
		border: 1px solid var(--border);
		margin-top: 1rem;
	}

	/* GOOGLE SNIPPET */
	.google-snippet-preview {
		background: #fff;
		color: #4d5156;
		padding: 1.6rem;
		border-radius: 8px;
		font-family: Arial, sans-serif;
	}

	.snippet-url { font-size: 1.2rem; color: #202124; display: block; }
	.snippet-title { font-size: 1.8rem; color: #1a0dab; font-weight: 600; display: block; margin: 0.4rem 0; cursor: pointer; }
	.snippet-desc { font-size: 1.3rem; line-height: 1.4; color: #4d5156; }

	.modal-footer {
		padding: 1.6rem 2.4rem;
		border-top: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(0,0,0,0.3);
	}

	.switch-label {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		font-size: 1.3rem;
		color: var(--text);
		cursor: pointer;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
	}

	.btn {
		padding: 0.8rem 1.6rem;
		border-radius: 6px;
		font-size: 1.3rem;
		font-weight: 600;
		cursor: pointer;
		border: 1px solid transparent;
		transition: all 0.2s;
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
	}

	.btn-primary {
		background: var(--primary);
		color: var(--bg-dark);
		border-color: var(--primary);
	}

	.btn-primary:hover {
		background: var(--primary-light);
	}

	.btn-secondary {
		background: rgba(255,255,255,0.08);
		color: var(--text);
	}

	.btn-outline {
		background: none;
		border: 1px solid var(--primary);
		color: var(--primary);
	}

	.empty-state {
		text-align: center;
		padding: 4rem;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 8px;
	}
	
	.empty-state p {
		color: var(--text-grey);
		font-size: 1.4rem;
	}

	@media (max-width: 950px) {
		.article-modal-split {
			grid-template-columns: 1fr;
		}
		.mobile-tabs-switch {
			display: flex;
		}
		.mobile-hidden {
			display: none !important;
		}
	}
</style>
