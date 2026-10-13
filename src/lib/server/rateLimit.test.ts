import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isRateLimited } from './rateLimit';

describe('isRateLimited', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('allows up to the limit then blocks', () => {
		const key = 'k-limit';
		for (let i = 0; i < 3; i++) expect(isRateLimited(key, 3, 1000)).toBe(false);
		expect(isRateLimited(key, 3, 1000)).toBe(true);
	});

	it('resets after the window', () => {
		const key = 'k-reset';
		for (let i = 0; i < 3; i++) isRateLimited(key, 2, 1000);
		expect(isRateLimited(key, 2, 1000)).toBe(true);
		vi.advanceTimersByTime(1001);
		expect(isRateLimited(key, 2, 1000)).toBe(false);
	});

	it('tracks keys independently', () => {
		isRateLimited('a', 1, 1000);
		expect(isRateLimited('a', 1, 1000)).toBe(true);
		expect(isRateLimited('b', 1, 1000)).toBe(false);
	});
});
