<script lang="ts">
	import type { Post } from '$lib/types';

	let { articole }: { articole: Post[] } = $props();

	// Calculăm metricele grafului
	const totalNoduri = $derived(articole.length);

	function extractLinks(content: string | null | undefined): string[] {
		if (!content) return [];
		const regex = /\[.*?\]\((\/blog\/[a-zA-Z0-9_\-]+)\)/g;
		const matches = [];
		let match;
		while ((match = regex.exec(content)) !== null) {
			const slug = match[1].replace('/blog/', '');
			matches.push(slug);
		}
		return matches;
	}

	const graphData = $derived(
		articole.map(post => {
			const outSlugs = extractLinks(post.content);
			return {
				post,
				outSlugs,
				outDegree: outSlugs.length
			};
		})
	);

	const inDegrees = $derived(() => {
		const counts: Record<string, number> = {};
		for (const item of graphData) {
			for (const target of item.outSlugs) {
				counts[target] = (counts[target] || 0) + 1;
			}
		}
		return counts;
	});

	const totalMuchii = $derived(
		graphData.reduce((acc, curr) => acc + curr.outDegree, 0)
	);

	const densitateGraf = $derived(
		totalNoduri > 1 ? (totalMuchii / (totalNoduri * (totalNoduri - 1))).toFixed(3) : '0'
	);
</script>

<div class="graph-inspector">
	<div class="graph-header">
		<div>
			<h2>🕸️ Inspector Graf Link Building (Algoritm TAP)</h2>
			<p>Analiza structurii de graf orientat G = (V, E) conform principiilor de Tehnici Avansate de Programare.</p>
		</div>
	</div>

	<!-- Stats cards -->
	<div class="graph-stats-grid">
		<div class="g-stat-card">
			<span class="g-val">{totalNoduri}</span>
			<span class="g-lbl">Noduri (Articole |V|)</span>
		</div>
		<div class="g-stat-card">
			<span class="g-val">{totalMuchii}</span>
			<span class="g-lbl">Muchii Orientate (|E|)</span>
		</div>
		<div class="g-stat-card">
			<span class="g-val">{densitateGraf}</span>
			<span class="g-lbl">Densitate Graf (E/V²)</span>
		</div>
		<div class="g-stat-card">
			<span class="g-val">Max 4</span>
			<span class="g-lbl">Plafon Out-Degree SEO</span>
		</div>
	</div>

	<div class="algorithm-rule-box">
		<div class="rule-icon">💡</div>
		<div class="rule-content">
			<h4>Cum funcționează evoluția dinamică a legăturilor:</h4>
			<p>
				• <strong>Ziua 1 (Publicare):</strong> Articolul primește inițial 1-2 link-uri către pilonii existenți.<br>
				• <strong>Ziua 30 (Evoluție Graf):</strong> Pe măsură ce noi articole din cluster devin active, algoritmul rebalansează automat legăturile până la <strong>4 link-uri/articol</strong>.<br>
				• <strong>Anti-Spam & SILO:</strong> Graful prioritizează clusterul tematic (ex: Veste Tactice) și nu depășește niciodată 4 link-uri trimise, menținând un flux sănătos de autoritate Google.
			</p>
		</div>
	</div>

	<!-- Adjacency Table -->
	<div class="adj-table-wrap">
		<table class="adj-table">
			<thead>
				<tr>
					<th>Nod Articol (Slug)</th>
					<th>Cluster / Categorie</th>
					<th style="text-align:center">Out-Degree (Trimise)</th>
					<th style="text-align:center">In-Degree (Primite)</th>
					<th>Articole Conectate (Vecini)</th>
				</tr>
			</thead>
			<tbody>
				{#each graphData as item}
					{@const inCount = inDegrees()[item.post.slug] || 0}
					<tr>
						<td>
							<strong>{item.post.title}</strong>
							<br><code class="slug-code">/{item.post.slug}</code>
						</td>
						<td><span class="cat-pill">{item.post.category}</span></td>
						<td style="text-align:center">
							<span class="degree-badge out-badge">{item.outDegree} / 4</span>
						</td>
						<td style="text-align:center">
							<span class="degree-badge in-badge">{inCount}</span>
						</td>
						<td>
							{#if item.outSlugs.length === 0}
								<span style="color:#64748b; font-size:1.15rem;">Fără link-uri de ieșire</span>
							{:else}
								<div class="connected-slugs">
									{#each item.outSlugs as s}
										<span class="connected-pill">→ /{s}</span>
									{/each}
								</div>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.graph-inspector {
		background: var(--bg-card, #13171d);
		border: 1px solid var(--border, rgba(255,255,255,0.08));
		border-radius: 10px;
		padding: 24px;
	}

	.graph-header h2 {
		font-size: 1.8rem;
		margin: 0 0 6px 0;
		color: var(--gold, #c5a030);
	}

	.graph-header p {
		margin: 0 0 20px 0;
		font-size: 1.3rem;
		color: var(--text-grey, #9ca3af);
	}

	.graph-stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 14px;
		margin-bottom: 24px;
	}

	.g-stat-card {
		background: rgba(255,255,255,0.02);
		border: 1px solid var(--border, rgba(255,255,255,0.08));
		border-radius: 8px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.g-val {
		font-size: 2.2rem;
		font-weight: 700;
		color: var(--gold, #c5a030);
	}

	.g-lbl {
		font-size: 1.15rem;
		color: #94a3b8;
	}

	.algorithm-rule-box {
		background: rgba(197, 160, 48, 0.08);
		border: 1px solid rgba(197, 160, 48, 0.25);
		border-radius: 8px;
		padding: 16px 20px;
		display: flex;
		gap: 16px;
		align-items: flex-start;
		margin-bottom: 24px;
	}

	.rule-icon {
		font-size: 2rem;
	}

	.rule-content h4 {
		margin: 0 0 6px 0;
		font-size: 1.4rem;
		color: var(--gold, #c5a030);
	}

	.rule-content p {
		margin: 0;
		font-size: 1.25rem;
		color: #e2e8f0;
		line-height: 1.5;
	}

	.adj-table-wrap {
		overflow-x: auto;
		border: 1px solid var(--border, rgba(255,255,255,0.08));
		border-radius: 8px;
	}

	.adj-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 1.25rem;
	}

	.adj-table th, .adj-table td {
		padding: 12px 16px;
		border-bottom: 1px solid rgba(255,255,255,0.06);
		text-align: left;
	}

	.adj-table th {
		background: rgba(0,0,0,0.3);
		color: #94a3b8;
		font-weight: 600;
	}

	.slug-code {
		color: #64748b;
		font-size: 1.1rem;
	}

	.cat-pill {
		background: rgba(255,255,255,0.05);
		padding: 3px 8px;
		border-radius: 4px;
		font-size: 1.1rem;
		color: #cbd5e1;
	}

	.degree-badge {
		padding: 3px 10px;
		border-radius: 12px;
		font-weight: 700;
		font-size: 1.15rem;
	}

	.out-badge {
		background: rgba(59, 130, 246, 0.15);
		color: #60a5fa;
		border: 1px solid rgba(59, 130, 246, 0.3);
	}

	.in-badge {
		background: rgba(34, 197, 94, 0.15);
		color: #4ade80;
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.connected-slugs {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.connected-pill {
		background: rgba(0,0,0,0.4);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 1.1rem;
		color: #94a3b8;
	}
</style>
