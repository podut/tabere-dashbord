// =========================================================================
// HTCMX ADMIN — EMAIL DISPATCH SERVICE (INTEGRARE MAILPIT & DYNAMIC TEMPLATES)
// =========================================================================

import { supabase } from '$lib/supabase';

export interface BookingEmailPayload {
	recruitName: string;
	recruitEmail: string;
	eventTitle: string;
	eventDate?: string;
	eventTime?: string;
	location?: string;
	position: string;
	ticketCode: string;
	price?: number;
}

export class EmailService {
	// Obtine sablonul activ din baza de date
	static async getTemplate(templateId: string = 'booking_confirmation') {
		try {
			const { data, error } = await supabase
				.from('email_templates')
				.select('*')
				.eq('id', templateId)
				.single();

			if (data && !error) return data;
		} catch {
			// Fallback la valorile implicite
		}

		return {
			headline: 'HTCMX AIRSOFT & TABERE',
			subheadline: 'ORDIN DE MISIUNE & BILET DE ACCES',
			subject_template: '🎖️ Confirmare Ordin Misiune: {eventTitle} [Cod: {ticketCode}]',
			body_intro: 'Cererea ta de inscriere a fost aprobata de Statul Major HTCMX. Locul tau in cadrul efectivului este asigurat, iar rolul tactic ti-a fost atribuit oficial.',
			checklist_items: [
				'Incaltaminte adecvata cu sustinere a gleznei (bocanci / ghete outdoor).',
				'Act de identitate (CI/Buletin) pentru semnarea instructajului de securitate.',
				'Ochelarii de protectie balistica sunt asigurati de baza sau adusi personal (testati).',
				'Vino cu 20 de minute inainte de ora de start pentru echipare si cronografiere replica.'
			],
			whatsapp_number: '+40 749 485 815',
			footer_text: '© 2026 HTCMX Tabere & Airsoft | Str. Principala, Baza Tactica Maramures. Acest mesaj este un email automat de confirmare a participarii.',
			ticket_box_title: 'CODUL TAU UNIC DE ACCES RAPID:',
			ticket_instruction: 'Prezinta acest cod sau biletul digital la receptia poligonului pentru preluarea echipamentului.',
			ticket_cta_enabled: true,
			ticket_cta_text: '🎟️ Deschide Biletul Digital & Harta Bazei',
			ticket_cta_url: 'http://localhost:8080/index.html?ticket={ticketCode}'
		};
	}

	// Trimite email de confirmare a participarii si ordin de misiune
	static async sendBookingConfirmation(payload: BookingEmailPayload): Promise<boolean> {
		if (!payload.recruitEmail) return false;

		const tpl = await this.getTemplate('booking_confirmation');

		const subject = tpl.subject_template
			? tpl.subject_template
				.replace('{eventTitle}', payload.eventTitle)
				.replace('{ticketCode}', payload.ticketCode)
			: `🎖️ Confirmare Ordin Misiune: ${payload.eventTitle} [Cod: ${payload.ticketCode}]`;

		const checklistHtml = (tpl.checklist_items || [])
			.map((item: string) => `<li>${item}</li>`)
			.join('');

		// Construieste URL-ul biletului cu codul real
		const ticketUrl = (tpl.ticket_cta_url || 'http://localhost:8080/index.html?ticket={ticketCode}')
			.replace('{ticketCode}', payload.ticketCode);

		// Buton CTA Bilet Digital — vizibil doar daca este activat in dashboard
		const ticketCtaHtml = tpl.ticket_cta_enabled
			? `<div style="margin-top:8px; margin-bottom:10px;"><a href="${ticketUrl}" target="_blank" style="background:#c5a030; color:#071407; font-size:13px; font-weight:800; padding:12px 28px; text-decoration:none; border-radius:7px; display:inline-block; letter-spacing:0.5px; text-transform:uppercase; box-shadow:0 4px 14px rgba(197,160,48,0.4);">${tpl.ticket_cta_text || '🎟️ Deschide Biletul Digital'}</a></div>`
			: '';

		const html = `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><title>${subject}</title></head><body style="margin:0;padding:0;background:#071407;font-family:'Segoe UI',sans-serif;color:#e0e0e0;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#071407;padding:30px 15px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#0d250d 0%,#081608 100%);border:1px solid #3d3419;border-radius:14px;overflow:hidden;box-shadow:0 12px 35px rgba(0,0,0,0.8);"><tr><td style="background:#040e04;padding:24px 30px;border-bottom:2px solid #c5a030;text-align:center;"><h1 style="margin:0;font-size:24px;color:#c5a030;letter-spacing:2px;text-transform:uppercase;font-weight:800;">${tpl.headline}</h1><p style="margin:4px 0 0 0;font-size:12px;color:#88a888;letter-spacing:1.5px;text-transform:uppercase;">${tpl.subheadline}</p></td></tr><tr><td style="background:rgba(81,207,102,0.15);padding:14px 30px;border-bottom:1px solid rgba(81,207,102,0.3);text-align:center;"><span style="font-size:14px;font-weight:700;color:#51cf66;">🟢 STATUT: CONFIRMAT & REPARTIZAT PE POZITIE</span></td></tr><tr><td style="padding:30px;"><h2 style="margin:0 0 16px 0;font-size:18px;color:#fff;">Salut, <span style="color:#c5a030;">${payload.recruitName}</span>!</h2><p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#ccc;">${tpl.body_intro}</p><table width="100%" cellpadding="12" cellspacing="0" style="background:#040d04;border:1px solid #233b23;border-radius:10px;margin-bottom:24px;"><tr><td style="border-bottom:1px solid #162916;font-size:13px;color:#888;">🎯 Misiune:</td><td style="border-bottom:1px solid #162916;font-size:14px;font-weight:700;color:#fff;" align="right">${payload.eventTitle}</td></tr><tr><td style="border-bottom:1px solid #162916;font-size:13px;color:#888;">📅 Data:</td><td style="border-bottom:1px solid #162916;font-size:14px;font-weight:700;color:#fff;" align="right">${payload.eventDate || 'Conform calendar'}</td></tr><tr><td style="border-bottom:1px solid #162916;font-size:13px;color:#888;">⏰ Ora Start:</td><td style="border-bottom:1px solid #162916;font-size:14px;font-weight:700;color:#c5a030;" align="right">${payload.eventTime || '09:00'}</td></tr><tr><td style="border-bottom:1px solid #162916;font-size:13px;color:#888;">📍 Locatie:</td><td style="border-bottom:1px solid #162916;font-size:14px;font-weight:600;color:#fff;" align="right">${payload.location || 'Baza HTCMX Maramures'}</td></tr><tr><td style="font-size:13px;color:#888;">🪖 Rol Tactic:</td><td style="font-size:14px;font-weight:800;color:#51cf66;" align="right">${payload.position}</td></tr></table><div style="background:rgba(197,160,48,0.08);border:1px solid #c5a030;border-radius:10px;padding:22px;text-align:center;margin-bottom:24px;"><span style="font-size:12px;font-weight:700;text-transform:uppercase;color:#c5a030;letter-spacing:1.5px;display:block;margin-bottom:8px;">${tpl.ticket_box_title}</span><span style="font-family:monospace;font-size:24px;font-weight:900;color:#fff;letter-spacing:5px;background:#000;padding:8px 22px;border-radius:7px;display:inline-block;border:1px solid #333;margin-bottom:14px;">${payload.ticketCode}</span>${ticketCtaHtml}<p style="margin:8px 0 0 0;font-size:12px;color:#a0b8a0;font-style:italic;">${tpl.ticket_instruction}</p></div><div style="background:#0a180a;border-left:3px solid #c5a030;padding:14px 16px;margin-bottom:20px;border-radius:0 8px 8px 0;"><h4 style="margin:0 0 8px 0;font-size:13px;color:#c5a030;text-transform:uppercase;">📋 Checklist Obligatoriu pentru Meci:</h4><ul style="margin:0;padding-left:18px;font-size:12px;color:#ccc;line-height:1.6;">${checklistHtml}</ul></div><p style="margin:0;font-size:12.5px;color:#888;">Urgente / WhatsApp: <strong style="color:#c5a030;">${tpl.whatsapp_number}</strong></p></td></tr><tr><td style="background:#040e04;padding:16px 24px;border-top:1px solid #162916;text-align:center;font-size:11px;color:#666;">${tpl.footer_text}</td></tr></table></td></tr></table></body></html>`;

		const text = `Salut ${payload.recruitName},\nInscriere confirmata la ${payload.eventTitle}!\nPozitie: ${payload.position}\nCod Acces: ${payload.ticketCode}\nBilet: ${ticketUrl}\nWhatsApp: ${tpl.whatsapp_number}`;

		try {
			const res = await fetch('http://127.0.0.1:54324/api/v1/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					From: { Email: 'comenzi@htcmx.ro', Name: tpl.headline || 'HTCMX Tactical Airsoft' },
					To: [{ Email: payload.recruitEmail, Name: payload.recruitName }],
					Subject: subject,
					Text: text,
					HTML: html
				})
			});
			return res.ok;
		} catch {
			return false;
		}
	}
}
