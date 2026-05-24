import { supabase } from '$lib/supabase';
import type { OrderRow, Update } from '$lib/types';

export class OrderRepository {
	static async getOrders() {
		const { data, error } = await supabase
			.from('orders')
			.select('*, order_items(*)')
			.order('created_at', { ascending: false });

		if (error) throw error;
		return (data as OrderRow[]) || [];
	}

	static async updateOrderStatus(id: string, status: string) {
		const { error } = await supabase
			.from('orders')
			.update({ status })
			.eq('id', id);
		
		if (error) throw error;
	}

	static async deleteOrder(id: string) {
		const { error } = await supabase.from('orders').delete().eq('id', id);
		if (error) throw error;
	}
}
