import { error, json } from '@sveltejs/kit';
import { PostRepository } from '$lib/data/repositories/PostRepository';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const post = await PostRepository.getPostBySlug(params.slug);
	if (!post || !post.is_published) {
		throw error(404, 'Articol negasit');
	}
	return json(post);
};
