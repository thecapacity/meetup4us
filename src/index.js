/**
 * Meetup4.us worker — serves the static app.
 * Mapping is fully client-side with free, key-less services
 * (MapLibre + OpenFreeMap tiles + Photon search), so no secrets are needed.
 */

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Root (and any query-string share link) serves the app page
		if (url.pathname === '/' || url.pathname === '/index.html') {
			const page = await env.ASSETS.fetch(new URL('/hello.html', url));
			return new Response(page.body, {
				headers: { 'Content-Type': 'text/html; charset=utf-8' },
			});
		} // end root

		// Everything else (app.js, og-image.png, ...) comes straight from assets
		return env.ASSETS.fetch(request);
	},
};
