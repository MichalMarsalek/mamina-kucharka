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
				runtimeCaching: [
					{
						urlPattern: /\.nt$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'recipe-data',
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
				enabled: true
			}
		})
	]
});
