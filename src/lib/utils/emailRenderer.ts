// =========================================================================
// EMAIL HTML RENDERER — fisier TypeScript pur, fara Svelte reactivity
// Mutat intentionat in afara componentelor Svelte pentru a evita bug-ul
// Svelte 5 care analizeaza template literals returnate din {@html} si
// incearca sa faca ${param} reactiv la nivel de componenta.
// =========================================================================

export interface EmailTemplateConfig {
	headline: string;
	subheadline: string;
	body_intro: string;
	ticket_box_title: string;
	ticket_instruction: string;
	ticket_cta_enabled: boolean;
	ticket_cta_text: string;
	ticket_cta_url: string;
	whatsapp_number: string;
	footer_text: string;
	checklist_items: string[];
}

export function buildConfirmationEmail(
	recruitName: string,
	eventTitle: string,
	date: string,
	time: string,
	location: string,
	position: string,
	ticketCode: string,
	price: number,
	tpl: EmailTemplateConfig
): string {
	const listHtml = (tpl.checklist_items || []).map((item) => '<li>' + item + '</li>').join('');

	const ticketUrl = (tpl.ticket_cta_url || 'http://localhost:8080/index.html?ticket=CODE')
		.replace('CODE', ticketCode)
		.replace('{ticketCode}', ticketCode);

	let ticketCtaBlock = '';
	if (tpl.ticket_cta_enabled) {
		ticketCtaBlock =
			'<div style="margin-top:6px;margin-bottom:10px;">' +
			'<a href="' + ticketUrl + '" target="_blank" ' +
			'style="background:#c5a030;color:#071407;font-size:12.5px;font-weight:800;' +
			'padding:10px 22px;text-decoration:none;border-radius:6px;display:inline-block;' +
			'letter-spacing:0.5px;text-transform:uppercase;box-shadow:0 3px 10px rgba(197,160,48,0.3);">' +
			(tpl.ticket_cta_text || 'Deschide Biletul Digital') +
			'</a></div>';
	}

	return (
		'<!DOCTYPE html><html><body style="margin:0;padding:0;background:#071407;font-family:\'Segoe UI\',sans-serif;color:#e0e0e0;">' +
		'<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 10px;"><tr><td align="center">' +
		'<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:linear-gradient(180deg,#0d250d 0%,#081608 100%);border:1px solid #3d3419;border-radius:12px;overflow:hidden;">' +

		// HEADER
		'<tr><td style="background-color:#040e04;padding:20px;border-bottom:2px solid #c5a030;text-align:center;">' +
		'<h1 style="margin:0;font-size:20px;color:#c5a030;letter-spacing:2px;text-transform:uppercase;font-weight:800;">' + tpl.headline + '</h1>' +
		'<p style="margin:4px 0 0 0;font-size:11px;color:#88a888;letter-spacing:1px;text-transform:uppercase;">' + tpl.subheadline + '</p>' +
		'</td></tr>' +

		// STATUS BAR
		'<tr><td style="background:rgba(81,207,102,0.15);padding:10px 20px;border-bottom:1px solid rgba(81,207,102,0.3);text-align:center;">' +
		'<span style="font-size:12px;font-weight:700;color:#51cf66;">&#x1F7E2; STATUT: CONFIRMAT &amp; REPARTIZAT</span>' +
		'</td></tr>' +

		// BODY
		'<tr><td style="padding:24px;">' +
		'<h2 style="margin:0 0 12px 0;font-size:16px;color:#fff;">Salut, <span style="color:#c5a030;">' + recruitName + '</span>!</h2>' +
		'<p style="margin:0 0 20px 0;font-size:13px;line-height:1.6;color:#ccc;">' + tpl.body_intro + '</p>' +

		// EVENT TABLE
		'<table width="100%" cellpadding="10" cellspacing="0" style="background:#040d04;border:1px solid #233b23;border-radius:8px;margin-bottom:20px;">' +
		'<tr><td style="border-bottom:1px solid #162916;font-size:12px;color:#888;">&#x1F3AF; Misiune:</td><td style="border-bottom:1px solid #162916;font-size:13px;font-weight:700;color:#fff;" align="right">' + eventTitle + '</td></tr>' +
		'<tr><td style="border-bottom:1px solid #162916;font-size:12px;color:#888;">&#x1F4C5; Data:</td><td style="border-bottom:1px solid #162916;font-size:13px;font-weight:700;color:#fff;" align="right">' + date + ' &middot; ' + time + '</td></tr>' +
		'<tr><td style="border-bottom:1px solid #162916;font-size:12px;color:#888;">&#x1F4CD; Locatie:</td><td style="border-bottom:1px solid #162916;font-size:13px;font-weight:600;color:#fff;" align="right">' + location + '</td></tr>' +
		'<tr><td style="border-bottom:1px solid #162916;font-size:12px;color:#888;">&#x1FA96; Rol Tactic:</td><td style="border-bottom:1px solid #162916;font-size:13px;font-weight:800;color:#51cf66;" align="right">' + position + '</td></tr>' +
		'<tr><td style="font-size:12px;color:#888;">&#x1F4B3; Tarif:</td><td style="font-size:13px;font-weight:700;color:#fff;" align="right">' + price + ' RON</td></tr>' +
		'</table>' +

		// TICKET BOX
		'<div style="background:rgba(197,160,48,0.08);border:1px solid #c5a030;border-radius:10px;padding:18px;text-align:center;margin-bottom:22px;box-shadow:0 4px 15px rgba(0,0,0,0.4);">' +
		'<span style="font-size:11px;font-weight:700;text-transform:uppercase;color:#c5a030;display:block;margin-bottom:6px;letter-spacing:1px;">' + tpl.ticket_box_title + '</span>' +
		'<span style="font-family:monospace;font-size:22px;font-weight:900;color:#fff;letter-spacing:4px;background:#000;padding:8px 20px;border-radius:6px;display:inline-block;border:1px solid #333;margin-bottom:12px;">' + ticketCode + '</span>' +
		ticketCtaBlock +
		'<p style="margin:6px 0 0 0;font-size:11.5px;color:#a0b8a0;font-style:italic;">' + tpl.ticket_instruction + '</p>' +
		'</div>' +

		// CHECKLIST
		'<div style="background:#0a180a;border-left:3px solid #c5a030;padding:14px 16px;margin-bottom:20px;border-radius:0 8px 8px 0;">' +
		'<h4 style="margin:0 0 8px 0;font-size:12.5px;color:#c5a030;text-transform:uppercase;">&#x1F4CB; Checklist Obligatoriu pentru Meci:</h4>' +
		'<ul style="margin:0;padding-left:18px;font-size:11.5px;color:#ccc;line-height:1.6;">' + listHtml + '</ul>' +
		'</div>' +

		'<p style="margin:0;font-size:12px;color:#888;">Urgente / WhatsApp: <strong style="color:#c5a030;">' + tpl.whatsapp_number + '</strong></p>' +
		'</td></tr>' +

		// FOOTER
		'<tr><td style="background-color:#040e04;padding:16px;border-top:1px solid #162916;text-align:center;font-size:10.5px;color:#666;">' +
		tpl.footer_text +
		'</td></tr>' +

		'</table></td></tr></table></body></html>'
	);
}
