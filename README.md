# meetup4us

Find a fair middle spot for your group: add everyone's locations, see the midpoint and a circle around it, and share the link.

Live at [meetup4.us](https://meetup4.us). Runs as a Cloudflare Worker serving static assets.

## Mapping stack (free, no API keys)

- **Map:** [MapLibre GL JS](https://maplibre.org) + [OpenFreeMap](https://openfreemap.org) vector tiles
- **Search / geocoding:** [Photon](https://photon.komoot.io) (OpenStreetMap data)

All mapping runs in the browser, so there are no keys to leak and no bill to run up.

## Development

* `npm install`
* `npm run dev`: local server on http://localhost:8080
* `npm run log`: tail live worker logs

## Deploying

Pushing to `main` deploys automatically via Cloudflare Workers Builds (worker name: `meetup4us`).
`npm run deploy` deploys manually; don't do both for the same change.

## Google Maps (retired)

The site used to use Google Maps. If the old Google Cloud project is still around, shut it down:
https://console.cloud.google.com/iam-admin/projects
