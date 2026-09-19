<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { showToast } from '$lib/admin/notify.svelte';
	import { buildConfirmationEmail } from '$lib/utils/emailRenderer';

	let activeSubTab = $state<'template' | 'newsletter' | 'subscribers'>('template');
	let saving = $state(false);
	let sendingTest = $state(false);
	let sendingBroadcast = $state(false);

	// 1. Model Șablon Confirmare
	let template = $state<any>({
		id: 'booking_confirmation',
		template_name: 'Confirmare Înscriere Eveniment & Ordin Misiune',
		subject_template: '🎖️ Confirmare Ordin Misiune: {eventTitle} [Cod: {ticketCode}]',
		headline: 'HTCMX AIRSOFT & TABERE',
		subheadline: 'ORDIN DE MISIUNE & BILET DE ACCES',
		body_intro: 'Cererea ta de înscriere a fost aprobată de Statul Major HTCMX. Locul tău în cadrul efectivului este asigurat, iar rolul tactic ți-a fost atribuit oficial.',
		checklist_items: [
			'Încălțăminte adecvată cu susținere a gleznei (bocanci / ghete outdoor).',
			'Act de identitate (CI/Buletin) pentru semnarea instructajului de securitate.',
			'Ochelarii de protecție balistică sunt asigurați de bază sau aduși personal (testați).',
			'Vino cu 20 de minute înainte de ora de start pentru echipare și cronografiere replică.'
		],
		whatsapp_number: '+40 749 485 815',
		footer_text: '© 2026 HTCMX Tabere & Airsoft | Str. Principală, Baza Tactică Maramureș. Acest mesaj este un email automat de confirmare a participării.',
		ticket_box_title: 'CODUL TĂU UNIC DE ACCES RAPID:',
		ticket_instruction: 'Prezintă acest cod sau biletul digital la recepția poligonului pentru preluarea echipamentului.',
		ticket_cta_enabled: true,
		ticket_cta_text: '🎟️ Deschide Biletul Digital & Harta Bazei →',
		ticket_cta_url: 'http://localhost:8080/index.html?ticket={ticketCode}'
	});

	let newChecklistItem = $state('');

	// 2. Model Newsletter Broadcast
	let newsletter = $state({
		subject: '🔥 Deschidere Înscrieri Tabere Militare 2026 — Locuri Limitate!',
		headline: 'NOUTĂȚI & MISIUNI SPECIALE HTCMX',
		message: 'Sezonul de toamnă aduce cele mai intense scenarii de noapte și module de supraviețuire în pădure. Noile replici de asalt și echipamentele au sosit la bază. Verifică datele disponibile și asigură-ți locul în pluton!',
		cta_text: 'Vezi Misiunile Active & Înscrie-te',
		cta_url: 'http://localhost:8080/#module'
	});

	// 3. Abonați
	let subscribers = $state<any[]>([]);
	let newSubscriberEmail = $state('');
	let newSubscriberName = $state('');
	let searchSubscriber = $state('');

	onMount(async () => {
		await loadTemplate();
		await loadSubscribers();
	});

	async function loadTemplate() {
		const { data, error } = await supabase
			.from('email_templates')
			.select('*')
			.eq('id', 'booking_confirmation')
			.single();

		if (data && !error) {
			template = {
				...template,
				...data,
				checklist_items: Array.isArray(data.checklist_items) ? data.checklist_items : []
			};
		}
	}

	async function loadSubscribers() {
		const { data, error } = await supabase
			.from('newsletter_subscribers')
			.select('*')
			.order('created_at', { ascending: false });

		if (data && !error) {
			subscribers = data;
		}
	}

	function addChecklistItem() {
		if (!newChecklistItem.trim()) return;
		template.checklist_items = [...template.checklist_items, newChecklistItem.trim()];
		newChecklistItem = '';
	}

	function removeChecklistItem(index: number) {
		template.checklist_items = template.checklist_items.filter((_: any, i: number) => i !== index);
	}

	async function saveTemplate() {
		saving = true;
		try {
			const { error } = await supabase
				.from('email_templates')
				.upsert({
					...template,
					updated_at: new Date().toISOString()
				}, { onConflict: 'id' });

			if (error) throw error;
			showToast('success', 'Șablonul de email și regulile au fost salvate cu succes!');
		} catch (err: any) {
			showToast('error', err.message || 'Eroare la salvare.');
		} finally {
			saving = false;
		}
	}

	async function sendTestConfirmationEmail() {
		sendingTest = true;
		try {
			const res = await fetch('http://127.0.0.1:54324/api/v1/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					From: { Email: 'comenzi@htcmx.ro', Name: template.headline || 'HTCMX Tactical Airsoft' },
					To: [{ Email: 'admin.test@htcmx.ro', Name: 'Operator Test Admin' }],
					Subject: `[TEST] ${template.subject_template.replace('{eventTitle}', 'Antrenament Tactic CQB').replace('{ticketCode}', 'HTC-777888')}`,
					HTML: renderConfirmationHTML('Operator Test Admin', 'Antrenament Tactic CQB', '2026-09-26', '09:00', 'Baza HTCMX Maramureș', 'Sniper Recon', 'HTC-777888', 120),
					Text: 'Email de test confirmare HTCMX'
				})
			});

			if (res.ok) {
				showToast('success', 'Emailul de test a fost trimis în Mailpit (http://localhost:54324)!');
			} else {
				showToast('error', 'Nu s-a putut trimite către Mailpit.');
			}
		} catch (err: any) {
			showToast('error', err.message || 'Eroare conexiune Mailpit.');
		} finally {
			sendingTest = false;
		}
	}

	async function sendNewsletterBroadcast() {
		if (subscribers.length === 0) {
			showToast('error', 'Nu există abonați în listă.');
			return;
		}

		sendingBroadcast = true;
		try {
			let sentCount = 0;
			for (const sub of subscribers) {
				await fetch('http://127.0.0.1:54324/api/v1/send', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						From: { Email: 'newsletter@htcmx.ro', Name: 'HTCMX Tactical Airsoft' },
						To: [{ Email: sub.email, Name: sub.name || 'Recrut HTCMX' }],
						Subject: newsletter.subject,
						HTML: renderNewsletterHTML(sub.name || 'Recrut'),
						Text: `${newsletter.headline}\n\n${newsletter.message}\n\n${newsletter.cta_url}`
					})
				});
				sentCount++;
			}

			// Înregistrează campania în baza de date
			await supabase.from('newsletter_campaigns').insert({
				subject: newsletter.subject,
				headline: newsletter.headline,
				message: newsletter.message,
				cta_text: newsletter.cta_text,
				cta_url: newsletter.cta_url,
				recipients_count: sentCount
			});

			showToast('success', `Campanie transmisă către ${sentCount} abonați în Mailpit!`);
		} catch (err: any) {
			showToast('error', err.message || 'Eroare la transmitere.');
		} finally {
			sendingBroadcast = false;
		}
	}

	async function addSubscriber() {
		if (!newSubscriberEmail.trim()) return;
		try {
			const { error } = await supabase.from('newsletter_subscribers').insert({
				email: newSubscriberEmail.trim().toLowerCase(),
				name: newSubscriberName.trim(),
				source: 'admin'
			});

			if (error) throw error;
			showToast('success', 'Abonat adăugat cu succes.');
			newSubscriberEmail = '';
			newSubscriberName = '';
			await loadSubscribers();
		} catch (err: any) {
			showToast('error', err.message || 'Eroare adăugare.');
		}
	}

	async function deleteSubscriber(id: string) {
		const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
		if (!error) {
			subscribers = subscribers.filter(s => s.id !== id);
			showToast('success', 'Abonat șters.');
		}
	}

	// Wrapper care citeste $state intr-un snapshot plain si apeleaza builderul extern
	// (evita bug-ul Svelte 5 care face ReferenceError pe parametrii functiei in template literals)
	function renderConfirmationHTML(recruitName: string, eventTitle: string, date: string, time: string, location: string, position: string, ticketCode: string, price: number): string {
		// Snapshot din $state -> obiect plain JS, fara reactivity
		const tpl = {
			headline: template.headline || 'HTCMX AIRSOFT & TABERE',
			subheadline: template.subheadline || 'ORDIN DE MISIUNE & BILET DE ACCES',
			body_intro: template.body_intro || '',
			ticket_box_title: template.ticket_box_title || 'CODUL TAU UNIC DE ACCES RAPID:',
			ticket_instruction: template.ticket_instruction || 'Prezinta acest cod la receptia poligonului.',
			ticket_cta_enabled: !!template.ticket_cta_enabled,
			ticket_cta_text: template.ticket_cta_text || 'Deschide Biletul Digital',
			ticket_cta_url: template.ticket_cta_url || 'http://localhost:8080/index.html?ticket={ticketCode}',
			whatsapp_number: template.whatsapp_number || '+40 749 485 815',
			footer_text: template.footer_text || '',
			checklist_items: Array.isArray(template.checklist_items) ? [...template.checklist_items] : []
		};
		// Apeleaza builderul extern (fara template literals cu $state)
		return buildConfirmationEmail(recruitName, eventTitle, date, time, location, position, ticketCode, price, tpl);
	}



	function renderNewsletterHTML(recruitName: string) {
		return `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#071407; font-family:'Segoe UI', sans-serif; color:#e0e0e0;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 10px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:linear-gradient(180deg, #0d250d 0%, #081608 100%); border:1px solid #c5a030; border-radius:12px; overflow:hidden;">
        <tr>
          <td style="background-color:#040e04; padding:24px 20px; border-bottom:2px solid #c5a030; text-align:center;">
            <h1 style="margin:0; font-size:20px; color:#c5a030; letter-spacing:2px; text-transform:uppercase; font-weight:800;">HTCMX TACTICAL BULLETIN</h1>
            <p style="margin:4px 0 0 0; font-size:11px; color:#88a888; letter-spacing:1px; text-transform:uppercase;">BULETINUL OFICIAL DE INFORMARE</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <h2 style="margin:0 0 14px 0; font-size:18px; color:#ffffff; line-height:1.3;">${newsletter.headline}</h2>
            <p style="margin:0 0 20px 0; font-size:13.5px; line-height:1.65; color:#d0dfd0;">
              Salut, <strong>${recruitName}</strong>!<br><br>
              ${newsletter.message}
            </p>
            <div style="text-align:center; margin:28px 0 20px 0;">
              <a href="${newsletter.cta_url}" style="background:#c5a030; color:#0d250d; font-size:14px; font-weight:800; padding:12px 28px; text-decoration:none; border-radius:8px; display:inline-block; letter-spacing:0.5px; text-transform:uppercase;">
                ${newsletter.cta_text} →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#040e04; padding:16px; border-top:1px solid #162916; text-align:center; font-size:10.5px; color:#666;">
            © 2026 HTCMX Tabere & Airsoft | Te-ai abonat la noutăți pe site-ul taberehtcmx.ro.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body></html>`;
	}

	const filteredSubscribers = $derived(
		subscribers.filter(s =>
			searchSubscriber === '' ||
			s.email.toLowerCase().includes(searchSubscriber.toLowerCase()) ||
			(s.name && s.name.toLowerCase().includes(searchSubscriber.toLowerCase()))
		)
	);
</script>

<div class="email-manager">
	<!-- HEADER TITLE -->
	<div class="titlu-pagina">
		<div>
			<h1>Gestiune Email & Newsletter</h1>
			<p class="subtitle-text">Personalizează șabloanele de confirmare, regulamentul meciurilor și transmite campanii de newsletter.</p>
		</div>
	</div>

	<!-- TOP TABS NAVIGATION -->
	<div class="email-subtabs">
		<button
			type="button"
			class="subtab-btn"
			class:active={activeSubTab === 'template'}
			onclick={() => (activeSubTab = 'template')}
		>
			📋 Șablon Confirmare & Reguli Meci
		</button>
		<button
			type="button"
			class="subtab-btn"
			class:active={activeSubTab === 'newsletter'}
			onclick={() => (activeSubTab = 'newsletter')}
		>
			🚀 Transmisie Newsletter
		</button>
		<button
			type="button"
			class="subtab-btn"
			class:active={activeSubTab === 'subscribers'}
			onclick={() => (activeSubTab = 'subscribers')}
		>
			👥 Abonați ({subscribers.length})
		</button>
	</div>

	<!-- TAB 1: ȘABLON CONFIRMARE & REGULI MECI (DUAL SPLIT SCREEN) -->
	{#if activeSubTab === 'template'}
		<div class="split-view-grid">
			<!-- LEFT: EDITOR FORM -->
			<div class="editor-pane">
				<div class="pane-card">
					<div class="pane-header">
						<h3>📝 Configurare Conținut Email Confirmare</h3>
					</div>

					<div class="form-fields">
						<div class="camp">
							<label for="tpl-head">Titlu Header (Brand)</label>
							<input id="tpl-head" bind:value={template.headline} placeholder="HTCMX AIRSOFT & TABERE" />
						</div>

						<div class="camp">
							<label for="tpl-subhead">Subtitlu Header</label>
							<input id="tpl-subhead" bind:value={template.subheadline} placeholder="ORDIN DE MISIUNE & BILET DE ACCES" />
						</div>

						<div class="camp">
							<label for="tpl-subject">Format Subiect Email</label>
							<input id="tpl-subject" bind:value={template.subject_template} placeholder="🎖️ Confirmare Ordin Misiune: &#123;eventTitle&#125; [Cod: &#123;ticketCode&#125;]" />
							<span class="field-hint">Variabile disponibile: &#123;eventTitle&#125;, &#123;ticketCode&#125;</span>
						</div>

						<div class="camp">
							<label for="tpl-intro">Mesaj Introductiv Aprobare</label>
							<textarea id="tpl-intro" rows="3" bind:value={template.body_intro}></textarea>
						</div>

						<!-- CONFIGURARE BILET DIGITAL & COD ACCES RAPID -->
						<div class="ticket-builder-box">
							<div class="builder-header">
								<label for="tpl-ticket-title">🎟️ Configurare Cod Acces & Buton Bilet Digital (Link)</label>
							</div>

							<div class="camp">
								<label for="tpl-ticket-title">Titlu Casă Cod Acces</label>
								<input id="tpl-ticket-title" bind:value={template.ticket_box_title} placeholder="CODUL TĂU UNIC DE ACCES RAPID:" />
							</div>

							<div class="toggle-row" style="margin: 0.4rem 0;">
								<label class="switch-label">
									<input type="checkbox" bind:checked={template.ticket_cta_enabled} />
									<span class="switch-text" style="color:var(--primary); font-weight:700;">Afișează Buton Link Bilet Digital în Email</span>
								</label>
							</div>

							{#if template.ticket_cta_enabled}
								<div class="form-row-2col">
									<div class="camp">
										<label for="tpl-ticket-text">Text Buton Link Bilet</label>
										<input id="tpl-ticket-text" bind:value={template.ticket_cta_text} placeholder="🎟️ Deschide Biletul Digital & Harta Bazei →" />
									</div>
									<div class="camp">
										<label for="tpl-ticket-url">Format URL Bilet (cu &#123;ticketCode&#125;)</label>
										<input id="tpl-ticket-url" bind:value={template.ticket_cta_url} placeholder="http://localhost:8080/index.html?ticket=&#123;ticketCode&#125;" />
									</div>
								</div>
							{/if}

							<div class="camp">
								<label for="tpl-ticket-inst">Instrucțiune Prezentare Recepție</label>
								<input id="tpl-ticket-inst" bind:value={template.ticket_instruction} placeholder="Prezintă acest cod sau biletul digital la recepția poligonului pentru preluarea echipamentului." />
							</div>
						</div>

						<!-- CHECKLIST REGULI MECI -->
						<div class="checklist-builder">
							<div class="builder-header">
								<label for="new-check-item">📋 Checklist Obligatoriu pentru Meci (Reguli & Echipament)</label>
							</div>

							<div class="checklist-items-list">
								{#each template.checklist_items as item, index}
									<div class="checklist-row">
										<span class="item-num">{index + 1}.</span>
										<input type="text" bind:value={template.checklist_items[index]} class="item-input" />
										<button type="button" class="btn-remove-item" onclick={() => removeChecklistItem(index)} title="Șterge regula">
											✕
										</button>
									</div>
								{/each}
							</div>

							<div class="add-item-row">
								<input
									id="new-check-item"
									type="text"
									placeholder="Adaugă o nouă regulă sau instrucțiune..."
									bind:value={newChecklistItem}
									onkeydown={(e) => e.key === 'Enter' ? (e.preventDefault(), addChecklistItem()) : null}
								/>
								<button type="button" class="btn btn-secondary" onclick={addChecklistItem}>
									+ Adaugă
								</button>
							</div>
						</div>

						<div class="form-row-2col">
							<div class="camp">
								<label for="tpl-wa">Număr WhatsApp Urgențe</label>
								<input id="tpl-wa" bind:value={template.whatsapp_number} placeholder="+40 749 485 815" />
							</div>
						</div>

						<div class="camp">
							<label for="tpl-footer">Text Notă Subsol (Footer)</label>
							<textarea id="tpl-footer" rows="2" bind:value={template.footer_text}></textarea>
						</div>
					</div>

					<div class="pane-footer">
						<button type="button" class="btn btn-secondary" onclick={sendTestConfirmationEmail} disabled={sendingTest}>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
							{sendingTest ? 'Se trimite test...' : '✉️ Trimite Test în Mailpit'}
						</button>
						<button type="button" class="btn btn-primary" onclick={saveTemplate} disabled={saving}>
							{saving ? 'Se salvează...' : '💾 Salvează Șablonul'}
						</button>
					</div>
				</div>
			</div>

			<!-- RIGHT: LIVE EMAIL PREVIEW HUB -->
			<div class="preview-pane">
				<div class="preview-card-sticky">
					<div class="preview-hud-header">
						<div class="hud-live-tag">
							<span class="hud-dot"></span>
							<span>Live Preview Email Confirmare</span>
						</div>
						<span class="preview-badge">HTML View</span>
					</div>

					<div class="preview-email-frame">
						{@html renderConfirmationHTML('Alexandru Pop', 'Misiune Nocturnă: Cod Roșu', '19 Septembrie 2026', '09:00', 'Baza HTCMX Maramureș', 'Asalt Frontal', 'HTC-549657', 100)}
					</div>
				</div>
			</div>
		</div>

	<!-- TAB 2: TRANSMISIE NEWSLETTER -->
	{:else if activeSubTab === 'newsletter'}
		<div class="split-view-grid">
			<div class="editor-pane">
				<div class="pane-card">
					<div class="pane-header">
						<h3>🚀 Compunere Buletin Informativ / Newsletter</h3>
					</div>

					<div class="form-fields">
						<div class="camp">
							<label for="news-subj">Subiect Email *</label>
							<input id="news-subj" bind:value={newsletter.subject} placeholder="ex: Deschidere Sezon MILSIM..." />
						</div>

						<div class="camp">
							<label for="news-head">Titlu Principal Anunț</label>
							<input id="news-head" bind:value={newsletter.headline} placeholder="NOUTĂȚI & MISIUNI SPECIALE HTCMX" />
						</div>

						<div class="camp">
							<label for="news-msg">Mesaj Anunț / Conținut Buletin *</label>
							<textarea id="news-msg" rows="6" bind:value={newsletter.message} placeholder="Scrie mesajul către toți abonații..."></textarea>
						</div>

						<div class="form-row-2col">
							<div class="camp">
								<label for="news-cta">Text Buton Acțiune (CTA)</label>
								<input id="news-cta" bind:value={newsletter.cta_text} placeholder="Vezi Misiunile Active" />
							</div>
							<div class="camp">
								<label for="news-url">Link Buton (URL)</label>
								<input id="news-url" bind:value={newsletter.cta_url} placeholder="http://localhost:8080/#module" />
							</div>
						</div>
					</div>

					<div class="pane-footer">
						<button type="button" class="btn btn-primary" onclick={sendNewsletterBroadcast} disabled={sendingBroadcast}>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
							{sendingBroadcast ? 'Se transmite...' : `🚀 Transmite către Cei ${subscribers.length} Abonați (Mailpit)`}
						</button>
					</div>
				</div>
			</div>

			<!-- RIGHT: NEWSLETTER PREVIEW -->
			<div class="preview-pane">
				<div class="preview-card-sticky">
					<div class="preview-hud-header">
						<div class="hud-live-tag">
							<span class="hud-dot"></span>
							<span>Live Preview Buletin Informativ</span>
						</div>
						<span class="preview-badge">Newsletter</span>
					</div>

					<div class="preview-email-frame">
						{@html renderNewsletterHTML('Alexandru Pop')}
					</div>
				</div>
			</div>
		</div>

	<!-- TAB 3: ABONAȚI NEWSLETTER -->
	{:else if activeSubTab === 'subscribers'}
		<div class="subscribers-view">
			<div class="subscribers-toolbar">
				<div class="subscribers-search">
					<input type="text" placeholder="Caută abonat după email sau nume..." bind:value={searchSubscriber} />
				</div>
				<div class="subscribers-add-box">
					<input type="email" placeholder="email@exemplu.ro" bind:value={newSubscriberEmail} />
					<input type="text" placeholder="Nume (opțional)" bind:value={newSubscriberName} />
					<button type="button" class="btn btn-primary" onclick={addSubscriber}>+ Adaugă Abonat</button>
				</div>
			</div>

			<div class="tabel-container table-scroll desktop-only-table">
				<table class="tabel-admin">
					<thead>
						<tr>
							<th>#</th>
							<th>Email</th>
							<th>Nume</th>
							<th>Sursă</th>
							<th>Data Înscrierii</th>
							<th style="text-align:right;">Acțiuni</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredSubscribers as sub, i}
							<tr>
								<td>{i + 1}</td>
								<td><strong>{sub.email}</strong></td>
								<td>{sub.name || '—'}</td>
								<td><span class="badge-source">{sub.source || 'website'}</span></td>
								<td>{new Date(sub.created_at).toLocaleDateString('ro-RO')}</td>
								<td style="text-align:right;">
									<button class="btn-delete-sub" onclick={() => deleteSubscriber(sub.id)} title="Șterge abonatul">
										🗑️
									</button>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="6" style="text-align:center; padding:3rem; color:var(--text-grey);">
									Niciun abonat găsit.
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- MOBIL: același conținut ca tabelul, sub formă de carduri -->
			<div class="mobile-only-grid">
				{#each filteredSubscribers as sub}
					<div class="sub-mobile-card">
						<div class="sub-card-info">
							<strong>{sub.email}</strong>
							<small>{sub.name || '—'}</small>
							<div class="sub-card-meta">
								<span class="badge-source">{sub.source || 'website'}</span>
								<small>{new Date(sub.created_at).toLocaleDateString('ro-RO')}</small>
							</div>
						</div>
						<button class="btn-delete-sub" onclick={() => deleteSubscriber(sub.id)} title="Șterge abonatul">
							🗑️
						</button>
					</div>
				{:else}
					<div class="sub-mobile-empty">Niciun abonat găsit.</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.email-manager {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.subtitle-text {
		color: var(--text-grey);
		font-size: 1.35rem;
		margin-top: 0.4rem;
	}

	.email-subtabs {
		display: flex;
		gap: 0.8rem;
		background: rgba(0, 0, 0, 0.4);
		padding: 0.6rem;
		border-radius: 12px;
		border: 1px solid var(--border);
	}

	.subtab-btn {
		padding: 0.9rem 1.8rem;
		border-radius: 8px;
		border: none;
		background: transparent;
		color: var(--text-grey);
		font-size: 1.35rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
	}

	.subtab-btn.active {
		background: var(--bg-card);
		color: var(--primary);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	}

	/* SPLIT VIEW */
	.split-view-grid {
		display: grid;
		/* minmax(0, …) — fara el, coloana se dilata la min-content-ul
		   previzualizarii de email (tabel de 600px) si iese din ecran pe mobil */
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
		gap: 2.4rem;
	}

	.editor-pane,
	.preview-pane {
		min-width: 0;
	}

	.pane-card {
		background: var(--bg-card);
		border: 1px solid var(--border-strong);
		border-radius: 16px;
		padding: 2.4rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.pane-header h3 {
		font-size: 1.7rem;
		font-weight: 800;
		color: var(--primary);
		margin: 0;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: 1.6rem;
	}

	.field-hint {
		font-size: 1.15rem;
		color: var(--text-grey);
	}

	/* CHECKLIST BUILDER */
	.checklist-builder {
		background: rgba(0, 0, 0, 0.25);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.6rem;
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
	}

	.builder-header label {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--primary-light);
	}

	.checklist-items-list {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.checklist-row {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.item-num {
		font-size: 1.2rem;
		font-weight: 800;
		color: var(--primary);
		min-width: 2rem;
	}

	.item-input {
		flex: 1;
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.6rem 1rem;
		color: var(--text);
		font-size: 1.3rem;
	}

	.btn-remove-item {
		background: rgba(224, 49, 49, 0.2);
		border: 1px solid var(--danger);
		color: #ff8787;
		padding: 0.4rem 0.8rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: bold;
	}

	.add-item-row {
		display: flex;
		gap: 0.8rem;
		margin-top: 0.6rem;
	}

	.add-item-row input {
		flex: 1;
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.6rem 1rem;
		color: var(--text);
		font-size: 1.3rem;
	}

	.pane-footer {
		display: flex;
		justify-content: flex-end;
		gap: 1.2rem;
		padding-top: 1.6rem;
		border-top: 1px solid var(--border);
	}

	/* PREVIEW PANE */
	.preview-card-sticky {
		position: sticky;
		top: 2rem;
		background: linear-gradient(180deg, #091c09 0%, #050f05 100%);
		border: 1px solid var(--border-strong);
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6);
	}

	.preview-hud-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.2rem 1.6rem;
		background: rgba(0, 0, 0, 0.4);
		border-bottom: 1px solid var(--border);
	}

	.hud-live-tag {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		font-size: 1.3rem;
		font-weight: 800;
		color: var(--primary-light);
	}

	.hud-dot {
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

	.preview-badge {
		background: rgba(197, 160, 48, 0.15);
		border: 1px solid var(--primary);
		color: var(--primary);
		font-size: 1.1rem;
		font-weight: 800;
		padding: 0.2rem 0.8rem;
		border-radius: 6px;
	}

	.preview-email-frame {
		max-height: 650px;
		overflow-y: auto;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		background: #071407;
	}

	/* SUBSCRIBERS */
	.subscribers-view {
		display: flex;
		flex-direction: column;
		gap: 1.6rem;
	}

	.subscribers-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1.6rem;
		flex-wrap: wrap;
		background: var(--bg-card);
		padding: 1.4rem;
		border-radius: 12px;
		border: 1px solid var(--border);
	}

	.subscribers-search input {
		width: 32rem;
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid var(--border);
		padding: 0.8rem 1.2rem;
		border-radius: 8px;
		color: var(--text);
		font-size: 1.3rem;
	}

	.subscribers-add-box {
		display: flex;
		gap: 0.8rem;
	}

	.subscribers-add-box input {
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid var(--border);
		padding: 0.8rem 1.2rem;
		border-radius: 8px;
		color: var(--text);
		font-size: 1.3rem;
	}

	.badge-source {
		background: rgba(197, 160, 48, 0.15);
		color: var(--primary);
		padding: 0.3rem 0.8rem;
		border-radius: 6px;
		font-size: 1.15rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.btn-delete-sub {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.5rem;
		padding: 0.4rem;
	}

	/* MOBIL: carduri abonați în locul tabelului */
	.mobile-only-grid {
		display: none;
	}

	.sub-mobile-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1.2rem;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 1.4rem 1.6rem;
		margin-bottom: 1.2rem;
	}

	.sub-card-info {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		min-width: 0;
	}

	.sub-card-info strong {
		font-size: 1.4rem;
		color: var(--text);
		overflow-wrap: anywhere;
	}

	.sub-card-info small {
		font-size: 1.2rem;
		color: var(--text-grey);
	}

	.sub-card-meta {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		flex-wrap: wrap;
		margin-top: 0.2rem;
	}

	.sub-mobile-empty {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-grey);
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 14px;
	}

	@media (max-width: 1000px) {
		.split-view-grid {
			grid-template-columns: minmax(0, 1fr);
		}

		/* pe o coloană nu mai are ce urmări, iar sidebar-ul e deja sticky sus */
		.preview-card-sticky {
			position: static;
		}
	}

	@media (max-width: 768px) {
		.email-manager {
			gap: 1.6rem;
		}

		/* tab-urile devin o bandă cu scroll orizontal, ca sidebar-ul din admin.css */
		.email-subtabs {
			gap: 0.4rem;
			padding: 0.4rem;
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none;
		}
		.email-subtabs::-webkit-scrollbar {
			display: none;
		}

		.subtab-btn {
			padding: 0.8rem 1.2rem;
			font-size: 1.25rem;
			white-space: nowrap;
			flex: 0 0 auto;
		}

		.pane-card {
			padding: 1.6rem;
			gap: 1.6rem;
			border-radius: 14px;
		}

		.pane-header h3 {
			font-size: 1.5rem;
		}

		/* butoanele de acțiune pe toată lățimea, în loc de rând înghesuit */
		.pane-footer {
			flex-direction: column-reverse;
			align-items: stretch;
			gap: 0.8rem;
		}
		.pane-footer .btn {
			width: 100%;
			justify-content: center;
		}

		.add-item-row {
			flex-direction: column;
			align-items: stretch;
		}
		.add-item-row .btn {
			width: 100%;
		}

		.checklist-builder,
		.ticket-builder-box {
			padding: 1.2rem;
		}

		.preview-email-frame {
			max-height: 60vh;
		}

		/* tabelul de abonați → carduri */
		.desktop-only-table {
			display: none !important;
		}
		.mobile-only-grid {
			display: block;
		}

		.subscribers-toolbar {
			flex-direction: column;
			align-items: stretch;
			gap: 1.2rem;
			padding: 1.2rem;
		}
		.subscribers-search input {
			width: 100%;
		}
		.subscribers-add-box {
			flex-direction: column;
			align-items: stretch;
		}
		.subscribers-add-box .btn {
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.subtitle-text {
			font-size: 1.25rem;
		}

		.preview-hud-header {
			padding: 1rem 1.2rem;
			gap: 0.8rem;
		}
		.hud-live-tag {
			font-size: 1.15rem;
		}

		/* numărul, inputul și ✕ nu încap pe un rând sub 480px */
		.checklist-row {
			flex-wrap: wrap;
			gap: 0.6rem;
		}
		.item-input {
			flex: 1 1 100%;
			order: 3;
		}

		.sub-mobile-card {
			padding: 1.2rem;
		}
	}

	/* TICKET BUILDER BOX */
	.ticket-builder-box {
		background: rgba(197, 160, 48, 0.04);
		border: 1px solid rgba(197, 160, 48, 0.35);
		border-radius: 12px;
		padding: 1.6rem;
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
	}

	.ticket-builder-box .builder-header label {
		color: var(--primary);
	}

	/* TOGGLE SWITCH */
	.toggle-row {
		display: flex;
		align-items: center;
	}

	.switch-label {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		cursor: pointer;
		user-select: none;
	}

	.switch-label input[type='checkbox'] {
		width: 1.8rem;
		height: 1.8rem;
		accent-color: var(--primary);
		cursor: pointer;
	}

	.switch-text {
		font-size: 1.25rem;
	}
</style>
