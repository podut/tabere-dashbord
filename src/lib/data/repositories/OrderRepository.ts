import { supabase } from '$lib/supabase';
import type { OrderRow, Update } from '$lib/types';

export class OrderRepository {
	static async getOrders() {
		// vezi nota din BookingRepository.getBookings() — acelasi risc de trunchiere
		// silentioasa la max_rows=1000 fara .range() explicit.
		const { data, error } = await supabase
			.from('orders')
			.select('*, order_items(*)')
			.order('created_at', { ascending: false })
			.range(0, 4999);

		if (error) throw error;
		return (data as OrderRow[]) || [];
	}

	static async updateOrderStatus(id: string, status: string) {
		const { error } = await supabase
			.from('orders')
			.update({ status } as any)
			.eq('id', id);
		
		if (error) throw error;
	}

	static async deleteOrder(id: string) {
		const { error } = await supabase.from('orders').delete().eq('id', id);
		if (error) throw error;
	}
}
