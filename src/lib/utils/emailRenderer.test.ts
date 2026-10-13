import { describe, it, expect } from 'vitest';
import { buildConfirmationEmail, type EmailTemplateConfig } from './emailRenderer';

const tpl: EmailTemplateConfig = {
	headline: 'Confirmare',
	subheadline: 'Sub',
	body_intro: 'Intro',
	ticket_box_title: 'Bilet',
	ticket_instruction: 'Arata codul',
	ticket_cta_enabled: true,
	ticket_cta_text: 'Deschide',
	ticket_cta_url: 'https://taberehtcmx.ro/?ticket=CODE',
	whatsapp_number: '0700',
	footer_text: 'Footer',
	checklist_items: ['Masca', 'Buletin']
};
const build = (over: Partial<EmailTemplateConfig> = {}, name = 'Ion') =>
	buildConfirmationEmail(name, 'Meci', '2026-10-01', '10:00', 'Baia Mare', 'Sniper', 'HTC-123456', 150, {
		...tpl,
		...over
	});

describe('buildConfirmationEmail', () => {
	it('includes core booking data', () => {
		const html = build();
		for (const s of ['Ion', 'Meci', '2026-10-01', '10:00', 'Baia Mare', 'Sniper', 'HTC-123456', '150 RON']) {
			expect(html).toContain(s);
		}
	});
	it('renders checklist items', () => {
		const html = build();
		expect(html).toContain('<li>Masca</li>');
		expect(html).toContain('<li>Buletin</li>');
	});
	it('substitutes the ticket code in the CTA url', () => {
		expect(build()).toContain('https://taberehtcmx.ro/?ticket=HTC-123456');
	});
	it('omits the CTA button when disabled', () => {
		expect(build({ ticket_cta_enabled: false })).not.toContain('Deschide');
	});
	it('tolerates a missing checklist', () => {
		expect(() => build({ checklist_items: undefined as any })).not.toThrow();
	});
	it('escapes HTML in user-supplied fields (recruit name)', () => {
		const html = build({}, '<script>alert(1)</script>');
		expect(html).not.toContain('<script>alert(1)</script>');
	});
});
