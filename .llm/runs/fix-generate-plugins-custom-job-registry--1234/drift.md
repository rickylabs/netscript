# Drift Log: custom workers job registry generation (#1234)

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-04 — Composed evaluator waiver

- **What:** Standalone local PLAN-EVAL and IMPL-EVAL sessions are replaced by composed milestone
  evaluation.
- **Source:** User directive; `.llm/harness/workflow/milestone-run.md` evaluator protocol and ruling
  D6.
- **Expected:** Ordinary harness runs use an independent formal evaluator session.
- **Actual:** This milestone PR records `composed per milestone-run.md (orchestrator waiver)` and
  locks the plan before implementation in the same run.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `plan-eval.md`, `plan.md`, and PR phase comments.

## 2026-08-04 — Foreign lockfile modification

- **What:** The worktree began with a one-line `deno.lock` addition unrelated to this run.
- **Source:** Raw `git status` and `git diff` before research.
- **Expected:** Clean implementation worktree.
- **Actual:** `deno.lock` is modified by an unknown owner and must remain untouched.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Baseline diff adds `jsr:@netscript/queue@0.0.4`; every commit and final PR diff must
  exclude `deno.lock`.

## 2026-08-04 — Scaffolded named job exports reached by public regeneration

- **What:** Once Flow B regenerated through the fixed public path, the workers service imported the
  new registry and exposed a second incompatibility: the manifest generator emitted default imports,
  while workers `add job` scaffolds named handler exports.
- **Source:** Full `scaffold.runtime` rerun and direct reproduction of the generated workers service
  command.
- **Expected:** Structural discovery alone would make the existing generated registry runnable.
- **Actual:** Discovery succeeded and Flow B's fixture gate passed, but `workers-api` stopped because
  `flow-b-callback.ts` did not provide a default export.
- **Severity:** significant
- **Action:** fix
- **Evidence:** Strengthen the custom-only integration test to the real scaffold export shape and
  reuse the established workers compiler resolution contract (`default`, `handler`, then first
  function export) in the manifest generator. This remains structural module discovery; it does not
  add source parsing or a new profile/metadata API.
