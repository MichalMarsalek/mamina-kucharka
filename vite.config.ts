import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		mkcert(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: false, // use static/site.webmanifest
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
				globIgnores: ['**/icons/**'],
				runtimeCaching: [
					{
						urlPattern: /\/offsets\.nt$/,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'photo-offsets-v1',
							expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 7 }
						}
					},
					{
						urlPattern: /\/recepty_\d+\.nt$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'recipe-data-v1',
							expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 }
						}
					},
					{
						urlPattern: /\/foto[01]?\/.+/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'recipe-photos',
							expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 }
						}
					}
				]
			},
			devOptions: {
				enabled: false
			}
		})
	]
});
