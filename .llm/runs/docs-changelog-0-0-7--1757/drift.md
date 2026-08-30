# Drift Log: provisional CLI changelog for 0.0.7

## 2026-08-30 — Agent-docs builder path includes `docs/`

- **What:** The brief names `.llm/tools/build-agent-docs-bundle.ts`, which does not exist on the pinned baseline.
- **Source:** `rg --files .llm/tools | rg 'build-agent-docs-bundle'`.
- **Expected:** `.llm/tools/build-agent-docs-bundle.ts`.
- **Actual:** `.llm/tools/docs/build-agent-docs-bundle.ts`, wired by `deno.json:113`.
- **Severity:** minor
- **Action:** accept; inspect the current file and cite its current line numbers.
- **Evidence:** `.llm/tools/docs/build-agent-docs-bundle.ts:254-310`; `deno.json:113`.

## 2026-08-30 — Release-artifact boundary confirmed

- **What:** The changelog is not a substitute for the manual GitHub release introduction.
- **Source:** `.llm/tools/release/github-release.ts:13-23` and `netscript-release`.
- **Expected:** No introduction, notes file, version bump, release cut, or publish action in this slice.
- **Actual:** Plan and worklog preserve that boundary.
- **Severity:** minor
- **Action:** accept and enforce.
- **Evidence:** `plan.md` Non-Scope and Locked Decision D4.

## 2026-08-30 — Shipped agent-tool bundle widened consumer-visible triage

- **What:** PLAN-EVAL cycle 1 proved four commits initially excluded as harness/tooling work alter tools embedded in the published CLI and installed by `agent init`.
- **Source:** `plan-eval.md` finding F1; `init-agent.ts`; `consumer-tools.json`; five focused generated-barrel diffs.
- **Expected:** 13 included commits and 20 excluded.
- **Actual:** 17 included and 16 excluded; the tool-bundle behavior is grouped into changelog bullet B1.
- **Severity:** significant
- **Action:** fix the plan before implementation and run PLAN-EVAL cycle 2.
- **Evidence:** `plan.md ## Locked Changelog Map`; `worklog.md ## Commit Triage`.

## 2026-08-30 — PLAN-EVAL two-failure limit reached

- **What:** Cycle 2 found two additional wording-completeness defects after cycle 1's structural repairs.
- **Source:** `plan-eval.md` findings F1 and F2.
- **Expected:** PLAN-EVAL `PASS` within two cycles before implementation.
- **Actual:** Both cycles returned `FAIL_PLAN`; all cycle-2 clauses are repaired, but no third cycle is authorized.
- **Severity:** significant
- **Action:** escalate to the owner; do not edit the changelog until cycle 3 is authorized and passes or the Plan-Gate is waived in writing.
- **Evidence:** `plan-eval-cycle-1.md`; `plan-eval.md`; repaired B1/B11 in `plan.md`.

## 2026-08-30 — Post-escalation PLAN-EVAL authorized implementation

- **What:** The coordinator authorized a fresh independent evaluation after the two-failure limit.
- **Source:** `plan-eval-cycle-2.md` and the coordinator's implementation dispatch.
- **Expected:** Implementation remains blocked until an authorized evaluation returns `PASS_PLAN`.
- **Actual:** The post-escalation evaluation returned `PASS_PLAN` after source-verifying the 33-row triage and eleven-row locked map.
- **Severity:** significant
- **Action:** accept the authorization; reconcile the moved baseline mechanically before implementation.
- **Evidence:** `plan-eval-cycle-2.md ## Verdict` and `## Moving baseline`.

## 2026-08-30 — Main advanced beyond the evaluated changelog pin

- **What:** `origin/main` advanced from the evaluated `13878a80a50c55b9662099fed64555f2310ae4a3` baseline through `625447f1b521e7fb0208fcfcc4ad3ea86cf52e21` to `f8b4f804cc5fe77054d4f220974eae66becf090c` before implementation.
- **Source:** `git ls-remote origin refs/heads/main`, followed by a focused diff inspection of both commits.
- **Expected:** Any post-plan commit is triaged before implementation; a consumer-visible change would require stopping rather than silently changing the locked map.
- **Actual:** `625447f1` contains only the architecture-debt ledger and `.llm/runs/**` verification artifacts. `f8b4f804` changes explanatory docs and their generated corpus/publish assets, documenting already-shipped behavior without changing consumer behavior.
- **Severity:** significant
- **Action:** keep the evaluated changelog content explicitly pinned to `13878a80`, add both commits as Exclude reconciliation rows, preserve the locked map, and state the provisional top-up requirement in the PR.
- **Evidence:** `worklog.md ## Commit Triage`; `git diff --name-status 13878a80..f8b4f804`; `git show f8b4f804 -- docs/site/ai/agent-tooling.md docs/site/reference/ai/skills.md docs/site/reference/cli/commands.md`.
