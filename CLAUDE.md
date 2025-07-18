# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Worker application for meetup planning, designed to help coordinate gatherings by working with addresses and Google Maps integration. The project uses the domain `meetup4.us` and is structured as a monorepo with the main worker code in the `meetup-worker/` directory.

## Architecture

- **Cloudflare Worker**: The main application runs as a Cloudflare Worker (`meetup-worker/src/index.js`)
- **Static Assets**: HTML/CSS/JS assets served through Cloudflare's asset binding (`meetup-worker/assets/`)
- **Google Maps Integration**: Frontend uses Google Maps JavaScript API for mapping functionality
- **Domain**: Configured to run on `meetup4.us` with custom domain routing

## Development Commands

### From Repository Root:
- `npm run dev` - Start development server (proxies to meetup-worker)
- `npm run start` - Alias for dev command
- `npm run remote` - Run development server with remote mode
- `npm run deploy` - Deploy to Cloudflare
- `npm run log` - View worker logs via wrangler tail

### From meetup-worker/ Directory:
- `npm run dev` - Start local development server on port 8080
- `npm run deploy` - Deploy worker to Cloudflare
- `npm run test` - Run tests using Vitest

## Testing

- Uses **Vitest** with `@cloudflare/vitest-pool-workers` for testing Cloudflare Workers
- Test configuration in `meetup-worker/vitest.config.js`
- Tests located in `meetup-worker/test/`
- Run tests: `cd meetup-worker && npm run test`

## Configuration

- **Wrangler Config**: `meetup-worker/wrangler.jsonc` - Cloudflare Worker configuration
- **Custom Domain**: Configured for `meetup4.us`
- **Assets Binding**: Static files served from `meetup-worker/assets/` via `ASSETS` binding
- **Dev Server**: Runs on port 8080 by default
- **Google Maps API**: Requires API key in `.dev.vars` file (not committed)

## Environment Setup

1. Install Wrangler globally: `npm install -g wrangler`
2. For Google Maps integration, create `.dev.vars` in `meetup-worker/` with:
   ```
   GOOGLEMAPS_APIKEY="your_google_maps_api_key"
   ```
3. API key should be restricted by domain for security

## Key Files

- `meetup-worker/src/index.js` - Main worker entry point
- `meetup-worker/assets/hello.html` - Main HTML interface
- `meetup-worker/wrangler.jsonc` - Worker configuration
- `meetup-worker/package.json` - Worker dependencies and scripts
- Root `package.json` - Convenience scripts for the entire project