<script lang="ts">
	import { onMount } from 'svelte';
	import { NotificationRepository } from '$lib/data/repositories/NotificationRepository';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import type { NotificationRow, EventRow } from '$lib/types';

	let { evenimente = [], supabase }: { evenimente: EventRow[], supabase: any } = $props();

	const DELIVERY_WINDOW_MS = 60 * 60 * 1000;

	let notificari = $state<NotificationRow[]>([]);
	let notifTotal = $state(0);
	let notifPerPagina = 30;
	let notifIncarcat = $state(0);
	let notifFiltruStatus = $state<'all' | 'programat' | 'trimis'>('all');
	let notifIncarcare = $state(false);

	let showNotifModal = $state(false);
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
		if (n.status === 'trimis' || n.status === 'sent') return 'expired';
		const sched = new Date(n.scheduled_at).getTime();
		const now = Date.now();
		if (now >= sched && now <= sched + DELIVERY_WINDOW_MS) return 'active';
		if (now > sched + DELIVERY_WINDOW_MS) return 'expired';
		return 'pending';
	}

	export async function incarcaNotificari(reset: boolean = false) {
		if (reset) { notificari = []; notifIncarcat = 0; }
		notifIncarcare = true;
		try {
			const acumUTC = new Date().toISOString();
			await NotificationRepository.autoTransitionNotifications(acumUTC);

			const from = notifIncarcat;
			const to = from + notifPerPagina - 1;
			let query = supabase
				.from('notifications')
				.select('*', { count: 'exact' })
				.order('scheduled_at', { ascending: false })
				.range(from, to);

			if (notifFiltruStatus !== 'all') query = query.eq('status', notifFiltruStatus);

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
			title: '', body: '', target_type: 'all', target_event_id: '',
			is_recurring: false, recurring_hour: 10,
			scheduled_at: toLocalISO(new Date()), status: 'programat'
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
		if (!(await confirmDialog({
			title: 'Ștergi notificarea?',
			message: 'Această acțiune nu poate fi anulată.',
			confirmLabel: 'Șterge',
			danger: true
		}))) return;
		try {
			await NotificationRepository.deleteNotification(id);
			notificari = notificari.filter(n => n.id !== id);
			showToast('success', 'Notificarea a fost ștearsă.');
		} catch (e: any) {
			showToast('error', e.message);
		}
	}

	const isPast = $derived(
		nouaNotif.scheduled_at
			? new Date(nouaNotif.scheduled_at).getTime() < Date.now() - DELIVERY_WINDOW_MS
			: false
	);
	const isSoonPast = $derived(
		!isPast && nouaNotif.scheduled_at
			? new Date(nouaNotif.scheduled_at).getTime() < Date.now()
			: false
	);
</script>

<div class="notifications-panel">
	<div class="bara-actiuni">
		<div class="tabs-stanga">
			<div class="tabs">
				{#each [
					{ key: 'all', label: 'Toate' },
					{ key: 'programat', label: 'Programate' },
					{ key: 'trimis', label: 'Trimise' }
				] as tab}
					<button
						class="tab-item"
						class:activ={notifFiltruStatus === tab.key}
						onclick={() => { notifFiltruStatus = tab.key as any; incarcaNotificari(true); }}
					>{tab.label}</button>
				{/each}
			</div>
			<span class="contor-notif">
				<strong>{notificari.length}</strong> / <strong>{notifTotal}</strong>
			</span>
		</div>
		<button class="buton-primar buton-nou" onclick={deschideNotificare}>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
			Notificare Nouă
		</button>
	</div>

	<div class="tabel-container table-scroll">
		<table>
			<thead>
				<tr>
					<th>Titlu &amp; Mesaj</th>
					<th>Status</th>
					<th>Livrabilă</th>
					<th>Programat</th>
					<th>Acțiuni</th>
				</tr>
			</thead>
			<tbody>
				{#each notificari as n}
					{@const ds = deliveryState(n)}
					<tr class:randul-expirat={ds === 'expired'}>
						<td>
							<strong>{n.title}</strong>
							<span class="mesaj-preview">{n.body}</span>
						</td>
						<td><span class="badge-status status-{n.status}">{n.status}</span></td>
						<td>
							{#if ds === 'active'}
								<span class="badge-livrare badge-livrare--activa">Activă</span>
							{:else if ds === 'expired'}
								{#if n.status === 'trimis' || n.status === 'sent'}
									<span class="badge-livrare badge-livrare--finalizata">Finalizată</span>
								{:else}
									<span class="badge-livrare badge-livrare--expirata">Expirată</span>
								{/if}
							{:else}
								<span class="badge-livrare badge-livrare--programata">Programată</span>
							{/if}
						</td>
						<td class="data-celula">{new Date(n.scheduled_at).toLocaleString('ro-RO')}</td>
						<td>
							<button class="btn-icon btn-sterge" onclick={() => stergeNotificare(n.id)} title="Șterge">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
							</button>
						</td>
					</tr>
				{:else}
					<tr><td colspan="5" class="td-gol">Nicio notificare găsită.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if notificari.length < notifTotal}
		<div class="mai-multe">
			<button class="buton-iesire" disabled={notifIncarcare} onclick={() => incarcaNotificari(false)}>
				{notifIncarcare ? 'Se încarcă...' : `Mai multe (${notifTotal - notificari.length} rămase)`}
			</button>
		</div>
	{/if}
</div>

{#if showNotifModal}
	<div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="notif-titlu">
		<div class="login-card modal-notif">
			<div class="modal-header">
				<h2 id="notif-titlu">Notificare Nouă</h2>
				<button class="btn-inchide" onclick={() => (showNotifModal = false)} aria-label="Închide">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
				</button>
			</div>

			<form onsubmit={salveazaNotificare}>
				<div class="camp">
					<label for="notif-titlu-input">Titlu</label>
					<input id="notif-titlu-input" bind:value={nouaNotif.title} placeholder="ex: Eveniment săptămâna aceasta" required />
				</div>

				<div class="camp">
					<label for="notif-mesaj">Mesaj</label>
					<textarea id="notif-mesaj" bind:value={nouaNotif.body} class="textarea-notif" placeholder="Textul notificării..." required></textarea>
				</div>

				<div class="camp">
					<label for="notif-tip">Tip / Grup Țintă</label>
					<select id="notif-tip" bind:value={nouaNotif.target_type}>
						<option value="all">Anunț — Toți userii</option>
						<option value="event">Eveniment — Doar participanții</option>
						<option value="promo">Promoție — Toți userii</option>
						<option value="update">Actualizare — Toți userii</option>
					</select>
					<p class="camp-hint">Tipul controlează cine primește și ce icon/culoare apare pe telefon.</p>
				</div>

				{#if nouaNotif.target_type === 'event'}
					<div class="camp">
						<label for="notif-eveniment">Eveniment</label>
						<select id="notif-eveniment" bind:value={nouaNotif.target_event_id} required>
							<option value="">— Selectează evenimentul —</option>
							{#each evenimente.filter(e => e.status === 'active') as ev}
								<option value={ev.id}>{ev.title}</option>
							{/each}
						</select>
					</div>
				{/if}

				<div class="rand-repetare">
					<label class="toggle-label">
						<input type="checkbox" id="rec" bind:checked={nouaNotif.is_recurring} />
						<span class="toggle-text">Repetă Zilnic</span>
					</label>
				</div>

				{#if nouaNotif.is_recurring}
					<div class="camp">
						<label for="notif-ora-zilnica">Ora de trimitere (zilnic)</label>
						<div class="input-cu-unitate">
							<input id="notif-ora-zilnica" type="number" min="0" max="23" bind:value={nouaNotif.recurring_hour} class="input-ora" />
							<span class="unitate">:00</span>
						</div>
					</div>
				{:else}
					<div class="camp">
						<label for="notif-data">Data &amp; Ora Trimiterii</label>
						<input id="notif-data" type="datetime-local" bind:value={nouaNotif.scheduled_at} required />
						<div class="preset-butoane">
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

						{#if isPast}
							<div class="alerta alerta--pericol">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
								<span><strong>Data e în trecut.</strong> Notificarea va fi marcată ca trimisă dar <strong>NU va apărea ca push</strong> pe telefon.</span>
							</div>
						{:else if isSoonPast}
							<div class="alerta alerta--info">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
								<span>Data e în trecut. Notificarea va fi trimisă imediat (livrabilă 1h).</span>
							</div>
						{/if}
					</div>
				{/if}

				<div class="butoane-modal">
					<button type="button" class="buton-iesire" onclick={() => (showNotifModal = false)}>Anulează</button>
					<button type="submit" class="buton-primar" disabled={savingNotif}>
						{savingNotif ? 'Se salvează...' : 'Programează'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	/* Panel layout */
	.notifications-panel { display: flex; flex-direction: column; gap: 2rem; }
	.bara-actiuni { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
	.tabs-stanga { display: flex; align-items: center; gap: 1.2rem; }
	.tabs { display: flex; gap: 0.4rem; background: #f1f3f5; padding: 0.4rem; border-radius: 12px; }
	.tab-item {
		background: none; border: none; padding: 0.8rem 1.6rem;
		font-size: 1.4rem; font-weight: 600; color: #666; cursor: pointer;
		border-radius: 8px; transition: all 0.2s; font-family: inherit;
	}
	.tab-item:hover { color: var(--dark); background: rgba(255,255,255,0.7); }
	.tab-item.activ { background: white; color: var(--dark); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
	.contor-notif { font-size: 1.3rem; color: #888; }
	.buton-nou { display: flex; align-items: center; gap: 0.6rem; }

	/* Table */
	.randul-expirat { opacity: 0.5; }
	.mesaj-preview { display: block; font-size: 1.2rem; color: #888; margin-top: 0.2rem; max-width: 32rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.data-celula { font-size: 1.3rem; color: #666; white-space: nowrap; }
	.td-gol { text-align: center; padding: 4rem; color: #999; }
	.mai-multe { text-align: center; }

	/* Delivery badges */
	.badge-livrare { padding: 0.4rem 1rem; border-radius: 100px; font-size: 1.1rem; font-weight: 700; white-space: nowrap; }
	.badge-livrare--activa { background: #d3f9d8; color: #2b8a3e; }
	.badge-livrare--finalizata { background: #f1f3f5; color: #495057; }
	.badge-livrare--expirata { background: #fdecea; color: #a93226; }
	.badge-livrare--programata { background: #fff3cd; color: #a05a00; }

	/* Modal */
	.modal-notif { max-width: 52rem; max-height: 90vh; overflow-y: auto; }
	.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.4rem; }
	.modal-header h2 { margin-bottom: 0; }
	.btn-inchide { background: none; border: none; cursor: pointer; color: #888; padding: 0.4rem; border-radius: 6px; display: flex; }
	.btn-inchide:hover { background: #f1f3f5; color: var(--dark); }

	.textarea-notif {
		width: 100%; height: 8rem; border-radius: 9px; border: 1px solid var(--border);
		padding: 1rem; font-family: inherit; font-size: 1.4rem; resize: vertical;
	}
	.textarea-notif:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(230, 126, 34, 0.1); }

	.camp-hint { font-size: 1.2rem; color: #888; margin-top: 0.4rem; }

	/* Recurring toggle row */
	.rand-repetare {
		background: var(--primary-tint); border-radius: 9px;
		padding: 1.2rem 1.6rem; margin-bottom: 2rem;
	}
	.toggle-label { display: flex; align-items: center; gap: 1rem; cursor: pointer; }
	.toggle-label input[type="checkbox"] { width: 1.8rem; height: 1.8rem; cursor: pointer; accent-color: var(--primary); }
	.toggle-text { font-size: 1.4rem; font-weight: 700; color: var(--primary-shade); }

	/* Recurring hour input */
	.input-cu-unitate { display: flex; align-items: center; gap: 1rem; }
	.input-ora { width: 10rem; }
	.unitate { font-size: 1.6rem; font-weight: 600; color: #555; }

	/* Preset buttons */
	.preset-butoane { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: 1rem; }
	.btn-preset {
		padding: 0.6rem 1.2rem; border-radius: 8px; border: 1px solid var(--border);
		background: white; font-size: 1.3rem; font-weight: 600; color: #555;
		cursor: pointer; transition: all 0.2s; font-family: inherit;
	}
	.btn-preset:hover { background: var(--primary-tint); border-color: var(--primary); color: var(--primary); }

	/* Alert boxes */
	.alerta {
		display: flex; align-items: flex-start; gap: 0.9rem;
		padding: 1rem 1.4rem; border-radius: 9px; font-size: 1.3rem;
		margin-top: 1rem; border-left: 4px solid;
	}
	.alerta svg { flex-shrink: 0; margin-top: 0.1rem; }
	.alerta--pericol { background: #fdecea; color: #a93226; border-left-color: #a93226; }
	.alerta--info { background: #fff8e1; color: #a05a00; border-left-color: #e6a817; }

	/* Modal buttons */
	.butoane-modal { display: flex; gap: 1rem; margin-top: 2.4rem; }
	.butoane-modal .buton-iesire { flex: 1; }
	.butoane-modal .buton-primar { flex: 2; }
</style>
