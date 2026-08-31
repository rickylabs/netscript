use harness

# PLAN-EVAL — #1349 [sdk-client S3] typed oRPC client-contribution seam

You are a **separate evaluator session**. You adjudicate a plan; you do not implement, commit, push,
or comment on GitHub, and you do not move any head.

| Field | Value |
| --- | --- |
| Repo | detached worktree, checked out at the plan head |
| Plan head | `4b520ea44` |
| Branch | `feat/sdk-client-contribution-seam` (off `main` `65cd8a077`) |
| Run dir | `.llm/runs/feat-sdk-client-contribution-seam--1349/` |
| Issue | rickylabs/netscript **#1349**, part of epic **#1348** (sdk-client-contrib), governed by RFC 0001 Stage 2 |

## SKILL

`netscript-harness`, `netscript-doctrine` (`packages/sdk`), `netscript-tools`, `rtk`. Read the issue
body in full (`gh issue view 1349`), then `research.md` and `plan.md` in the run dir.

## Why this plan exists

The supervisor judged #1349 **critical/complex** — unlike the mechanical leaves this lane has been
shipping — and produced a bounded plan rather than dispatching an implementer. Your job is to rule on
whether that plan is correct and sufficient.

## What to adjudicate

1. **The two contradiction resolutions (LD-1, LD-2).** The issue's amendment banner says it
   "supersedes conflicting rows below", and two "Target contract" rows conflict with it: §3 says to
   export `createHttpClientLink`/`ClientLinkPort`/`ClientLinkCallOptions` (amendment and acceptance
   both forbid it), and §5 says to remove `port`/`timeout` (amendment and acceptance say keep them
   deprecated). The plan resolves both **for the amendment**. **Verify this reading against the issue
   text yourself** — if the precedence clause does not actually cover these rows, say so, because an
   implementer following the superseded prose would produce working code that silently fails
   acceptance.
2. **LD-5, the hardest reading.** "Target contract" §4 wants retry/dedupe/CLIENT-span "composed
   through the same public path, so there is no private fast lane", but acceptance forbids
   *contributions* from supplying retry/dedupe/tracing. The plan reconciles these by routing built-ins
   through the **private v1 adapter** rather than the public descriptor type. Is that the correct
   reading, a defensible one, or a contradiction the plan is papering over? This is the single most
   consequential judgement in the plan.
3. **LD-4 / "unrepresentable".** Acceptance requires contributions cannot "supply or observe" fetch,
   link plugins, interceptor arrays, retry, dedupe, tracing, or the resolved HTTP method. The plan
   requires the descriptor type make these unrepresentable and proves it with negative type tests
   that fail to compile. Is a negative type test sufficient evidence for "cannot observe", or does
   observation require a runtime guarantee the type system cannot give?
4. **LD-6 / LD-7 (ordering, desktop).** The issue names "invalid dependency ordering" and
   "desktop-incompatible contributions" without defining either. The plan proposes declaration-order
   with a name-must-appear-earlier dependency check, and a declared descriptor property for desktop
   incompatibility checked at construction. Are these adequate, or do they under-specify the
   acceptance criterion?
5. **The proposed 3-slice split.** Slice 1 types-only, Slice 2 private adapter + composition, Slice 3
   conflict taxonomy + cache modes + reconnect/desktop. Is this the right decomposition? Is Slice 1
   independently valuable and testable, or does it publish types whose correctness cannot be judged
   until Slice 2 exists?
6. **LD-9 / scope leakage.** The acceptance says server handler/plugin forwarding is "out of this
   client-seam leaf **unless independently required by the RFC's private adapter**". The plan's
   default assumption is "not required". Is that safe, or does the adapter plausibly need it?
7. **Boundaries against siblings.** #1350, #1351, #1352, #1353, #451 each own adjacent scope. Does
   the plan stay clear of all five?

## Verdict

Return exactly one of `PASS`, `ACCEPTED_WITH_FINDINGS`, `FAIL_PLAN`, naming the plan head you
adjudicate. Findings must be concrete and actionable — a plan defect should name the LD it breaks and
what the correct decision is. If you judge the plan sound enough to implement Slice 1 from, say so
explicitly.

**Do not run `e2e:cli`, Aspire, Docker, or any browser gate.** No runtime lease is held by this lane.
