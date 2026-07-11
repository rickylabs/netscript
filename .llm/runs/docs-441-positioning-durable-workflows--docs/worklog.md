# Worklog — docs/441-positioning-durable-workflows (issue #441, D2)

Branch: `docs/441-positioning-durable-workflows` from `7f7ed76b`.
Scope: `docs/site/durable-workflows/{index,sagas,triggers,streams}.md` — positioning stories per
the D-common bar (design/CD-docs epic-and-issues §4 row D2; proposal §4.2 story template).

## Plan

The three feature pages were already mechanism-complete (sagas.md is the named template page), so
the slice layers the story template on top rather than rewriting: elevator pitch → stakes-grounded
story spine → mechanism (existing, cross-linked) → one factual competitor comparison (T1/T2) →
cross-links. The thin pillar `index.md` becomes a story page (pitch, checkout-saga stakes,
continuous-app chain, pick-by-failure-mode links) keeping the existing cardsGrid.

## Changes + claim tracing

Every present-tense NetScript capability statement added is a restatement of claims already on the
same page (previously deno-doc-verified mechanism content); no new API claims were introduced.

- `index.md` — rewritten as pillar story: build-efficiency pitch (definitions as typed data,
  legible to registry tooling and coding agents), checkout money-loss stakes (traces to
  `tutorials/storefront/04-checkout-saga`), continuous-app chain (`:8093` triggers → workers →
  `UserSettingsCreated` → saga on `:8092` — all claims restated from sagas.md/triggers.md),
  failure-mode picker links, xref `explain:durable-workflows`. cardsGrid preserved; no nav/_data.ts
  change; no orphan (page already in nav).
- `sagas.md` (T1) — added story-spine paragraph (checkout stakes + agent-legibility: enumerable
  handlers/compensations, `:8092` instances API — both restate existing page content); added
  "Recovery models, compared" apiTable: Temporal replay/determinism requirement (public Temporal
  model), Inngest step memoization (public Inngest model), NetScript checkpointed state machine
  (traces to existing SagaHandler row: synchronous, returns effects; "persists state between every
  message" already on page). Competitor source: teardown row "Inngest-vs-Temporal
  determinism-trap", factual-table shape, no adjectives in cells. Also reworded a pre-existing
  "fan-out throughput" phrase to "parallel fan-out" to keep the positioning-law grep clean.
- `triggers.md` (T2) — added ingress-failure story spine (webhook retry storm / half-written CSV /
  missed cron fire → `idempotencyKey` / `stabilityThreshold` / `backfill`, all existing spec fields
  on the page) + agent-legibility line (frozen definitions, registry listing — restates the page's
  oRPC introspection callout); added "Where ingress lives, compared": Inngest platform-hosted
  event API + retry loop vs NetScript in-workspace `:8093` ingress/processor/DLQ under Aspire —
  operational-locus framing, single-paragraph shape. Competitor source: teardown row "Inngest
  homepage".
- `streams.md` (T2) — added polling-loop story spine grounded in
  `tutorials/live-dashboard/05-live-stream` + `inspectStreamTopic` legibility line (symbol already
  documented on page); added "Kept in sync, compared": Convex reactive-query hosted-database sync
  vs NetScript declared-contract sync (`:4437`, requiresDb/requiresKv=false — restates the page's
  runtime-facts table). Competitor source: teardown row "Convex 'always in sync'".

## Positioning-law self-check

- grep `-i honest|candor|throughput|% faster|fastest|best-in|world's|unbreakable|seamless` over the
  4 pages: clean (one false positive: "outside world starts the work").
- One comparison per T1/T2 page, factual/falsifiable, no invented numbers, no superlatives.
- No `_plan/*` prose consulted or lifted. No `packages/`/`plugins/`/`deno.lock` touched. No
  `_data.ts` change. Capability redirect stubs untouched.

## Validation

`deno task verify` in `docs/site` (build → check:links → check:caveats):

- Build: `500 files generated in 8.48 seconds` (first attempt failed on the known Vento landmine —
  the word "function" inside a comp-tag arg — reworded the two table cells; drift note: the
  landmine also fires on the bare word, not only the keyword).
- Links: `23027 internal links across 162 pages — all resolve`
- Caveats: `27 caveat markers across 22 pages — all references resolve`

Verdict: GREEN.
