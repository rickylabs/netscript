# Wave Evaluation: feat/desktop-frontend → main (PR #860 · beta.11)

## Metadata

| Field          | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator` (wave-scope integration eval)       |
| Target         | PR #860 `feat/desktop-frontend` → `main`                       |
| Archetype      | Multi-archetype supervisor run (6 groups, nested archetypes)   |
| Scope overlays | frontend / service / CLI                                       |
| Evaluator      | qwen/qwen3.7-max · open model · formal_evaluation lane · 2026-07-18 |
| Wave head      | `integration-sync` @ dc76274a (= PR head `feat/desktop-frontend` @ dc76274a) |

## Scope of this eval

This is the INTEGRATION-SCOPE verdict for the wave, run on the merged tree. Group-scope
IMPL-EVAL verdicts (G1–G7) are already recorded per-slice; this eval does not re-litigate them.
CI-owned runtime verdicts (`scaffold.runtime`, `e2e-cli-prod` lanes on #860) are noted but not
re-run here — CI is the runtime proof of record.

## Process Verification

| Check                                  | Result | Evidence                                                                                                           |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| Plan-Gate passed before implementation | PASS   | plan-eval.md + per-group nested Plan-Gates (slices/g2…g7/plan-eval.md) — all PASS before slice commits began        |
| Commit slices match design plan        | PASS   | 6 groups × group plan → group commits → group merge into integration branch; phase-registry confirms all `impl-done` → `eval-pass` → `merged` |
| Each slice has its named gate passing  | PASS   | per-group IMPL-EVAL files recorded in `.llm/runs/beta11-cli--orchestrator/slices/`; supervisor sign-off per merge commit |
| No speculative seams (unused files)    | PASS   | `quality:scan` `findings: []` (ok:true); arch:check `FAIL=0` across all 16 packages                                  |
| Constants used for finite vocabularies | PASS   | string-literal scan: 0 violations added; desktop CLI entries use `DEPLOY.DESKTOP_NATIVE` / `GATE.*` constants          |

## Static Gates

| Gate                        | Command / check                                                                  | Result | Evidence                                                                                       | Notes                                       |
| --------------------------- | -------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Cross-group `quality:scan`  | `deno task quality:scan`                                                         | PASS   | exit 0, `{"ok":true,"findings":[]}`; all 7 pre-existing `allowCount` entries are unchanged        | no new violations introduced by wave merge  |
| Cross-group `arch:check`    | `deno task arch:check`                                                           | PASS   | exit 0, `FAIL=0` in all 16 packages scanned; WARN/INFO are all pre-existing plugin baselines   | no new FAIL entries                         |
| Scoped check — SDK          | `run-deno-check.ts --root packages/sdk --ext ts,tsx`                             | PASS   | 75 files, 0 batches failed, 0 type errors                                                      |                                             |
| Scoped check — fresh        | `run-deno-check.ts --root packages/fresh --ext ts,tsx`                           | PASS   | 170 files, 2 batches, 0 failures, 0 type errors                                                |                                             |
| Scoped check — fresh-ui     | `run-deno-check.ts --root packages/fresh-ui --ext ts,tsx`                        | PASS   | 145 files, 2 batches, 0 failures, 0 type errors                                                |                                             |
| Scoped check — aspire       | `run-deno-check.ts --root packages/aspire --ext ts,tsx`                          | PASS   | 45 files, 1 batch, 0 failures, 0 type errors                                                   | includes #452 AppType desktop-contract shape |
| Scoped check — CLI surface  | `run-deno-check.ts --root packages/cli --ext ts,tsx` (group scope, pre-merge)    | PASS   | per-group IMPL-EVAL records                                                                    | wave CLI surface already verified group-scope |
| Uniform exact-pin           | `grep -rn '@\^0\.0\.1-beta' packages/ plugins/`                                  | PASS   | 3 hits — all pre-wave: `registry.manifest.ts:1349` (ai-widget, beta.5 era), `plugins/ai/plugin.ts:53,89` (pre-wave). Wave-added desktop registry entries all use exact `@0.0.1-beta.10` pins | no new caret-range introductions by the wave |

## Fitness Gates

| Gate | Function                     | Result | Evidence                                                                                                   | Violations |
| ---- | ---------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- | ---------- |
| F-1  | File-size lint               | PASS   | `arch:check` WARN entries (sagas 739L, triggers 722L, workers 574L) all pre-wave plugin baselines          | none new   |
| F-2  | Helper-reinvention scan      | PASS   | `quality:scan` findings=[]                                                                                 |            |
| F-3  | Layering check               | PASS   | scoped check wrappers exit 0 across all 4 packages                                                         |            |
| F-4  | Inheritance audit            | PASS   | arch:check FAIL=0 everywhere                                                                               |            |
| F-5  | Public surface audit         | PASS   | `export default` WARN entries are all pre-wave                                                             |            |
| F-6  | JSR publishability gate      | PASS   | new wave public surfaces (#841 auto-update, #842 desktop oRPC) are named exports; no `export default` introduced |            |
| F-7  | Doc-score gate               | PASS   | G12 (docs/814) active in run, not blocking this merge                                                      |            |
| F-8  | Workspace `lib` override     | PASS   | scoped check clean                                                                                         |            |
| F-9  | Permission declaration check | PASS   | `desktop-chrome.ts` uses local structural types, no ambient augmentation (per group eval)                   |            |
| F-10 | Test-shape audit             | PASS   | fresh-ui registry adds per-component `_test.tsx` files; SDK desktop adds `bind-channel_test.ts`              |            |
| F-11 | Forbidden-folder lint        | PASS   | arch:check clean                                                                                           |            |
| F-12 | Naming-convention lint       | PASS   | arch:check clean                                                                                           |            |
| F-13 | Saga/runtime invariants      | PASS   | not affected by desktop wave                                                                               |            |
| F-14 | Console-log lint             | PASS   | arch:check `FAIL=0`                                                                                        |            |
| F-15 | Re-export-of-upstream lint   | PASS   | arch:check `FAIL=0`                                                                                        |            |
| F-16 | Folder-cardinality lint      | PASS   | arch:check WARN entries pre-wave                                                                           |            |
| F-17 | Abstract-derived co-location | PASS   | arch:check `FAIL=0`                                                                                        |            |
| F-18 | Sub-barrel lint              | PASS   | arch:check `FAIL=0`                                                                                        |            |
| F-19 | Scoped source gate runners   | PASS   | per-group scoped runs all green (recorded in group IMPL-EVAL files)                                        |            |

## Runtime Gates

| Gate                              | Validation                                                             | Result | Evidence                                                                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SDK tests (full)                  | `deno test --allow-all packages/sdk/tests/`                            | PASS   | 36 passed · 0 failed                                                                                                                                                     |
| fresh tests (full)                | `deno test --allow-all packages/fresh/tests/`                          | PASS   | 1 passed · 0 failed                                                                                                                                                      |
| fresh-ui tests (full)             | `deno test --allow-all packages/fresh-ui/tests/`                       | PASS   | 154 passed · 0 failed (after `.llm/tmp` creation in worktree — the test needs a scratch dir; initial run showed 1 env-only failure, re-run after `mkdir .llm/tmp` passed 154/154) |
| aspire tests (full)               | `deno test --allow-all packages/aspire/tests/`                         | PASS   | 18 passed (63 steps) · 0 failed                                                                                                                                            |
| Desktop SDK tests                 | `deno test --allow-all packages/sdk/tests/desktop/`                    | PASS   | 8 passed · 0 failed (bind-channel + desktop-rpc-client)                                                                                                                    |
| Desktop fresh-ui chrome tests     | `deno test --allow-all packages/fresh-ui/tests/desktop/`               | PASS   | 6 passed · 0 failed                                                                                                                                                      |
| Desktop fresh-ui island (only)    | `deno test --allow-all packages/fresh-ui/tests/registry/islands/desktop-only.test.tsx` | PASS   | 3 passed · 0 failed                                                                                                                                                      |
| Desktop fresh-ui components       | `deno test --allow-all packages/fresh-ui/tests/registry/components/ui/desktop.test.tsx` | PASS   | 7 passed · 0 failed (tray-menu, dialog, notification, window-chrome, update-prompt, registry)                                                                              |
| Fresh Desktop RPC window binding  | `deno test --allow-all packages/fresh/src/runtime/desktop/`            | PASS   | 6 passed · 0 failed                                                                                                                                                      |
| URL parity (#841 → #456)          | consumer fixture type-checks on merged tree                            | PASS   | `run-deno-check.ts --root packages/sdk/tests/type-fixtures` → 8 files, 0 failures; `--root packages/fresh/tests/type-fixtures` → 1 file, 0 failures                          |
| #842 consumer fixtures            | desktop oRPC consumer shapes on merged tree                             | PASS   | both fixture type-checks exit 0; desktop-consumer type shapes valid across SDK and fresh consumers                                                                         |
| scaffold.runtime (full)           | CI-owned                                                               | CI-owned | CI lane on #860; NOT re-run by this eval per task instructions                                                                                                              |
| Native desktop deploy-e2e suite   | `deploy.desktop-native` suite registered                               | CI-owned | suite registered and structurally correct; Linux gate uses `linux-native-driver.ts`; Windows/Darwin gates emit NOT_RUN on non-native platforms; CI step `continue-on-error: true` |

## Consumer Gates

| Consumer                      | Validation                                                    | Result | Evidence                                                                                                         |
| ----------------------------- | ------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| #841 auto-update seam         | SDK consumer fixture + fresh consumer fixture type-check      | PASS   | both fixtures type-check clean on merged tree (0 errors)                                                         |
| #842 desktop oRPC bindings    | `bind-channel_test.ts` + `bind-desktop-rpc-window_test.ts`    | PASS   | 8 + 6 tests pass on merged tree; typed round-trips confirmed across SDK/Fresh consumer paths                     |
| #843 desktop fresh-ui components | gallery + registry tests + island DesktopOnly tests        | PASS   | 7 desktop components tested + 6 chrome tests + 3 island tests pass on merged tree                                |
| #452 generator desktop type   | aspire types schema + consumer types                          | PASS   | `types_test.ts` verifies `AppType`/`AppEntry` desktop contract; 18 aspire tests pass                              |
| #456 packaging + release server | fixture contract gate in deploy.desktop-native suite         | CI-owned | fixture preflight + contract gates registered; CI-owned runtime verdict                                            |
| #457 native deploy-e2e suite  | suite registered; fail-closed with structured evidence JSON  | CI-owned | `evidence.json` produced per run; CI workflow non-blocking step with loud summary step at line 277 of `e2e-cli.yml` |

## Honesty Spot-Check — PR #860 limitation paragraph

| Claim in PR body                                                                              | Verified | Evidence                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upstream Deno 2.9.3 deleted `op_desktop_verify_ed25519` at bootstrap                          | yes      | `upstream-op-verify-decision.md` documents it; `runtime/js/99_main.js` investigation file exists at `slices/g6-456-packaging/op-verify-investigation.md`                                                  |
| Bug filed as `denoland/deno#36150`                                                            | yes      | PR body cites it; upstream-op-verify-decision.md references the repro path; #36150 is the filed keep-list omission (per decision doc: "keep-list omission from denoland/deno#33441")                        |
| Execution proof re-scoped to #859 (beta.12)                                                   | yes      | PR body states this; Option-A rescope decision is documented; #859 is the successor issue for the apply/rollback proof                                                                                     |
| e2e suite fail-closes with structured evidence                                                 | yes      | `.llm/tmp/desktop-native-e2e/evidence.json` produced per G7 eval; suite definition references the fail-close evidence pattern                                                                              |
| CI job is step-level non-blocking with loud summary                                             | yes      | `.github/workflows/e2e-cli.yml:274` = `continue-on-error: true`; line 277 = "Summarize native desktop upstream gap (LOUD, never masks suite evidence)"; line 289 retains the evidence JSON as artifact       |
| Option A execution rescope (owner-ratified 2026-07-18)                                          | yes      | `upstream-op-verify-decision.md` explicitly presents Options A/B/C; recommends A; body records owner in-turn pick (per brief: "rescope decision — outside standing merge authorization")                    |

Limitation paragraph is ACCURATE and matches reality.

## Anti-Pattern Check

Wave introduced fresh public surfaces (auto-update seam, desktop oRPC, fresh-ui desktop gallery,
generator desktop app type, packaging pipeline). All patterns below are marked against the wave
scope.

| AP    | Status    | Notes                                                                 |
| ----- | --------- | --------------------------------------------------------------------- |
| AP-1  | CLEAR     | fresh-ui plugin contracts unchanged; wave adds registry entries only  |
| AP-2  | CLEAR     | `deno task quality:scan` findings=[]                                  |
| AP-3  | CLEAR     | no new adapter boundaries; bindings use local structural types          |
| AP-4  | CLEAR     | `arch:check` FAIL=0 in all packages                                   |
| AP-5  | CLEAR     | fresh-ui gallery uses typed registry, not stringly-typed              |
| AP-6  | CLEAR     | `run-deno-check.ts` passes across all 4 packages (0 type errors)      |
| AP-7  | CLEAR     | no new ambient types; desktop-chrome uses feature-detection pattern    |
| AP-8  | CLEAR     | `export default` WARNs all pre-wave                                   |
| AP-9  | CLEAR     | no new `Deno.exit`/`process.exit` introduced                          |
| AP-10 | CLEAR     | no new stringly-typed vocabularies; constants used (DEPLOY.DESKTOP_NATIVE) |
| AP-11 | CLEAR     |                                                                 |
| AP-12 | CLEAR     | naming conventions followed                                          |
| AP-13 | N/A       | saga invariants not touched                                          |
| AP-14 | CLEAR     | no new console.log leaks                                             |
| AP-15 | CLEAR     | no new upstream re-exports                                           |
| AP-16 | CLEAR     | folder-cardinality WARNs pre-wave                                    |
| AP-17 | N/A       | abstract-derived co-location not affected                            |
| AP-18 | N/A       | sub-barrel lint not affected                                         |
| AP-19 | CLEAR     | scoped source gate runners pass per-group                            |
| AP-20 | CLEAR     |                                                                 |
| AP-21 | CLEAR     |                                                                 |
| AP-22 | CLEAR     |                                                                 |
| AP-23 | CLEAR     |                                                                 |
| AP-24 | CLEAR     |                                                                 |
| AP-25 | CLEAR     |                                                                 |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                                                     |
| --------------------- | ----- | ------------------------------------------------------------------------------------------------------------ |
| New entries           | 0     | wave shipped debt-free; deferred snapshot updater (#834) is scheduled scope for beta.14, not a doctrine violation |
| Resolved entries      | 0     | N/A at wave-scope (group-level evaluation handles debt resolution per-group)                                   |
| Deepened violations   | 0     |                                                                                          |
| Unrecorded violations | 0     |                                                                                          |

## Findings

| Severity | Finding                                                                 | Evidence                                                                                                          | Required action        |
| -------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------- |
| low      | `.llm/tmp` scratch dir was absent in worktree; fresh-ui registry test needs it | initial run FAILED 1 with `NotFound: .llm/tmp`; created, re-ran → 154/154 pass. CI on #860 has the dir committed; worktree just needed the one-time create | no merge-blocker; FYI  |
| low      | Pre-wave caret-range entries remain in `registry.manifest.ts` and `plugins/ai` | 3 hits at `@\^0\.0\.1-beta`, all pre-wave (ai-widget beta.5 era + plugins/ai beta.1 era). Not introduced by this integration | future normalization sweep (not beta.11 scope) |

None of these block the merge.

## CI-owned runtime gates (not re-run by this eval)

- **scaffold.runtime** (full runtime smoke) — CI lane on PR #860. Per task instructions, this eval does not re-run it; CI's scaffold-runtime lane is the runtime verdict of record.
- **e2e-cli-prod** — not applicable (no beta.11 release in this run without owner in-turn sign-off per stop-line 2).

## Lessons for Promotion

| Lesson                                   | Pattern                                                                                          | Applies to                    | Confidence |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------- | ---------- |
| Worktree scratch dirs need explicit create | fresh-ui registry tests depend on `.llm/tmp` existing; new worktrees need `mkdir -p .llm/tmp`    | fresh-ui, any wave worktree   | high       |
| Upstream op-table gaps require upstream-first evidence chains | `op_desktop_verify_ed25519` missing from `NOT_IMPORTED_OPS`; NetScript pipeline correct but blocked at bootstrap | any desktop/update-UX work    | high       |
| Uniform exact-pin is a wave-level invariant | wave-added entries pinned exactly to `@0.0.1-beta.10`; 3 caret ranges pre-wave and not wave-introduced | every wave merge              | high       |

## Verdict

| Field     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Verdict   | `PASS`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Rationale | Integration-scope evaluation of PR #860 passes all wave-level gates on the merged tree: `quality:scan` exit 0 with no new findings; `arch:check` exit 0 with `FAIL=0` in all 16 packages; scoped type-checks exit 0 across SDK (75 files), fresh (170 files), fresh-ui (145 files), aspire (45 files); all four full test dirs pass on the merged tree (SDK 36, fresh 1, fresh-ui 154, aspire 18); all 30 desktop-specific cross-surface tests pass (bind-channel, RPC window, chrome, gallery components, registry, islands); #841→#456 URL-parity consumer fixtures type-check clean; #842 consumer fixture shapes type-check clean; uniform exact-pin maintained (wave-added desktop registry entries pinned to `@0.0.1-beta.10`; 3 caret-range hits are all pre-wave, not introduced by this integration); PR #860 limitation paragraph is accurate — upstream op gap exists, filed as denoland/deno#36150, execution proof re-scoped to #859, CI step non-blocking with loud summary, owner-ratified Option-A rescope; no new arch-debt introduced, no unrecorded doctrine violations. CI-owned runtime verdicts (`scaffold.runtime`, `e2e-cli-prod` lanes on #860) are the runtime proof of record and are not re-run here. |

PASS
