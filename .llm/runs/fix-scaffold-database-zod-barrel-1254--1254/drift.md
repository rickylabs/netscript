# Drift Log — #1254

## 2026-08-04 — Milestone composed PLAN-EVAL

- **What:** Local formal PLAN-EVAL omitted.
- **Source:** owner brief and milestone ruling D6.
- **Expected:** generic run-loop separate PLAN-EVAL.
- **Actual:** locked plan; evaluation composes draft→ready augment, OpenHands, orchestrator gate.
- **Severity:** minor / authorized
- **Action:** accept
- **Evidence:** `supervisor.md`, `plan-eval.md`.

## 2026-08-04 — Inherited lock change

- **What:** One unrelated `deno.lock` addition carried from the supplied worktree.
- **Source:** raw branch-switch status/diff.
- **Expected:** clean fresh branch.
- **Actual:** `jsr:@netscript/queue@0.0.4` line remains modified.
- **Severity:** minor
- **Action:** preserve and exclude
- **Evidence:** `git diff -- deno.lock`.

## 2026-08-04 — Complete barrel lacks contract aliases

- **What:** Issue/brief path-only edit would remove `CreateInput` and `UpdateInput` names consumed
  by the existing contract template.
- **Source:** `contract.ts.template`, `writeCrudZodBarrel`, issue barrel example.
- **Expected:** Repointing alone keeps the template unmodified.
- **Actual:** Complete models barrel needs deterministic aliases for every model.
- **Severity:** minor hidden scope; explicitly requested compatibility check
- **Action:** fix within slice
- **Evidence:** `research.md`, plan D2–D5.
