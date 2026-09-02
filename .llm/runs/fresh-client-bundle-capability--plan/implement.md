use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/deno-fresh/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`, and `.agents/skills/netscript-pr/SKILL.md`.

You are the lane (Codex · OpenAI · GPT-5.6 Sol · high, `complex_implementation`) for a **clustered
Fresh leaf covering #1601 and #1557**. Read both in full:
`gh issue view 1601 --repo rickylabs/netscript` and `gh issue view 1557 --repo rickylabs/netscript`.

Worktree `/home/agent/projects/netscript/worktrees/007-leaf-1601`, branch
`test/fresh-client-bundle-capability`, based on current `origin/main`.

Scope: `packages/fresh/**`, `packages/cli/e2e/**` only if #1557's capability genuinely belongs there,
and the run-dir worklog. Nothing else.

**Coordination constraint:** #1610 is in flight on `packages/fresh/src/application/route/types.ts`
and its route-inference tests. Do **not** touch route inference. Your surface is client-bundle test
capability.

## Why these two are one leaf

Both are about the same missing thing — the repo's ability to build and assert on a Fresh **client
bundle** deterministically.

- **#1601** — `packages/fresh/tests/defer-island-client-bundle_test.ts:14-33` shells
  `deno run --no-lock -A npm:vite@7.2.2 build` at *test time*. With `--no-lock` and a bare npm
  specifier the verdict depends on registry reachability and npm cache warmth, so the **package
  suite** is non-deterministic across environments for the same commit — the property release-lane
  merge decisions rest on. Observed on PR #1593 at `308bcea57`.
- **#1557** — there is no capability to assert the deferred coordinator actually issues its partial
  request on a cache-miss client navigation. No browser driver in repo gates; nothing builds or
  inspects `_fresh` output; the closest is a live dev server over HTTP
  (`probe-project-boundary-dev.ts:43`) which cannot trigger a **client** navigation.

Fixing #1601 by pinning the toolchain is most of the substrate #1557 needs. Doing them separately
would build it twice.

## Task 1 — design note first, in `plan.md`

#1557 is explicitly capability work with open design questions. Before writing gates, record:

1. **Which level** the assertion belongs at: package test, `packages/cli/e2e` gate, or a new lane.
   Justify against what each can actually observe.
2. **What drives the client navigation** — a real browser driver, or a lighter mechanism that
   genuinely exercises client-side partial fetch. If a browser is required, say so plainly and cost
   it (CI time, image size, per-run cost). Do not smuggle in a heavy dependency without naming it.
3. **How the bundle build becomes deterministic**: vite pinned through the workspace/lockfile rather
   than resolved at test time. `--no-lock` with a bare `npm:` specifier must not survive.
4. Whether this belongs in the default suite or behind a label/opt-in gate, and why.

If the honest answer is that #1557 needs infrastructure beyond this slice, **say so and land #1601
alone** with #1557's design note recorded. A truthful partial is worth more than a forced bundle —
#1557 exists precisely because a criterion was moved rather than ticked on weak evidence.

## Task 2 — make #1601 deterministic

Same commit, same result, cold cache, no network. Prove it: demonstrate the test's behaviour with the
npm cache cold or the network denied, not merely that it passes on a warm runner.

Do not delete the test to remove the flake — the assertion it makes is wanted; its **resolution
strategy** is the defect.

## Task 3 — #1557 only if Task 1 concludes it is in scope

If in scope, the test must assert the partial endpoint is requested **and** the named boundary swaps
exactly once, per #1459's original criterion. Anything weaker does not close #1557 — record it as
still open rather than ticking it.

## Gates

- `run-deno-check.ts --root packages/fresh --ext ts,tsx`
- `deno task --cwd packages/fresh test`
- `run-deno-lint.ts` / `run-deno-fmt.ts` over touched roots
- If you touch `packages/cli/e2e`, its check and unit tests too — but do **not** run the full
  `e2e:cli` runtime suite.

## PR rules

Draft PR on the first commit — a draft skips every runtime job, so mark it ready when you want CI.
Use a closing keyword **only** for issues genuinely satisfied: likely `Closes #1601` plus
`Refs #1557`, unless Task 3 fully lands. Never put a closing keyword in prose explaining a *removed*
one — the parser ignores negation and it has already caused a false auto-close in this milestone.
Labels `type:test`, `area:fresh`, `priority:p2`, `status:impl`, `orchestrator:fixes`; milestone
`0.0.7`. Progress in `.llm/runs/fresh-client-bundle-capability--plan/worklog.md`.
