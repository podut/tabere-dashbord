import { supabase } from '$lib/supabase';
import type { ParticipantProfile } from '$lib/types';

export class ParticipantProfileRepository {
	static async getParticipants(
		page: number,
		perPage: number,
		search = ''
	): Promise<{ participants: ParticipantProfile[]; total: number }> {
		let query = supabase
			.from('participant_profiles')
			.select('*', { count: 'exact' })
			.order('updated_at', { ascending: false });

		if (search.trim()) {
			query = query.ilike('name', `%${search.trim()}%`);
		}

		const from = (page - 1) * perPage;
		query = query.range(from, from + perPage - 1);

		const { data, error, count } = await query;
		if (error) throw error;
		return { participants: data || [], total: count || 0 };
	}

	static async deleteParticipant(deviceId: string) {
		const { error } = await supabase
			.from('participant_profiles')
			.delete()
			.eq('device_id', deviceId);
		if (error) throw error;
	}
}
