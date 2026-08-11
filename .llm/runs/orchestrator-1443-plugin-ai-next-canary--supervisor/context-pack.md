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
| Implement | **complete — S1–S13 plus 6 E2E-driven fixes landed** (Codex GPT-5.6 Sol high, thread `019feca2-d7db-7801-b314-42b5c366964b`; the last fix authored by the supervisor while that thread was writer-locked) |
| Gate | **all green** — `scaffold.runtime` **passed=84 failed=0 skipped=2** (`evidence/scaffold-runtime-GREEN.log`); cli 740/0 (501 steps), plugin 83/0, six plugin suites 0 failed; scoped check/lint clean; `quality:scan` `findings:[]`; `arch:check` 0; `doc:lint` 0; `publish:dry-run` green without `--allow-slow-types`; `deno.lock` byte-identical to `2256a67bf`; consumer-verify red vs 0.0.5 / green vs local source |
| Evaluate | IMPL-EVAL (Fable 5, worktree `/home/codex/repos/ns-1443-impl-eval`): cycle 1 `FAIL_FIX` (6 findings), cycle 2 `FAIL_FIX` (5, artifact-only), owner escalation recorded, cycle 3 `FAIL_FIX` (2, artifact-only). **No cycle raised a source finding.** Cycle 4 pending. |
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
| S1 manifest can express "no service" | `da7245561` | plugin 82/0, cli 719/0 |
| S2 host stops synthesizing entrypoints (3 sites) | `cc1e5ddf4` | cli 720/0 |
| S3+S4 AI declares truth; configured module loads | `fed46cfc5` | cli 722/0, ai 29/0 |
| S5 identity follows the configured module | `e5ac71c28` | cli 726/0 |
| S6+S7 AI namespace complete + compilable | `31cd83e95` | cli 726/0, ai 30/0 |
| S8+S9 doctor checks + assertive consumer gate | `9fab42043` | cli 735/0; consumer-verify red vs 0.0.5, green vs local |
| S10+S11 shared contract, all six plugins | `6d3ef496e` | cli 736/0; six plugin suites green |
| S12 E2E gates registered | `da866797c` | cli 739/0 |
| E2E fix: re-install idempotency (disk truth) | `55fcbcefa` | cli 739/0 (500 steps) |
| S14 control-plane/runtime split (owner D-10) | `0c3641de1`…`0282b04d8` | cli 740/0; six plugin suites green |
| IMPL-EVAL + trigger-discovery fixes | head | cli 740/0 (501 steps); scoped check/lint clean |

`deno.lock` unchanged throughout; `quality:scan` `findings:[]` and `arch:check` exit 0 on every
slice. **#1443 acceptance box 1 is true** (no gateway/service/AppHost resource by default).

## Remaining

Fresh IMPL-EVAL `PASS` on the artifact-only head → merge #1444 (closes #1443 + #1445) → hand the
merge SHA to the release lane. The separate #1447 lane (PR #1449, branch `fix/1447-service-env`,
worktree `/home/codex/repos/ns-1447-aspire-env`) is under opposite-family Codex IMPL-EVAL; both SHAs
then go to the release lane and the next canary carries both (owner directive, drift D-12).

## Standing review rule (earned in S1)

If a fixture or existing expectation has to change for an implementation to pass, the
**implementation** is suspect. S1's atomic rule over-constrained the published protocol and the
fixture was edited to match; reverting the fixture and rescoping the rule was the fix. Check
`git diff '*_test.ts' | grep -E '^-\s+(assert|expect)'` on every slice.
