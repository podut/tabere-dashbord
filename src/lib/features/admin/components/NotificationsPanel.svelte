<script lang="ts">
	import { NotificationRepository } from '$lib/data/repositories/NotificationRepository';
	import { showToast, confirmDialog } from '$lib/admin/notify.svelte';
	import type { NotificationRow, EventRow } from '$lib/types';
	import NotificationMobileCard from './Notifications/view/NotificationMobileCard.svelte';
	import NotificationModal from './Notifications/NotificationModal.svelte';

	let { evenimente = [] }: { evenimente: EventRow[] } = $props();

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
			await NotificationRepository.autoTransitionNotifications(new Date().toISOString());
			const { data, count } = await NotificationRepository.getNotifications(
				Math.floor(notifIncarcat / notifPerPagina) + 1,
				notifPerPagina,
				notifFiltruStatus
			);
			notificari = reset ? data : [...notificari, ...data];
			notifTotal = count;
			notifIncarcat = notificari.length;
		} catch (err: any) {
			showToast('error', 'Eroare la încărcarea notificărilor.');
		} finally {
			notifIncarcare = false;
		}
	}

	$effect(() => { incarcaNotificari(true); });

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
				scheduled_at: new Date(nouaNotif.scheduled_at).toISOString(),
				status: 'programat',
				channel: 'htcmx_general',
				open_count: 0
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
			<div class="tabs-intern-notif">
				{#each [
					{ key: 'all', label: 'Toate' },
					{ key: 'programat', label: 'Programate' },
					{ key: 'trimis', label: 'Trimise' }
				] as tab}
					<button
						class="tab-item-notif"
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

	<!-- Mobile View -->
	<div class="mobile-only-grid">
		{#each notificari as n}
			<NotificationMobileCard {n} {deliveryState} onDelete={stergeNotificare} />
		{:else}
			<div class="td-gol">Nicio notificare găsită.</div>
		{/each}
	</div>

	<div class="tabel-container table-scroll notif-table-container desktop-only-table">
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
							<div class="notif-info-celula">
								<strong class="notif-titlu-text">{n.title}</strong>
								<span class="mesaj-preview">{n.body}</span>
							</div>
						</td>
						<td><span class="badge-status status-{n.status}">{n.status}</span></td>
						<td>
							{#if ds === 'active'}
								<span class="badge-livrare badge-livrare--activa">Activă</span>
							{:else if ds === 'expired'}
								{#if n.status === 'trimis'}
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
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
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
			<button class="buton-iesire load-more-btn" disabled={notifIncarcare} onclick={() => incarcaNotificari(false)}>
				{notifIncarcare ? 'Se încarcă...' : `Mai multe (${notifTotal - notificari.length} rămase)`}
			</button>
		</div>
	{/if}
</div>

{#if showNotifModal}
	<NotificationModal
		bind:notif={nouaNotif}
		{evenimente}
		onClose={() => (showNotifModal = false)}
		onSave={salveazaNotificare}
		saving={savingNotif}
		{isPast}
		{isSoonPast}
	/>
{/if}

<style>
	/* Panel layout */
	.notifications-panel { display: flex; flex-direction: column; gap: 1.6rem; }
	.bara-actiuni { display: flex; align-items: center; justify-content: space-between; gap: 1.6rem; flex-wrap: wrap; }

	.mobile-only-grid { display: none; }
	.tabs-stanga { display: flex; align-items: center; gap: 2rem; }
	
	.tabs-intern-notif { display: flex; background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 12px; border: 1px solid var(--border); gap: 0.5rem; }
	
	.tab-item-notif {
		background: none; border: none; padding: 0.8rem 2rem;
		font-size: 1.4rem; font-weight: 700; color: var(--text-grey); cursor: pointer;
		border-radius: 8px; transition: all 0.2s; font-family: inherit;
	}
	.tab-item-notif:hover:not(.activ) { color: var(--text); background: rgba(255,255,255,0.05); }
	.tab-item-notif.activ { background: var(--bg-card); color: var(--primary); box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1px solid var(--border); }
	
	.contor-notif { font-size: 1.3rem; color: var(--text-grey); font-weight: 600; }
	.buton-nou { display: flex; align-items: center; gap: 0.8rem; }

	/* Table */
	.notif-table-container { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.25); overflow: hidden; }
	
	.randul-expirat { opacity: 0.6; }
	.notif-info-celula { display: flex; flex-direction: column; gap: 0.3rem; }
	.notif-titlu-text { font-size: 1.5rem; color: var(--text); }
	.mesaj-preview { display: block; font-size: 1.25rem; color: var(--text-grey); max-width: 40rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	
	.data-celula { font-size: 1.3rem; color: var(--text-grey); font-family: monospace; font-weight: 600; }
	.td-gol { text-align: center; padding: 4rem 2rem; color: var(--text-grey); font-size: 1.5rem; font-style: italic; }

	@media (max-width: 768px) {
		.mobile-only-grid { display: block; }
		.notif-table-container { display: none; }
	}
	
	.mai-multe { text-align: center; margin-top: 1rem; }
	.load-more-btn { min-width: 25rem; }

	/* Delivery badges */
	.badge-livrare { padding: 0.4rem 1.2rem; border-radius: 100px; font-size: 1.1rem; font-weight: 800; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.5px; }
	.badge-livrare--activa { background: #2b8a3e; color: white; box-shadow: 0 0 10px rgba(43, 138, 62, 0.4); }
	.badge-livrare--finalizata { background: var(--bg-dark); color: var(--text-grey); border: 1px solid var(--border); }
	.badge-livrare--expirata { background: #a93226; color: white; }
	.badge-livrare--programata { background: #f39c12; color: white; }
</style>
