<script lang="ts">
	import type { Post } from '$lib/types';

	let { articole, onEditPost }: {
		articole: Post[];
		onEditPost: (post: Post) => void;
	} = $props();

	let filterCluster = $state<string>('all');

	// Sortăm cronologic articolele după data publicării
	const sortedPosts = $derived(
		[...articole].sort((a, b) => {
			const da = new Date(a.published_at || a.created_at || 0).getTime();
			const db = new Date(b.published_at || b.created_at || 0).getTime();
			return da - db;
		})
	);

	const now = new Date();

	function isFuture(dateStr: string | null | undefined): boolean {
		if (!dateStr) return false;
		return new Date(dateStr) > now;
	}

	function formatDate(dateStr: string | null | undefined): string {
		if (!dateStr) return 'Fără dată';
		const d = new Date(dateStr);
		return d.toLocaleDateString('ro-RO', {
			weekday: 'short',
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}) + ' la ' + d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
	}

	function countInternalLinks(content: string | null | undefined): number {
		if (!content) return 0;
		const matches = content.match(/\[.*?\]\(\/blog\/.*?\)/g);
		return matches ? matches.length : 0;
	}

	const filteredPosts = $derived(
		sortedPosts.filter(p => {
			if (filterCluster === 'all') return true;
			if (filterCluster === 'vesta') return p.title.toLowerCase().includes('vesta') || (p.tags || []).some((t: string) => t.toLowerCase().includes('vesta'));
			if (filterCluster === 'future') return isFuture(p.published_at);
			return p.category === filterCluster;
		})
	);
</script>

<div class="scheduler-container">
	<div class="scheduler-header">
		<div class="scheduler-intro">
			<h2>📅 Calendar & Scheduler Postări Zilnice Blog</h2>
			<p>Planificarea automată a articolelor cu publicare cadențată și link building dinamic integrat.</p>
		</div>

		<div class="scheduler-filters">
			<button class="pill-btn {filterCluster === 'all' ? 'active' : ''}" onclick={() => filterCluster = 'all'}>
				Toate ({sortedPosts.length})
			</button>
			<button class="pill-btn {filterCluster === 'future' ? 'active' : ''}" onclick={() => filterCluster = 'future'}>
				⏰ Doar Programate Viitor
			</button>
			<button class="pill-btn {filterCluster === 'vesta' ? 'active' : ''}" onclick={() => filterCluster = 'vesta'}>
				🎯 Cluster Veste Tactice
			</button>
		</div>
	</div>

	{#if filteredPosts.length === 0}
		<div class="empty-scheduler">
			<p>Nu există articole în această secțiune a calendarului.</p>
		</div>
	{:else}
		<div class="timeline">
			{#each filteredPosts as post (post.id)}
				{@const future = isFuture(post.published_at)}
				{@const linkCount = countInternalLinks(post.content)}
				<div class="timeline-item {future ? 'item-scheduled' : 'item-published'}">
					<div class="timeline-dot"></div>
					<div class="timeline-card">
						<div class="card-meta-top">
							<span class="schedule-date">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
								{formatDate(post.published_at)}
							</span>
							{#if future}
								<span class="badge-status badge-scheduled">⏳ Programat Automat</span>
							{:else}
								<span class="badge-status badge-live">🟢 Live pe Site</span>
							{/if}
						</div>

						<div class="card-body">
							<h3 class="card-title">{post.title}</h3>
							<p class="card-slug"><code>/{post.slug}</code></p>
							{#if post.excerpt}
								<p class="card-excerpt">{post.excerpt}</p>
							{/if}

							<div class="card-footer-info">
								<span class="category-tag">{post.category || 'General'}</span>
								<span class="links-badge" title="Număr de legături interne construite conform algoritmului TAP">
									🔗 {linkCount} / 4 link-uri TAP
								</span>

								{#if post.tags && post.tags.length > 0}
									<div class="tags-row">
										{#each post.tags.slice(0, 3) as tag}
											<span class="keyword-pill">#{tag}</span>
										{/each}
									</div>
								{/if}
							</div>
						</div>

						<div class="card-actions">
							<button class="btn btn-secondary btn-sm" onclick={() => onEditPost(post)}>
								✏️ Editează / Ajustează Dată
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.scheduler-container {
		background: var(--bg-card, #13171d);
		border: 1px solid var(--border, rgba(255,255,255,0.08));
		border-radius: 10px;
		padding: 24px;
	}

	.scheduler-header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		margin-bottom: 24px;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
	}

	.scheduler-intro h2 {
		font-size: 1.8rem;
		margin: 0 0 6px 0;
		color: var(--gold, #c5a030);
	}

	.scheduler-intro p {
		margin: 0;
		font-size: 1.3rem;
		color: var(--text-grey, #9ca3af);
	}

	.scheduler-filters {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.pill-btn {
		background: rgba(255,255,255,0.05);
		border: 1px solid var(--border, rgba(255,255,255,0.1));
		color: var(--text, #e5e7eb);
		padding: 6px 14px;
		border-radius: 20px;
		font-size: 1.2rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.pill-btn:hover {
		background: rgba(255,255,255,0.1);
	}

	.pill-btn.active {
		background: var(--gold, #c5a030);
		color: #0b0e14;
		border-color: var(--gold, #c5a030);
		font-weight: 700;
	}

	.timeline {
		position: relative;
		padding-left: 28px;
		margin-top: 16px;
	}

	.timeline::before {
		content: '';
		position: absolute;
		left: 8px;
		top: 10px;
		bottom: 10px;
		width: 2px;
		background: rgba(197, 160, 48, 0.25);
	}

	.timeline-item {
		position: relative;
		margin-bottom: 22px;
	}

	.timeline-dot {
		position: absolute;
		left: -28px;
		top: 18px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #1e293b;
		border: 3px solid var(--gold, #c5a030);
		z-index: 2;
	}

	.item-scheduled .timeline-dot {
		border-color: #3b82f6;
		background: #1e3a8a;
	}

	.timeline-card {
		background: rgba(255,255,255,0.02);
		border: 1px solid var(--border, rgba(255,255,255,0.08));
		border-radius: 8px;
		padding: 16px 20px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		transition: transform 0.2s, border-color 0.2s;
	}

	.timeline-card:hover {
		border-color: rgba(197, 160, 48, 0.4);
		transform: translateY(-2px);
	}

	.card-meta-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 1.2rem;
	}

	.schedule-date {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--gold, #c5a030);
		font-weight: 600;
	}

	.badge-status {
		padding: 3px 8px;
		border-radius: 4px;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.badge-scheduled {
		background: rgba(59, 130, 246, 0.15);
		color: #60a5fa;
		border: 1px solid rgba(59, 130, 246, 0.3);
	}

	.badge-live {
		background: rgba(34, 197, 94, 0.15);
		color: #4ade80;
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.card-title {
		font-size: 1.6rem;
		margin: 0 0 4px 0;
		color: #fff;
	}

	.card-slug code {
		background: rgba(0,0,0,0.3);
		padding: 2px 6px;
		border-radius: 4px;
		color: #94a3b8;
		font-size: 1.15rem;
	}

	.card-excerpt {
		font-size: 1.25rem;
		color: #9ca3af;
		margin: 6px 0 0 0;
		line-height: 1.45;
	}

	.card-footer-info {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
		margin-top: 8px;
		padding-top: 10px;
		border-top: 1px dashed rgba(255,255,255,0.06);
	}

	.category-tag {
		background: rgba(197, 160, 48, 0.12);
		color: var(--gold, #c5a030);
		padding: 3px 8px;
		border-radius: 4px;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.links-badge {
		background: rgba(255,255,255,0.06);
		color: #e2e8f0;
		padding: 3px 8px;
		border-radius: 4px;
		font-size: 1.1rem;
	}

	.tags-row {
		display: flex;
		gap: 6px;
	}

	.keyword-pill {
		font-size: 1.1rem;
		color: #94a3b8;
	}

	.card-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 6px;
	}

	.empty-scheduler {
		text-align: center;
		padding: 40px;
		color: #9ca3af;
		font-size: 1.4rem;
	}
</style>
