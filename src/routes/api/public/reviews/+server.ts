import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

// NOTA: tabela "reviews" nu exista in productie la data scrierii acestui
// endpoint (verificat direct in DB) — codul vechi din site o interoga oricum
// si trata orice eroare ca "nicio recenzie". Pastram acelasi comportament
// aici in loc sa aruncam eroare, pana se decide daca feature-ul se construieste.
export const GET: RequestHandler = async () => {
	const { data, error } = await supabase
		.from('reviews' as any)
		.select('*')
		.eq('is_visible', true)
		.order('created_at', { ascending: false });

	if (error) return json([]);
	return json(data || []);
};
