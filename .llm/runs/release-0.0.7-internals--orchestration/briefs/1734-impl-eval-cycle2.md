use harness

## SKILL

Load `netscript-harness`, `netscript-doctrine`, `netscript-tools`, `netscript-deno-toolchain`, and
`netscript-pr`. Read `.llm/harness/evaluator/` and `.llm/harness/gates/static-gates.md`.

# IMPL-EVAL cycle 2 — #1734 / PR #1736 (`packages/fresh` query hydration boundary)

You are the **independent adversarial evaluator**. You did not write this code and you are not its
supervisor. Your job is to try to break it and to return an honest verdict, not to confirm one.

## Identity and scope

| Field | Value |
| --- | --- |
| Evaluated head | `3b3044f7af178e740b577a80f83e785c1fd6ee7f` |
| Branch | `fix/fresh-query-hydration-readonly-state` |
| Your worktree | `/home/agent/projects/netscript/worktrees/007-eval-1734` (detached at that head, clean) |
| Base for scope diff | `21d516224fe35e92957f0998ee848bbf2024eda0` |
| Cycle-1 head (FAIL_IMPL) | `e537b2c1f06e9bc3345efe84597740a72844440b` |
| Issue | #1734 · PR **#1736** (draft) |

**Artifact-only.** You may write exactly one new file,
`.llm/runs/fix-fresh-query-hydration-readonly-state--1734/impl-eval-cycle-2.md`, and you must
**preserve `impl-eval.md` (cycle 1) bit-identical**. Do not touch product code, tests, the PR body,
labels, draft state, the milestone, or the issue. Do not merge, push to any other ref, or force-push.
Commit your artifact and push with an explicit refspec only:
`git push origin HEAD:refs/heads/fix/fresh-query-hydration-readonly-state` — and note you are on a
**detached** worktree, so create the commit on the branch tip you evaluated, not a stray head.

Post exactly one PR comment on #1736 in the repo's structured form:
`[PHASE: IMPL-EVAL] [VERDICT: PASS|FAIL_FIX|FAIL_PLAN|FAIL_IMPL]`. **Post it yourself** — a previous
leaf in this lane had to have its verdict comment repaired afterwards because the brief did not say
so.

## What cycle 1 found, and what was authorized in response

Cycle 1 returned **`FAIL_IMPL` / `FAIL_FIX`** at `e537b2c1f`. Read it first:
`.llm/runs/fix-fresh-query-hydration-readonly-state--1734/impl-eval.md`. Acceptance items 1–4 and 6
held; the type-level design was not reopened. **F1**: the boundary guard validated the *in-memory*
shape from `dehydrateQueryClient()`, but the package's own transport is JSON, which drops
`undefined`-valued keys — so `Object.hasOwn(state, 'context'|'data'|'variables')` failed on the wire
and the guard threw on state that hydrated before the fix.

The supervisor extended that finding before dispatching the repair, and you should know why: cycle 1
filed the error-shape problem as an *observation* "outside the package's default API". That scoping
was **wrong**. A mutation paused after one failed attempt — default `shouldDehydrateMutation` —
carries a `failureReason` that serializes to `{}`, so `isErrorOrNull` rejected it too. The wire object
was rejected twice, not once. Both were authorized for repair.

Authorized envelope was exactly: R1 serialized-shape validation with load-bearing checks retained;
R2 error-shaped fields surviving the round trip without `any` / `as unknown as` / `@ts-ignore` /
`@ts-expect-error`; R3 round-trip tests through the real transport, RED first. Anything touching the
exports of `query-types.ts` / `query/mod.ts` or widening the public `DehydratedState` contract was a
**stop-and-report** condition, not an author decision.

## What the author delivered

| Commit | Content |
| --- | --- |
| `8dac327d0b21d4fcdabea7adce69e785c1b2a4fb` | RED — JSON-transport regression tests |
| `a1dc5fce65058ab47cd49c5af13d91c145f0d1cf` | fix — normalize serialized hydration state |
| `3b3044f7af178e740b577a80f83e785c1fd6ee7f` | run artifacts / handoff (evaluated head) |

R2 decision taken: **revive** a plain serialized error record into a real `Error`, preserving
`message` / `name` / `stack` when present, with `{}` becoming `Serialized hydration error`. The
author reports the stop condition did not fire.

## Attack this — the list is a floor, not a ceiling

1. **Re-execute RED yourself.** Check out `8dac327d0` in a throwaway worktree and run the round-trip
   suite. If it does not fail there for the stated reason, that is a finding.
2. **Prove the repair on the real transport**, not a hand-rolled `JSON.parse(JSON.stringify(...))`
   imitation — go through `QueryHydrationScript` / `serializeDehydratedState` /
   `readDehydratedState` as the package actually does, including the `<` escaping.
3. **Did the guard get too permissive?** This is the central risk of this repair. The fix loosens
   validation to accept the wire shape; find state the guard now waves through that `hydrate()`
   cannot actually consume, or that corrupts the cache. Re-run cycle 1's eight attack cases and
   invent more of your own.
4. **Attack the revive.** Non-plain objects, prototype-polluting keys (`__proto__`, `constructor`),
   a `stack` that is not a string, deeply nested junk, an `error` that is an array / string / number
   / `undefined`, and a real `Error` on the in-memory path. Confirm rejection is still indexed and
   that a rejection leaves the client **empty** — no partial hydration — and does not mutate the
   caller's input.
5. **Is reviving a behaviour change that matters?** Pre-fix, `{}` passed straight through to
   `hydrate()`. Now consumers get an `Error` with a synthetic message. Judge whether that is
   defensible, stated, and tested — or whether it silently changes what a consumer's error UI shows.
6. **Both ends of the declared range**, `5.101.0` and `5.102.8`, still compile — and verify the
   fixtures resolve the versions they name rather than trusting the filenames. This is the defect
   that created the issue; do not take it on faith.
7. **Public contract**: `query-types.ts`, `query/mod.ts`, `packages/fresh/deno.json` must be
   unchanged versus base, and the range must still be `^5.101.0`, not narrowed to hide anything.
8. **Forbidden constructs** anywhere in the added source or tests.
9. **Scope**: the diff versus base outside `.llm/runs/` must be exactly the three `packages/fresh`
   files. No lock churn, no workflow edits, no pre-existing test modified or deleted.
10. **Receipt honesty**: every SHA cited in the PR body and comments must resolve to a real commit
    (cycle 1 of this leaf cited two fabricated SHA suffixes), and every claimed gate must have
    actually fired at this head.

## Host conditions — record honestly, do not launder and do not fail the leaf for them

This machine currently has **~7,700 PID-1-owned zombie processes** that no agent can reap. That
exhausts per-process descriptors and PID slots, and it makes two `.llm/tools/agentic/**` test modules
fail for reasons that have nothing to do with this change: `codex-follow_test` hits `Too many open
files`, and `hybrid-launcher_test` observes a surviving cancellation child.

Consequently:

- **Do not run the full root `deno task test`.** It is not a usable signal on this host right now,
  and re-running it only adds load.
- Judge the **`packages/fresh` product gates independently** — focused test, check, lint, fmt over
  the changed files, plus `quality:scan` (`allowCount` must stay **7**) and `arch:check`.
- Compare against the known `main` baseline rather than treating an infrastructure red as a leaf
  defect. If you do observe host-caused failures, **record them explicitly as host conditions with
  the evidence**, and say plainly that they are outside the scope diff. Do not report them as green,
  and do not stop or kill any foreign process to manufacture a green.

Also not run and **not a finding**: Aspire, Docker, browser, `scaffold.runtime`, `e2e:cli`. This leaf
holds no runtime lease; the bounded local runtime proof is queued behind another lane and the
`scaffold.runtime` restoration claim is CI-owned.

## Verdict rules

- **`PASS`** — the acceptance holds at this head and you could not break it. Say what you attacked
  and failed to break; a `PASS` with no attack narrative is not a `PASS`.
- **`FAIL_FIX`** — a bounded defect the author can repair without reopening design.
- **`FAIL_IMPL` / `FAIL_PLAN`** — the approach itself is wrong.

State the evaluated head in the artifact, assert local == remote == PR head yourself before judging,
and scope your verdict to that head only. If you find nothing, say so plainly — do not manufacture a
finding to look thorough, and do not soften a real one because this is cycle 2.
