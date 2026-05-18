<script lang="ts">
	import { onMount } from 'svelte';
	import { NotificationRepository } from '$lib/data/repositories/NotificationRepository';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import type { NotificationRow, EventRow } from '$lib/types';

	let { evenimente = [], supabase }: { evenimente: EventRow[], supabase: any } = $props(); // Pentru a alege evenimentul dintr-o lista


	const DELIVERY_WINDOW_MS = 60 * 60 * 1000;

	let notificari = $state<NotificationRow[]>([]);
	let notifTotal = $state(0);
	let notifPerPagina = 30;
	let notifIncarcat = $state(0);
	let notifFiltruStatus = $state<'all' | 'programat' | 'trimis'>('all');
	let notifIncarcare = $state(false);

	let showNotifModal = $state(false);
	let confirmDelNotif = $state<{ show: boolean; id: string }>({ show: false, id: '' });
	let savingNotif = $state(false);

	function toLocalISO(date: Date) {
		const offset = date.getTimezoneOffset() * 60000;
		return new Date(date.getTime() - offset).toISOString().slice(0, 16);
	}

	let nouaNotif = $state({
		title: '',
		body: '',
		target_type: 'all' as 'all' | 'event' | 'user' | 'promo' | 'update',
		target_event_id: '',
		is_recurring: false,
		recurring_hour: 10,
		scheduled_at: toLocalISO(new Date()),
		status: 'programat'
	});

	function deliveryState(n: any) {
		if (n.status === 'trimis' || n.status === 'sent') return "expired";
		const sched = new Date(n.scheduled_at).getTime();
		const now = Date.now();
		if (now >= sched && now <= sched + DELIVERY_WINDOW_MS) return "active";
		if (now > sched + DELIVERY_WINDOW_MS) return "expired";
		return "pending";
	}

	export async function incarcaNotificari(reset: boolean = false) {
		if (reset) {
			notificari = [];
			notifIncarcat = 0;
		}
		notifIncarcare = true;
		
		try {
			// Auto transition before loading - folosim UTC pentru consistenta cu baza de date
			const acumUTC = new Date().toISOString();
			await NotificationRepository.autoTransitionNotifications(acumUTC);

			const from = notifIncarcat;
			const to = from + notifPerPagina - 1;
			let query = supabase
				.from('notifications')
				.select('*', { count: 'exact' })
				.order('scheduled_at', { ascending: false })
				.range(from, to);
			
			if (notifFiltruStatus !== 'all') {
				query = query.eq('status', notifFiltruStatus);
			}
			
			const { data, count, error } = await query;
			if (error) throw error;

			notificari = reset ? (data || []) : [...notificari, ...(data || [])];
			notifTotal = count || 0;
			notifIncarcat = notificari.length;
		} catch (error: any) {
			console.error(error);
			showToast('error', 'Eroare la încărcarea notificărilor.');
		} finally {
			notifIncarcare = false;
		}
	}

	function deschideNotificare() {
		nouaNotif = {
			title: '',
			body: '',
			target_type: 'all',
			target_event_id: '',
			is_recurring: false,
			recurring_hour: 10,
			scheduled_at: toLocalISO(new Date()),
			status: 'programat'
		};
		showNotifModal = true;
	}

	async function salveazaNotificare(e: SubmitEvent) {
		e.preventDefault();
		savingNotif = true;
		try {
			const payload: any = {
				title: nouaNotif.title,
				body: nouaNotif.body,
				target_type: nouaNotif.target_type,
				target_event_id: nouaNotif.target_type === 'event' ? nouaNotif.target_event_id : null,
				is_recurring: nouaNotif.is_recurring,
				recurring_hour: nouaNotif.is_recurring ? nouaNotif.recurring_hour : null,
				scheduled_at: new Date(nouaNotif.scheduled_at).toISOString(),
				status: 'programat',
				open_count: 0,
				is_read: false
			};

			await NotificationRepository.createNotification(payload);

			showNotifModal = false;
			await incarcaNotificari(true);
			showToast('success', 'Notificare adăugată cu succes.');
		} catch (e: any) {
			showToast('error', e.message);
		} finally {
			savingNotif = false;
		}
	}

	async function stergeNotificare(id: string) {
		try {
			await NotificationRepository.deleteNotification(id);
			notificari = notificari.filter(n => n.id !== id);
			confirmDelNotif = { show: false, id: '' };
			showToast('success', 'Notificarea a fost ștearsă.');
		} catch (e: any) {
			showToast('error', e.message);
		}
	}
</script>

<div class="notifications-panel">
	<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.6rem; flex-wrap:wrap; gap:1rem;">
		<div style="display:flex; align-items:center; gap:1.2rem; flex-wrap:wrap;">
			<div class="tabs-intern" style="display:flex; background:#e0e0e0; padding:0.4rem; border-radius:12px; gap:0.4rem;">
				{#each [
					{ key: 'all', label: 'Toate' },
					{ key: 'programat', label: '🕒 Programată' },
					{ key: 'trimis', label: '✅ Trimise' }
				] as tab}
					<button
						onclick={() => { notifFiltruStatus = tab.key as any; incarcaNotificari(true); }}
						style="padding:0.7rem 1.4rem; border-radius:10px; border:none; cursor:pointer; font-weight:700; font-size:1.25rem;
						background: {notifFiltruStatus === tab.key ? 'white' : 'transparent'};
						color: {notifFiltruStatus === tab.key ? 'var(--dark)' : '#666'};
						box-shadow: {notifFiltruStatus === tab.key ? '0 4px 10px rgba(0,0,0,0.1)' : 'none'};"
					>{tab.label}</button>
				{/each}
			</div>
			<span style="color:#666; font-size:1.25rem;">Afișate <strong>{notificari.length}</strong> din <strong>{notifTotal}</strong></span>
		</div>
		<button
			class="buton-primar"
			style="padding:0.8rem 1.6rem; font-size:1.4rem;"
			onclick={deschideNotificare}>+ Notificare Nouă</button>
	</div>

	<div class="table-scroll" style="background: white; border-radius: 12px; border: 1px solid var(--border);">
		<table>
			<thead><tr><th>Titlu & Mesaj</th><th>Status</th><th>Livrabilă</th><th>Programat</th><th>Acțiuni</th></tr></thead>
			<tbody>
				{#each notificari as n}
					{@const ds = deliveryState(n)}
					<tr style={ds === "expired" ? "opacity:0.55;" : ""}>
						<td><strong>{n.title}</strong><br><small style="color:#777">{n.body}</small></td>
						<td><span class="badge-status status-{n.status}">{n.status}</span></td>
						<td>
							{#if ds === "active"}
								<span style="background:#e8f5e9; color:#1b5e20; padding:0.4rem 0.9rem; border-radius:20px; font-size:1.1rem; font-weight:700;">✅ Activă</span>
							{:else if ds === "expired"}
								{#if n.status === 'trimis' || n.status === 'sent'}
								<span title="Fereastra de livrare push s-a închis." style="background:#f5f5f5; color:#777; padding:0.4rem 0.9rem; border-radius:20px; font-size:1.1rem; font-weight:700;">🏁 Finalizată</span>
								{:else}
								<span title="Notificarea nu a putut fi livrată în timp util." style="background:#fdecea; color:#a93226; padding:0.4rem 0.9rem; border-radius:20px; font-size:1.1rem; font-weight:700;">⏳ Expirată</span>
								{/if}
							{:else}
								<span style="background:#fff8e1; color:#a05a00; padding:0.4rem 0.9rem; border-radius:20px; font-size:1.1rem; font-weight:700;">🕒 Programată</span>
							{/if}
						</td>
						<td>{new Date(n.scheduled_at).toLocaleString('ro-RO')}</td>
						<td>
							<button class="btn-icon btn-sterge" onclick={() => (confirmDelNotif = { show: true, id: n.id })}>🗑️</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if notificari.length < notifTotal}
		<div style="text-align:center; margin-top:1.6rem;">
			<button class="buton-primar" style="padding:1rem 2.4rem; font-size:1.3rem;" disabled={notifIncarcare} onclick={() => incarcaNotificari(false)}>
				{notifIncarcare ? 'Se încarcă...' : `Mai multe (${notifTotal - notificari.length} rămase)`}
			</button>
		</div>
	{/if}
</div>

{#if showNotifModal}
	<div class="modal-overlay">
		<div class="login-card" style="max-width: 50rem;">
			<h2>Trimite/Programează Notificare</h2>
			<form onsubmit={salveazaNotificare}>
				<div class="camp"><label>Titlu</label><input bind:value={nouaNotif.title} required /></div>
				<div class="camp"><label>Mesaj</label><textarea bind:value={nouaNotif.body} required style="width:100%; height:8rem; border-radius:9px; border:1px solid var(--border); padding:1rem;"></textarea></div>

				<div class="form-row-2col">
					<div class="camp">
						<label>Tip / Grup Țintă</label>
						<select bind:value={nouaNotif.target_type} style="width:100%; padding:1.2rem; border-radius:9px; border:1px solid var(--border);">
							<option value="all">📢 Anunț — Toți userii</option>
							<option value="event">🎯 Eveniment — Doar participanții</option>
							<option value="promo">🏷 Promoție — Toți userii (icon portocaliu)</option>
							<option value="update">🆕 Actualizare — Toți userii (icon albastru)</option>
						</select>
						<p style="font-size:1.1rem; color:#777; margin-top:0.4rem;">Tipul controlează cine primește și ce icon/culoare apare pe telefon.</p>
					</div>
					{#if nouaNotif.target_type === 'event'}
						<div class="camp">
							<label>Alege Evenimentul</label>
							<select bind:value={nouaNotif.target_event_id} required style="width:100%; padding:1.2rem; border-radius:9px; border:1px solid var(--border);">
								<option value="">-- Selectează Eveniment --</option>
								{#each evenimente.filter(e => e.status === 'active') as ev}
									<option value={ev.id}>{ev.title}</option>
								{/each}
							</select>
						</div>
					{/if}
				</div>

				<div class="timer-container">
					<div style="display:flex; align-items:center; gap: 1rem; margin-bottom:1rem;">
						<input type="checkbox" id="rec" bind:checked={nouaNotif.is_recurring} style="width:1.6rem; height:1.6rem;" />	
						<label for="rec" style="font-weight:700; cursor:pointer; font-size:1.4rem; color: #d35400;">🔄 Repetă Zilnic</label>
					</div>
					
					{#if nouaNotif.is_recurring}
						<div class="camp">
							<label>Ora de trimitere (Zilnic)</label>
							<div style="display:flex; align-items:center; gap:1rem;">
								<input type="number" min="0" max="23" bind:value={nouaNotif.recurring_hour} class="input-modern-time" style="width:10rem;" />
								<span style="font-size:1.4rem; color:#888;">Fix (ex: 10 pentru ora 10:00 AM)</span>
							</div>
						</div>
					{:else}
						<div class="camp">
							<label>Data & Ora Trimiterii (O singură dată)</label>
							<input type="datetime-local" bind:value={nouaNotif.scheduled_at} required class="input-modern-time" />
							
							<div class="timer-presets">
								<button type="button" class="btn-preset" onclick={() => nouaNotif.scheduled_at = toLocalISO(new Date())}>Acum</button>
								<button type="button" class="btn-preset" onclick={() => nouaNotif.scheduled_at = toLocalISO(new Date(Date.now() + 30 * 60000))}>+30 min</button>
								<button type="button" class="btn-preset" onclick={() => nouaNotif.scheduled_at = toLocalISO(new Date(Date.now() + 60 * 60000))}>+1 oră</button>
								<button type="button" class="btn-preset" onclick={() => {
									const d = new Date();
									d.setDate(d.getDate() + 1);
									d.setHours(9, 0, 0, 0);
									nouaNotif.scheduled_at = toLocalISO(d);
								}}>Mâine 09:00</button>
							</div>

							{#if nouaNotif.scheduled_at && new Date(nouaNotif.scheduled_at).getTime() < Date.now() - DELIVERY_WINDOW_MS}
								<div style="background:#fdecea; color:#a93226; padding:0.9rem 1.2rem; border-radius:8px; font-size:1.2rem; margin-top:0.8rem; border-left:4px solid #a93226;">
									⚠️ <strong>Data e în trecut.</strong> Notificarea va fi marcată ca <em>trimisă</em> dar <strong>NU va apărea ca push</strong> pe telefon.
								</div>
							{:else if nouaNotif.scheduled_at && new Date(nouaNotif.scheduled_at).getTime() < Date.now()}
								<div style="background:#fff8e1; color:#a05a00; padding:0.9rem 1.2rem; border-radius:8px; font-size:1.2rem; margin-top:0.8rem; border-left:4px solid #a05a00;">
									ℹ️ Data e în trecut. Notificarea va fi trimisă imediat (livrabilă 1h).
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<div style="display:flex; gap:1rem; margin-top:2rem;">
					<button type="button" class="buton-iesire" style="flex:1" onclick={() => (showNotifModal = false)}>Anulează</button>
					<button type="submit" class="buton-primar" style="flex:2" disabled={savingNotif}>{savingNotif ? "Se salvează..." : "Programează"}</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if confirmDelNotif.show}
	<div class="modal-overlay" style="z-index: 3000;">
		<div class="login-card" style="max-width: 40rem; text-align:center;">
			<p style="font-size:3.2rem; line-height:1; margin-bottom:1.2rem;">🗑️</p>
			<h2 style="font-size:2rem; margin-bottom:0.8rem;">Ștergi notificarea?</h2>
			<p style="font-size:1.4rem; color:#999; margin-bottom:2.4rem;">Această acțiune nu poate fi anulată.</p>
			<div style="display:flex; gap:1rem;">
				<button class="buton-iesire" style="flex:1;" onclick={() => (confirmDelNotif = { show: false, id: '' })}>Anulează</button>
				<button class="buton-primar" style="flex:1; background:var(--danger);" onclick={() => stergeNotificare(confirmDelNotif.id)}>Șterge</button>
			</div>
		</div>
	</div>
{/if}
