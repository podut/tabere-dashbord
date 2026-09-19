import { json } from '@sveltejs/kit';
import { PostRepository } from '$lib/data/repositories/PostRepository';
import { isRateLimited } from '$lib/server/rateLimit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, getClientAddress }) => {
	if (isRateLimited(`dwell:${getClientAddress()}`, 30, 60_000)) {
		return json({ error: 'Prea multe cereri' }, { status: 429 });
	}

	const body = await request.json().catch(() => ({}));
	const dwellSeconds = Math.max(0, Math.min(600, Number(body?.dwell_seconds) || 0));
	if (dwellSeconds < 8) {
		return json({ ok: true, skipped: true });
	}

	await PostRepository.incrementDwell(params.slug, dwellSeconds);
	return json({ ok: true });
};
