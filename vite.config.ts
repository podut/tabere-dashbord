import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			// /api/public/* e servit de rutele SvelteKit proprii (+server.ts),
			// nu trebuie proxy-uit. Restul lui /api ramane pe vechiul tool local.
			'^/api(?!/public)': 'http://localhost:8000'
		}
	}
});
