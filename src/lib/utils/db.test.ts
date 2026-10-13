import { describe, it, expect } from 'vitest';
import { sanitizeSearch } from './db';

describe('sanitizeSearch', () => {
	it('escapes % and _ wildcards', () => {
		expect(sanitizeSearch('50%_off')).toBe('50\\%\\_off');
	});
	it('leaves plain text untouched', () => {
		expect(sanitizeSearch('airsoft baia mare')).toBe('airsoft baia mare');
	});
	it('handles empty string', () => {
		expect(sanitizeSearch('')).toBe('');
	});
});
