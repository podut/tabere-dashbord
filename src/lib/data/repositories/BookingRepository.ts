import { supabase } from '$lib/supabase';
import type { Booking, Update } from '$lib/types';

export class BookingRepository {
	static async getBookings() {
		const { data, error } = await supabase
			.from('bookings')
			.select('*')
			.order('created_at', { ascending: false });

		if (error) throw error;
		return data || [];
	}

	static async updateBooking(id: string, payload: Update<'bookings'>) {
		const { data, error } = await supabase
			.from('bookings')
			.update(payload)
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	static async deleteBooking(id: string) {
		const { error } = await supabase.from('bookings').delete().eq('id', id);
		if (error) throw error;
	}

	static async assignPosition(bookingId: string, position: string) {
		const { error } = await supabase
			.from('bookings')
			.update({ selected_position: position, status: 'confirmat' })
			.eq('id', bookingId);
		
		if (error) throw error;
	}

	static async releasePosition(bookingId: string) {
		const { error } = await supabase
			.from('bookings')
			.update({ selected_position: '', status: 'nou' })
			.eq('id', bookingId);
		
		if (error) throw error;
	}
}
