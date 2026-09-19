import { json } from '@sveltejs/kit';
import { createPublicBooking, PublicBookingError } from '$lib/server/publicBooking';
import { isRateLimited } from '$lib/server/rateLimit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	if (isRateLimited(`booking:${getClientAddress()}`, 5, 60_000)) {
		return json({ error: 'Prea multe cereri, incearca din nou peste un minut' }, { status: 429 });
	}

	const body = await request.json().catch(() => null);
	if (!body) {
		return json({ error: 'Cerere invalida' }, { status: 400 });
	}

	try {
		const booking = await createPublicBooking(body);
		return json({ ok: true, id: booking.id }, { status: 201 });
	} catch (err) {
		if (err instanceof PublicBookingError) {
			return json({ error: err.message }, { status: err.status });
		}
		console.error('createPublicBooking failed', err);
		return json({ error: 'Eroare interna' }, { status: 500 });
	}
};
