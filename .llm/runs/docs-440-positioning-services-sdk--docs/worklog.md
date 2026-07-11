# Worklog — docs/440-positioning-services-sdk (issue #440, D1)

Branch: `docs/440-positioning-services-sdk` from `7f7ed76be66fbfcf1133f7c4bcab33737aa09c78`.
Lane: Claude documentation-authoring workflow (docs exception), under beta-7 shipping orchestrator.

## Plan

Add the D1 positioning story layer to `docs/site/services-sdk/{index,services,sdk}.md` per the
proposal §4.2 story template: elevator pitch (eis-chat-led) → story spine (concrete failure mode)
→ mechanism (existing content, cross-linked not duplicated) → one factual competitor comparison
(Encore nestjs-alternatives for services; tRPC declare-once for sdk) → cross-links. Fix stale
"alpha" claims on sdk.md while touching it (common brief version rule). No `_data.ts` change (no
new pages, no nav change). Do not lift `_plan/*` prose.

## Changes

- `services-sdk/index.md` — story-driven pillar overview + elevator pitch ("declare the API once
  ... all derive from that one object"), eis-chat dogfooding evidence, entry-path cross-links.
- `services-sdk/services.md` — pitch line up top; new section "Why contract-first: the drift you
  never debug" (failure-mode spine: hand-synced API copies; eis-chat `implement(ChannelContractV1)`
  + typed dashboard client; one factual Encore comparison, linked to
  encore.dev/articles/nestjs-alternatives). Mechanism sections untouched.
- `services-sdk/sdk.md` — pitch line up top; new section "Declare once, derived everywhere"
  (failure-mode spine: hand-rolled fetch wrapper; one factual tRPC comparison reframed on turns:
  contract lives in a versioned package, derivation extends to keys/options/cache). Fixed stale
  `badge({ status: "alpha" })` → `"beta"` and "NetScript is in alpha" → "in beta". Mechanism
  sections untouched.

## Accuracy lines (claim → source → verdict)

- "renamed field is a compile error in both handler and caller" — pre-existing verified claim on
  both services.md and sdk.md (contract object shared via `implement()` / client import) — reused,
  not new.
- eis-chat: `implement(ChannelContractV1)` in `services/eischat/src/routers/channel.ts`; typed
  dashboard client built off the contract type in `apps/dashboard/lib/channel-service.ts` —
  `context/D-positioning/elevator-pitch-raw-material.md` item 1, confidence STRONG — OK to publish.
- Encore claim ("agents pick a different combination on every prompt"; Encore fixes conventions in
  application code) — verbatim-sourced paraphrase of encore.dev/articles/nestjs-alternatives in
  `research/D-positioning/competitor-teardown.md` §1; article linked on the page — factual,
  attributed, no numbers borrowed.
- tRPC claim ("declare a procedure on the server and the client's types follow, end-to-end
  typesafe") — tRPC hero verbatim "End-to-end typesafe APIs made easy" (teardown §1); reframed on
  turns per proposal §4.3 row 2 — factual, no capability denial about tRPC.
- SDK derivation list (`key()`, `clientKey()`, `queryOptions`, `mutationOptions`, SWR cache reads)
  — matches the pre-existing verified ActionMethod apiTable on the same page — no new API claims.
- `badge` component: unknown status falls back to muted styling with `label || status` — verified
  in `docs/site/_components/badge.vto`, so `status: "beta"` renders "beta".

## Positioning-law self-check

- No throughput/benchmark, no %/social proof, no superlatives, no honesty/candor framing (grep
  clean: `honest|candor|throughput|faster` — no hits in the three pages).
- Exactly one named competitor comparison per Tier-1 page (Encore on services.md; tRPC on sdk.md);
  index.md has none.
- No `_plan/*` prose lifted.

## Validation

- `deno task verify` (docs/site): **GREEN** — site built (500 files); "23022 internal links across
  162 pages — all resolve"; "27 caveat markers across 22 pages — all references resolve".
- Positioning-law grep (`honest|candor|candid|throughput|% faster|world's|unbreakable|blazing`)
  over `docs/site/services-sdk/*.md`: no hits (exit 1).
