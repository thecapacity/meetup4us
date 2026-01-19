/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Only process the HTML for the root path
		if (url.pathname === '/' || url.pathname === '/index.html') {
			try {
				const htmlContent = await env.ASSETS.fetch('https://assets.local/hello.html');
				const htmlText = await htmlContent.text();

				// Replace placeholder with actual API key from secrets
				const updatedHtml = htmlText.replace('GOOGLEMAPS_APIKEY', env.GOOGLEMAPS_APIKEY || 'GOOGLEMAPS_APIKEY');

				return new Response(updatedHtml, {
					headers: { "Content-Type": "text/html" },
				});

			} catch (err) {
				console.log({ "message": "Error reading the HTML file", "error": err });
				return new Response("Error loading the dashboard.", { status: 500 });
			}
		}

		// For all other paths, pass through to the ASSETS binding
		return env.ASSETS.fetch(request);
	},
};
