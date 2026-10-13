import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ create: vi.fn(), limited: vi.fn() }));
vi.mock('$lib/server/publicBooking', () => {
	class PublicBookingError extends Error {
		constructor(
			m: string,
			public status: number
		) {
			super(m);
		}
	}
	return { createPublicBooking: h.create, PublicBookingError };
});
vi.mock('$lib/server/rateLimit', () => ({ isRateLimited: h.limited }));

import { POST } from './+server';
import { PublicBookingError } from '$lib/server/publicBooking';

const call = (body: unknown, raw = false) =>
	POST({
		request: new Request('http://x/api/public/bookings', {
			method: 'POST',
			body: raw ? (body as string) : JSON.stringify(body)
		}),
		getClientAddress: () => '1.2.3.4'
	} as any);

beforeEach(() => {
	h.create.mockReset();
	h.limited.mockReset().mockReturnValue(false);
});

describe('POST /api/public/bookings', () => {
	it('201 with id on success', async () => {
		h.create.mockResolvedValue({ id: 'abc' });
		const res = await call({ nume_client: 'Ion' });
		expect(res.status).toBe(201);
		expect(await res.json()).toEqual({ ok: true, id: 'abc' });
	});
	it('429 when rate limited', async () => {
		h.limited.mockReturnValue(true);
		expect((await call({ nume_client: 'Ion' })).status).toBe(429);
		expect(h.create).not.toHaveBeenCalled();
	});
	it('400 on invalid JSON', async () => {
		expect((await call('not json', true)).status).toBe(400);
	});
	it('maps PublicBookingError to its status', async () => {
		h.create.mockRejectedValue(new PublicBookingError('complet', 409));
		const res = await call({ nume_client: 'Ion' });
		expect(res.status).toBe(409);
		expect(await res.json()).toEqual({ error: 'complet' });
	});
	it('500 without leaking internals on unexpected error', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		h.create.mockRejectedValue(new Error('secret db detail'));
		const res = await call({ nume_client: 'Ion' });
		expect(res.status).toBe(500);
		expect(JSON.stringify(await res.json())).not.toContain('secret');
	});
});
