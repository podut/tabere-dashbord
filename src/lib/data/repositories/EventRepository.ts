import { supabase } from '$lib/supabase';
import type { EventRow, Insert, Update } from '$lib/types';

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
				const timePart = e.start_time?.match(/^\d{2}:\d{2}$/) ? e.start_time : '23:59';
				return new Date(`${datePart}T${timePart}:00`) < now;
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
