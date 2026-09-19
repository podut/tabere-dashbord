import { supabase } from '$lib/supabase';
import type { Insert, Update } from '$lib/types';

export class GalleryRepository {
	static async getGallery() {
		const { data, error } = await supabase
			.from('gallery')
			.select('*')
			.order('order', { ascending: true });

		if (error) throw error;
		return data || [];
	}

	static async getPublicPage(page = 1, limit = 12) {
		const from = (page - 1) * limit;
		const to = from + limit - 1;
		const { data, error, count } = await supabase
			.from('gallery')
			.select('*', { count: 'exact' })
			.order('order', { ascending: true })
			.range(from, to);

		if (error) throw error;
		return { items: data || [], total: count ?? 0, page, limit };
	}

	static async saveImage(image: Insert<'gallery'> | Update<'gallery'>) {
		const isUpdate = 'id' in image && image.id;
		const { data, error } = isUpdate
			? await supabase.from('gallery').update(image as any).eq('id', image.id as string).select().single()
			: await supabase.from('gallery').insert([image as any]).select().single();
		if (error) throw error;
		return data;
	}

	static async deleteImage(id: string) {
		const { error } = await supabase.from('gallery').delete().eq('id', id);
		if (error) throw error;
	}

	static async updateOrder(id: string, order: number) {
		const { error } = await supabase.from('gallery').update({ order }).eq('id', id);
		if (error) throw error;
	}
}
