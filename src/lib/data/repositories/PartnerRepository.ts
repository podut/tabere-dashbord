import { supabase } from '$lib/supabase';
import type { Partner, Insert, Update } from '$lib/types';

export class PartnerRepository {
	static async getPartners() {
		const { data, error } = await supabase
			.from('partners')
			.select('*')
			.order('order', { ascending: true });

		if (error) throw error;
		return data || [];
	}

	static async savePartner(partner: Insert<'partners'> | Update<'partners'>) {
		const isUpdate = 'id' in partner && partner.id;
		const { data, error } = isUpdate
			? await supabase.from('partners').update(partner).eq('id', partner.id).select().single()
			: await supabase.from('partners').insert([partner]).select().single();
		if (error) throw error;
		return data;
	}

	static async deletePartner(id: string) {
		const { error } = await supabase.from('partners').delete().eq('id', id);
		if (error) throw error;
	}
}
