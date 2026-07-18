# Nitro versus own-layer rev2 — owner-linked live evidence

Retrieved: 2026-07-18. This committed extract preserves the source facts used by
`../research/nitro-vs-own-rev2.md`. It paraphrases the linked pages; URLs are the primary sources.

## Deno-native and provider-native deployment tools

- `lowlighter/vercel-deno` supports Deno 2.x, local `vercel dev`, `Deno.ServeHandler`, default
  `Deno.serve` exports, Deno version selection, permissions, environment variables, and asset
  pre-caching. Its README describes it as a standards-aligned rewrite of an unmaintained prior
  runtime and configures functions through `vercel.json`. Deno is available only during function
  execution unless the build separately installs it. At retrieval it showed 20 commits, 11 stars,
  and no open issues or pull requests; those are a maintenance-risk signal, not a quality verdict.
  Source: https://github.com/lowlighter/vercel-deno
- Denoflare is a Deno CLI for Cloudflare Workers that avoids a Node/npm/Wrangler requirement. On
  Deno 2 it bundles with esbuild plus esbuild-deno-loader. It supports R2 and advertises
  experimental multi-platform output for Deno Deploy, Lambda, and Supabase. Source:
  https://denoflare.dev/
- Deno's official Wrangler tutorial points a Wrangler config directly at `src/mod.ts`, pins a
  compatibility date, and adds Wrangler dev/deploy tasks to `deno.json`. This proves a Deno source
  project can use Cloudflare's official deploy path without Nitro. Source:
  https://docs.deno.com/examples/cloudflare_workers_wrangler_tutorial/
- Cloudflare's Vite plugin runs Worker code in workerd for development parity, exposes runtime APIs
  and bindings, builds frontend assets, supports HMR and preview, and covers standalone and
  multi-Worker applications. Source: https://developers.cloudflare.com/workers/vite-plugin/
- Miniflare accepts Worker scripts/modules, module resolution rules, compatibility dates and flags,
  and local binding configuration. It is part of Cloudflare's workers-sdk. Source:
  https://github.com/cloudflare/workers-sdk/tree/main/packages/miniflare
- AWS Lambda Web Adapter runs any HTTP/1.0 or HTTP/1.1 application on Lambda and supports API
  Gateway REST/HTTP APIs, Function URLs, ALB, managed/custom runtimes, OCI images, graceful
  shutdown, binary responses, compression, streaming, multi-tenancy and non-HTTP triggers. The same
  image can run on Lambda, EC2, Fargate, and locally; the repository includes a Deno Oak zip
  example. Source: https://github.com/aws/aws-lambda-web-adapter
- A January 2025 community experiment runs Deno through the AWS Node runtime processing loop with a
  Lambda layer and `AWS_LAMBDA_EXEC_WRAPPER`. It reports needing `--allow-all`, unstable Node
  compatibility flags, and disabling a telemetry file descriptor. This is useful proof of
  feasibility but is not a sound default production contract. Source:
  https://zaccharles.medium.com/run-typescript-deno-natively-in-aws-lambda-995c77221a60

## Cloudflare provider suite

- Workers Cache can serve cached HTTP responses without executing Worker code; the Worker controls
  it through standard HTTP cache directives. Source:
  https://developers.cloudflare.com/workers/cache/
- Cloudflare Queues documents guaranteed delivery, batching, retries, delays, dead-letter queues,
  and pull consumers. Source: https://developers.cloudflare.com/queues/
- Durable Objects combine named compute with attached, strongly consistent storage and expose
  transactional/serializable storage, alarms, and WebSocket hibernation. Source:
  https://developers.cloudflare.com/durable-objects/
- Workers KV is global low-latency key-value storage accessed through a Worker binding or REST API;
  the binding exposes put/get/list/delete operations and is declared in Wrangler configuration.
  Source: https://developers.cloudflare.com/kv/

## AWS provider suite

- Lambda event-source mappings poll SQS and invoke a function with message batches. Delivery is at
  least once, duplicates can occur, idempotency is required, failed batches reappear after the
  visibility timeout, and partial batch failure reporting is supported. Source:
  https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html
- Lambda event-source mappings cover queues and streams including SQS, Kinesis, DynamoDB Streams,
  Kafka, Amazon MQ, and DocumentDB change streams. AWS documents extended workflow handling through
  durable functions and intermediary invocation. Source:
  https://docs.aws.amazon.com/lambda/latest/dg/durable-invoking-esm.html
- AWS Step Functions provides more sophisticated workflow error handling than Lambda retry alone.
  Source: https://docs.aws.amazon.com/lambda/latest/dg/with-step-functions.html
