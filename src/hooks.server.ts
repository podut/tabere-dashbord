import type { Handle } from '@sveltejs/kit';

const ALLOWED_ORIGINS = new Set([
	'https://taberehtcmx.ro',
	'https://www.taberehtcmx.ro'
]);

function isAllowedOrigin(origin: string | null): boolean {
	if (!origin) return false;
	if (ALLOWED_ORIGINS.has(origin)) return true;
	// Dev local: orice origin pe localhost / IP LAN, orice port.
	return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):\d+$/.test(origin);
}

export const handle: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith('/api/public/')) {
		return resolve(event);
	}

	const origin = event.request.headers.get('origin');
	const allowOrigin = isAllowedOrigin(origin) ? (origin as string) : '';

	if (event.request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': allowOrigin,
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Max-Age': '86400',
				Vary: 'Origin'
			}
		});
	}

	const response = await resolve(event);
	if (allowOrigin) {
		response.headers.set('Access-Control-Allow-Origin', allowOrigin);
		response.headers.append('Vary', 'Origin');
	}
	return response;
};
