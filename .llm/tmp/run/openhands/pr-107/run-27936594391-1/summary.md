# OpenHands Run Summary — 27936594391-1

**Run-id:** 27936594391-1
**Trigger:** `@openhands-agent model=openrouter/minimax/minimax-m3 provider=openrouter output=pr-comment iterations=120 use harness — run PLAN-EVAL (separate-session plan gate) for the docs-v4 IA-deepening run on this PR branch.`
**PR:** #107 (planning-only PR for `docs-v4-ia-deepening`)
**Branch:** `docs/v4-ia-deepening` @ `2db524bd`
**Output mode:** pr-comment
**Selected model:** `openrouter/minimax/minimax-m3` (provider OPENROUTER)
**Selected role:** PLAN-EVAL (separate session; not the Claude author / not the WSL Codex implementer)
**Verdict:** `FAIL_PLAN` — see plan-eval.md for required fixes.

## Summary

Performed a PLAN-EVAL pass on the `docs-v4-ia-deepening` planning PR. Read the run artifacts
(`plan.md`, `research.md`, `ia-tree.md`, `seam-coverage.md`, `drift.md`, `arch-debt.md` entry
935, `gates/plan-gate.md`, `evaluator/plan-protocol.md`) and spot-checked headline claims
against the live source tree on `origin/docs/v4-ia-deepening` @ `2db524bd`.

The plan is **largely complete and internally consistent**: locked decisions carry rationale,
the 7 workstreams are commit-sized and gated, the drift-D1 process-failure is correctly framed
(caveat-harvest + link-integrity + seam-coverage discipline), and the seam-coverage matrix
correctly identifies ONE real build-seam gap (auth-better-auth plugin passthrough).

The three open IA questions explicitly delegated to PLAN-EVAL were ruled PASS:
1. **Background-Processing vs Durable-Workflows:** SPLIT (pillars 3 and 4).
2. **Reference layout:** pillar-local Reference leaves + thin global index.
3. **Fresh Examples/sandbox:** prose now, StackBlitz backlog.

One evaluator-run open-decision sweep finding was missed by the plan: a symbol-name drift
between the IA-tree / seam-coverage text (`createDurableSagaRuntime`) and the live export
(`createSagaRuntime` at `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts:73`).
This is the exact class of untracked caveat `drift.md` D1 was opened to prevent — fixed as
Required Fix #1.

## Changes

### Deliverable artifacts written

- `.llm/tmp/run/docs-v4-ia-deepening/plan-eval.md` — full PLAN-EVAL verdict with 7 spot-checks,
  checklist table, rulings on the 3 IA questions, and 3 required fixes.
- `/home/runner/work/_temp/openhands/27936594391-1/summary.md` — this file.

### Verdict comment (PR #107)

Per the trigger contract (`output=pr-comment`), emit a PR-comment body for the workflow to
post. The PR-comment body follows the existing `docs-v3-ia-plan--supervisor` precedent
format — a short verdict statement + link to `plan-eval.md` + the 3 required fixes + the
3 IA-question rulings. See "PR-comment body" section below.

### Source-tree / framework changes

- **None.** This is a planning-only PR (per `plan.md` §"Build / eval / merge flow" step 1:
  "No authoring/build before PASS"). No files under `packages/`, `plugins/`, `docs/site`,
  or framework code were modified.
- No commit was created in this run.

## Validation

- **No source code or docs modified** → no `deno check` / `deno task check` / `deno task e2e:cli`
  needed. PLAN-EVAL is a planning verdict; validation lives in IMPL-EVAL after the build branch
  ships.
- Spot-checks performed (read-only):
  1. `packages/fresh/deno.json` exports map → 11 subpaths (`./server`, `./builders`, `./route`,
     `./defer`, `./form`, `./error`, `./streams`, `./query`, `./interactive`, `./vite`,
     `./testing`) — every IA-tree Web-Layer page maps to a real subpath.
  2. `packages/fresh/src/application/builders/mod.ts:26` — `definePage` exists.
  3. `packages/fresh/src/application/route/mod.ts:99` — `defineRouteContract` exists.
  4. `packages/plugin-sagas-core/src/public/mod.ts` and `src/runtime/create-saga-runtime.ts:73` —
     `createSagaRuntime` is the live export; `createDurableSagaRuntime` is only in historical
     artifacts under `.llm/tmp/run/feat-prime-time-sagas-telemetry-spans--impl/` etc.
  5. `packages/auth-better-auth/src/better-auth.ts:23` — `NetscriptBetterAuthOptions` fields:
     `prisma`, `provider`, `debugLogs?`, `usePlural?`, `transaction?`, `appName?`, `baseURL?`,
     `basePath?`, `secret?` — **no `plugins` field.** Matches `seam-coverage.md` headline.
  6. `packages/auth-better-auth/src/better-auth.ts:77` — `BetterAuthInstance` is a structural
     `{ handler, api.getSession }` interface. `createBetterAuthBackend({ auth })` accepts it
     structurally (matches the escape-hatch code in `seam-coverage.md:13`–`22`).
  7. `packages/plugin-streams-core/src/public/mod.ts` — public exports are producer-only
     (`createDurableStream`, `DurableStreamProducer`, `defineStreamSchema`,
     `inspectStreamTopic`, URL resolvers). No consumer / replay / consumer-group export.
     The "absent — already documented" verdict in `seam-coverage.md:63` is correct.

## Verdict (from `plan-eval.md`)

```
FAIL_PLAN
```

### Required fixes (file-referenced)

1. **Symbol-name drift.** `seam-coverage.md:61` and `ia-tree.md` pillar-4 prose reference
   `createDurableSagaRuntime`. Real export is `createSagaRuntime`
   (`packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts:73`,
   re-exported via `packages/plugin-sagas-core/src/public/mod.ts` and
   `packages/plugin-sagas-core/src/runtime/mod.ts:75`). Fix in W2/W6 — and record `D2` in
   `drift.md` so the caveat-harvest gate has a reference.

2. **Risk-register row for docs-vs-R0 ordering.** `plan.md:64`–`65` says "R0 seam slice
   rides its own framework PR — ordering: seam green first, or docs state 'shipping in
   <ref>'". Convert to a named risk-register row (in `drift.md` or new
   `risk-register.md`) so IMPL-EVAL can verify the auth-pillar pages carry explicit
   "shipping in <ref>" caveats if R0 is not green at docs-merge time.

3. **(Minor, optional.) W4 scope — auth-pillar Plugins leaf must carry R1 schema-gen
   caveat.** `plan.md:46`–`48` says the workspace tutorial documents the R1 caveat "if R1
   not built this run" — extend the same conditional to the auth-pillar Plugins leaf itself
   (page-level, not buried in the tutorial). One-line edit to W4.

### Rulings on the 3 PLAN-EVAL-delegated IA questions

| # | Question | Ruling |
|---|----------|--------|
| 1 | Background-Processing vs Durable-Workflows split? | **SPLIT** (pillars 3 and 4; `DurableStream` is a durability primitive, not a worker). |
| 2 | Reference: pillar-local vs global catalog? | **PILLAR-LOCAL + THIN GLOBAL INDEX** (matches `ia-tree.md:76`). |
| 3 | Fresh Examples/sandbox: prose now, live StackBlitz? | **PROSE NOW, STACKBLITZ BACKLOG** (no `@netscript/fresh` subpath backing for prose-only is honest; defer avoids new external CI integration). |

## PR-comment body

The workflow will post this on PR #107 as the OpenHands status comment:

````markdown
## OpenHands PLAN-EVAL — docs-v4-ia-deepening

**Verdict:** `FAIL_PLAN` (first cycle; per `evaluator/plan-protocol.md` §"Loop limit", one
`FAIL_PLAN` cycle is allowed; a second unfixed cycle escalates to the user).

**Evaluator:** OpenHands minimax-M3, separate session (not the Claude author / not the
WSL Codex implementer). Run-id: 27936594391-1. Branch: `docs/v4-ia-deepening` @ `2db524bd`.

**Full verdict:** `.llm/tmp/run/docs-v4-ia-deepening/plan-eval.md`

### Required fixes

1. **`createSagaRuntime` symbol-name drift** (`seam-coverage.md:61`, `ia-tree.md` pillar-4).
   The real export on this branch is `createSagaRuntime`
   (`packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts:73`, re-exported via
   `packages/plugin-sagas-core/src/public/mod.ts`). Fix in W2 (IA restructure) + W6 (pillar
   rewrite), and carry a `D2` entry in `drift.md` so the caveat-harvest gate has a reference.
   This is the exact class of untracked caveat `drift.md` D1 was opened to prevent.
2. **Risk-register row for docs-vs-R0 ordering.** `plan.md:64`–`65` names the policy
   ("seam green first, or docs state 'shipping in <ref>'") but not as a tracked risk. Add a
   named row (in `drift.md` or new `risk-register.md`) so IMPL-EVAL can verify the auth-pillar
   pages carry the caveat if R0 is not green at docs-merge time.
3. **(Minor.) W4 scope — auth-pillar Plugins leaf must carry R1 schema-gen caveat.** Extend
   the W4 conditional from the workspace tutorial to the auth-pillar Plugins leaf itself
   (one-line edit).

### Rulings on the 3 delegated IA questions

| # | Question | Ruling |
|---|----------|--------|
| 1 | Background-Processing vs Durable-Workflows split? | **SPLIT** |
| 2 | Reference: pillar-local vs global catalog? | **PILLAR-LOCAL + THIN GLOBAL INDEX** |
| 3 | Fresh Examples/sandbox: prose now, StackBlitz? | **PROSE NOW, STACKBLITZ BACKLOG** |

### Spot-checks (against the live tree)

- `packages/fresh/deno.json` exports → all 11 subpaths exist; every IA-tree Web-Layer
  page maps to a real export. ✓
- `packages/fresh/src/application/builders/mod.ts:26` — `definePage` exists. ✓
- `packages/fresh/src/application/route/mod.ts:99` — `defineRouteContract` exists. ✓
- `packages/auth-better-auth/src/better-auth.ts:23` — `NetscriptBetterAuthOptions` has no
  `plugins` field (matches `seam-coverage.md` headline). ✓
- `packages/auth-better-auth/src/better-auth.ts:77` — `BetterAuthInstance` is structural;
  `createBetterAuthBackend({ auth })` accepts it (escape-hatch code is type-correct). ✓
- `packages/plugin-streams-core/src/public/mod.ts` — producer-only exports (no consumer /
  replay / consumer-group); "absent — already documented" verdict in `seam-coverage.md:63`
  is correct. ✓

### What was NOT changed

- No source code, no `packages/**`, no `plugins/**`, no `docs/site`, no framework churn.
- No `deno.lock` mutation; no `git` commit; no push. This was a planning-only evaluation
  per the trigger contract.
````

## Responses to review comments or issue comments

N/A — this is a planning-only PR with no review comments yet. The PR-comment body above is
the OpenHands status comment that the workflow will post.

## Remaining risks

- **`createSagaRuntime` drift may exist in other artifacts.** I only spot-checked the docs
  artifacts in this run dir. If other v4-era docs (under `docs/site/_plan/` or other
  `ground/` scouts) reference `createDurableSagaRuntime`, the fix #1 should sweep those too.
  The drift D2 entry should carry a list of all such locations.
- **R0 seam ordering hazard is the largest residual risk** (see Required Fix #2). The plan
  says "seam green first, or docs state 'shipping in <ref>'" but does not commit to which
  branch holds if neither holds at merge time. IMPL-EVAL will need to check this explicitly.
- **Caveat-harvest + link-integrity + seam-coverage gates** (`plan.md:28`–`34`) are
  correctly aimed at the systemic process failure (`drift.md` D1) but their exact CI wiring
  is described as "wired into CI/review" without a named task or script. This is the kind of
  thing that drifts during implementation — IMPL-EVAL should verify the gates actually fail
  the build before they pass on paper. Marked PASS in this PLAN-EVAL pass per Phase-A
  reporting (`gates/plan-gate.md:42`–`45`) — "absence of a script is not permission to omit
  the check".

## Files touched in this OpenHands run

- `.llm/tmp/run/docs-v4-ia-deepening/plan-eval.md` (created — verdict)
- `/home/runner/work/_temp/openhands/27936594391-1/summary.md` (created — this file)

No `deno.lock`, no source code, no commit. Lock hygiene preserved.