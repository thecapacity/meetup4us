# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Meetup4.us helps a group pick a central meeting spot. Users add locations; the app shows their midpoint (simple average of coordinates; every location counts equally) and a circle around it (80% of the farthest distance, minimum 1 km). The plan is shared via the page URL. Keep it simple, low-stress and zero-cost to operate.

## Architecture

- **Cloudflare Worker** (`src/index.js`): serves `assets/hello.html` at `/`; everything else comes from the `ASSETS` binding (e.g. `/about` → `assets/about.html`).
- **Frontend** (`assets/app.js`, `assets/hello.html`): all mapping is client-side.
  - Map: MapLibre GL JS (unpkg CDN) + OpenFreeMap tiles; no API key
  - Search: Photon (`photon.komoot.io`); no API key, debounced to be polite
- **Share URL format:** `?addy=<address>|<lat>,<lng>` (repeatable). An `addy` without coordinates is geocoded on load.
- **Domain:** `meetup4.us` via custom domain route in `wrangler.jsonc`.

## Commands

- `npm run dev`: local dev server on port 8080
- `npm run deploy`: manual deploy
- `npm run log`: `wrangler tail`

## Deployment

Cloudflare Workers Builds deploys automatically on push to `main`. The worker is named `meetup4us`, and the name in `wrangler.jsonc` must match. Don't also run `npm run deploy` for the same change.

## Mobile notes

- The map keeps a fixed size while typing: resizing it on input focus caused bad zoom fits and missed taps.
- Controls tapped while the search input is focused should act on `pointerdown` (see the ⓘ about link).
