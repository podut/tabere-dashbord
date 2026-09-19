import { supabase } from '$lib/supabase';
import type { Insert, Update } from '$lib/types';

export class EventRepository {
	static async getEvents() {
		const { data, error } = await supabase
			.from('events')
			.select('*')
			.order('date', { ascending: false });

		if (error) throw error;
		return data || [];
	}

	static async saveEvent(event: Insert<'events'> | Update<'events'>) {
		const isUpdate = 'id' in event && event.id;
		
		const { data, error } = isUpdate
			? await supabase.from('events').update(event as any).eq('id', event.id as string).select().single()
			: await supabase.from('events').insert([event as any]).select().single();

		if (error) throw error;
		return data;
	}

	/**
	 * Evenimente publice, active, cu data viitoare (sau in ziua curenta, pana la 23:59:59).
	 * Centralizeaza filtrul folosit de website-ul public.
	 */
	static async getPublicUpcoming() {
		const { data, error } = await supabase
			.from('events')
			.select('*')
			.eq('active', true)
			.eq('is_public', true)
			.order('date', { ascending: true });

		if (error) throw error;

		const now = new Date();
		const events = (data || []).filter((e) => {
			const datePart = e.date?.substring(0, 10);
			if (!datePart) return false;
			const expiryLimit = new Date(`${datePart}T23:59:59`);
			return expiryLimit >= now;
		});

		const { data: bookings, error: bookingsError } = await supabase
			.from('bookings')
			.select('event_id, status')
			.in(
				'status',
				['confirmat', 'nou']
			);
		if (bookingsError) throw bookingsError;

		const bookedCount = new Map<string, number>();
		for (const b of bookings || []) {
			if (!b.event_id) continue;
			bookedCount.set(b.event_id, (bookedCount.get(b.event_id) || 0) + 1);
		}

		return events.map((e) => ({ ...e, booked_count: bookedCount.get(e.id) || 0 }));
	}

	static async deleteEvent(id: string) {
		const { error } = await supabase.from('events').delete().eq('id', id);
		if (error) throw error;
	}

	static async finalizeEvent(id: string) {
		const { error } = await supabase
			.from('events')
			.update({ status: 'finished', active: false })
			.eq('id', id);
		
		if (error) throw error;
	}

	/**
	 * Finalizează automat evenimentele a căror dată + oră de start a trecut.
	 * Compară data evenimentului + start_time cu momentul curent.
	 */
	static async autoFinalizeEvents() {
		const { data: events, error } = await supabase
			.from('events')
			.select('id, date, start_time')
			.eq('status', 'active');

		if (error || !events?.length) return;

		const now = new Date();
		const toFinalize = events
			.filter(e => {
				const datePart = e.date?.substring(0, 10);
				if (!datePart) return false;
				// Evenimentul rămâne activ pe tot parcursul zilei programate (până la 23:59:59)
				const expiryLimit = new Date(`${datePart}T23:59:59`);
				return expiryLimit < now;
			})
			.map(e => e.id);

		if (toFinalize.length > 0) {
			const { error: updateError } = await supabase
				.from('events')
				.update({ status: 'finished', active: false })
				.in('id', toFinalize);
			if (updateError) console.error('Auto-finalizare eșuată:', updateError);
		}
	}
}
