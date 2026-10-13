import { describe, it, expect, vi, beforeEach } from 'vitest';

type Result = { data?: unknown; error?: unknown; count?: number | null };
const state = vi.hoisted(() => ({
	event: { data: null, error: null } as Result,
	count: { count: 0, error: null } as Result,
	insert: { data: { id: 'b1' }, error: null } as Result,
	inserted: null as unknown
}));

vi.mock('$lib/supabase', () => ({
	supabase: {
		from: (table: string) => {
			if (table === 'events') {
				const q: any = { select: () => q, eq: () => q, maybeSingle: async () => state.event };
				return q;
			}
			return {
				insert: (rows: unknown) => {
					state.inserted = rows;
					return { select: () => ({ single: async () => state.insert }) };
				}
			};
		}
	}
}));
vi.mock('$lib/server/supabase.server', () => ({
	getSupabaseAdmin: () => ({
		from: () => {
			const q: any = { select: () => q, eq: () => q, in: async () => state.count };
			return q;
		}
	})
}));

import { createPublicBooking, PublicBookingError } from './publicBooking';

const okEvent = { id: 'e1', active: true, is_public: true, max_participants: 10, title: 'Meci' };

beforeEach(() => {
	state.event = { data: okEvent, error: null };
	state.count = { count: 0, error: null };
	state.insert = { data: { id: 'b1' }, error: null };
	state.inserted = null;
});

describe('createPublicBooking', () => {
	it('rejects missing or blank name with 400', async () => {
		await expect(createPublicBooking({ nume_client: '   ' })).rejects.toMatchObject({ status: 400 });
		await expect(createPublicBooking({} as any)).rejects.toBeInstanceOf(PublicBookingError);
	});

	it('creates a generic service request without event_id', async () => {
		const r = await createPublicBooking({ nume_client: ' Ion ', telefon: ' 0712 ' });
		expect(r).toEqual({ id: 'b1' });
		const row = (state.inserted as any[])[0];
		expect(row).toMatchObject({ nume_client: 'Ion', telefon: '0712', status: 'nou', event_id: null, email: null });
	});

	it('404 when event missing, inactive or not public', async () => {
		state.event = { data: null, error: null };
		await expect(createPublicBooking({ nume_client: 'A', event_id: 'e1' })).rejects.toMatchObject({ status: 404 });
		state.event = { data: { ...okEvent, active: false }, error: null };
		await expect(createPublicBooking({ nume_client: 'A', event_id: 'e1' })).rejects.toMatchObject({ status: 404 });
		state.event = { data: { ...okEvent, is_public: false }, error: null };
		await expect(createPublicBooking({ nume_client: 'A', event_id: 'e1' })).rejects.toMatchObject({ status: 404 });
	});

	it('409 when the event is full', async () => {
		state.count = { count: 10, error: null };
		await expect(createPublicBooking({ nume_client: 'A', event_id: 'e1' })).rejects.toMatchObject({ status: 409 });
	});

	it('accepts when seats remain and takes title from the event', async () => {
		state.count = { count: 9, error: null };
		await createPublicBooking({ nume_client: 'A', event_id: 'e1' });
		expect((state.inserted as any[])[0]).toMatchObject({ event_id: 'e1', activity_title: 'Meci' });
	});

	it('skips the capacity check when max_participants is not a number', async () => {
		state.event = { data: { ...okEvent, max_participants: null }, error: null };
		state.count = { count: 999, error: null };
		await expect(createPublicBooking({ nume_client: 'A', event_id: 'e1' })).resolves.toBeTruthy();
	});

	it('always forces status "nou"', async () => {
		await createPublicBooking({ nume_client: 'A', status: 'confirmat' } as any);
		expect((state.inserted as any[])[0].status).toBe('nou');
	});

	it('propagates database errors', async () => {
		state.insert = { data: null, error: new Error('db down') };
		await expect(createPublicBooking({ nume_client: 'A' })).rejects.toThrow('db down');
	});
});
