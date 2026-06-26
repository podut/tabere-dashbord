import { supabase } from '$lib/supabase';
import type { Equipment, Insert, Update } from '$lib/types';

export class EquipmentRepository {
	static async getEquipment() {
		const { data, error } = await supabase
			.from('equipment')
			.select('*')
			.order('order', { ascending: true });

		if (error) throw error;
		return data || [];
	}

	static async saveEquipment(eq: Insert<'equipment'> | Update<'equipment'>) {
		const isUpdate = 'id' in eq && eq.id;
		
		const { data, error } = isUpdate
			? await supabase.from('equipment').update(eq as any).eq('id', eq.id as string).select().single()
			: await supabase.from('equipment').insert([eq as any]).select().single();

		if (error) throw error;
		return data;
	}

	static async deleteEquipment(id: string) {
		const { error } = await supabase.from('equipment').delete().eq('id', id);
		if (error) throw error;
	}

	static async updateOrder(id: string, order: number) {
		const { error } = await supabase
			.from('equipment')
			.update({ order })
			.eq('id', id);
		
		if (error) throw error;
	}
}
