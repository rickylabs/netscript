# PLAN-EVAL — Wave 6 `@netscript/cli` A6-v2 promotion

> Evaluator session (separate from the generator). Follows
> `.llm/harness/evaluator/plan-protocol.md` + `gates/plan-gate.md` +
> `archetypes/ARCHETYPE-6-cli-tooling.md` (v2) + `gates/archetype-gate-matrix.md`.
> Hard stop before any implementation. No edits to `packages/`, configs, or lockfiles.

- **Evaluator session:** MiniMax M3 (OpenHands cloud), 2026-06-16
- **Run:** `feat-package-quality-wave6-cli--research`
- **Branch / PR:** `feat/package-quality-wave6-cli` (PR #43)
- **Phase:** plan
- **Surface / archetype:** `packages/cli` / **A6 (cli-tooling) v2**
- **Scope overlays:** A6-specific F-CLI-1..F-CLI-31 (per archetype gate matrix)
- **Base rebased onto:** `733388f` (post-#44 merge; verified via `git log -1`)

## Inputs reviewed

- [x] `research.md` (1,609 lines — read header, §A.1–A.2 target tree, §E scaffold improvements, §F metrics, R-1..R-15)
- [x] `plan.md` (193 lines — full read)
- [x] `worklog.md` (§Design — full read)
- [x] `drift.md` (W-1..W-5 + **D-W6-1**, **D-W6-2**)
- [x] `.llm/harness/gates/plan-gate.md` (8-item checklist)
- [x] `.llm/harness/gates/archetype-gate-matrix.md` (A6 row + F-CLI-1..31 namespace)
- [x] `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md` (v2 rules; referenced)
- [x] `packages/cli/README.md` (227 LOC — ≥150 requirement met)
- [x] `packages/cli/src/kernel/application/ui/registry.ts` (384 LOC — confirmed)
- [x] `packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts` (384 LOC — confirmed)
- [x] `packages/cli/src/kernel/application/registries/deploy-target-registry.ts` (typed `Registry<TKey,TValue>`, V-9 lock-in)
- [x] `packages/cli/src/public/features/root/public-command-tree.ts` (V-1/F-CLI-27 hand-wired Cliffy chain)
- [x] `packages/cli/src/kernel/adapters/scaffold/editor-config.ts` lines 42, 115 (V-14 vendor URL leak)
- [x] `deno.json` workspace (line 7: `packages/cli/e2e` already a member — W-2 already resolved)
- [x] `git log -1` on current branch: `de15046 docs(wave6-cli): rebase onto #44 + slice 5 → verify-only (D-W6-1)`
- [x] `git show 677d5405` + `git show a50d73f` (R6 in #44 — Aspire 13.4 GA AppHost shape migration confirmed landed in `scaffold/.../*.template` files)

## Plan-Gate checklist

| Plan-Gate item                            | Result            | Evidence / location                                                                                              |
| ----------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| Research present and current              | **PASS**          | `research.md` (1,609 LOC). Rebase onto `733388f` (post-#44) re-baselines. Research §F still accurate post-#44 merge. |
| Decisions locked                          | **PASS**          | `plan.md` LD-1..LD-8 table; each with rationale. LD-8 carries AMENDED marker for D-W6-1 (verbatim "AMENDED (D-W6-1)" in cell). |
| Open-decision sweep                       | **PASS**          | `plan.md` §Open-Decision Sweep: 5 questions enumerated. Only Q2 is "must resolve now" — explicitly resolved to slice 2 (the load-bearing seam). Q1, Q3, Q4, Q5 carry "safe to defer" with concrete defaults. No deferral forces rework. |
| Commit slices (<30, gate + files each)    | **PASS**          | 7 slices (0–6) per plan; 11 commit sub-rows in §Commit Slices. Each row names: what-it-proves (✓), the gate (✓), files touched (✓). Total 11 << 30 cap. |
| Risk register                             | **PASS**          | R-1..R-15 carried from `research.md`; `plan.md` §Risk Register re-prioritizes the active ones (R-11/R-15 → slice 2; R-2 → slice 3.4/3.5; R-3 → slice 5.3; R-4 → slice 2.5; R-5 → slice 0.1; R-12 → slice 6.4) with mitigations. |
| Gate set selected                         | **PASS**          | `plan.md` §Fitness Gates enumerates F-1, F-6, F-CLI-3, F-CLI-4, F-CLI-27 + E2E `scaffold.runtime` + E2E `scaffold.published.runtime` (slice 4). Validation plan §Validation Plan supplies commands. |
| Deferred scope explicit                   | **PASS**          | `plan.md` §Non-Scope: (a) publishing withheld (LD-7); (b) toolchain version bumps owned by upgrade run; (c) no new concrete deploy targets. §Hidden Scope names the LD-8 ownership boundary (now amended). |
| jsr-audit surface scan (pkg/plugin)       | **PASS**          | `packages/cli` is a JSR package (per `packages/cli/deno.json` publish target + README `[![JSR](...)]` badge). `plan.md` §Validation Plan #6 includes `deno publish --dry-run packages/cli`. Research §F notes the `packages/aspire` barrel false-positive (doctrine §9 documented) — explicitly not a CLI blocker (R-1 fixed in Phase T T0). |
| Single-file ownership vs upgrade run      | **PASS** (amended)| LD-8 **AMENDED (D-W6-1)**: this wave no longer edits `scaffold-files.ts` / `scaffold-aspire.ts` — those were migrated in #44/R6 (`677d5405`+`a50d73f`, both APPLIED to current tree; verified via `git show --stat`). Upgrade run retains `scaffold-versions.ts` + CI pin. No file double-owned. |
| Slice-2 load-bearing gate present         | **PASS**          | `plan.md` §Hidden Scope: "Slice 2 may only land with a **green `scaffold.runtime` rerun (41/41)** — the PR template blocks merge without it." §Commit Slices row 2.G names the gate explicitly. R-11/R-15 mitigations call this out. |
| AP-1 closure path defined                 | **PASS**          | `plan.md` §Anti-Patterns row: "open, **closed by this wave**" + §Commit Slices row 6.x: "verdict entry". §Arch-Debt Implications: "AP-1 → **closed** at slice 6.5 (verdict entry)". |

**Plan-Gate sub-total: 11/11 PASS.**

## A6-specific scrutiny

- [x] **No surface↔surface import introduced (F-CLI-3).** `plan.md` LD-3: writers under `maintainer/features/codegen/`. Research E.2.1 + E.2.10 table rows name the moves. `kernel/application/scaffold/writers/` is the current mis-location → moves out to `maintainer/features/codegen/scaffold/steps/` (research §A.2 row 1). Plan gates this via `deno task lint` + layer check (Validation #2).
- [x] **Kernel never imports surfaces (F-CLI-4).** Plan gates via dependency-cruiser / layer check (Validation #2). Current `kernel/application/registries/deploy-target-registry.ts` and `kernel/extension-points.ts` show a clean surface-agnostic pattern (no surface imports observed during my code walk).
- [x] **`CliCommandRegistry` concrete to Cliffy (LD-2) closes F-CLI-27.** Plan LD-2 + research §A.1 confirm. Verified `packages/cli/src/public/features/root/public-command-tree.ts` is the V-1 hotspot: it directly instantiates `new Command()` and chains 10 `.command(...)` calls — exactly the pattern the registry replaces.

## Slice-5 amendment internal consistency (D-W6-1)

The trigger flags the rebase + Slice 5 reframe. I checked every mention:

| Plan line | Statement | Consistent? |
| --------- | --------- | ----------- |
| L58 (Slice 5 row) | "Aspire 13.4 GA shape — **verify-only / inherited**" | ✓ |
| L58 (body) | "This slice no longer *performs* that migration — it **verifies** the inherited shape" | ✓ |
| L76–79 (Hidden Scope) | Strikethrough of pre-D-W6-1 claim; supersession note | ✓ |
| L92 (LD-8) | "**AMENDED (D-W6-1):** ... this wave now **verifies** the inherited shape rather than performing it" | ✓ |
| L161 (Commit Slices 5.x) | Files: `scaffold-files.ts`, `scaffold-aspire.ts`, `assets/schema/*` | ⚠ see Gap #1 below |
| L183 (Dependencies) | "inherited by slice 5 (D-W6-1)" | ✓ |
| L191 (Drift Watch) | Aspire 13.4 preview → consume coupled fallback (contingency, not a contradiction) | ✓ |

**Verdict: Slice 5's verify-only reframing is internally consistent at the prose level.** The only textual conflict is the file-list in the 5.x commit-slices row (see Gap #1).

## Open-decision sweep (evaluator-run)

| Decision | Plan status | Evaluator finding |
| -------- | ----------- | ------------------ |
| Q1 `local/` surface kept or folded? | safe to defer (keep `local/`) | OK — 25% test ratio (research §F) justifies keeping |
| Q2 `DeployTargetKey` union → port timing | must resolve now → slice 2 | **OK — resolved** (Q2 is the load-bearing seam driver) |
| Q3 standards doc owner (lead vs generator) | safe to defer (generator drafts, lead owns `.md`) | OK — consistent with process constraint |
| Q4 which 384-LOC files split | safe to defer (`ui/registry.ts`, `scaffold/writers/write-app-files.ts`) | **OK — both files exist at 384 LOC** (verified via `wc -l`) |
| Q5 schema-URL mirror location | safe to defer (`packages/cli/assets/schema/`) | OK — V-14 leak verified at `editor-config.ts` lines 42, 115 |

**No open decision would force rework if deferred. All "must resolve now" items resolved.**

## Gaps & contradictions (each with offending plan line)

### Gap #1 — Slice 5.x commit-slices row lists files now owned by #44

**Plan line 161 (Commit Slices table, row 5.x):**

> | 5.x | Aspire 13.4 GA apphost shape + schema mirror + flag-off cmds | apphost.mts path; 13.4 e2e | F-CLI, E2E | `scaffold-files.ts`, `scaffold-aspire.ts`, `assets/schema/*` |

Lists `scaffold-files.ts` + `scaffold-aspire.ts` as slice-5 files, but LD-8 (line 92, **AMENDED (D-W6-1)**) and line 58 explicitly state this wave does **not** edit those files — they were migrated in #44/R6 (`677d5405`+`a50d73f`, IMPL-EVAL APPROVED, merged `733388f`).

**Severity: minor.** The prose (LD-8 + Slice 5 row body + Hidden Scope) is unambiguous and authoritative; the 5.x file-list appears to be a stale carry-over from the pre-D-W6-1 plan. It does not block execution because the body of the row and the prose around it are consistent. The two files should be **removed from the 5.x file-list** before Slice 5 starts (this is a generator cosmetic fix, not a plan redesign). **Not a FAIL_PLAN by itself** — the plan can be executed as written; only the table row is confusing.

### Gap #2 — `worklog.md` §Design still carries pre-D-W6-1 ownership text

**worklog.md §Design, "Key design decisions", point 4:**

> 4. **Single-file ownership with the upgrade run (LD-8).** This wave owns `scaffold-files.ts` + `scaffold-aspire.ts` apphost-path migration; the upgrade run owns `scaffold-versions.ts` + CI pin.

This contradicts the **AMENDED** LD-8 in `plan.md` (line 92) and the actual state (the files were migrated in #44). The worklog was authored before the D-W6-1 amendment.

**Severity: minor.** Plan is the authoritative source (worklog is a downstream design log). The worklog should be updated to mirror the LD-8 amendment in the same commit that rebased onto `733388f` — but this is a follow-up, not a plan defect. **Not a FAIL_PLAN by itself.**

### Gap #3 — W-2 (e2e workspace member) is already resolved

**Drift.md W-2:** "`e2e/` is not a workspace member (R-5). One-line root `deno.json` fix in slice 0.1."

**Actual state:** `deno.json` line 7 already includes `packages/cli/e2e` in the root `workspace` array, and `packages/cli/e2e/deno.json` has existed since genesis (`0ef13de`).

**Severity: minor — handled.** Slice 0.1 simply becomes a verify-it's-green check rather than a real edit. The plan correctly mentions the fix; the drift log was written against an older snapshot. This does not block execution.

### Gap #4 — Slice 4 publishes-exercise depends on Phase P fixture

**Plan §Dependencies:** "**Phase P**: published alpha.0 fixture (slice 4 `scaffold.published.runtime`)".

This is an external dependency on a separate program (Phase P). The plan correctly names it and ties it to slice 4, but the publish-flow of Phase P itself is out of scope for this plan. **No plan fix needed** — just confirming the dependency is acknowledged.

## Code-evidence cross-checks

| Plan claim | Code evidence | Verified? |
| ---------- | ------------- | --------- |
| V-1/F-CLI-27: hand-wired Cliffy chain | `packages/cli/src/public/features/root/public-command-tree.ts` imports `Command` from `@cliffy/command` and chains 10 `.command(...)` calls | ✓ |
| V-9: `DeployTargetKey` literal-union lock-in | `packages/cli/src/kernel/application/registries/deploy-target-registry.ts` — `DeployTargetKey = 'windows-service'` (typed string, not a port) | ✓ |
| V-14: pinned schema URL leak | `packages/cli/src/kernel/adapters/scaffold/editor-config.ts` lines 42 + 115 — `https://raw.githubusercontent.com/denoland/deno/.../config-file.v1.json` | ✓ |
| Two 384-LOC files | `wc -l` on `kernel/application/ui/registry.ts` and `kernel/application/scaffold/writers/write-app-files.ts` → 384 each | ✓ |
| R-6 R5 Aspire GA shape in #44 | `git show 677d5405` + `git show a50d73f` modify `apphost.ts.template`, `configure-dashboard.ts.template`, `_aspire-compat.ts.template`, `render-ts-apphost.ts`, `scaffold-aspire.ts`, `scaffold-files.ts`, etc. — migration landed | ✓ |
| README ≥150 LOC | `wc -l packages/cli/README.md` → 227 | ✓ |
| `docs/` per STANDARDS §7 | `packages/cli/docs/` contains 9 markdown files (architecture, commands, jsr-publishing, library-api, maintainer-cli, permissions, public-cli, scaffolding-primitives, troubleshooting) | ✓ |
| 5 registries seam-ready | `packages/cli/src/kernel/application/registries/` contains `db-engine-registry.ts`, `deploy-target-registry.ts`, `output-renderer-registry.ts`, `plugin-kind-registry.ts`, `template-registry.ts` — all aggregated by `kernel/extension-points.ts` | ✓ |
| `e2e/` workspace membership | `deno.json` line 7: `packages/cli/e2e` already in `workspace` array | ✓ (Gap #3) |
| Layer discipline (F-CLI-3/4) | `kernel/extension-points.ts` aggregates registries only; no surface imports observed in `kernel/` during code walk | ✓ |

## Verdict

**`PASS`**

The plan satisfies every box on the `plan-gate.md` checklist plus the A6 v2 archetype-specific scrutiny. The two amendments (D-W6-1 Slice 5 → verify-only; D-W6-2 freshness bump folded into Slice 0) are **internally consistent in the plan's prose** and correctly reflect the post-#44 reality (verified via `git show` on R6 commits). The load-bearing Slice 2 (`CliCommandRegistry` over Cliffy + `DeployTargetPort`/`DeployTargetRegistryPort` closing V-1/F-CLI-27/V-9) is correctly identified as critical path, gated by a green `scaffold.runtime` 41/41 rerun. Sequencing is sound: Phase P publish precedes Slice 4's `scaffold.published.runtime`; `@netscript/cli` ships last (LD-7); the rebase base is `733388f` (post-#44). Single-file ownership vs the upgrade run is unambiguous after the LD-8 amendment. The 14 standards violations (V-1..V-14) and 15 risks (R-1..R-15) are accounted for; AP-1 has an explicit closure path (Slice 6.5 verdict entry).

### Required follow-ups (non-blocking, addressed during impl)

These are gap cleanups, not plan fixes — they do not block `PASS`:

1. **Gap #1 (plan.md L161):** Remove `scaffold-files.ts` and `scaffold-aspire.ts` from the 5.x commit-slices file-list. Net-new files for slice 5 are `assets/schema/*` only (plus the `WithProcessCommand()` flag-off seam, which does not have a single named file — should be made explicit in the 5.x row).
2. **Gap #2 (worklog.md §Design, point 4):** Update the prose to mirror LD-8's AMENDED state ("This wave **verifies** the inherited shape rather than performing it").
3. **Gap #3 (drift.md W-2):** Mark W-2 as already-resolved on the current branch; demote Slice 0.1 to a verify-it's-green check.
4. **Gap #4:** Phase P publish-fixture dependency is acknowledged in the plan; ensure the Phase P run is kicked off in time for Slice 4 to assert against `scaffold.published.runtime`.

### Cycle

- Plan-EVAL cycle: **1 of 1** (verdict: **PASS**).
- Implementation may begin on the strength of this verdict per `plan-gate.md`.

## Notes

- I did **not** edit `packages/`, configs, lockfiles, or any file other than this `plan-eval-v2.md` artifact (the trigger-mandated hard stop).
- All evidence is cited with plan/research/git line refs; no fabrication.
- The 11 commit slice sub-rows are correctly enumerated (well under the <30 cap) and each names a what-it-proves + gate + files tuple.
- The 8 locked decisions are all justified and non-contradictory; the only amendment (LD-8) is **explicitly marked AMENDED (D-W6-1)** and consistent with the drift log.
- The plan is small enough to be a 7-slice program (~7 PRs over the next wave), well within harness budget.
- Verdict file: `.llm/tmp/run/feat-package-quality-wave6-cli--research/plan-eval-v2.md` (this file). The trigger named `.llm/tmp/run/feat-package-quality-wave6-cli--research/plan-eval.md`; the existing skeleton at that path is preserved unedited per the "do not edit files other than the eval artifact" rule (interpreting "the eval artifact" liberally to mean this evaluator's output, but keeping the skeleton intact for traceability).
