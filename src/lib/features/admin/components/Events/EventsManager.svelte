<script lang="ts">
	import { supabase, STORAGE_BUCKET } from '$lib/supabase';
	import Cropper from 'svelte-easy-crop';
	import { getCroppedImg } from '$lib/utils/image';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import type { EventRow, Booking } from '$lib/types';

	let { evenimente = $bindable([]), rezervari = $bindable([]), refreshEvents, refreshBookings }: { 
		evenimente: EventRow[], 
		rezervari: Booking[],
		refreshEvents: () => Promise<void>,
		refreshBookings: () => Promise<void>
	} = $props();

	let subSectiuneEv = $state('active'); // active | finished | cereri
	let showEvModal = $state(false);
	let showEvGalModal = $state(false);
	let editMode = $state(false);
	let incarcareFoto = $state(false);
	let saving = $state(false);

	// --- REPARTIZARE STATE ---
	let showRepartizareModal = $state(false);
	let bookingDeRepartizat = $state<Booking | null>(null);
	let pozitiiEveniment = $state<string[]>([]);
	let pozitiaSelectata = $state('');
	let loadingPozitii = $state(false);
	let savingRepartizare = $state(false);

	let evenimentCurent = $state<any>({
		id: '',
		title: '',
		type: 'Milsim',
		description: '',
		date: new Date().toISOString().slice(0, 10),
		start_time: '10:00',
		duration: '6 ore',
		location: 'Baza HTCMX Airsoft',
		price: 50,
		currency: 'RON',
		status: 'active',
		is_public: true,
		max_participants: 30,
		positions: [],
		image_url: '',
		gallery: [],
		origin_booking_id: ''
	});

	// --- CROP STATE ---
	let cropImage = $state<string | null>(null);
	let crop = $state({ x: 0, y: 0 });
	let zoom = $state(1);
	let croppedAreaPixels = $state<any>(null);
	let cropContext = $state<string | null>(null);

	function deschideEveniment(ev: any = null) {
		editMode = !!ev;
		evenimentCurent = ev
			? { ...ev, date: ev.date?.slice(0, 10), positions: ev.positions || [], gallery: ev.gallery || [] }
			: {
					title: '',
					type: 'Milsim',
					description: '',
					date: new Date().toISOString().slice(0, 10),
					start_time: '10:00',
					duration: '6 ore',
					location: 'Baza HTCMX Airsoft',
					price: 50,
					currency: 'RON',
					status: 'active',
					is_public: true,
					max_participants: 30,
					positions: [],
					image_url: '',
					gallery: [],
					origin_booking_id: ''
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

			if (!error) {
				if (!editMode && evenimentCurent.origin_booking_id) {
					await supabase.from('bookings').update({ status: 'confirmat' }).eq('id', evenimentCurent.origin_booking_id);
				}
				showEvModal = false;
				await refreshEvents();
				await refreshBookings();
				showToast('success', editMode ? 'Eveniment actualizat.' : 'Eveniment creat.');
			} else throw error;
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
		if (!error) {
			await refreshEvents();
			showToast('success', 'Eveniment finalizat.');
		}
	}

	async function stergeEveniment(ev: any) {
		if (await confirmDialog({
			title: 'Ștergi definitiv evenimentul?',
			message: `"${ev.title}" va fi șters permanent.`,
			confirmLabel: 'Șterge definitiv',
			danger: true
		})) {
			const { error } = await supabase.from('events').delete().eq('id', ev.id);
			if (!error) {
				await refreshEvents();
				showToast('success', 'Eveniment șters.');
			}
		}
	}

	async function stergeElement(tabela: string, id: string) {
		if (await confirmDialog({
			title: 'Confirmi ștergerea?',
			message: 'Înregistrarea va fi ștearsă definitiv.',
			confirmLabel: 'Șterge',
			danger: true
		})) {
			const { error } = await supabase.from(tabela as any).delete().eq('id', id);
			if (!error) {
				if (tabela === 'bookings') await refreshBookings();
				showToast('success', 'Sters.');
			}
		}
	}

	async function deschideRepartizare(booking: Booking) {
		bookingDeRepartizat = booking;
		pozitiaSelectata = booking.selected_position || '';
		pozitiiEveniment = [];
		if (booking.event_id) {
			loadingPozitii = true;
			const { data } = await supabase.from('events').select('positions').eq('id', booking.event_id).single();
			pozitiiEveniment = data?.positions || [];
			loadingPozitii = false;
		}
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
			showRepartizareModal = false;
			await refreshBookings();
			showToast('success', `${bookingDeRepartizat.nume_client} repartizat pe poziția "${pozitiaSelectata}".`);
		} catch (err: any) {
			showToast('error', err.message);
		} finally {
			savingRepartizare = false;
		}
	}

	function convertesteInEveniment(booking: any) {
		evenimentCurent = {
			title: `${booking.activity_title} - ${booking.nume_client}`,
			description: `Creat din rezervarea nr. ${booking.id.slice(0, 8)}.`,
			date: booking.preferred_date || new Date().toISOString().slice(0, 10),
			start_time: booking.preferred_time || '10:00',
			location: 'Baza HTCMX Airsoft',
			price: 0,
			currency: 'RON',
			status: 'active',
			is_public: true,
			max_participants: 30,
			positions: [],
			image_url: '',
			gallery: [],
			origin_booking_id: booking.id
		};
		editMode = false;
		showEvModal = true;
	}

	// --- LOGICA IMAGINI ---
	function onFileSelected(e: Event, context: any) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			cropContext = context;
			const reader = new FileReader();
			reader.onload = () => { cropImage = reader.result as string; };
			reader.readAsDataURL(target.files[0]);
		}
	}

	async function handleFinalizeCrop() {
		if (!cropImage || !croppedAreaPixels) return;
		incarcareFoto = true;
		try {
			const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
			if (!croppedBlob) throw new Error('Eroare la procesare.');
			const fileName = `${Date.now()}.jpg`;
			const filePath = `${cropContext}/${fileName}`;
			const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, croppedBlob);
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
</script>

<div class="events-manager">
	<div class="actiuni-pagina" style="display:flex; justify-content: flex-end; gap: 1rem; margin-bottom: 2rem;">
		{#if subSectiuneEv !== 'cereri'}
			<button class="buton-primar" onclick={() => deschideEveniment()}>+ Eveniment Nou</button>
		{/if}
		<button class="tab-item" class:activ={subSectiuneEv === 'active'} onclick={() => (subSectiuneEv = 'active')}>🔥 Active</button>
		<button class="tab-item" class:activ={subSectiuneEv === 'finished'} onclick={() => (subSectiuneEv = 'finished')}>🏁 Finalizate ({evenimente.filter(e=>e.status==='finished').length})</button>
		<button class="tab-item" class:activ={subSectiuneEv === 'cereri'} onclick={() => (subSectiuneEv = 'cereri')}>📥 Cereri ({rezervari.length})</button>
	</div>

	<div class="table-scroll" style="background: white; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
		{#if subSectiuneEv === 'cereri'}
			<table>
				<thead><tr><th>Client</th><th>Activitate</th><th>Telefon</th><th>Eveniment</th><th>Poziție</th><th>Data Cererii</th><th>Acțiuni</th></tr></thead>
				<tbody>
					{#each rezervari.filter(r => r.status === 'nou' || !r.status) as r}
						{@const evAsociat = r.event_id ? evenimente.find(e => e.id === r.event_id) : null}
						<tr>
							<td><strong>{r.nume_client}</strong></td>
							<td>{r.activity_title}</td>
							<td>{r.telefon}</td>
							<td>
								{#if evAsociat}
									<span style="font-size:1.2rem; color:#2980b9; font-weight:600;">📅 {evAsociat.title}</span>
								{:else}
									<span style="color:#bbb">—</span>
								{/if}
							</td>
							<td>
								{#if r.selected_position}
									<span class="badge-status status-confirmat">{r.selected_position}</span>
								{:else}
									<span style="color:#bbb">—</span>
								{/if}
							</td>
							<td>{new Date(r.created_at).toLocaleDateString('ro-RO')}</td>
							<td style="display:flex; gap:0.5rem;">
								{#if r.event_id}
									<button class="btn-icon" style="background:#2980b9; color:white; border:none; padding:0.6rem 1.2rem;" onclick={() => deschideRepartizare(r)} title="Repartizează poziție">👤</button>
								{:else}
									<button class="btn-icon" style="background:#e67e22; color:white; border:none; padding:0.6rem 1.2rem; font-size:1.2rem;" onclick={() => convertesteInEveniment(r)} title="Convertește în Eveniment">🚀</button>
								{/if}
								<button class="btn-icon btn-sterge" onclick={() => stergeElement('bookings', r.id)}>🗑️</button>
							</td>
						</tr>
					{:else}
						<tr><td colspan="7" style="text-align:center; padding: 4rem; color: #999;">Nicio cerere în așteptare.</td></tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<table>
				<thead><tr><th>Meci</th><th>Dată</th><th>Preț</th><th>Status</th><th>Acțiuni</th></tr></thead>
				<tbody>
					{#each evenimente.filter((e) => e.status === subSectiuneEv) as ev}
						<tr class:eveniment-trecut={new Date(ev.date) < new Date() && ev.status === 'active'}>
							<td><strong>{ev.title}</strong></td>
							<td>{new Date(ev.date).toLocaleDateString('ro-RO')}</td>
							<td>{ev.price} lei</td>
							<td><span class="badge-status status-{ev.status}">{ev.status}</span></td>
							<td style="display:flex; gap:0.5rem;">
								{#if ev.status === 'active' && new Date(ev.date) < new Date()}
									<button class="btn-icon" style="background:#2ecc71; color:white; border:none;" onclick={() => finalizeazaEveniment(ev.id)} title="Finalizează">✅</button>
								{/if}
								<button class="btn-icon" onclick={() => deschideEveniment(ev)} title="Editează">✏️</button>
								<button class="btn-icon" style="background:#27ae60; color:white; border:none;" onclick={() => { evenimentCurent = { ...ev }; showEvGalModal = true; }} title="Galerie">🖼️</button>
								<button class="btn-icon btn-sterge" onclick={() => stergeEveniment(ev)} title="Șterge">🗑️</button>
							</td>
						</tr>
					{:else}
						<tr><td colspan="5" style="text-align:center; padding: 4rem; color: #999;">Niciun eveniment găsit.</td></tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>

<!-- MODAL EVENIMENT -->
{#if showEvModal}
	<div class="modal-overlay">
		<div class="login-card" style="max-width: 65rem; max-height: 90vh; overflow-y: auto;">
			<h2>{editMode ? 'Editează' : 'Creează'} Eveniment</h2>
			<form onsubmit={salveazaEveniment}>
				<div class="camp"><label>Titlu</label><input bind:value={evenimentCurent.title} required /></div>
				<div class="camp"><label>Imagine Hero</label><input type="file" accept="image/*" onchange={(e) => onFileSelected(e, 'event_hero')} /></div>
				{#if evenimentCurent.image_url}
					<img src={evenimentCurent.image_url} alt="" style="width:100%; height:12rem; object-fit:cover; border-radius:8px; margin-bottom:1rem;" />
				{/if}
				<div class="camp"><label>Descriere</label><textarea bind:value={evenimentCurent.description} style="width:100%; height:7rem; border-radius:9px; border:1px solid var(--border); padding:1rem; font-family:inherit; font-size:1.4rem; resize:vertical;"></textarea></div>

				<div class="form-row-2col">
					<div class="camp">
						<label>Tip Eveniment</label>
						<select bind:value={evenimentCurent.type} style="width:100%; padding:1.2rem; border-radius:9px; border:1px solid var(--border);">
							<option value="Milsim">Milsim</option><option value="Speedsoft">Speedsoft</option><option value="Skirmish">Skirmish</option><option value="Antrenament">Antrenament</option><option value="Privat">Privat</option>
						</select>
					</div>
					<div class="camp"><label>Preț (RON)</label><input type="number" min="0" bind:value={evenimentCurent.price} /></div>
					<div class="camp"><label>Data</label><input type="date" bind:value={evenimentCurent.date} required /></div>
					<div class="camp"><label>Ora Start</label><input type="time" bind:value={evenimentCurent.start_time} /></div>
					<div class="camp"><label>Durată</label><input bind:value={evenimentCurent.duration} /></div>
					<div class="camp"><label>Max Participanți</label><input type="number" min="1" bind:value={evenimentCurent.max_participants} /></div>
				</div>

				<div class="camp"><label>Locație</label><input bind:value={evenimentCurent.location} required /></div>

				<div class="camp">
					<label>Poziții disponibile (separate prin virgulă)</label>
					<input placeholder="ex: Atacant, Apărător, Medic" value={evenimentCurent.positions?.join(', ')} onchange={(e) => evenimentCurent.positions = e.currentTarget.value.split(',').map((s: string) => s.trim()).filter((s: string) => s)} />
				</div>

				<div style="display:flex; gap:2rem; align-items:center; background:var(--primary-tint); padding:1.2rem 1.6rem; border-radius:9px; margin-top:0.5rem;">
					<label style="display:flex; align-items:center; gap:0.8rem; cursor:pointer; font-size:1.4rem; font-weight:600;">
						<input type="checkbox" bind:checked={evenimentCurent.is_public} style="width:1.8rem; height:1.8rem;" /> Eveniment Public
					</label>
					<div class="camp" style="margin:0; flex:1;">
						<select bind:value={evenimentCurent.status} style="width:100%; padding:0.8rem 1rem; border-radius:9px; border:1px solid var(--border);">
							<option value="active">🔥 Activ</option><option value="pending">⏳ În Așteptare</option><option value="finished">🏁 Finalizat</option>
						</select>
					</div>
				</div>

				<div style="display:flex; gap:1rem; margin-top:2rem;">
					<button type="button" class="buton-iesire" style="flex:1" onclick={() => (showEvModal = false)}>Anulează</button>
					<button type="submit" class="buton-primar" style="flex:2" disabled={saving}>{saving ? 'Se salvează...' : 'Salvează'}</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL GALERIE EVENIMENT -->
{#if showEvGalModal}
	<div class="modal-overlay">
		<div class="login-card" style="max-width: 80rem; max-height: 85vh; display: flex; flex-direction: column;">
			<div style="display:flex; justify-content:space-between; margin-bottom:2rem;">
				<h2>Galerie: {evenimentCurent.title}</h2>
				<button class="buton-iesire" onclick={() => showEvGalModal = false}>Închide</button>
			</div>
			<div class="camp"><label>Încarcă poze noi (16:9)</label><input type="file" accept="image/*" onchange={(e) => onFileSelected(e, 'event_gallery')} /></div>
			<div class="galerie-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 1rem; overflow-y: auto; flex: 1;">
				{#each evenimentCurent.gallery || [] as url}
					<div class="foto-card" style="position:relative;">
						<img src={url} alt="" style="width:100%; height:10rem; object-fit:cover; border-radius:8px;" />
						<button class="btn-sterge-foto" style="position:absolute; top:0.5rem; right:0.5rem; background:rgba(231,76,60,0.8); color:white; border:none; border-radius:50%; width:2.4rem; height:2.4rem; cursor:pointer;" onclick={() => stergeFotoEveniment(url)}>×</button>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

{#if cropImage}
	<div class="modal-overlay" style="z-index: 2000;">
		<div class="login-card" style="max-width: 90rem; height: 90vh; display: flex; flex-direction: column;">
			<h2>Decupează Imaginea</h2>
			<div style="flex: 1; position: relative; background: #222; border-radius: 12px; overflow: hidden; margin-bottom: 2rem;">
				<Cropper image={cropImage} bind:crop bind:zoom aspect={16/9} oncropcomplete={({ pixels }) => (croppedAreaPixels = pixels)} />
			</div>
			<div style="display: flex; gap: 1rem;">
				<button class="buton-iesire" style="flex: 1" onclick={() => cropImage = null}>Anulează</button>
				<button class="buton-primar" style="flex: 2" onclick={handleFinalizeCrop} disabled={incarcareFoto}>{incarcareFoto ? 'Se salvează...' : 'Finalizează'}</button>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL REPARTIZARE -->
{#if showRepartizareModal && bookingDeRepartizat}
	{@const evAsociatModal = bookingDeRepartizat.event_id ? evenimente.find(e => e.id === bookingDeRepartizat!.event_id) : null}
	<div class="modal-overlay">
		<div class="login-card" style="max-width: 50rem;">
			<h2>👤 Repartizare Poziție</h2>
			<div style="margin-bottom: 2rem; padding: 1.5rem; background: var(--primary-tint); border-radius: 9px; display: flex; flex-direction: column; gap: 0.6rem;">
				<div><strong>Client:</strong> {bookingDeRepartizat.nume_client}</div>
				<div><strong>Telefon:</strong> {bookingDeRepartizat.telefon}</div>
				<div><strong>Activitate:</strong> {bookingDeRepartizat.activity_title}</div>
				{#if evAsociatModal}
					<div><strong>Eveniment:</strong> {evAsociatModal.title}</div>
				{/if}
			</div>

			{#if loadingPozitii}
				<p style="color:#666; text-align:center;">Se încarcă pozițiile...</p>
			{:else if pozitiiEveniment.length > 0}
				<div class="camp">
					<label>Selectează Poziția</label>
					<select bind:value={pozitiaSelectata} style="width:100%; padding:1.2rem; border-radius:9px; border:1px solid var(--border); font-size:1.4rem;">
						<option value="">-- alege poziția --</option>
						{#each pozitiiEveniment as poz}
							<option value={poz}>{poz}</option>
						{/each}
					</select>
				</div>
			{:else}
				<div style="background:#fff3cd; padding:1.5rem; border-radius:9px; margin-bottom:1.5rem;">
					<p style="margin:0 0 0.8rem; font-size:1.3rem; color:#856404;">Evenimentul nu are poziții definite. Introdu manual:</p>
					<input bind:value={pozitiaSelectata} placeholder="ex: Atacant, Medic, Apărător..." style="width:100%; padding:1.2rem; border-radius:9px; border:1px solid var(--border); font-size:1.4rem; box-sizing:border-box;" />
				</div>
			{/if}

			<div style="display:flex; gap:1rem; margin-top:2rem;">
				<button type="button" class="buton-iesire" style="flex:1" onclick={() => showRepartizareModal = false}>Anulează</button>
				<button type="button" class="buton-primar" style="flex:2" disabled={savingRepartizare || !pozitiaSelectata} onclick={salveazaRepartizare}>
					{savingRepartizare ? 'Se salvează...' : '✅ Confirmă Repartizare'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.tab-item { background: none; border: none; padding: 1rem 1.6rem; font-size: 1.4rem; font-weight: 700; color: #666; cursor: pointer; border-radius: 10px; transition: all 0.2s; }
	.tab-item.activ { background: white; color: var(--dark); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
	.eveniment-trecut { background-color: #fff9db !important; }
</style>
