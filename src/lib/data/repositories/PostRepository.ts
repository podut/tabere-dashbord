import { supabase } from '$lib/supabase';
import type { Post, PostInsert, PostUpdate } from '$lib/types';

export class PostRepository {
	static async getPosts(includeUnpublished = true): Promise<Post[]> {
		let query = supabase
			.from('posts')
			.select('*')
			.order('published_at', { ascending: false, nullsFirst: false });

		if (!includeUnpublished) {
			query = query.eq('is_published', true);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data || [];
	}

	static async getPostById(id: string): Promise<Post | null> {
		const { data, error } = await supabase
			.from('posts')
			.select('*')
			.eq('id', id)
			.maybeSingle();

		if (error) throw error;
		return data;
	}

	static async getPostBySlug(slug: string): Promise<Post | null> {
		const { data, error } = await supabase
			.from('posts')
			.select('*')
			.eq('slug', slug)
			.maybeSingle();

		if (error) throw error;
		return data;
	}

	static async savePost(post: (PostInsert | PostUpdate) & { id?: string }): Promise<Post> {
		const isUpdate = !!post.id;
		const payload = {
			...post,
			updated_at: new Date().toISOString()
		};

		const { data, error } = isUpdate
			? await supabase.from('posts').update(payload as any).eq('id', post.id as string).select().single()
			: await supabase.from('posts').insert([payload as any]).select().single();

		if (error) throw error;
		return data;
	}

	static async togglePublish(id: string, is_published: boolean): Promise<Post> {
		const payload: PostUpdate = {
			is_published,
			published_at: is_published ? new Date().toISOString() : null,
			updated_at: new Date().toISOString()
		};

		const { data, error } = await supabase
			.from('posts')
			.update(payload as any)
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	static async incrementDwell(slug: string, dwellSeconds: number): Promise<void> {
		const { error } = await supabase.rpc('record_post_dwell_time', {
			p_slug: slug,
			p_dwell_seconds: dwellSeconds
		});
		if (error) throw error;
	}

	static async deletePost(id: string): Promise<void> {
		const { error } = await supabase.from('posts').delete().eq('id', id);
		if (error) throw error;
	}
}
