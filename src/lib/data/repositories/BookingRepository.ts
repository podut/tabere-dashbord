import { supabase } from '$lib/supabase';
import type { Booking, Update } from '$lib/types';

type Callback = (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Booking; old: Booking }) => void;

export class BookingRepository {
	static async getBookings() {
		// Supabase (supabase/config.toml max_rows=1000) trunchiaza silentios peste 1000
		// randuri fara .range() explicit. bookings creste constant — cerem un plafon
		// generos ca sa nu pierdem randuri fara eroare vizibila.
		const { data, error } = await supabase
			.from('bookings')
			.select('*')
			.order('created_at', { ascending: false })
			.range(0, 4999);

		if (error) throw error;
		return data || [];
	}

	static subscribeToChanges(callback: Callback) {
		return supabase
			.channel('public:bookings')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'bookings' },
				(payload) => {
					callback(payload as any);
				}
			)
			.subscribe();
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
		const { data, error } = await supabase
			.from('bookings')
			.update({ selected_position: position, status: 'confirmat' })
			.eq('id', bookingId)
			.select()
			.single();
		
		if (error) throw error;

		// Trimitere automată email confirmare în Mailpit dacă există email
		if (data?.email) {
			import('$lib/services/EmailService').then(({ EmailService }) => {
				EmailService.sendBookingConfirmation({
					recruitName: data.nume_client || 'Recrut',
					recruitEmail: data.email,
					eventTitle: data.activity_title || 'Misiune Airsoft',
					eventDate: data.preferred_date || undefined,
					eventTime: data.preferred_time || undefined,
					position: position,
					ticketCode: data.private_code || (() => {
						const arr = new Uint32Array(1);
						crypto.getRandomValues(arr);
						return `HTC-${100000 + (arr[0] % 900000)}`;
					})()
				}).catch(() => {});
			});
		}

		return data;
	}

	static async releasePosition(bookingId: string) {
		const { error } = await supabase
			.from('bookings')
			.update({ selected_position: '', status: 'nou' })
			.eq('id', bookingId);
		
		if (error) throw error;
	}
}
