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
			? await supabase.from('events').update(event).eq('id', event.id).select().single()
			: await supabase.from('events').insert([event]).select().single();

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
	 * Finalizează automat evenimentele care au data în trecut.
	 */
	static async autoFinalizeEvents() {
		const acum = new Date().toISOString();
		const { data: pastEvents, error: fetchError } = await supabase
			.from('events')
			.select('id')
			.eq('status', 'active')
			.lt('date', acum);

		if (fetchError) {
			console.error('Eroare la preluarea evenimentelor trecute:', fetchError);
			return;
		}

		if (pastEvents && pastEvents.length > 0) {
			const { error: updateError } = await supabase
				.from('events')
				.update({ status: 'finished', active: false })
				.in('id', pastEvents.map(e => e.id));

			if (updateError) {
				console.error('Eroare la auto-finalizarea evenimentelor:', updateError);
			}
		}
	}
}
