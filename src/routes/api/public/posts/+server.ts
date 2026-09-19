import { json } from '@sveltejs/kit';
import { PostRepository } from '$lib/data/repositories/PostRepository';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const posts = await PostRepository.getPosts(false);
	return json(posts);
};
