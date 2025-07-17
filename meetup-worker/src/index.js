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
		try {
			const htmlContent = await env.ASSETS.fetch('https://assets.local/hello.html');
			return new Response(await htmlContent.text(), {
				headers: { "Content-Type": "text/html" },
			});
		
		} catch (err) {
			console.log({ "message": "Error reading the HTML file", "error": err });
			return new Response("Error loading the dashboard.", { status: 500 });
		}
		
	},
};
