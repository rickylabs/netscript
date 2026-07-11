# Worklog — docs/de-internalize-sweep

Branch `docs/de-internalize-sweep` from `2205f926918879a940d93b6c52aae1a080dcf4db`.
Scope overlay: `SCOPE-docs.md`. Owner directive: PUBLIC framework docs — no internal company
wordings, no PR/issue-number mentions, no "internal"/"incomplete" process framing. Exclusive file
set (below); other agents own `tutorials/chat`, `tutorials/eis-chat`, `tutorials/erp-sync`,
`tutorials/index.md`, `_data.ts`, `_data/xref.ts`.

## Plan

1. Neutralize `eis-chat` provenance (drop internal app name + "dogfood" framing; keep technical
   substance) across the 6 assigned files.
2. Remove PR/issue-number mentions from `reference/fresh-ui/index.md` and
   `background-processing/workers.md`; verify the workers caveat's technical statement against
   issue #638's diagnosis before rewording.
3. Inspect each `internal`/`incomplete` hit in `observability/telemetry.md`,
   `explanation/contracts.md`, `data-persistence/database.md`; keep legitimate technical uses,
   change only internal-company/process references. Record keep/change per hit.
4. Repo-wide public-docs residual grep; report hits outside my scope.

## Evidence — Scope 1: eis-chat de-internalization (7 hits, 6 files)

All replaced with neutral "a production chat application built on NetScript" framing; internal app
name + "the NetScript team dogfoods/builds against the framework" provenance dropped; technical
substance (context-accumulator, ERP-cutover ops team, org-catalog dual-database split, embedding/
vision workers, contract-first typed dashboard client) preserved.

- `tutorials/workspace/index.md:11` — CHANGED (merged two sentences, dropped name + dogfood clause).
- `tutorials/workspace/index.md:58` — CHANGED.
- `tutorials/workspace/03-workspace-data.md:55` — CHANGED (dropped appositive).
- `tutorials/workspace/04-provision-job.md:18` — CHANGED.
- `services-sdk/index.md:17` — CHANGED (dropped "dogfooded against" em-dash clause).
- `services-sdk/services.md:51` — CHANGED.
- `services-sdk/sdk.md:67` — CHANGED.

## Evidence — Scope 2: PR/issue-number removal

- `reference/fresh-ui/index.md:227-229` — CHANGED. "making them public is tracked in PR #58" →
  "planned for a future release". Kept "package-internal" (legitimate technical: the `*Namespace`
  types are package-private). File is under `reference/`, which `check:caveats` skips, so no caveat
  marker involved.
- `background-processing/workers.md:110-120` — CHANGED. Verified against issue #638 (title:
  "published-mode root import map omits @netscript/sdk — generated workers runtime cannot load
  jobs"; diagnosis: `netscript init --package-source jsr` on beta.7 emits a root `deno.json` whose
  import map omits `@netscript/sdk` + `@netscript/sdk/client`, so the scaffolded worker runtime
  crashloops with `Import "@netscript/sdk/client" not a dependency and not in import map`; fix on
  main, published in the next cut). The callout's technical body already matched this exactly, so
  only the trailing citation changed: `Tracked in <a ...>#638</a>; the fix targets the next cut.` →
  `This is fixed on the main line and ships in the next release.` The stale
  `<!-- caveat: gh:#638 -->` marker was removed (issue #638 is closed/shipped; de-referencing it is
  the point of the sweep). `check:caveats` stays green with zero remaining markers repo-wide.

## Evidence — Scope 3: internal/incomplete inspection (all KEEP)

No "incomplete" hits found. Four "internal"-family hits, all legitimate technical usage — none is
company/process framing:

- `explanation/contracts.md:240` — KEEP. "the contract is how NetScript makes the *internal*
  surfaces of a system" = internal surfaces of a running system (technical), not company-internal.
- `data-persistence/database.md:69` — KEEP. "worth internalizing before you run anything" =
  verb (to internalize/learn), not a company reference.
- `data-persistence/database.md:276` — KEEP. Code comment "drops noisy internal spans" = internal
  OpenTelemetry spans (technical).
- `observability/telemetry.md:258` — KEEP. `INTERNAL` is the OpenTelemetry `SpanKind` enum value
  (INTERNAL/SERVER/CLIENT/PRODUCER/CONSUMER) — a public API constant.

## Evidence — Scope 4: repo-wide residual grep

`grep -rniE "eis|VIF|CSB|PR #|pull/[0-9]|dogfood"` over `docs/site` (excluding `_plan/`,
`capabilities/`, `_site/`, `_cache/`). No `PR #`, `pull/[0-9]`, or `dogfood` residuals remain
anywhere. `eis`-substring false positives (NOT reported): `useIsland*` hooks, `SagasLiveIsland`,
`IslandQuery*` in `web-layer/query.md`, `reference/fresh/index.md`,
`tutorials/live-dashboard/05-live-stream.md`.

Genuine residual hits OUTSIDE my scope (other agents own these):

- `_data.ts:222` — eis-chat nav entry.
- `_data/xref.ts:160-164` — eis-chat xref keys.
- `tutorials/index.md:42,44,86` — eis-chat on-ramp references.
- `tutorials/eis-chat/**` — whole mini eis-chat tutorial track (index + 01–04) still names the app
  throughout.
- `tutorials/erp-sync/**` — VIF/CSB legacy-ERP names throughout (index + 01–05).
- `durable-workflows/streams.md:240,242` — example `streamPath: "/eischat/completions"` and
  `producerId: "eischat-ingestion"` still reference the app name. This file is neither in my
  assigned edit set nor in the named other-agent exclusions; flagging for whoever owns the residual
  sweep.

## Validation

`deno task verify` in `docs/site` (build → check:links → check:caveats): GREEN.
- build: Site built into `_site` — 516 files generated.
- check:links: 24055 internal links across 167 pages — all resolve.
- check:caveats: 27 caveat markers across 22 pages — all references resolve.
