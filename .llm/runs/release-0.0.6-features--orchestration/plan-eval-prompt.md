use harness

# PLAN-EVAL — NetScript issue #1398

You are a **formal PLAN-EVAL evaluator** in a fresh session. You did not write this plan and you are
not its supervisor. Your job is to try to **break** it, then return a verdict.

Worktree: `/home/codex/repos/ns006-1398-planeval` (detached at `01aeafbfa`). **Read-only** — do not
edit, commit, or push anything. You may run read-only commands (`git`, `grep`, `deno doc`,
`deno check`) to verify claims.

## SKILL

- `netscript-harness` — read `.llm/harness/evaluator/plan-protocol.md`,
  `.llm/harness/gates/plan-gate.md`, and `.llm/harness/evaluator/verdict-definitions.md`.
- `netscript-doctrine` — plugin/package layering, Archetype 5 thinness, public-surface rules.

## Read

1. `.llm/runs/release-0.0.6-features--orchestration/plan.md` — the plan under evaluation.
2. `.llm/runs/release-0.0.6-features--orchestration/slices/research-1398.md` — the research it rests
   on. **Note its "Unverified" section: that research pass was terminated early on budget.**
3. The live issue #1398 body and its four acceptance boxes.
4. Whatever source you need to check the plan's claims. The plan cites specific `path:line`
   locations — check them.

## What to attack, in priority order

The plan's entire design rests on **one causal chain**. Verify it or break it:

> `job-dispatcher.ts:44` derives `parentContext` from the stored trace headers and passes it to
> `traceJobExecution` (`:108`), so `job.execute` shares a trace id with the execution record's
> stored `traceparent`; and `instrumentation.ts:160` starts the stream publish span on the **ambient**
> OTel context. Therefore publishing execution mutations under a context extracted from the stored
> `traceparent` makes every published record — including the pre-span `create()` one — carry a header
> traceparent whose **trace id** equals the `job.execute` trace id, satisfying TC-14
> (`select-flow-b-stream-change.ts:122-153`).

Specific things worth doubting:

1. **Is the trace id really shared?** `getParentContextFromHeaders` may return a context that is
   remote/non-recording, or `withSpan` may ignore `parentContext` under some configuration. If
   `job.execute` starts a **new trace** rather than continuing the dispatch trace, decision D3 is
   wrong and the plan fails.
2. **Does TC-14 assert what the plan says it asserts?** Read
   `select-flow-b-stream-change.ts:122-153` and `consume-flow-b-stream.ts:52-107,203-230` yourself.
   If the gate compares full `traceparent` rather than trace id, or matches a record the plan does
   not anticipate, say so.
3. **Selector ambiguity.** Four records share a `correlationId`. Does the selector take the first,
   the last, or all? If it takes the first and that is the `create()` record, does the plan's D3
   actually save it — or does D3 only work if the extracted context is non-remote?
4. **Is `SCAFFOLD_RUNTIME_DEFERRED_GATES` really the acceptance surface** the plan claims (D5), and
   does removing those two entries make `scaffold.runtime` run them?
5. **S0's blocking precondition.** The plan blocks on whether `workers-combined` receives the streams
   env. Read
   `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts:180-220`
   and `stream-url-resolver.ts:154-190` and **answer it now** if you can — it is the cheapest way to
   de-risk the whole slice, and the research never got to it.
6. **Idempotency of D1.** Can `startCombinedProcess` end up installing the hook twice, or installing
   it where the API service already did? What happens then?
7. **Scope honesty.** Does anything in the plan quietly require the `WorkerExecutionZodSchema` change
   that D4 forbids? If so the plan is internally inconsistent.

Also apply the plan-gate checklist: contract-first, acceptance mapped to evidence, gates named,
risks recorded, no criterion that cannot be truthfully ticked.

## Output

Write your verdict to
`.llm/runs/release-0.0.6-features--orchestration/plan-eval.md` **as text in your final message**
(do not write the file — the orchestrator commits it). Structure:

```
**[PHASE: PLAN-EVAL] [VERDICT: PASS|FAIL_PLAN]**

<one-line headline>

### Verified
- <claim> — <how you checked, with path:line>

### Findings
1. **C1 <title>** — what is wrong, where, and the concrete fix.
...

### Answers to open questions
- S0 (streams env reaches workers-combined): <answered yes/no + citation, or "could not determine">

### Next
- <action + owner>
```

Rules: every finding cites `path:line`. Distinguish **blocking** (`FAIL_PLAN`) from advisory. If you
cannot verify something, say "could not verify" — do not guess, and do not pad the verdict with
praise. A finding I can check is worth more than a paragraph of assessment.
