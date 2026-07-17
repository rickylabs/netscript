# Comparable deployment-framework extracts (fetched 2026-07-18)

Concise extracts used by `research/market.md`; original URLs are the authority.

## Nuxt / Nitro

Source: https://nuxt.com/docs/4.x/getting-started/deployment

- A Node deployment starts the generated `.output/server/index.mjs` entry.
- Nitro can emit a `node_cluster` preset; the guide also documents PM2 and reverse-proxy
  operation.

Source: https://nitro.build/deploy

- Nitro compiles the same server source into deployment-specific output presets and defaults to
  the Node server preset when it cannot detect a provider.

## Next.js standalone

Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js/output

- `output: "standalone"` creates `.next/standalone` with a minimal `server.js` and traced runtime
  dependencies.
- `public` and `.next/static` are not copied automatically; monorepos may need
  `outputFileTracingRoot` to include files outside the app directory.

## React Router framework mode

Sources:

- https://reactrouter.com/start/framework/deploying
- https://reactrouter.com/api/other-api/adapter

- Framework mode supports full-stack hosting, static hosting, Docker, and provider templates.
- A React Router adapter converts a host-specific request into a Web Fetch API `Request`, calls the
  request handler, and converts the `Response` back; official adapter packages include Node,
  Express, and Cloudflare.

## SvelteKit

Sources:

- https://svelte.dev/docs/kit/adapters
- https://svelte.dev/docs/kit/adapter-node

- Adapters are build plugins that transform the built application for a deployment target; the
  docs list automatic and official provider adapters.
- `adapter-node` emits a standalone Node server started with `node build`; environment variables,
  reverse proxy behavior, and graceful shutdown remain explicit operator concerns.

## Redwood

Sources:

- https://docs.redwoodjs.com/docs/deploy/introduction
- https://docs.redwoodjs.com/docs/docker

- Redwood's deployment model separates a static `web` side from API code and supports both
  serverless and serverful destinations.
- Its Docker guidance builds/runs distinct web and API units with corresponding server packages.

## Wasp

Source: https://wasp.sh/docs/deployment/deployment-methods/overview

- A production Wasp app consists of a Node server, static client assets, and PostgreSQL; those
  components can be deployed separately.
- Wasp generates a Dockerfile for the server deployment path.
