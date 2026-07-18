# Nitro versus own-layer live evidence

Retrieved: 2026-07-18. This committed extract records the portions of live upstream documentation
used by `../research/nitro-vs-own.md`. It is a paraphrased evidence ledger; the linked pages remain
the primary sources.

## Nitro

- Nitro v3 is a public beta. Its beta announcement says the build moved to Rolldown and Vite 8, with
  HMR, code splitting, tree shaking, minification, route compilation, and a generated `.output`
  directory. H3 v2 is its Web-standards HTTP layer and Nitro can host another framework. Source:
  https://nitro.build/blog/v3-beta
- Nitro produces deployment-specific output formats. The deploy guide documents a default Node
  output, preset selection/auto-detection, and provider compatibility dates; Nitro recommends
  testing before advancing the date because provider behavior changes. Source:
  https://nitro.build/deploy
- The provider index documents roughly twenty provider families/recipes. They are not represented as
  one uniform maturity tier: some are direct presets, some are auto-detected integrations, and some
  deployment pages describe multiple variants. Source: https://nitro.build/deploy
- Cloudflare's `cloudflare_module` output is deployed or previewed with Wrangler. Nitro exposes
  Cloudflare runtime hooks (including scheduled, queue, email, tail, and trace handlers), can emit
  exports, can translate `scheduledTasks` into Cron Triggers, and can generate Pages routing
  metadata. Source: https://nitro.build/deploy/providers/cloudflare
- Vercel has a `vercel` preset, route/function configuration, route rewrites, scheduled-task to Cron
  generation, and queue hooks. The provider page also records an API-route caveat. Source:
  https://nitro.build/deploy/providers/vercel
- AWS Lambda has an `aws_lambda` preset whose output includes `.output/server/index.mjs` as an
  event/response handler. The page documents dynamic chunks, optional import inlining, and a
  streaming option. Source: https://nitro.build/deploy/providers/aws

## Provider output contracts NetScript would otherwise own

- A Cloudflare Worker module exports a `fetch(request, env, ctx)` handler returning a `Response`;
  `env` carries bindings and `ctx` supplies lifecycle methods such as `waitUntil`. Source:
  https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/
- Wrangler configuration is the deployment source of truth and declares such inputs as the worker
  name, entry `main`, compatibility date, routes, environments, assets, and resource bindings. The
  documentation includes KV, R2, and D1 binding/provisioning behavior and notes that bindings are
  not inherited by environments. Source:
  https://developers.cloudflare.com/workers/wrangler/configuration/
- Vercel's Build Output API reserves `.vercel/output/static` for static files and represents each
  function as a `.func` directory containing `.vc-config.json`; files outside the specified output
  structure are ignored. Source: https://vercel.com/docs/build-output-api/primitives
- Vercel's Build Output configuration controls routing and the deployment-level output contract.
  Source: https://vercel.com/docs/build-output-api/configuration
- AWS Lambda TypeScript handlers follow the exported-handler convention. TypeScript must be
  transpiled, and the deployment package must contain the handler and its runtime dependencies; AWS
  documents bundling as a packaging option. Sources:
  https://docs.aws.amazon.com/lambda/latest/dg/typescript-handler.html and
  https://docs.aws.amazon.com/lambda/latest/dg/typescript-package.html
