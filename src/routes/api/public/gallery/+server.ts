import { json } from '@sveltejs/kit';
import { GalleryRepository } from '$lib/data/repositories/GalleryRepository';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const page = Number(url.searchParams.get('page')) || 1;
	// Fara ?limit explicit, intoarce tot (site-ul public isi face singur
	// paginarea vizuala din lista completa, ca inainte).
	const limit = Number(url.searchParams.get('limit')) || 200;
	const result = await GalleryRepository.getPublicPage(page, Math.min(limit, 200));
	return json(result.items);
};
