<script lang="ts">
	let {
		post = {
			title: 'Ghid Tactic Airsoft',
			slug: 'ghid-tactic-airsoft',
			excerpt: 'Descriere scurtă a articolului...',
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
		}
	}: {
		post: any;
	} = $props();

	let previewTab = $state<'card' | 'reader' | 'seo'>('card');

	function resolveImage(url: string | null | undefined): string {
		if (!url) return 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80';
		if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
			return url;
		}
		return 'http://localhost:8080/' + url.replace(/^\//, '');
	}

	function parseMarkdown(md: string): string {
		if (!md) return '<p style="color:#777; font-style:italic;">Conținutul articolului va fi randat aici pe măsură ce scrii în editor...</p>';
		return md
			.replace(/^# (.*$)/gim, '<h1 class="hud-h1">$1</h1>')
			.replace(/^## (.*$)/gim, '<h2 class="hud-h2">$1</h2>')
			.replace(/^### (.*$)/gim, '<h3 class="hud-h3">$1</h3>')
			.replace(/^#### (.*$)/gim, '<h4 class="hud-h4">$1</h4>')
			.replace(/^> (.*$)/gim, '<blockquote class="hud-quote">$1</blockquote>')
			.replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#c5a030;">$1</strong>')
			.replace(/\*(.*?)\*/gim, '<em>$1</em>')
			.replace(/^---$/gim, '<hr class="hud-hr" />')
			.replace(/^- (.*$)/gim, '<li class="hud-li">$1</li>')
			.replace(/^\d+\. (.*$)/gim, '<li class="hud-li-num">$1</li>')
			.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" style="color:#c5a030; text-decoration:underline;">$1</a>')
			.split('\n\n')
			.map((para) => {
				const trimmed = para.trim();
				if (!trimmed) return '';
				if (
					trimmed.startsWith('<h') ||
					trimmed.startsWith('<blockquote') ||
					trimmed.startsWith('<hr') ||
					trimmed.startsWith('<li')
				) {
					return trimmed;
				}
				return `<p class="hud-p">${trimmed.replaceAll('\n', '<br/>')}</p>`;
			})
			.join('\n');
	}

	const formattedDate = $derived(
		post.published_at
			? new Date(post.published_at).toLocaleDateString('ro-RO', { year: 'numeric', month: 'short', day: 'numeric' })
			: new Date().toLocaleDateString('ro-RO', { year: 'numeric', month: 'short', day: 'numeric' })
	);
</script>

<div class="article-preview-hud">
	<!-- HUD HEADER BAR -->
	<div class="hud-header">
		<div class="hud-header__title">
			<span class="hud-live-dot"></span>
			<span>Preview Articol în Timp Real</span>
		</div>
		<div class="hud-view-modes">
			<button
				type="button"
				class="hud-mode-btn"
				class:active={previewTab === 'card'}
				onclick={() => (previewTab = 'card')}
				title="Previzualizează Cardul de Blog"
			>
				⊞ Card Blog
			</button>
			<button
				type="button"
				class="hud-mode-btn"
				class:active={previewTab === 'reader'}
				onclick={() => (previewTab = 'reader')}
				title="Previzualizează Pagina Completă de Articol"
			>
				📖 Pagină Articol
			</button>
			<button
				type="button"
				class="hud-mode-btn"
				class:active={previewTab === 'seo'}
				onclick={() => (previewTab = 'seo')}
				title="Previzualizează Snippet Google Search"
			>
				🔍 Google SEO
			</button>
		</div>
	</div>

	<!-- HUD CONTENT BODY -->
	<div class="hud-viewport">
		{#if previewTab === 'card'}
			<!-- 1. CARD BLOG PREVIEW -->
			<div class="card-preview-wrap">
				<div class="preview-device-label">📱 Aspect Card în Grila de Blog (Website):</div>
				<article class="hud-blog-card">
					<div class="hud-blog-card__media">
						<img src={resolveImage(post.featured_image)} alt={post.title} />
						<span class="hud-badge-category">{post.category || 'Ghid'}</span>
						<span class="hud-badge-status" class:published={post.is_published}>
							{post.is_published ? '🟢 Publicat' : '⚪ Ciornă'}
						</span>
					</div>
					<div class="hud-blog-card__body">
						<div class="hud-meta-row">
							<span class="hud-meta-item">📅 {formattedDate}</span>
							<span class="hud-meta-item">⏱ {post.reading_time_min || 3} min de citit</span>
						</div>
						<h3 class="hud-card-title">{post.title || 'Titlul articolului va apărea aici...'}</h3>
						<p class="hud-card-excerpt">
							{post.excerpt || 'Rezumatul scurt al articolului va apărea aici, captivând atenția cititorilor...'}
						</p>
						{#if post.tags && post.tags.length > 0}
							<div class="hud-tags-row">
								{#each post.tags as tag}
									<span class="hud-tag">#{tag}</span>
								{/each}
							</div>
						{/if}
						<div class="hud-card-footer">
							<span class="hud-author">👤 {post.author || 'Echipa HTCMX'}</span>
							<span class="hud-read-link">Citește Articolul →</span>
						</div>
					</div>
				</article>
			</div>

		{:else if previewTab === 'reader'}
			<!-- 2. FULL ARTICLE READER PREVIEW -->
			<div class="reader-preview-wrap">
				<div class="preview-device-label">📖 Aspect Pagină Articol (`articol.html`):</div>
				<div class="hud-reader-page">
					<!-- Hero Banner -->
					<div class="hud-reader-hero">
						<img src={resolveImage(post.featured_image)} alt={post.title} class="hud-reader-hero__img" />
						<div class="hud-reader-hero__overlay">
							<span class="hud-reader-cat">{post.category || 'Ghid'}</span>
							<h1 class="hud-reader-title">{post.title || 'Titlu Articol'}</h1>
							<div class="hud-reader-meta">
								<span>👤 {post.author || 'Echipa HTCMX'}</span>
								<span>📅 {formattedDate}</span>
								<span>⏱ {post.reading_time_min || 3} min de citit</span>
							</div>
						</div>
					</div>

					<!-- Rendered Markdown Body -->
					<div class="hud-reader-body">
						{#if post.excerpt}
							<div class="hud-reader-lead">
								{post.excerpt}
							</div>
						{/if}

						<div class="hud-rendered-markdown">
							{@html parseMarkdown(post.content)}
						</div>
					</div>
				</div>
			</div>

		{:else if previewTab === 'seo'}
			<!-- 3. GOOGLE SEO SNIPPET PREVIEW -->
			<div class="seo-preview-wrap">
				<div class="preview-device-label">🔍 Rezultat Căutare Google (SERP Preview):</div>
				<div class="hud-google-serp">
					<div class="serp-site-info">
						<div class="serp-favicon">H</div>
						<div class="serp-site-text">
							<span class="serp-domain">HTCMX Tabere Airsoft</span>
							<span class="serp-url">https://taberehtcmx.ro/blog/{post.slug || 'slug-articol'}</span>
						</div>
					</div>
					<h3 class="serp-title">
						{post.meta_title || (post.title ? `${post.title} — HTCMX Tabere` : 'Titlu Articol — HTCMX')}
					</h3>
					<p class="serp-snippet">
						<span class="serp-date">{formattedDate} — </span>
						{post.meta_description || post.excerpt || 'Descrierea meta a articolului optimizată pentru indexarea în Google și atragerea de click-uri calificate.'}
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.article-preview-hud {
		background: linear-gradient(180deg, #091c09 0%, #050f05 100%);
		border: 1px solid var(--border-strong);
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
	}

	.hud-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.2rem 1.6rem;
		background: rgba(0, 0, 0, 0.4);
		border-bottom: 1px solid var(--border);
	}

	.hud-header__title {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		font-size: 1.3rem;
		font-weight: 800;
		color: var(--primary-light);
	}

	.hud-live-dot {
		width: 8px;
		height: 8px;
		background: #51cf66;
		border-radius: 50%;
		box-shadow: 0 0 8px #51cf66;
		animation: pulseDot 1.5s infinite;
	}

	@keyframes pulseDot {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(1.3); }
	}

	.hud-view-modes {
		display: flex;
		gap: 0.4rem;
		background: rgba(0, 0, 0, 0.5);
		padding: 0.3rem;
		border-radius: 8px;
		border: 1px solid var(--border);
	}

	.hud-mode-btn {
		background: transparent;
		border: none;
		color: var(--text-grey);
		padding: 0.4rem 0.9rem;
		border-radius: 6px;
		font-size: 1.15rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
	}

	.hud-mode-btn.active {
		background: var(--bg-card);
		color: var(--primary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.hud-viewport {
		padding: 1.6rem;
		overflow-y: auto;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.preview-device-label {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-grey);
		margin-bottom: 1.2rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	/* CARD PREVIEW */
	.card-preview-wrap {
		display: flex;
		flex-direction: column;
		max-width: 440px;
		margin: 0 auto;
		width: 100%;
	}

	.hud-blog-card {
		background: linear-gradient(175deg, #0d250d 0%, #071607 100%);
		border: 1px solid rgba(197, 160, 48, 0.3);
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 14px 35px rgba(0, 0, 0, 0.6);
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
	}

	.hud-blog-card:hover {
		transform: translateY(-4px);
		border-color: var(--primary);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(197, 160, 48, 0.2);
	}

	.hud-blog-card__media {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: #000;
	}

	.hud-blog-card__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.4s ease;
	}

	.hud-blog-card:hover .hud-blog-card__media img {
		transform: scale(1.05);
	}

	.hud-badge-category {
		position: absolute;
		top: 12px;
		left: 12px;
		background: rgba(13, 37, 13, 0.85);
		backdrop-filter: blur(8px);
		border: 1px solid var(--primary);
		color: var(--primary-light);
		font-size: 1.1rem;
		font-weight: 800;
		padding: 0.3rem 0.9rem;
		border-radius: 20px;
		text-transform: uppercase;
	}

	.hud-badge-status {
		position: absolute;
		top: 12px;
		right: 12px;
		background: rgba(0, 0, 0, 0.75);
		border: 1px solid #666;
		color: #aaa;
		font-size: 1.05rem;
		font-weight: 700;
		padding: 0.2rem 0.7rem;
		border-radius: 6px;
	}

	.hud-badge-status.published {
		border-color: rgba(81, 207, 102, 0.6);
		color: #51cf66;
	}

	.hud-blog-card__body {
		padding: 1.8rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
	}

	.hud-meta-row {
		display: flex;
		justify-content: space-between;
		font-size: 1.15rem;
		color: var(--text-grey);
	}

	.hud-card-title {
		font-size: 1.6rem;
		font-weight: 800;
		color: #ffffff;
		line-height: 1.35;
		margin: 0;
	}

	.hud-card-excerpt {
		font-size: 1.3rem;
		color: #b0c4b0;
		line-height: 1.5;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.hud-tags-row {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
	}

	.hud-tag {
		background: rgba(197, 160, 48, 0.1);
		color: var(--primary-light);
		border: 1px solid rgba(197, 160, 48, 0.25);
		padding: 0.2rem 0.6rem;
		border-radius: 4px;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.hud-card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1.2rem;
		border-top: 1px solid rgba(197, 160, 48, 0.15);
		margin-top: auto;
	}

	.hud-author {
		font-size: 1.2rem;
		color: var(--text-grey);
		font-weight: 600;
	}

	.hud-read-link {
		color: var(--primary);
		font-size: 1.25rem;
		font-weight: 800;
	}

	/* READER PREVIEW */
	.reader-preview-wrap {
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	.hud-reader-page {
		background: #081608;
		border: 1px solid var(--border);
		border-radius: 14px;
		overflow: hidden;
	}

	.hud-reader-hero {
		position: relative;
		width: 100%;
		height: 220px;
		background: #000;
	}

	.hud-reader-hero__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.65;
	}

	.hud-reader-hero__overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(8, 22, 8, 0.95) 100%);
		padding: 2rem;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: 0.8rem;
	}

	.hud-reader-cat {
		display: inline-block;
		background: var(--primary);
		color: var(--bg-dark);
		font-size: 1.1rem;
		font-weight: 800;
		padding: 0.2rem 0.8rem;
		border-radius: 4px;
		text-transform: uppercase;
		align-self: flex-start;
	}

	.hud-reader-title {
		font-size: 2rem;
		font-weight: 800;
		color: #ffffff;
		margin: 0;
		line-height: 1.25;
	}

	.hud-reader-meta {
		display: flex;
		gap: 1.4rem;
		font-size: 1.2rem;
		color: var(--text-grey);
	}

	.hud-reader-body {
		padding: 2.4rem;
		max-height: 480px;
		overflow-y: auto;
	}

	.hud-reader-lead {
		font-size: 1.45rem;
		font-style: italic;
		color: #d1dfd1;
		border-left: 4px solid var(--primary);
		padding-left: 1.4rem;
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	:global(.hud-rendered-markdown) {
		color: #d8e5d8;
		font-size: 1.35rem;
		line-height: 1.7;
	}

	:global(.hud-rendered-markdown .hud-h1) { font-size: 2rem; color: #fff; margin: 1.8rem 0 1rem 0; border-bottom: 1px solid rgba(197, 160, 48, 0.2); padding-bottom: 0.6rem; }
	:global(.hud-rendered-markdown .hud-h2) { font-size: 1.7rem; color: var(--primary-light); margin: 1.6rem 0 0.8rem 0; }
	:global(.hud-rendered-markdown .hud-h3) { font-size: 1.5rem; color: #fff; margin: 1.4rem 0 0.6rem 0; }
	:global(.hud-rendered-markdown .hud-quote) { border-left: 4px solid var(--primary); background: rgba(197, 160, 48, 0.08); padding: 1rem 1.4rem; border-radius: 0 8px 8px 0; margin: 1.4rem 0; font-style: italic; }
	:global(.hud-rendered-markdown .hud-hr) { border: 0; border-top: 1px solid rgba(197, 160, 48, 0.2); margin: 2rem 0; }
	:global(.hud-rendered-markdown .hud-li) { margin-left: 2rem; list-style-type: disc; margin-bottom: 0.4rem; }
	:global(.hud-rendered-markdown .hud-p) { margin-bottom: 1.2rem; }

	/* GOOGLE SEO PREVIEW */
	.seo-preview-wrap {
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	.hud-google-serp {
		background: #ffffff;
		border-radius: 12px;
		padding: 1.8rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
		font-family: Arial, sans-serif;
	}

	.serp-site-info {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		margin-bottom: 0.6rem;
	}

	.serp-favicon {
		width: 26px;
		height: 26px;
		background: #0d250d;
		color: #c5a030;
		font-weight: 800;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.3rem;
	}

	.serp-site-text {
		display: flex;
		flex-direction: column;
	}

	.serp-domain {
		font-size: 1.2rem;
		color: #202124;
		font-weight: 500;
	}

	.serp-url {
		font-size: 1.1rem;
		color: #4d5156;
	}

	.serp-title {
		font-size: 1.8rem;
		color: #1a0dab;
		font-weight: 400;
		line-height: 1.3;
		margin: 0 0 0.6rem 0;
		cursor: pointer;
	}

	.serp-title:hover {
		text-decoration: underline;
	}

	.serp-snippet {
		font-size: 1.3rem;
		color: #4d5156;
		line-height: 1.5;
		margin: 0;
	}

	.serp-date {
		color: #70757a;
	}
</style>
