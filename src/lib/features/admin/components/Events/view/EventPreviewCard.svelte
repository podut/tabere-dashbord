<script lang="ts">
	import type { EventRow, Booking } from '$lib/types';

	let {
		ev,
		rezervari = [],
		onEdit,
		onFinalize,
		onDelete,
		onGallery,
		acum
	}: {
		ev: EventRow;
		rezervari?: Booking[];
		onEdit: (ev: EventRow) => void;
		onFinalize: (id: string) => void;
		onDelete: (ev: EventRow) => void;
		onGallery: (ev: EventRow) => void;
		acum: Date;
	} = $props();

	// Calculate occupied slots from bookings
	const confirmedCount = $derived(
		rezervari.filter((r) => r.event_id === ev.id && r.status === 'confirmat').length
	);
	const maxCap = $derived(ev.max_participants || 30);
	const availableSlots = $derived(Math.max(0, maxCap - confirmedCount));
	const percentFilled = $derived(Math.min(100, Math.round((confirmedCount / maxCap) * 100)));

	// Date formatting
	const eventDate = $derived(ev.date ? new Date(ev.date) : null);
	const isPast = $derived(eventDate ? eventDate < acum : false);
	const isExpiredActive = $derived(isPast && ev.status === 'active');

	const dateFormatted = $derived(
		eventDate
			? eventDate.toLocaleDateString('ro-RO', {
					day: '2-digit',
					month: 'short',
					year: 'numeric'
				})
			: 'Dată nestabilită'
	);

	// Thumbnail image
	const imageUrl = $derived(
		ev.image_url ||
		(Array.isArray(ev.gallery) && ev.gallery.length > 0 ? ev.gallery[0] : null) ||
		'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80'
	);

	const galleryCount = $derived(Array.isArray(ev.gallery) ? ev.gallery.length : 0);
</script>

<article class="event-card" class:card-expired={isExpiredActive} class:card-finished={ev.status === 'finished'}>
	<!-- 1. VISUAL PREVIEW BANNER -->
	<div class="event-card__banner">
		<img
			src={imageUrl}
			alt={ev.title}
			class="event-card__img"
			loading="lazy"
			onerror={(e) => {
				const img = e.currentTarget as HTMLImageElement;
				img.src = 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80';
			}}
		/>
		<div class="event-card__gradient"></div>

		<!-- Top Badges -->
		<div class="event-card__top-bar">
			<div class="event-card__type-group">
				<span class="badge-type">{ev.type || 'MILSIM'}</span>
				{#if !ev.is_public}
					<span class="badge-private" title={ev.event_code ? `Cod: ${ev.event_code}` : 'Misiune Privată'}>
						🔒 {ev.event_code || 'PRIVAT'}
					</span>
				{:else}
					<span class="badge-public" title="Vizibil public pe site">🌐 PUBLIC</span>
				{/if}
			</div>

			<div class="event-card__status-wrap">
				{#if isExpiredActive}
					<span class="badge-status status-expired" title="Data evenimentului a trecut. Necesită finalizare.">
						<span class="pulse-dot red"></span> Necesită Finalizare
					</span>
				{:else if ev.status === 'active'}
					<span class="badge-status status-active">
						<span class="pulse-dot green"></span> Activ
					</span>
				{:else}
					<span class="badge-status status-finished">
						⚪ Finalizat
					</span>
				{/if}
			</div>
		</div>

		<!-- Bottom Banner Overlay Meta -->
		<div class="event-card__bottom-bar">
			<div class="datetime-pill">
				<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
				<span>{dateFormatted} · {ev.start_time || '10:00'}</span>
			</div>

			<button
				type="button"
				class="gallery-trigger-btn"
				onclick={(e) => {
					e.stopPropagation();
					onGallery(ev);
				}}
				title="Gestionează galeria foto"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
				<span>{galleryCount > 0 ? `${galleryCount} Foto` : '+ Foto'}</span>
			</button>
		</div>
	</div>

	<!-- 2. CARD BODY & TACTICAL INFO -->
	<div class="event-card__body">
		<!-- Title & Location -->
		<div class="event-card__header">
			<h3 class="event-card__title" onclick={() => onEdit(ev)} title="Apasă pentru editare">
				{ev.title}
			</h3>
			<div class="event-card__meta-line">
				<span class="meta-item">
					<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
					{ev.location || 'Baza HTCMX Airsoft'}
				</span>
				{#if ev.duration}
					<span class="meta-item duration">
						<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
						{ev.duration}
					</span>
				{/if}
			</div>
		</div>

		{#if ev.description}
			<p class="event-card__desc">{ev.description}</p>
		{/if}

		<!-- HUD Specs Panel -->
		<div class="event-card__hud">
			<!-- Slot / Capacity Progress -->
			<div class="hud-slot-box">
				<div class="hud-slot-header">
					<span class="hud-label">Capacitate & Sloturi:</span>
					<span class="hud-count">
						<strong>{confirmedCount}</strong> / {maxCap} pers.
					</span>
				</div>
				<div class="hud-progress-track" title={`${percentFilled}% locuri ocupate`}>
					<div
						class="hud-progress-fill"
						class:hud-progress-full={percentFilled >= 90}
						style={`width: ${percentFilled}%`}
					></div>
				</div>
				<div class="hud-slot-sub">
					<span>🟢 {availableSlots} disponibile</span>
					{#if ev.capacity}
						<span class="hud-target">{ev.capacity}</span>
					{/if}
				</div>
			</div>

			<!-- Price Box -->
			<div class="hud-price-box">
				<span class="hud-label">Tarif Misiune:</span>
				<div class="hud-price-value">
					{ev.price || 0} <span class="currency">{ev.currency || 'RON'}</span>
				</div>
				<span class="hud-price-sub">/ participant</span>
			</div>
		</div>
	</div>

	<!-- 3. ACTIONS TOOLBAR -->
	<div class="event-card__footer">
		<button
			type="button"
			class="btn-card-action btn-edit"
			onclick={() => onEdit(ev)}
			title="Editează detaliile misiunii"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
			<span>Editează</span>
		</button>

		<button
			type="button"
			class="btn-card-action btn-gallery"
			onclick={() => onGallery(ev)}
			title="Gestionează galeria foto"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
			<span>Galerie</span>
		</button>

		{#if isExpiredActive}
			<button
				type="button"
				class="btn-card-action btn-finalize"
				onclick={() => onFinalize(ev.id)}
				title="Marchează misiunea ca finalizată"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
				<span>Finalizează</span>
			</button>
		{/if}

		<button
			type="button"
			class="btn-card-action btn-delete"
			onclick={() => onDelete(ev)}
			title="Șterge definitiv misiunea"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
		</button>
	</div>
</article>

<style>
	.event-card {
		background: linear-gradient(180deg, rgba(15, 43, 15, 0.95) 0%, rgba(10, 26, 10, 0.98) 100%);
		border: 1px solid var(--border);
		border-radius: 18px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
		transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
		position: relative;
	}

	.event-card:hover {
		transform: translateY(-4px);
		border-color: var(--border-strong);
		box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(197, 160, 48, 0.12);
	}

	.event-card.card-expired {
		border-color: rgba(224, 49, 49, 0.4);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35), 0 0 15px rgba(224, 49, 49, 0.1);
	}

	.event-card.card-finished {
		opacity: 0.82;
		filter: grayscale(0.2);
	}

	/* 1. BANNER & PREVIEW */
	.event-card__banner {
		position: relative;
		width: 100%;
		height: 190px;
		overflow: hidden;
		background: #061106;
	}

	.event-card__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		transition: transform 0.5s ease;
		display: block;
	}

	.event-card:hover .event-card__img {
		transform: scale(1.06);
	}

	.event-card__gradient {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 40%, rgba(15,43,15,0.95) 100%);
		pointer-events: none;
	}

	.event-card__top-bar {
		position: absolute;
		top: 1.2rem;
		left: 1.2rem;
		right: 1.2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.8rem;
		z-index: 2;
	}

	.event-card__type-group {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.badge-type {
		background: rgba(197, 160, 48, 0.22);
		border: 1px solid var(--primary);
		color: var(--primary-light);
		padding: 0.3rem 0.9rem;
		border-radius: 6px;
		font-size: 1.1rem;
		font-weight: 800;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		backdrop-filter: blur(8px);
	}

	.badge-public {
		background: rgba(0, 0, 0, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #e0e0e0;
		padding: 0.3rem 0.7rem;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 700;
		backdrop-filter: blur(6px);
	}

	.badge-private {
		background: rgba(197, 160, 48, 0.3);
		border: 1px solid var(--primary);
		color: #ffe066;
		padding: 0.3rem 0.7rem;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 700;
		backdrop-filter: blur(6px);
	}

	.badge-status {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.35rem 0.9rem;
		border-radius: 8px;
		font-size: 1.1rem;
		font-weight: 700;
		backdrop-filter: blur(8px);
	}

	.status-active {
		background: rgba(46, 125, 50, 0.4);
		border: 1px solid rgba(81, 207, 102, 0.5);
		color: #b2f2bb;
	}

	.status-expired {
		background: rgba(194, 37, 37, 0.45);
		border: 1px solid rgba(224, 49, 49, 0.6);
		color: #ffc9c9;
	}

	.status-finished {
		background: rgba(0, 0, 0, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: var(--text-grey);
	}

	.pulse-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
	}

	.pulse-dot.green {
		background: #51cf66;
		box-shadow: 0 0 8px #51cf66;
	}

	.pulse-dot.red {
		background: #ff6b6b;
		box-shadow: 0 0 8px #ff6b6b;
		animation: pulseRed 1.6s infinite;
	}

	@keyframes pulseRed {
		0%, 100% { transform: scale(1); opacity: 1; }
		50% { transform: scale(1.3); opacity: 0.5; }
	}

	.event-card__bottom-bar {
		position: absolute;
		bottom: 1rem;
		left: 1.2rem;
		right: 1.2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		z-index: 2;
	}

	.datetime-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(0, 0, 0, 0.75);
		border: 1px solid rgba(197, 160, 48, 0.3);
		padding: 0.4rem 0.9rem;
		border-radius: 8px;
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text);
		backdrop-filter: blur(6px);
	}

	.gallery-trigger-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(15, 43, 15, 0.85);
		border: 1px solid var(--border-strong);
		color: var(--primary);
		padding: 0.4rem 0.9rem;
		border-radius: 8px;
		font-size: 1.1rem;
		font-weight: 700;
		cursor: pointer;
		backdrop-filter: blur(6px);
		transition: all 0.2s;
	}

	.gallery-trigger-btn:hover {
		background: var(--primary);
		color: var(--bg-dark);
		border-color: var(--primary);
	}

	/* 2. BODY */
	.event-card__body {
		padding: 1.6rem 1.6rem 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
		flex: 1;
	}

	.event-card__title {
		font-size: 1.7rem;
		font-weight: 800;
		color: var(--text);
		line-height: 1.35;
		margin-bottom: 0.4rem;
		cursor: pointer;
		transition: color 0.2s;
	}

	.event-card__title:hover {
		color: var(--primary);
	}

	.event-card__meta-line {
		display: flex;
		align-items: center;
		gap: 1.2rem;
		flex-wrap: wrap;
		font-size: 1.2rem;
		color: var(--text-grey);
	}

	.meta-item {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.meta-item.duration {
		color: var(--primary-light);
		font-weight: 600;
	}

	.event-card__desc {
		font-size: 1.25rem;
		color: var(--text-grey);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin: 0;
	}

	/* HUD SPECS GRID */
	.event-card__hud {
		display: grid;
		grid-template-columns: 1.5fr 1fr;
		gap: 1rem;
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.2rem;
		margin-top: auto;
	}

	.hud-label {
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-grey);
		display: block;
		margin-bottom: 0.3rem;
	}

	.hud-slot-box {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.hud-slot-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.4rem;
	}

	.hud-count {
		font-size: 1.2rem;
		color: var(--text);
	}

	.hud-count strong {
		color: var(--primary);
		font-weight: 800;
	}

	.hud-progress-track {
		width: 100%;
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		overflow: hidden;
		margin-bottom: 0.4rem;
	}

	.hud-progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #51cf66 0%, #C5A030 100%);
		border-radius: 10px;
		transition: width 0.4s ease;
	}

	.hud-progress-full {
		background: linear-gradient(90deg, #C5A030 0%, #e03131 100%);
	}

	.hud-slot-sub {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 1.05rem;
		color: var(--text-grey);
	}

	.hud-target {
		color: var(--accent-blue);
		font-weight: 600;
	}

	.hud-price-box {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: flex-end;
		border-left: 1px solid var(--border);
		padding-left: 1rem;
	}

	.hud-price-value {
		font-size: 1.8rem;
		font-weight: 900;
		color: var(--primary);
		line-height: 1.1;
	}

	.hud-price-value .currency {
		font-size: 1.1rem;
		font-weight: 700;
	}

	.hud-price-sub {
		font-size: 1rem;
		color: var(--text-grey);
	}

	/* 3. FOOTER ACTIONS */
	.event-card__footer {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 1.2rem 1.6rem;
		background: rgba(0, 0, 0, 0.25);
		border-top: 1px solid var(--border);
	}

	.btn-card-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		padding: 0.8rem 1.4rem;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--bg-card);
		color: var(--text);
		font-size: 1.25rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
	}

	.btn-card-action:hover {
		transform: translateY(-1px);
	}

	.btn-edit {
		flex: 1;
		background: rgba(197, 160, 48, 0.12);
		border-color: var(--primary);
		color: var(--primary-light);
	}

	.btn-edit:hover {
		background: var(--primary);
		color: var(--bg-dark);
		box-shadow: 0 4px 14px rgba(197, 160, 48, 0.3);
	}

	.btn-gallery {
		background: rgba(111, 169, 196, 0.12);
		border-color: rgba(111, 169, 196, 0.35);
		color: var(--accent-blue);
	}

	.btn-gallery:hover {
		background: var(--accent-blue);
		color: var(--bg-dark);
	}

	.btn-finalize {
		background: rgba(81, 207, 102, 0.15);
		border-color: rgba(81, 207, 102, 0.4);
		color: #51cf66;
	}

	.btn-finalize:hover {
		background: #51cf66;
		color: var(--bg-dark);
	}

	.btn-delete {
		padding: 0.8rem 1rem;
		color: var(--text-grey);
		border-color: transparent;
		background: transparent;
	}

	.btn-delete:hover {
		background: rgba(224, 49, 49, 0.18);
		border-color: var(--danger);
		color: #ff8787;
	}

	@media (max-width: 480px) {
		.event-card__hud {
			grid-template-columns: 1fr;
		}
		.hud-price-box {
			border-left: none;
			border-top: 1px solid var(--border);
			padding-left: 0;
			padding-top: 0.8rem;
			align-items: flex-start;
		}
	}
</style>
