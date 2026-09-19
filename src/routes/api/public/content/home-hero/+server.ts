import { json } from '@sveltejs/kit';
import { ContentRepository } from '$lib/data/repositories/ContentRepository';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const content = await ContentRepository.getBySectionId('home_hero');
	return json(content);
};
