# Research — openhands-dispatch-claim-and-refusal

## Re-baseline

- Carried-in source: live issues #1611 and #1613 plus the coordinator's frozen contract.
- Re-derived against `main` @ `7737d8903bb2925c3fcefbda362168fe297eebd4` (2026-08-15).
- Branch source is unchanged from the immutable baseline; bootstrap commit `ca2266ecb` adds only the
  run record.
- Live issue state: #1611 is open, `priority:p1`, milestone `0.0.7`; #1613 is open,
  `priority:p2`, milestone `0.0.7`. Their acceptance text was read from GitHub in this session.

## Findings

### F1 — the agentic producer cannot emit a formal claim tuple

- `DispatchOptions` exposes model, output mode, iterations, provider, effort, and prompt, but no
  evaluator phase or immutable head (`.llm/tools/agentic/lib/agentic-lib.ts:514-521`).
- `buildOpenHandsComment` emits only those fields (`.llm/tools/agentic/lib/agentic-lib.ts:528-537`).
- The real `agentic:dispatch-openhands` caller likewise defines no `phase`/`head` options
  (`.llm/tools/agentic/openhands/dispatch-openhands.ts:58-72`), parses no such flags
  (`.llm/tools/agentic/openhands/dispatch-openhands.ts:100-167`), and passes neither field to the
  builder (`.llm/tools/agentic/openhands/dispatch-openhands.ts:228-237`).
- The caller knows the target PR number but builds the comment before resolving a GitHub token and
  performs no PR-head read (`.llm/tools/agentic/openhands/dispatch-openhands.ts:202-205,228-282`).

Consequence: changing only the frozen `agentic-lib.ts` surface cannot make the documented CLI route
emit a truthful formal phase/head tuple. The caller outside the frozen surface must select the
formal phase and obtain/bind the immutable PR head (or the coordinator must provide another explicit
contract).

### F2 — missing producer fields bypass the existing atomic claim

- The production predicate already parses `phase` and `head`, but returns an authorized decision
  without claim lookup when both are absent
  (`.github/scripts/openhands-comment-trigger.mjs:57-67`).
- When present, it resolves the live generation/head/status, forms
  `(generation, phase, head)`, checks the generation marker, then calls the existing atomic claim
  primitive (`.github/scripts/openhands-comment-trigger.mjs:69-88`).
- The automatic phase workflow independently reads live state, retries generation lookup, builds
  the same tuple and marker, and acquires the claim before creating its trusted trigger comment
  (`.github/workflows/openhands-phase-eval.yml:257-321,337-361`).

Consequence: the race in #1611 is not a missing claim primitive. It is a producer/authorizer
contract gap: the documented manual helper emits no tuple, so line 63 takes the non-formal bypass
and a concurrent automatic dispatch can already own the tuple.

### F3 — refused commands are not reported to their authors

- The authorize job currently starts for an issue comment only when the body begins with the token
  and the author association is already trusted
  (`.github/workflows/openhands-agent.yml:136-147`). Therefore the production parser's
  `command-not-first-token` and `author-not-authorized` decisions
  (`.github/scripts/openhands-comment-trigger.mjs:91-114`) cannot be observed by that workflow.
- For denials that do reach the policy, the workflow writes only `core.notice`; only stale
  head/status reasons receive a job summary, and no PR/issue reply is created
  (`.github/workflows/openhands-agent.yml:247-258`).
- The authorize job has only `contents: read`; the later paid agent job, which is skipped on
  denial, owns the comment-write permissions (`.github/workflows/openhands-agent.yml:149-150,260-268`).

Consequence: satisfying #1613 requires a cheap, pre-spend author-visible reply path and a bounded
candidate condition that lets malformed/unauthorized command attempts reach the trusted predicate.
The reply must not itself become a candidate or a dispatch.

### F4 — generation retry differs exactly as reported

- The manual authorize resolver makes one events request and throws immediately when the current
  phase label event is absent (`.github/workflows/openhands-agent.yml:197-209`). The throw prevents
  a normal denial decision and therefore cannot produce refusal feedback.
- The automatic phase workflow makes up to five event reads with one-second waits, then throws
  after exhaustion (`.github/workflows/openhands-phase-eval.yml:302-317`).

Consequence: `openhands-phase-eval.yml` is already the stated retry reference. The manual workflow
needs matching bounded retry and an exhaustion result that remains fail-closed and attributable.
No source change to the phase workflow is currently justified.

### F5 — the frozen edit surface excludes required regression evidence

- The real cross-module producer/predicate test is
  `.github/scripts/openhands-comment-trigger.test.ts:63-73`; formal claim/collision cases are at
  lines 110-233, and recursion/grammar cases are at lines 15-108.
- Builder unit expectations live in
  `.llm/tools/agentic/lib/agentic-lib_test.ts:334-359`.
- Workflow contract assertions live in
  `.llm/tools/agentic/openhands/phase-eval-workflow_test.ts:202-233`; they currently require
  `startsWith(...)`, reject `contains(...)`, and require the immediate generation-lookup throw.
- All three suites are executed by the durable `agentic-lifecycle-test` gate catalog
  (`.llm/tools/gates/catalog.ts:4-14`). None is in the frozen four-file surface.

Consequence: the acceptance requirements for executed claim-collision, producer round-trip,
non-recursive refusal, and retry regression tests cannot be met without editing tests excluded by
the contract. Existing assertions would also reject necessary workflow changes.

## Frozen-contract verdict

The four frozen surfaces are not a valid implementation envelope:

1. `.llm/tools/agentic/openhands/dispatch-openhands.ts` is a required production caller but is
   excluded.
2. The directly affected regression suites are excluded even though live acceptance explicitly
   requires executed tests.
3. `.github/workflows/openhands-phase-eval.yml` already implements the desired retry and is not
   currently justified as an edit target.

Per the coordinator instruction, this thread does not widen or replace the contract. Research stops
at the rescope boundary.

## jsr-audit surface scan

- N/A: no publishable `packages/**` or `plugins/**` surface is in the contract or discovered fix.

## Open questions requiring coordinator disposition

1. May the production surface expand to
   `.llm/tools/agentic/openhands/dispatch-openhands.ts` so the real CLI can select a formal phase
   and bind the live immutable PR head?
2. May the regression surface expand to the three existing affected test files named in F5?
3. Should `.github/workflows/openhands-phase-eval.yml` be removed from the edit contract and kept as
   read-only reference behavior?
4. What exact CLI semantics distinguish a formal evaluation from a non-formal task (for example an
   explicit `--phase plan|impl` flag versus another coordinator-owned signal)? This changes the
   caller contract and must be locked before implementation.
