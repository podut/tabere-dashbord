<script lang="ts">
	// Replica cardului public de serviciu din tabere-website
	// (script.js -> createServiceCard / createMiniGallery, style.css -> .service-card__*).
	// Culorile sunt cele ale site-ului, nu variabilele din admin, ca previzualizarea
	// sa arate exact ca pagina reala.
	let { service }: { service: any } = $props();

	const FALLBACK_IMG = 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80';

	// Site-ul foloseste `s.gallery || [4 poze demo]` — un array gol ramane gol,
	// deci nu afiseaza niciun thumbnail. Replicam exact acelasi comportament.
	const galleryPhotos = $derived(
		Array.isArray(service.gallery) ? service.gallery : [service.image_url || FALLBACK_IMG]
	);

	// indexul pozei mari; site-ul schimba imaginea principala la click pe thumbnail
	let activeIdx = $state(0);

	const mainImage = $derived(
		galleryPhotos[activeIdx] || service.image_url || FALLBACK_IMG
	);

	const priceText = $derived(
		service.price_label || (service.price ? `${service.price} RON` : 'La cerere')
	);

	const descText = $derived(service.description || service.full_desc || '');
	const includes = $derived(Array.isArray(service.includes) ? service.includes : []);
</script>

<article class="service-card">
	<div class="service-card__img-wrap">
		<img
			src={mainImage}
			alt={service.title || 'Serviciu'}
			class="service-card__img"
			onerror={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
		/>
		<div class="service-card__img-overlay"></div>
		<span class="service-card__badge">{service.category || 'Serviciu Tactic'}</span>
	</div>

	<div class="service-card__body">
		<h3 class="service-card__title">{service.title || 'Titlu Serviciu'}</h3>

		{#if descText}
			<p class="service-card__desc">{descText}</p>
		{/if}

		<div class="service-card__gallery-wrap">
			<div class="service-card__gallery-title">📷 Galerie Prezentare Serviciu:</div>
			{#if galleryPhotos.length === 0}
				<div class="gallery-empty-note">Nicio poză în galerie — pe site rândul rămâne gol.</div>
			{/if}
			<div class="service-card__gallery-track">
				{#each galleryPhotos.slice(0, 4) as photo, i}
					<button
						type="button"
						class="service-card__thumb"
						class:active={i === activeIdx}
						aria-label="Vezi poza {i + 1}"
						onclick={() => (activeIdx = i)}
					>
						<img src={photo} alt="{service.title} foto {i + 1}" />
					</button>
				{/each}
			</div>
		</div>

		{#if includes.length > 0}
			<ul class="service-card__features">
				{#each includes as inc}
					<li>{inc}</li>
				{/each}
			</ul>
		{/if}

		<div class="service-card__footer">
			<div class="service-card__price-row">
				<div class="service-card__price">{priceText}</div>
				<span class="service-card__guarantee">🛡️ Garanție Inclusă</span>
			</div>
			<!-- butonul e inert in preview: pe site deschide modalul de rezervare -->
			<button type="button" class="service-card__btn" disabled>
				Înscrie-te la acest Serviciu →
			</button>
		</div>
	</div>
</article>

<style>
	.service-card {
		background: linear-gradient(175deg, #0d220d 0%, #061206 100%);
		border: 1px solid rgba(197, 160, 48, 0.25);
		border-top: 4px solid #c5a030;
		border-radius: 16px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55);
		position: relative;
	}

	.service-card__img-wrap {
		height: 190px;
		overflow: hidden;
		position: relative;
		background: #050e05;
		clip-path: polygon(0 0, 100% 0, 100% 90%, 0 100%);
	}

	.service-card__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		filter: brightness(0.92) contrast(1.05);
	}

	.service-card__img-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, rgba(5, 14, 5, 0.05) 0%, rgba(5, 14, 5, 0.65) 100%);
		pointer-events: none;
	}

	.service-card__badge {
		position: absolute;
		top: 14px;
		left: 14px;
		padding: 4px 12px;
		background: rgba(5, 14, 5, 0.94);
		border: 1px solid #c5a030;
		color: #c5a030;
		font-size: 1.15rem;
		font-weight: 700;
		letter-spacing: 1.2px;
		text-transform: uppercase;
		border-radius: 4px;
	}

	.service-card__body {
		padding: 20px 22px 22px 22px;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.service-card__title {
		font-size: 2.1rem;
		color: #f0ede6;
		text-transform: uppercase;
		letter-spacing: 0.8px;
		margin: 0 0 10px 0;
		line-height: 1.3;
		font-weight: 700;
	}

	.service-card__desc {
		color: rgba(240, 237, 230, 0.7);
		font-size: 1.4rem;
		line-height: 1.55;
		margin: 0 0 14px 0;
		flex: 1;
	}

	.service-card__gallery-wrap {
		margin: 0 0 14px 0;
	}

	.service-card__gallery-title {
		font-size: 1.15rem;
		color: #c5a030;
		text-transform: uppercase;
		letter-spacing: 0.8px;
		margin-bottom: 6px;
		display: flex;
		align-items: center;
		gap: 5px;
	}

	/* nu exista pe site — doar in preview, ca sa se vada de ce lipsesc pozele */
	.gallery-empty-note {
		font-size: 1.15rem;
		color: rgba(240, 237, 230, 0.45);
		font-style: italic;
		padding: 0.4rem 0;
	}

	.service-card__gallery-track {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}

	.service-card__thumb {
		aspect-ratio: 4 / 3;
		border-radius: 6px;
		overflow: hidden;
		border: 1px solid rgba(197, 160, 48, 0.25);
		background: #050e05;
		cursor: pointer;
		transition: all 0.25s ease;
		padding: 0;
	}

	.service-card__thumb:hover,
	.service-card__thumb.active {
		border-color: #c5a030;
		transform: scale(1.05);
		box-shadow: 0 0 10px rgba(197, 160, 48, 0.4);
	}

	.service-card__thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.service-card__features {
		list-style: none;
		padding: 12px 0 0 0;
		margin: 0 0 18px 0;
		display: flex;
		flex-direction: column;
		gap: 7px;
		border-top: 1px dashed rgba(197, 160, 48, 0.25);
	}

	.service-card__features li {
		font-size: 1.3rem;
		color: rgba(240, 237, 230, 0.7);
		display: flex;
		align-items: center;
		gap: 8px;
		line-height: 1.4;
	}

	.service-card__features li::before {
		content: '✓';
		color: #c5a030;
		font-weight: 900;
		font-size: 1.5rem;
	}

	.service-card__footer {
		padding-top: 14px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.service-card__price-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.8rem;
		flex-wrap: wrap;
	}

	.service-card__price {
		font-size: 2rem;
		color: #c5a030;
		font-weight: 700;
		line-height: 1.1;
		white-space: nowrap;
	}

	.service-card__guarantee {
		font-size: 1.2rem;
		color: #4ade80;
		background: rgba(34, 197, 94, 0.12);
		border: 1px solid rgba(34, 197, 94, 0.3);
		padding: 3px 10px;
		border-radius: 12px;
		font-weight: 600;
		white-space: nowrap;
	}

	.service-card__btn {
		width: 100%;
		padding: 11px 16px;
		background: #c5a030;
		color: #000;
		font-size: 1.45rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		border: none;
		border-radius: 100px;
		text-align: center;
		box-shadow: 0 4px 14px rgba(197, 160, 48, 0.3);
		cursor: default;
		opacity: 0.95;
	}
</style>
