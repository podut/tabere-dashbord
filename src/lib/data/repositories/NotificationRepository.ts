import { supabase } from '$lib/supabase';

export interface NotificationPayload {
	title: string;
	body: string;
	target_type: string;
	status: string;
	target_event_id?: string;
	is_recurring?: boolean;
	recurring_hour?: number;
	scheduled_at?: string;
}

export class NotificationRepository {
	/**
	 * Automatically transitions 'programat' notifications to 'trimis' if their scheduled_at time has passed.
	 * Note: Depending on logic, it might be better handled via a cron job, but we'll keep the UI-triggered check.
	 */
	static async autoTransitionNotifications(nowISO: string) {
		const { error } = await supabase
			.from('notifications')
			.update({ status: 'trimis' })
			.eq('status', 'programat')
			.lte('scheduled_at', nowISO);

		if (error) {
			console.error('Eroare la tranziția automată a notificărilor:', error);
		}
	}

	/**
	 * Fetches a paginated list of notifications.
	 */
	static async getNotifications(
		page: number,
		perPage: number,
		statusFilter: string
	) {
		let q = supabase.from('notifications').select('*', { count: 'exact' });

		if (statusFilter !== 'all') {
			q = q.eq('status', statusFilter);
		}
		q = q.order('created_at', { ascending: false });

		const start = (page - 1) * perPage;
		const end = start + perPage - 1;
		q = q.range(start, end);

		const { data, count, error } = await q;

		if (error) throw error;

		return { data: data || [], count: count || 0 };
	}

	/**
	 * Creates a new notification in the database.
	 */
	static async createNotification(payload: NotificationPayload) {
		const { data, error } = await supabase
			.from('notifications')
			.insert(payload)
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	/**
	 * Deletes a notification by its ID.
	 */
	static async deleteNotification(id: string) {
		const { error } = await supabase.from('notifications').delete().eq('id', id);
		if (error) throw error;
	}
}
