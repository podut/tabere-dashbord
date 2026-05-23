<script lang="ts">
	import { supabase, STORAGE_BUCKET } from '$lib/supabase';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import type { EventRow, Booking } from '$lib/types';

	import EventsTab from './EventsTab.svelte';
	import CereriTab from './CereriTab.svelte';
	import ConfirmatiTab from './ConfirmatiTab.svelte';
	import EventModal from './EventModal.svelte';
	import GalerieModal from './GalerieModal.svelte';
	import CropModal from './CropModal.svelte';
	import RepartizareModal from './RepartizareModal.svelte';

	let { evenimente = $bindable([]), rezervari = $bindable([]), servicii = [], refreshEvents, refreshBookings }: {
		evenimente: EventRow[];
		rezervari: Booking[];
		servicii: Service[];
		refreshEvents: () => Promise<void>;
		refreshBookings: () => Promise<void>;
	} = $props();

	type Tab = 'active' | 'finished' | 'cereri' | 'confirmati';
	let tabActiv = $state<Tab>('active');
	let showEvModal = $state(false);
	let showEvGalModal = $state(false);
	let editMode = $state(false);
	let saving = $state(false);

	let showRepartizareModal = $state(false);
	let bookingDeRepartizat = $state<Booking | null>(null);
	let pozitiiEveniment = $state<string[]>([]);
	let pozitiaSelectata = $state('');
	let savingRepartizare = $state(false);

	let evenimentCurent = $state<any>({
		id: '', title: '', type: 'Milsim', description: '',
		date: new Date().toISOString().slice(0, 10),
		start_time: '10:00', duration: '',
		location: 'Baza HTCMX Airsoft', price: 50, currency: 'RON',
		status: 'active', is_public: true, max_participants: 30,
		positions: [], image_url: '', gallery: [], origin_booking_id: ''
	});

	let cropImage = $state<string | null>(null);
	let cropContext = $state<string | null>(null);
	let incarcareFoto = $state(false);

	const numarCereri = $derived(rezervari.filter(r => r.status === 'nou' || !r.status).length);
	const numarConfirmati = $derived(rezervari.filter(r => r.status === 'confirmat').length);
	const numarFinalizate = $derived(evenimente.filter(e => e.status === 'finished').length);

	function deschideEveniment(ev: EventRow | null = null) {
		editMode = !!ev;
		evenimentCurent = ev
			? { ...ev, date: ev.date?.slice(0, 10), positions: ev.positions || [], gallery: ev.gallery || [] }
			: {
				title: '', type: 'Milsim', description: '',
				date: new Date().toISOString().slice(0, 10),
				start_time: '10:00', duration: '',
				location: 'Baza HTCMX Airsoft', price: 50, currency: 'RON',
				status: 'active', is_public: true, max_participants: 30,
				positions: [], image_url: '', gallery: [], origin_booking_id: ''
			};
		showEvModal = true;
	}

	async function salveazaEveniment(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		try {
			const dateStr = evenimentCurent.date
				? evenimentCurent.date.slice(0, 10) + 'T12:00:00'
				: new Date().toISOString();

			const payload = {
				title: evenimentCurent.title,
				type: evenimentCurent.type || '',
				description: evenimentCurent.description,
				date: dateStr,
				start_time: evenimentCurent.start_time || '10:00',
				duration: evenimentCurent.duration || '',
				capacity: evenimentCurent.capacity || '',
				location: evenimentCurent.location,
				price: evenimentCurent.price,
				currency: evenimentCurent.currency || 'RON',
				status: evenimentCurent.status,
				active: evenimentCurent.status === 'active',
				is_public: evenimentCurent.is_public ?? true,
				max_participants: evenimentCurent.max_participants || 30,
				positions: evenimentCurent.positions || [],
				image_url: evenimentCurent.image_url,
				gallery: evenimentCurent.gallery || [],
				origin_booking_id: evenimentCurent.origin_booking_id || ''
			};

			const { error } = editMode
				? await supabase.from('events').update(payload).eq('id', evenimentCurent.id)
				: await supabase.from('events').insert([payload]);

			if (error) throw error;

			if (!editMode && evenimentCurent.origin_booking_id) {
				await supabase.from('bookings').update({ status: 'confirmat' }).eq('id', evenimentCurent.origin_booking_id);
			}
			showEvModal = false;
			await refreshEvents();
			await refreshBookings();
			showToast('success', editMode ? 'Eveniment actualizat.' : 'Eveniment creat.');
		} catch (err: any) {
			showToast('error', err.message);
		} finally {
			saving = false;
		}
	}

	async function finalizeazaEveniment(id: string) {
		if (!(await confirmDialog({
			title: 'Finalizezi evenimentul?',
			message: 'Evenimentul va fi marcat ca finalizat și dezactivat.',
			confirmLabel: 'Finalizează',
			danger: false
		}))) return;

		const { error } = await supabase.from('events').update({ status: 'finished', active: false }).eq('id', id);
		if (!error) { await refreshEvents(); showToast('success', 'Eveniment finalizat.'); }
	}

	async function stergeEveniment(ev: EventRow) {
		if (!(await confirmDialog({
			title: 'Ștergi definitiv evenimentul?',
			message: `"${ev.title}" va fi șters permanent.`,
			confirmLabel: 'Șterge definitiv',
			danger: true
		}))) return;

		const { error } = await supabase.from('events').delete().eq('id', ev.id);
		if (!error) { await refreshEvents(); showToast('success', 'Eveniment șters.'); }
	}

	async function stergeBooking(id: string) {
		if (!(await confirmDialog({
			title: 'Confirmi ștergerea?',
			message: 'Înregistrarea va fi ștearsă definitiv.',
			confirmLabel: 'Șterge',
			danger: true
		}))) return;

		const { error } = await supabase.from('bookings').delete().eq('id', id);
		if (!error) { await refreshBookings(); showToast('success', 'Șters.'); }
	}

	async function mutaParticipant(bookingId: string, newPosition: string) {
		const { error } = await supabase
			.from('bookings')
			.update({ selected_position: newPosition })
			.eq('id', bookingId);
		if (error) { showToast('error', error.message); return; }
		await refreshBookings();
		showToast('success', `Mutat pe poziția "${newPosition}".`);
	}

	async function elibereazaPozitia(bookingId: string) {
		if (!(await confirmDialog({
			title: 'Scoți participantul din poziție?',
			message: 'Statusul va reveni la "nou" și poziția va fi eliberată.',
			confirmLabel: 'Scoate',
			danger: false
		}))) return;

		const { error } = await supabase
			.from('bookings')
			.update({ selected_position: '', status: 'nou' })
			.eq('id', bookingId);
		if (error) { showToast('error', error.message); return; }
		await refreshBookings();
		showToast('success', 'Participant scos din poziție.');
	}

	function deschideRepartizare(booking: Booking) {
		bookingDeRepartizat = booking;
		pozitiaSelectata = booking.selected_position || '';
		const ev = evenimente.find(e => e.id === booking.event_id);
		const toatePozitiile: string[] = (ev?.positions as string[]) || [];
		const ocupate = new Set(
			rezervari
				.filter(r => r.event_id === booking.event_id && r.status === 'confirmat' && r.id !== booking.id)
				.map(r => r.selected_position)
				.filter((p): p is string => !!p)
		);
		pozitiiEveniment = toatePozitiile.filter(p => !ocupate.has(p));
		showRepartizareModal = true;
	}

	async function salveazaRepartizare() {
		if (!bookingDeRepartizat || !pozitiaSelectata) return;
		savingRepartizare = true;
		try {
			const { error } = await supabase
				.from('bookings')
				.update({ selected_position: pozitiaSelectata, status: 'confirmat' })
				.eq('id', bookingDeRepartizat.id);
			if (error) throw error;

			if (bookingDeRepartizat.user_id) {
				const evTitle = evenimente.find(e => e.id === bookingDeRepartizat!.event_id)?.title ?? 'eveniment';
				await supabase.from('notifications').insert({
					user_id: bookingDeRepartizat.user_id,
					title: 'Ai fost repartizat!',
					body: `Ești repartizat pe poziția "${pozitiaSelectata}" la ${evTitle}. Ne vedem pe teren!`,
					target_event_id: bookingDeRepartizat.event_id,
					target_type: 'event',
					scheduled_at: new Date().toISOString(),
					status: 'trimis'
				});
			}

			showRepartizareModal = false;
			await refreshBookings();
			showToast('success', `${bookingDeRepartizat.nume_client} repartizat pe poziția "${pozitiaSelectata}".`);
		} catch (err: any) {
			showToast('error', err.message);
		} finally {
			savingRepartizare = false;
		}
	}

	function convertesteInEveniment(booking: Booking) {
		const srv = servicii.find(s => s.title === booking.activity_title);
		
		evenimentCurent = {
			title: `${booking.activity_title} - ${booking.nume_client}`,
			description: srv?.description || `Creat din rezervarea nr. ${booking.id.slice(0, 8)}.`,
			date: booking.preferred_date || new Date().toISOString().slice(0, 10),
			start_time: booking.preferred_time || '10:00',
			duration: srv?.duration || '6 ore',
			capacity: srv?.capacity || '',
			location: 'Baza HTCMX Airsoft',
			price: srv?.price || 0, 
			currency: 'RON', status: 'active', is_public: true,
			max_participants: Number(srv?.capacity?.split('-')?.[1]) || 30, 
			positions: srv?.positions || [], 
			image_url: srv?.image_url || '', 
			gallery: srv?.gallery || [],
			origin_booking_id: booking.id
		};
		editMode = false;
		showEvModal = true;
	}

	function onFileSelected(e: Event, context: string) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			cropContext = context;
			const reader = new FileReader();
			reader.onload = () => { cropImage = reader.result as string; };
			reader.readAsDataURL(target.files[0]);
		}
	}

	async function handleCropFinish(blob: Blob) {
		incarcareFoto = true;
		try {
			const fileName = `${Date.now()}.jpg`;
			const filePath = `${cropContext}/${fileName}`;
			const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, blob);
			if (uploadError) throw uploadError;

			const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
			const publicUrl = data.publicUrl;

			if (cropContext === 'event_hero') {
				evenimentCurent.image_url = publicUrl;
			} else if (cropContext === 'event_gallery') {
				const newGallery = [...(evenimentCurent.gallery || []), publicUrl];
				await supabase.from('events').update({ gallery: newGallery }).eq('id', evenimentCurent.id);
				evenimentCurent.gallery = newGallery;
			}

			cropImage = null;
			await refreshEvents();
		} catch (err: any) {
			showToast('error', 'Eroare: ' + err.message);
		} finally {
			incarcareFoto = false;
		}
	}

	async function stergeFotoEveniment(url: string) {
		const newGallery = evenimentCurent.gallery.filter((item: string) => item !== url);
		await supabase.from('events').update({ gallery: newGallery }).eq('id', evenimentCurent.id);
		evenimentCurent.gallery = newGallery;
		await refreshEvents();
	}

	const tabs: { id: Tab; label: string; count?: () => number }[] = [
		{ id: 'active', label: 'Active' },
		{ id: 'finished', label: 'Finalizate', count: () => numarFinalizate },
		{ id: 'cereri', label: 'Cereri', count: () => numarCereri },
		{ id: 'confirmati', label: 'Confirmați', count: () => numarConfirmati }
	];
</script>

<div class="events-manager">
	<div class="bara-actiuni">
		{#if tabActiv === 'active' || tabActiv === 'finished'}
			<button class="buton-primar buton-nou" onclick={() => deschideEveniment()}>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
				Eveniment Nou
			</button>
		{/if}
		<div class="tabs">
			{#each tabs as tab}
				<button
					class="tab-item"
					class:activ={tabActiv === tab.id}
					onclick={() => (tabActiv = tab.id)}
				>
					{tab.label}
					{#if tab.count && tab.count() > 0}
						<span class="tab-badge">{tab.count()}</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	{#if tabActiv === 'cereri'}
		<CereriTab
			cereri={rezervari.filter(r => r.status === 'nou' || !r.status)}
			{evenimente}
			onRepartizare={deschideRepartizare}
			onConverteste={convertesteInEveniment}
			onDelete={stergeBooking}
		/>
	{:else if tabActiv === 'confirmati'}
		<ConfirmatiTab
			confirmati={rezervari.filter(r => r.status === 'confirmat')}
			{evenimente}
			onMutaParticipant={mutaParticipant}
			onElibereazaPozitia={elibereazaPozitia}
		/>
	{:else}
		<EventsTab
			{evenimente}
			{tabActiv}
			onEdit={deschideEveniment}
			onFinalize={finalizeazaEveniment}
			onDelete={stergeEveniment}
			onGallery={(ev) => { evenimentCurent = { ...ev }; showEvGalModal = true; }}
		/>
	{/if}
</div>

{#if showEvModal}
	<EventModal
		bind:eveniment={evenimentCurent}
		{editMode}
		{saving}
		onClose={() => (showEvModal = false)}
		onSave={salveazaEveniment}
		{onFileSelected}
	/>
{/if}

{#if showEvGalModal}
	<GalerieModal
		eveniment={evenimentCurent}
		onClose={() => (showEvGalModal = false)}
		{onFileSelected}
		onDeletePhoto={stergeFotoEveniment}
	/>
{/if}

{#if cropImage}
	<CropModal
		{cropImage}
		saving={incarcareFoto}
		onFinish={handleCropFinish}
		onCancel={() => (cropImage = null)}
	/>
{/if}

{#if showRepartizareModal && bookingDeRepartizat}
	<RepartizareModal
		booking={bookingDeRepartizat}
		eveniment={bookingDeRepartizat.event_id ? (evenimente.find(e => e.id === bookingDeRepartizat!.event_id) ?? null) : null}
		pozitii={pozitiiEveniment}
		bind:pozitiaSelectata
		saving={savingRepartizare}
		onSave={salveazaRepartizare}
		onClose={() => (showRepartizareModal = false)}
	/>
{/if}

<style>
	.events-manager { display: flex; flex-direction: column; gap: 2rem; }
	.bara-actiuni { display: flex; align-items: center; justify-content: flex-end; gap: 1rem; flex-wrap: wrap; }
	.buton-nou { display: flex; align-items: center; gap: 0.6rem; }
	.tabs { display: flex; gap: 0.4rem; background: rgba(0,0,0,0.3); padding: 0.4rem; border-radius: 12px; border: 1px solid var(--border); }
	.tab-item {
		background: none; border: none; padding: 0.8rem 1.6rem;
		font-size: 1.4rem; font-weight: 600; color: var(--text-grey);
		cursor: pointer; border-radius: 8px; transition: all 0.2s;
		display: flex; align-items: center; gap: 0.6rem;
		font-family: inherit;
	}
	.tab-item:hover { color: var(--text); background: rgba(197,160,48,0.06); }
	.tab-item.activ { background: var(--bg-card); color: var(--primary); box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1px solid var(--border); }
	.tab-badge {
		background: var(--primary); color: white;
		font-size: 1.1rem; font-weight: 700;
		padding: 0.1rem 0.6rem; border-radius: 100px;
		min-width: 2rem; text-align: center;
	}
</style>
