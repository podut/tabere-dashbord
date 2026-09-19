import { json } from '@sveltejs/kit';
import { ServiceRepository } from '$lib/data/repositories/ServiceRepository';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const services = await ServiceRepository.getPublicList();
	return json(services);
};
