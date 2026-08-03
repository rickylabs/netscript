# Review — #1087 evaluator child-model cost guard (opposite-family slice review)

- Reviewer: Claude (Fable 5, `review_codex_complex` route per drift entry 2026-08-03), separate
  session from the Codex generator.
- Scope reviewed: uncommitted diff after `410b90e87` plus untracked
  `.llm/tools/agentic/claude/evaluator-model-guard.ts` and
  `.llm/tools/agentic/claude/evaluator-model-guard_test.ts`.

## Verdict: PASS

The slice enforces the open-evaluator allowlist at the child HTTP request surface (a loopback
proxy substituted via `ANTHROPIC_BASE_URL` in the spawned evaluator environment), fails closed,
audits credential-blind, and keeps ordinary presets and route invariants intact. All findings
below are low/informational; none blocks.

## Findings (by severity)

1. **Low — SIGTERM-only termination, no escalation.**
   `claude-print.ts:78` kills the child with `SIGTERM` only. A child that ignores SIGTERM can
   linger; the wrapper then blocks on `await process.status`. Mitigated: every subsequent
   model-bearing request is denied 403, so no further spend is possible, and the exit-code
   override to 78 still applies whenever the child does exit. Consider a SIGKILL escalation
   timer in a follow-up.
2. **Low — audit-write failure suppresses abort/exit-78.**
   In `evaluator-model-guard.ts:72-73`, `await ports.audit(attempt)` runs before
   `ports.abortEvaluation(attempt)`. If the JSONL append throws (e.g. unwritable
   `.llm/tmp/`), the handler rejects, `Deno.serve` returns 500, the violation flag is never
   set, and the process exit code falls back to the child's. The prohibited request is still
   never forwarded upstream (fail-closed on spend holds), but the audit event and the 78 exit
   are lost. Recording the violation before attempting the audit write would close this.
3. **Low — permission broadening applies to all Claude print lanes.**
   `claude-adapter.ts:71,73` adds `--allow-write` and `--allow-net` (both unscoped) to the
   wrapper spawn for every launch/resume, not only evaluator routes. Tighter:
   `--allow-write=.llm/tmp/agentic/evaluator-policy` and
   `--allow-net=127.0.0.1,openrouter.ai`, or conditional on the enforce flag.
4. **Info — `--session-id` now passed on every non-resume launch** (`claude-print.ts:39`),
   including ordinary presets. Behaviorally equivalent (a fresh session with an explicit UUID)
   and it is what makes the audit's `requestingSession` the actual child session identity, but
   it is an argv change outside the evaluator-only path; noted for boundary 4.
5. **Info — guard attach is keyed on exact preset match.** The enforce flag is computed from
   `matchOpenRouterPreset(route)?.purpose === 'evaluation'` (`claude-adapter.ts:150`), which
   requires exact profile+model+effort. A hand-rolled route that skips
   `formalEvaluatorRoute` (routing-policy.ts:489-508) would get no guard — but that path also
   is not a formal-evaluator dispatch, and the canonical dispatch cannot reach the adapter
   with a non-preset evaluation route. Acceptable; worth remembering when adding future
   evaluation presets.
6. **Info — audit path uses the raw session id** (`evaluator-model-guard.ts:94`). The id comes
   from the runtime session store (UUIDs captured from stream-json), so traversal is
   theoretical, but a sanitize/validate on the `--resume` value would be cheap.

## Six-boundary assessment

1. **Enforcement on every spawned formal-evaluator model request, via child environment, not
   prompt text — MET.** The guard is a loopback `Deno.serve` proxy; `claude-print.ts:88`
   substitutes `ANTHROPIC_BASE_URL: guard.baseUrl` in the spawned `claude` env (Deno.Command
   env merges over the inherited runtime policy value, so the override wins). Every
   model-bearing HTTP request the child makes transits the handler; nothing depends on prompt
   content. README (`.llm/tools/agentic/README.md:288-292`) records it as configuration.
2. **Only `OPEN_EVALUATOR_MODEL_IDS`, no duplicated authority — MET.** The allowlist is read
   solely from `config/models.ts:58-64` (`evaluator-model-guard.ts:8,62`); the route-level
   check in `routing-policy.ts:498` imports the same constant. No second model list exists;
   the volatile-value guard (Layers A+B) passes.
3. **Prohibited or missing model fails closed with non-zero exit and credential-blind audit —
   MET.** Non-allowlisted models and model-less/unparseable POST bodies both deny with 403
   before any upstream forward (`evaluator-model-guard.ts:63-75`), the child is SIGTERMed, and
   the wrapper exits `EVALUATOR_MODEL_GUARD_EXIT_CODE` (78) even if the child exits 0
   (`claude-print.ts:91`). The audit event carries only event name, model (`<missing>` when
   absent), requesting session, and timestamp — no headers/body; the focused test asserts the
   synthetic secret never appears in the audit JSON. Files land 0o600 under a 0o700
   `.llm/tmp/agentic/evaluator-policy/`. Caveat: finding 2's audit-failure corner.
4. **Ordinary presets retain existing behavior — MET (with finding 4 noted).** The enforce
   flag is emitted only for `purpose === 'evaluation'`; the new
   `formal evaluator routes alone receive the child-model request guard` test proves the GLM
   design route does not carry it, and no env override is applied when the guard is off
   (`claude-print.ts:70,88`). The `--session-id` argv addition is the only ordinary-lane
   delta and is behavior-preserving.
5. **Streaming, launch/resume identity, teardown, spawn failures, races — MET.** Approved
   requests are forwarded as-is with URL rebased to the OpenRouter upstream and the streaming
   Response returned directly (test asserts URL+body preservation). Launch assigns the session
   id up front (`--session-id`) and resume reuses the `--resume` id, so the audited
   `requestingSession` is the real child session in both modes; the enforce flag applies to
   both launch and resume in `printRequest`. The guard server is closed in `finally`
   (`claude-print.ts:93-94`) covering spawn throw, child exit, and violation paths; the
   violation flag is set synchronously before the 403 is returned, so a child that races to
   exit 0 after receiving the denial still yields exit 78. A denied evaluator cannot keep
   spending: even if SIGTERM is ignored (finding 1), all further model requests are 403.
6. **Existing route invariants green — MET.** Reproduced independently:
   `formal evaluator rejects the Gemini documentation-authoring generator lane` passes, and
   the volatile-value guard (`no-hardcoded-volatile_test.ts`, 4 tests incl. Layers A+B)
   passes. `LOOPBACK_HOST`/`LOOPBACK_HTTP_PROTOCOL` were correctly added to
   `config/endpoints.ts` rather than hardcoded in the guard.

## Gates run by this reviewer (independent reproduction)

- Focused set (`evaluator-model-guard_test`, `claude-print_test`,
  `runner-provider-profiles_test`, `routing-policy_test`, `no-hardcoded-volatile_test`):
  **47 passed, 0 failed** — matches the author's claim.
- `routing-policy_test.ts --filter "Gemini"`: **1 passed** (invariant intact).
- Complete `deno test .llm/tools/agentic/`: **329 passed, 0 failed** — matches.
- Scoped wrappers on `.llm/tools/agentic` (`--ext ts,tsx`): check **129 files, 0 findings**;
  lint **129 files, 0 findings**; fmt **129 files, 0 findings** — matches.

No `packages/**`/`plugins/**` files are touched, so `quality:scan`/`arch:check` are not
required for this slice. Lock hygiene preserved: no `deno.lock` changes in the diff.

## Remediation verification (same reviewer session, 2026-08-03)

Re-inspected the updated diff after the author's remediation pass. Line references below are to
the remediated files.

1. **SIGTERM-only termination — RESOLVED.** The violation callback now arms a one-shot 1s
   escalation timer that sends `SIGKILL` if the child survives `SIGTERM`
   (`claude-print.ts:80-88`); the timer is cleared in the `finally` block once the child
   exits (`claude-print.ts:106`), so a cooperative exit never receives a stray SIGKILL.
2. **Audit-write failure suppressing abort/exit-78 — RESOLVED.**
   `ports.abortEvaluation(attempt)` now runs before `await ports.audit(attempt)`
   (`evaluator-model-guard.ts:78-79`), so the violation flag, kill, and exit 78 hold even
   when the durable write fails. New test
   `evaluator model guard aborts even when its durable audit write fails` proves it. Residual
   (accepted): on audit failure the child sees a 500 instead of 403 and the JSONL event
   itself is still lost — the abort, non-zero exit, and spend block are what the finding
   required, and they now hold.
3. **Unscoped permissions on all print lanes — RESOLVED.** The extra flags are now emitted
   only for evaluator routes and are scoped:
   `--allow-write=.llm/tmp/agentic/evaluator-policy` and
   `--allow-net=127.0.0.1,openrouter.ai`, both derived from config constants rather than
   literals (`claude-adapter.ts:66-72`), keeping the volatile-value guard green. Ordinary
   lanes are back to the baseline `--allow-read --allow-run`, asserted by the updated adapter
   test. I additionally probed the scoped grant empirically: a `deno run
   --allow-write=.llm/tmp/agentic/evaluator-policy` script in a fresh directory successfully
   performed the recursive `mkdir` (absent parents) plus the 0o600 append write the audit
   path needs — the scoping does not break the audit at runtime.
4. **`--session-id` on ordinary launches — RESOLVED.** The flag is now conditional on
   `enforceOpenEvaluatorModels` (`claude-print.ts:39-43`); ordinary launches retain the
   implicit fresh-session argv, proven by the new test
   `ordinary Claude print launches retain implicit fresh-session behavior`. Evaluator
   launches still pin the session id up front, preserving the boundary-3/5 identity
   guarantee.
5. **Preset-keyed guard attach (informational) — UNCHANGED, ACCEPTED.** No remediation was
   expected; the note stands for future evaluation presets.
6. **Raw session id in audit filename — RESOLVED.** `evaluatorModelAuditPath()`
   (`evaluator-model-guard.ts:34-38`) replaces every character outside `[A-Za-z0-9._-]` with
   `_` and maps an empty id to `missing-session`. Traversal requires `/`, which is always
   replaced, so any supplied identity stays inside the audit root; the new test asserts
   `../foreign/session` becomes `.._foreign_session.jsonl` under the root.

Gates re-run on the remediated code:

- Focused set: **50 passed, 0 failed** (the three new remediation tests included).
- Complete `deno test .llm/tools/agentic/`: **332 passed, 0 failed**.
- Scoped wrappers on `.llm/tools/agentic` (`--ext ts,tsx`): check/lint/fmt each
  **129 files, 0 findings**.
- Scoped-permission probe (finding 3): recursive mkdir + append write succeed under the
  exact `--allow-write` grant.

All actionable findings are resolved; the two residual notes (audit event loss on write
failure, preset-keyed attach) are accepted as informational.

**Verdict retained: PASS.**
