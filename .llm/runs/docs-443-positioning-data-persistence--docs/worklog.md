# Worklog — docs/443-positioning-data-persistence (D4)

Issue #443 — docs(positioning): data-persistence stories. Branch
`docs/443-positioning-data-persistence` from `7f7ed76b`. Authoring lane per the
documentation-authoring exception; brief:
`.llm/runs/beta7-ship--orchestrator/docs-briefs/issue-443.md`.

## Plan

Pages: `docs/site/data-persistence/{index,database,kv-queues-cron}.md`.

Story template per proposal §4.2 (pitch → spine → mechanism-links → one factual
comparison → cross-links), applied without duplicating the mechanism content already on
these pages:

1. **index.md** — pillar home currently opens with a bare sentence + cards grid. Add an
   elevator pitch (build-efficiency framing: one schema edit propagates to client types,
   zod schemas, and migration in one workflow) and a two-lane story framing (records →
   database; execution state → kv-queues-cron). No competitor mention on the hub (taste
   rule: comparisons live on the Tier-2/3 leaf pages).
2. **database.md (T2)** — add a story-spine opening (the concrete failure mode: a model
   change that leaves client types, validation, and migration drifting in three places —
   each a separate keep-in-sync turn) + pitch, then a "How it compares" factual Yes/No
   matrix vs **Convex and Supabase** (teardown §2 row: reuse the
   `convex.dev/compare/supabase` matrix *shape*; category rows, no adjectives, one
   neutral trade-off sentence up front). Rows limited to falsifiable facts: engine
   choice at scaffold time, schema medium, where the database runs by default.
3. **kv-queues-cron.md (T3)** — light touch: one factual **BullMQ/Celery** sentence
   (both require a broker/Redis provisioned before the first job; `createQueue()` starts
   on local Deno KV and upgrades under Aspire — same code), plus one concrete story beat
   in "How they compose": the oversized-queue-payload failure (Deno KV's 64 KiB value
   cap on enqueue; carry a reference, fetch bytes back over RPC) — grounded in the
   evidence file (`elevator-pitch-raw-material.md`, PROSCO spine `#kb-image-payload`),
   written as reader guidance, no internal app named.

Positioning-law checks applied while writing: no throughput/benchmark, no superlatives,
no honesty framing, no fabricated %, no `_plan/*` prose lifted, present-tense claims
restricted to mechanisms already documented on these pages (Prisma client + zod from
`db generate`, adapter matrix, queue auto-detection order, Postgres queue
explicit-only) — all previously verified page content, not new API claims.

Sourcing notes (accuracy):

- "BullMQ is Redis-backed" — BullMQ docs (Redis-based queue library); "Celery requires a
  message broker (e.g. RabbitMQ/Redis)" — Celery docs. Factual, falsifiable, current.
- "Convex provides its own datastore / schema declared in TypeScript" —
  convex.dev/compare/supabase + docs (teardown §1). "Supabase is Postgres" — supabase.com
  (teardown §1).
- Deno KV value size limit 64 KiB — Deno KV docs; matches the recorded real failure in
  the evidence file.

## Evidence

- Branch created from `7f7ed76b`; only files touched: the three pages + this worklog
  (`git diff --stat`: database.md +29, index.md +19/-2, kv-queues-cron.md +13).
- `deno task verify` in `docs/site` — **GREEN**:
  - build: `500 files generated in 10.57 seconds`
  - check:links: `23020 internal links across 162 pages — all resolve`
  - check:caveats: `27 caveat markers across 22 pages — all references resolve`
- Positioning-law grep over the added lines
  (`honest|candor|candid|throughput|faster|% |world's|best|unbreakable|blazing|beta.N`):
  **CLEAN** — no hits.
- No `_data.ts`, no `packages/`, no `plugins/`, no `deno.lock` touched; pages were
  already in nav (no orphan). Capability redirect stubs untouched.
- Comparison count: exactly one per page where the tier allows it — database.md carries
  the Convex/Supabase matrix (T2); kv-queues-cron.md carries one BullMQ/Celery sentence
  (T3); index.md carries none.
