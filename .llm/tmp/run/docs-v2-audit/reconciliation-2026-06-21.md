# Reconciliation — 2026-06-21

This note reconciles the 2026-06-19 capability-truth audit (the other files in this
directory) against the state of `main` as of 2026-06-21, after (a) the capability
caveat-fix track, (b) the auth plugin program (Track-5 + AS7 + AS8), and (c) the v3
documentation overhaul that now ships on `docs/user-site`. The original audit files are
preserved unchanged as a historical record; this file records what has since changed so
the merged artifact is **not** read as current ground truth.

## Findings since FIXED in code (caveat no longer applies)

- **Trigger `defer` actions ignored** (`caveats-and-gaps.md` → "Trigger `defer` Actions Are
  Ignored By Runtime Dispatch"; `missing-and-miscategorized.md` → "Trigger Deferred
  Actions"): **FIXED.** The triggers `defer` path no longer silently returns; deferred
  actions now surface explicitly (throw / DLQ) instead of being dropped (S2 triggers-defer
  slice). Do **not** re-add the "silent no-op" caveat to the live docs — the v3 docs
  already describe current behavior.
- **PostgreSQL queue provider not implemented** (`caveats-and-gaps.md` → "PostgreSQL Queue
  Provider Is Explicitly Not Implemented"; `missing-and-miscategorized.md` → "Queue
  Provider Support"): **SUPERSEDED.** The queue factory now supports a Postgres backend
  (explicit-provider selection) alongside Deno KV, Redis, and RabbitMQ. v3
  `capabilities/kv-queues-cron.md` reflects the current provider set; the "Postgres not
  implemented" line is stale.

## Findings since CONFIRMED / resolved

- **Service oRPC path drift `/rpc` vs `/api/rpc/*`** (both files): **CONFIRMED as
  `/api/rpc/*`.** The v3 service capability page and the build-a-service tutorial were
  reconciled to `/api/rpc/*`; the earlier `/rpc` reference was corrected. No open drift.
- **Sagas durable store**: the audit predates the Prisma saga store. Sagas now support
  `kv | prisma` durable backends (Track-3). v3 `capabilities/durable-sagas.md` covers both.

## Findings ADDRESSED by the v3 docs overhaul (IA gaps closed)

- **Polyglot tasks need a first-class IA home** (`missing-and-miscategorized.md` →
  "Missing: Polyglot Tasks"): **ADDRESSED.** `capabilities/background-jobs.md` now carries a
  dedicated "Polyglot tasks" section (`defineTask`; multi-runtime
  deno/python/shell/dotnet/powershell/cmd/executable) with its own anchor and a real sample
  task module, plus a generated `/reference/workers/` unit. The page also correctly states
  that job dispatch/execution emit real OpenTelemetry spans.
- **`@netscript/fresh` meta-framework miscategorized** (`missing-and-miscategorized.md` →
  "Miscategorized: `@netscript/fresh` Meta-Framework"): **PARTIALLY ADDRESSED.** The
  reference IA now ships **two distinct units** — `/reference/fresh/` (the meta-framework:
  routes, forms, defer, query/hydration, server, Vite, testing) and `/reference/fresh-ui/`
  (copy-source design system). The narrative capability page remains "Fresh UI & design"; a
  dedicated `capabilities/fresh-framework` narrative page is still a candidate enhancement
  (not a correctness gap).
- **Runtime config has little user IA** (both files): **PARTIALLY ADDRESSED.** A generated
  `/reference/runtime-config/` unit now exists. A narrative operations/how-to page for
  runtime overrides remains a candidate enhancement.

## Findings still ACCURATE (documented caveats, unchanged)

- **Triggers webhooks are raw Hono, not oRPC** — still true and documented.
- **Streams topic producer/consumer helpers are stubs** — still true; v3 streams docs say
  the topic helpers are inert and direct durable work to `@netscript/plugin-streams-core`
  (`createDurableStream`, port 4437).
- **Scaffolded worker `createJobTools(ctx)` trace/progress helpers are no-op** — still true
  and documented; framework-level job-execution spans are real and separate.
- **DurableStreamProducer drops writes after a failed connection** — still accurate; a
  known-limitation note in streams reference remains a candidate enhancement.

## Net-new since the audit (out of its original scope)

- The **auth plugin program** shipped entirely after this audit: `plugins/auth` (oRPC
  service on port 8094, single-active-backend over better-auth / WorkOS / KV-OAuth
  backends), `auth.prisma`, and CLI + scaffold + Aspire wiring (Track-5 / AS1–AS6), a
  doctrine-fitness audit (AS7), and audit-observability (AS8: e2e traces + structured audit
  logging). The v3 overhaul documents this as `capabilities/auth.md`,
  `explanation/auth-model.md`, and `how-to/add-authentication.md`. None of it is reflected
  in the 2026-06-19 audit above.
