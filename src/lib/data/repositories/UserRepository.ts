import { supabase } from '$lib/supabase';
import type { Profile } from '$lib/types';
import { sanitizeSearch } from '$lib/utils/db';

export class UserRepository {
	static async getUsers(
		page: number,
		perPage: number,
		searchQuery: string = ''
	) {
		const from = (page - 1) * perPage;
		const to = from + perPage - 1;

		let query = supabase
			.from('profiles')
			.select('*', { count: 'exact' })
			.order('created_at', { ascending: false })
			.range(from, to);

		if (searchQuery.trim()) {
			const cleanQuery = sanitizeSearch(searchQuery.trim());
			query = query.or(`name.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%`);
		}

		const { data, count, error } = await query;
		if (error) throw error;

		return {
			users: (data as Profile[]) || [],
			total: count || 0
		};
	}

	static async getUserById(id: string) {
		const { data, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', id)
			.single();
		
		if (error) throw error;
		return data as Profile;
	}
}
