import { supabase } from '$lib/supabase';
import { getSupabaseAdmin } from '$lib/server/supabase.server';

export class PublicBookingError extends Error {
	constructor(
		message: string,
		public status: number
	) {
		super(message);
	}
}

export type PublicBookingInput = {
	event_id?: string | null;
	activity_title?: string;
	nume_client: string;
	email?: string;
	telefon?: string;
	mesaj?: string;
	selected_position?: string;
};

const ACTIVE_STATUSES = ['nou', 'confirmat'];

/**
 * Creeaza o rezervare publica dupa validare server-side:
 * - daca e legata de un eveniment (event_id), acesta trebuie sa existe, sa fie
 *   activ/public, si sa mai fie loc (verificat cu service_role, ca sa vada
 *   TOATE rezervarile indiferent de RLS) — altfel e o cerere generica de
 *   serviciu (event_id absent), pastrand comportamentul de dinainte
 * - statusul e mereu 'nou', indiferent ce trimite clientul
 * - nu se mai foloseste device_id (id fals, nepersistent, fara valoare reala)
 */
export async function createPublicBooking(input: PublicBookingInput) {
	if (!input.nume_client?.trim()) {
		throw new PublicBookingError('nume_client este obligatoriu', 400);
	}

	let eventTitle: string | undefined;

	if (input.event_id) {
		const { data: event, error: eventError } = await supabase
			.from('events')
			.select('id, active, is_public, max_participants, title')
			.eq('id', input.event_id)
			.maybeSingle();

		if (eventError) throw eventError;
		if (!event || !event.active || !event.is_public) {
			throw new PublicBookingError('Evenimentul nu exista sau nu mai este disponibil', 404);
		}
		eventTitle = event.title ?? undefined;

		if (typeof event.max_participants === 'number') {
			const { count, error: countError } = await getSupabaseAdmin()
				.from('bookings')
				.select('id', { count: 'exact', head: true })
				.eq('event_id', input.event_id)
				.in('status', ACTIVE_STATUSES);

			if (countError) throw countError;
			if ((count ?? 0) >= event.max_participants) {
				throw new PublicBookingError('Evenimentul este complet ocupat', 409);
			}
		}
	}

	const { data, error } = await supabase
		.from('bookings')
		.insert([
			{
				event_id: input.event_id || null,
				activity_title: input.activity_title ?? eventTitle,
				nume_client: input.nume_client.trim(),
				email: input.email?.trim() || null,
				telefon: input.telefon?.trim() || null,
				mesaj: input.mesaj?.trim() || null,
				selected_position: input.selected_position || null,
				status: 'nou'
			}
		])
		.select('id')
		.single();

	if (error) throw error;
	return data;
}
