# meetup4us

## Setup

* `npm install -g wrangler`
* `npm create cloudflare@latest -- meetup-worker`
    - go throught the prompts:
        * name: `meetup-worker`
        * category: `Hello World example`
        * type: `Worker Only`
        * langg: `Javascript`
    - Deploy: `No` (we'll use a GitHub Workflow for that or Cloudflare's GitHub App)
* `npx wrangler dev`

## Google Maps API
- https://developers.google.com/maps/documentation/javascript/cloud-setup
    - Get an API key, add it `KEY="..."` into `.dev.vars`
    - It's a good idea to restrict by website domain (referrer too)
- **To Shutdown:** https://console.cloud.google.com/iam-admin/projects?utm_source=Docs_ProjectShutdown&utm_content=Docs_maps-backend
    - Delete the project