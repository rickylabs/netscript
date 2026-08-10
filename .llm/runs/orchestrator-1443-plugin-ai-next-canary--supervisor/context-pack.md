# Context Pack — #1443 plugin-ai next-canary orchestrator

Resume point for this run. Read `supervisor.md` first for identity and lanes.

## What this run is

Fix the whole `plugin-ai` defect class in #1443 (P0, milestone `0.0.6`, blocking
`rickylabs/eis-chat#157`): one focused PR against `main`, IMPL-EVAL `PASS`, merge, close #1443, hand
the merge SHA to the **existing** release lane for the next canary. Do not cut a competing canary.

## State

| Phase | Status |
| --- | --- |
| Bootstrap | done — run dir + `supervisor.md` |
| Research | done — `research.md`, evidence preserved under `evidence/` |
| Plan & Design | done — `plan.md` **v6** (D1–D9), 13 slices, Design in `worklog.md` |
| Plan-Gate | **PASS** (cycle 5 of 5; cycles 1–4 `FAIL_PLAN`) — `plan-eval-cycle5.md` |
| Implement | **in progress — S1–S5 of 13 landed** (Codex GPT-5.6 Sol high, thread `019feca2-d7db-7801-b314-42b5c366964b`) |
| Gate | not started |
| Evaluate | not started (IMPL-EVAL: Fable 5 medium) |
| Release | hand off merge SHA to the active release lane |
| Close | arch-debt entry + follow-up issue for the unmounted chat island |

## The four defects, mechanized

1. `jsr:@netscript/plugin-ai@0.0.5/services` written to `appsettings.json` for a package with no
   `/services` export — the host synthesizes it as a blind fallback in `resolveServiceEntrypoint`.
2. `netscript.config.ts` gets `./plugins/ai/mod.ts`, which is never created — the AI starter
   resources have no `mod.ts` emitter, so `resolvePluginConfigDirectory` takes its fallback branch.
   `generate runtime-schemas` then fails.
3. `deno check ai/**` → 27 errors: `preact`/`preact/hooks` absent from the root import map,
   `ai/components/ui/markdown.tsx` never emitted, and the generated root `deno.json` has no
   `jsx`/`jsxImportSource`.
4. `plugin doctor` reports healthy through all of it; the canonical E2E never selects `ai/**` and
   never runs `generate runtime-schemas`.

Root cause behind (1): `packages/plugin`'s manifest protocol has no way to express "no service" —
four fields are required by a `.strict()` schema.

## Key paths

- `packages/plugin/src/protocol/manifest.ts` — manifest schema (slice 1)
- `packages/cli/src/kernel/adapters/plugin/appsettings-entry-builders.ts` — `resolveServiceEntrypoint` (slice 2)
- `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts` — appsettings/config/import-map/workspace mutation
- `packages/cli/src/public/features/plugins/install/install-plugin.ts` — install orchestration
- `plugins/ai/scaffold.plugin.json` — the manifest that lies (slice 3)
- `plugins/ai/src/adapter/plugin.ts` — `aiStarterResources` (slices 4–5)
- `plugins/ai/src/adapter/resources/chat-route/chat-route.stub.ts` — the island importing `../components/ui/markdown.tsx`
- `packages/cli/src/kernel/application/ui/registry.ts` — `installUiRegistryItems` (slice 6)
- `packages/cli/e2e/suites/scaffold/capability-suites.ts` + `src/application/gates/scaffold/**` (slice 8)
- `packages/fresh-ui/registry.manifest.ts:1409` — `markdown` in the `ai` collection

## Reproduction

`evidence/published-0.0.5-repro.sh` — rebuild a clean 0.0.5 consumer and re-observe all four
defects. Re-run it against the local-source CLI after slices 2–6 as the cheap regression check
before the expensive E2E.

## Invariants for this run

- No hardcoded plugin names host-side, no `any`, no casts, no lint suppressions, no skipped or
  deleted tests, no docs-only papering.
- Repository `deno.lock` unchanged unless genuinely required and explained in the PR.
- Tier-A slice review before every sign-off commit; no implementation lane self-certifies.
- Final proof: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, visibly
  installing plugin-AI and type-checking the generated AI namespace, then leak-check.


## Landed slices

| Slice | Commit | Gate evidence |
| --- | --- | --- |
| S1 manifest can express "no service" | `da7245561` | plugin 82/0, cli 719/0, quality clean, arch 0 |
| S2 host stops synthesizing entrypoints (3 sites) | `cc1e5ddf4` | cli 720/0, plugin 82/0 |
| S3+S4 AI declares truth; `ai/mod.ts` loads | `fed46cfc5` | cli 722/0, ai 29/0, plugin 82/0 |
| S5 identity follows the configured module | `e5ac71c28` | cli 726/0 |

`deno.lock` unchanged throughout; `quality:scan` `findings:[]` and `arch:check` exit 0 on every
slice. **#1443 acceptance box 1 is true** (no gateway/service/AppHost resource by default).

## Remaining

S6 markdown registry closure → S7 `ai/**` type-checks → S8 three doctor checks (subprocess-isolated;
`ProcessPort.exec` has no cancellation — extend the seam, do **not** `Promise.race`) → S9 assertive
`consumer-verify.sh` → S10/S11 shared contract + import surfaces across all six plugins → S12 E2E
gates → S13 `scaffold.runtime` proof → IMPL-EVAL (Fable 5 medium, **its own worktree**) → merge →
hand merge SHA to the release lane.

## Standing review rule (earned in S1)

If a fixture or existing expectation has to change for an implementation to pass, the
**implementation** is suspect. S1's atomic rule over-constrained the published protocol and the
fixture was edited to match; reverting the fixture and rescoping the rule was the fix. Check
`git diff '*_test.ts' | grep -E '^-\s+(assert|expect)'` on every slice.
