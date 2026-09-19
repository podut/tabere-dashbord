import { json } from '@sveltejs/kit';
import { EquipmentRepository } from '$lib/data/repositories/EquipmentRepository';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const items = await EquipmentRepository.getEquipment();
	return json(items);
};
