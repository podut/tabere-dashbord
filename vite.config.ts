import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node'
	},
	server: {
		proxy: {
			// /api/public/* e servit de rutele SvelteKit proprii (+server.ts),
			// nu trebuie proxy-uit. Restul lui /api ramane pe vechiul tool local.
			'^/api(?!/public)': 'http://localhost:8000'
		}
	}
});
