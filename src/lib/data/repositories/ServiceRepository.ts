import { supabase } from '$lib/supabase';
import type { Service, Insert, Update } from '$lib/types';

export class ServiceRepository {
	static async getServices() {
		const { data, error } = await supabase
			.from('services')
			.select('*')
			.order('order', { ascending: true });

		if (error) throw error;
		return data || [];
	}

	static async saveService(service: Insert<'services'> | Update<'services'>) {
		const isUpdate = 'id' in service && service.id;
		const { data, error } = isUpdate
			? await supabase.from('services').update(service as any).eq('id', service.id as string).select().single()
			: await supabase.from('services').insert([service as any]).select().single();
		if (error) throw error;
		return data;
	}

	static async deleteService(id: string) {
		const { error } = await supabase.from('services').delete().eq('id', id);
		if (error) throw error;
	}
}
