# Plan-EVAL session — PR #127 (CLI JSR production hardening)

## Summary

Ran PLAN-EVAL on the `fix/cli-jsr-prod-hardening` branch (PR #127, run
`fix-cli-jsr-prod-hardening--prod-hardening`). Walked `.llm/harness/gates/plan-gate.md` (8-item
checklist) plus A6 F-CLI-1..F-CLI-31 archetype gates against `research.md` and `plan.md`, with
spot-checks of the named read sites, the `packageSource` plumbing, the `deno.json` exports/bin,
`mod.ts` / `bin/netscript.ts` runnability, and the `TemplateRegistry.load()` hydration shape.

**Verdict: `FAIL_PLAN`** (6/8 PASS, 2 FAIL — 5 required fixes, 1 bonus recommendation).

The plan correctly identifies the chokepoint (`template-asset.ts` + `editor-config.ts` + contract
templates), correctly orders slices (S1 unblocks → S2/S3 land), and correctly enumerates risks +
out-of-scope items. It fails the gate on three open decisions that would force rework if deferred:

1. **D1 hydration timing** — `TemplateRegistry.load()` does not hydrate `content` today; nobody
   calls it. Bootstrap site (top-level `mod.ts` await vs lazy in `createPublicCli`) is undecided.
2. **D1 sync→async strategy** — Plan lists 42 sync callers but defers the strategy. Notably,
   `generateV1Mod()` (`packages/cli/src/kernel/adapters/contracts/templates/generate-v1-mod.ts:34,64`)
   reads a URL **not in the registry**, so the hydration-cache fallback cannot cover it. Must
   enumerate the migration list now.
3. **D2 JSR bin mechanism** — Plan's example `"./bin": "./bin/netscript.ts"` is an `exports`
   entry, not the JSR `deno.json` `"bin"` map. JSR uses `"bin": { "netscript": "./bin/netscript.ts" }`
   for `deno install -g`. (Note: `mod.ts` is already runnable via `if (import.meta.main)`, so
   `deno run -A jsr:@netscript/cli` works once D1 lands — the `bin` field is the `deno install`
   path.)
4. **D1 — JSON module import** must commit to `with { type: 'json' }` for `editor-config.ts`'s
   schema; remove the "fetch is acceptable alternative" hedge.
5. **D3 — `packageSource` plumbing** must enumerate runner changes (`create-default-runner.ts:57`,
   `suite-builder-options.ts:23`, public init path selection, workflow YAML) instead of saying
   "wire the existing axis".

Bonus: replace S1's vague verification ("use a local file-server or module-graph import") with a
concrete unit test (regex/AST check for no top-level `Deno.read*` in `editor-config.ts` + a
`readTemplateAsset` call against an `https:` URL served by a local file-server).

Cycle count: **cycle 1**. Per `gates/plan-gate.md`, two `FAIL_PLAN` cycles then user escalation.

## Changes

Created:

- `.llm/tmp/run/fix-cli-jsr-prod-hardening--prod-hardening/plan-eval.md` — full Plan-Gate
  checklist walk with A6-specific scrutiny + open-decision sweep + required fixes.
- `.llm/tmp/run/fix-cli-jsr-prod-hardening--prod-hardening/pr-comment.md` — PR-comment body
  matching the verdict (workflow owns posting).

Did **not** edit:

- `packages/`, `plugins/`, `deno.json`, `deno.lock`, `.github/workflows/**`, `.llm/harness/**`,
  doctrine files, or any code path. Per evaluator protocol: no edits to source — verdict only.

## Validation

- Walked all 8 Plan-Gate items individually (table in `plan-eval.md`).
- A6-specific scrutiny: F-CLI-4 (kernel never imports surfaces), F-CLI-8/F-CLI-9/F-CLI-10
  (`deno doc` + `deno publish --dry-run` re-run needed post-D1/D2), F-CLI-15/F-CLI-16 (top-level
  `Deno.read*` removed by D1).
- Spot-checked the 5 named read sites in research.md against current tree:
  - `editor-config.ts:16` — top-level `Deno.readTextFileSync` confirmed
  - `template-registry.ts:10,25` — `ASSET_ROOT_URL` constant + per-asset URL — confirmed
  - `template-asset.ts:14-28` — four read fns (async + sync) — confirmed
  - `generate-v1-mod.ts:34,64` — sync `Deno.readTextFileSync` confirmed
  - `contract-template-registry.ts:26,31` — URL constants (no read calls) confirmed
- Verified `packageSource` field plumbing: `RunOptions.packageSource` exists but defaults are
  `PACKAGE_SOURCE.LOCAL` at `create-default-runner.ts:57` and `suite-builder-options.ts:23`; never
  read in any gate. Confirmed the plan's "wire the existing axis" is under-specified.
- Verified `mod.ts` is already runnable (`if (import.meta.main)` block calls `runNetscriptCli`).
- Verified `bin/netscript.ts` transitively imports `editor-config.ts` via `runPublicCli`, so the
  bin export in D2 only matters AFTER D1 lands (slice ordering is correct).

## Responses to review comments or issue comments

None — this is the **first** evaluator pass (cycle 1). No prior review comments to respond to.

The verdict body itself (in `pr-comment.md`) is what the supervisor will post as a PR comment.

## Remaining risks

- The plan may still be PASS-worthy if the supervisor concludes the open decisions are "safe to
  defer" under a different reading of `plan-gate.md` §Open-decision sweep. My evaluator reading:
  deferring the 42-call-site enumeration would force a partial rewrite when discovered at slice
  time (the hydration-cache fallback can't cover `generateV1Mod`'s non-registry URL). The
  supervisor is the arbiter — if they agree, cycle 2 closes the gate.
- The `deno.json` `"bin"` field detail is a JSR toolchain nuance. `.agents/skills/netscript-deno-toolchain`
  is the canonical source; if the JSR toolchain doc has been updated since alpha.2, the recommended
  syntax may differ slightly. The fix is "use the `bin` field, not `exports.bin`" — the exact
  field shape should be re-verified against the current JSR spec at slice time.
- This run did not invoke `deno task check` / `deno publish --dry-run` on the PR branch — those
  belong to IMPL-EVAL after D1 lands.

This summary was generated by an AI agent (OpenHands minimax-m3) on behalf of the supervisor.
