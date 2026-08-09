# Drift Log: W3-A #1326 durable producer reconnect

Drift is append-only.

## 2026-08-09 — Live dispatch supersedes preparation identity

- **What:** Historical `supervisor.md` named `fix/streams-producer-reconnect-1326`, a separate
  worktree, a future canary.15 base, and Qwen evaluation.
- **Source:** Slice preparation artifact versus the inlined live dispatch.
- **Expected:** Dispatch identity is authoritative at activation.
- **Actual:** Branch is `fix/streams-durable-producer-reconnect`, worktree is this checkout, exact
  base is `aa8e151e6`, and both formal evaluators are separate Claude/Fable 5 medium sessions.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `supervisor.md`; raw `git rev-parse` results recorded in research.

## 2026-08-09 — Upstream append declaration is not its runtime behavior

- **What:** `AppendOptions` declares producer id/epoch/sequence fields, but the 0.2.6
  `DurableStream.append` runtime never emits their headers. `IdempotentProducer.onError` also lacks
  the failed payload/sequence and fires after removing the batch.
- **Source:** `deno doc` declarations and cached upstream `dist/index.js` implementation.
- **Expected:** A declared idempotent append seam might have supported package-level replay.
- **Actual:** Using it would produce a false fix or lose the failed batch.
- **Severity:** significant
- **Action:** fix
- **Evidence:** `research.md` findings 4–7; plan D7 narrows a transport adapter over
  upstream-exported constants and verified server responses.

## 2026-08-09 — JSR helper banner false positive

- **What:** `audit-jsr-package.ts` reports one slow-type warning by counting the dry-run banner.
- **Source:** Helper output versus raw `deno publish --dry-run --allow-dirty --no-check`.
- **Expected:** Helper and raw dry-run agree.
- **Actual:** Raw dry-run has no slow-type diagnostic and exits 0; helper reports one warning.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `research.md` baseline table; `netscript-tools` makes raw output authoritative.

## 2026-08-09 — Root fitness gates omit plugin-streams-core

- **What:** `quality:scan` defaults to CLI/plugin roots, and the doctrine root list omits
  `packages/plugin-streams-core`; the aggregate `quality:gate` therefore supplies no package
  coverage for this slice. F-14 also has no implementing script.
- **Source:** PLAN-EVAL cycle 1; `.llm/tools/quality/scan-code-quality.ts`, root `deno.json`, and
  `.llm/tools/fitness/check-doctrine.ts`.
- **Expected:** Framework-law commands traverse every changed framework package.
- **Actual:** Bare aggregate exits would be vacuous evidence for this package.
- **Severity:** significant repo-tooling gap; local proof mechanism is repairable.
- **Action:** use package-scoped commands plus manual F-14 evidence marked `PENDING_SCRIPT`;
  preserve repo-wide repair as separate issue #1403.
- **Evidence:** revised `plan.md` validation rows 10–12. No tooling source is changed in this slice.

## 2026-08-09 — Owner-ratified third PLAN-EVAL cycle

- **What:** Cycle 2 found that intentionally type-broken S1 fixtures were planned under the package
  tree, making scoped and repo CI checks unsatisfiable until S2.
- **Source:** PLAN-EVAL cycle 2 and owner escalation in the supervisor thread.
- **Expected:** Two `FAIL_PLAN` cycles normally require escalation before further plan work.
- **Actual:** The threshold was reached, and the owner explicitly ratified cycle 3 on the
  evaluator-recommended fixture relocation.
- **Severity:** process exception, bounded.
- **Action:** move only the planned fixture location to the slice run dir, update direct commands,
  and preserve all confirmed contract, ordering, and gate decisions.
- **Evidence:** revised `plan.md` S1 files/evidence decision and validation rows 1b/1c; no product
  or tooling source change.
