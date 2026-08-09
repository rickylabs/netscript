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
