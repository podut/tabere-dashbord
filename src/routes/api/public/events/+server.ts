import { json } from '@sveltejs/kit';
import { EventRepository } from '$lib/data/repositories/EventRepository';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const events = await EventRepository.getPublicUpcoming();
	return json(events);
};
