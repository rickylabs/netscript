# Bounded delta re-review — #1729 ADVISORY-1 repair

You are an **independent delta reviewer**. A prior evaluator (separate session) issued `PASS_IMPL`
for #1729 at `9abc76d48cb7bf63ee25b413fb72160362bc2e8c` with two advisories; its artifact is
`907cce4147d999f1ea0f145ca02731307cf680d4` on `eval/impl-eval-1729-cycle-1` — read it first for
context. You are distinct from that evaluator, from the author (Codex `gpt-5.6-sol`, thread
`01a04f8b-…`), and from the topic supervisor.

Your worktree: `/home/codex/repos/netscript-007-eval-1729-delta` (detached at the repair head).
Supervisor disposition: **ADVISORY-1 taken before merge**; **ADVISORY-2 filed as issue #1737**
(outside the five-path ceiling, correctly not fixed in this leaf).

The author has pushed the repair. New head: **`608f68b076bfb724d111bdaf075fd4111703d937`**.

This is a **bounded delta re-review**, not a fresh full evaluation. Answer one question: *does the
repair fix ADVISORY-1 without disturbing anything your PASS rested on?*

## The delta

Product files changed since your evaluated head — exactly three:

- `packages/cli/src/kernel/assets/agent/guidance.md.template`
- `packages/cli/src/kernel/assets/embedded.generated.ts` (regenerated barrel)
- `packages/cli/src/public/features/agent/init/init-agent_test.ts` (the `#1674` assertion string)

Plus `worklog.md` and `drift.md`.

The corrected sentence now reads:

> The app build guide at `apps/<app>/AGENTS.md` explains the local examples and the project's
> `definePage`, `withResource`, and `withForm` composition conventions; read it before app work
> instead of inventing a parallel pattern, and use MCP `find_guidance` or the installed offline docs
> for `defineRouteContract`, `staleTime`, dehydration, and optimistic UI.

## Checks

1. **Is the claim now accurate?** Against a fresh scaffold's generated `apps/<app>/AGENTS.md`,
   confirm the three topics it now claims are present and that the four routed elsewhere are the ones
   your grep counted at 0. The pointer must not overstate its target in either direction.
2. **Link and instruction preserved** — #1674 acceptance box 2 rests on the link plus its "read it
   before app work" instruction. Both must survive.
3. **Barrel current** — `gen:assets-barrel` re-run reproduces the committed
   `embedded.generated.ts` byte-for-byte. Supervisor measured REPRODUCES; confirm independently.
4. **Nothing else moved** — no sixth product path; the #1672 and #1675 sections of the guidance
   unchanged; installer suite still 22 passing.

## Boundaries

- Do not re-litigate anything your cycle-1 PASS settled, and do not re-run the full gate matrix.
- No Aspire, Docker, browser, `e2e:cli`, or expensive-gate lease. A fresh `agent init` scaffold into a
  temp dir is authorized.
- Modify no product/test/docs/tooling path; touch no label, readiness, checkbox, or PR state.
- Probe in a pristine `git archive` extraction, not a repo checkout. Leave no residue.

## Deliverable

Write `.llm/runs/fix-agent-init-guidance-and-cross-host-skills--0.0.7/delta-review-advisory1.md`
with the four checks, exact commands and results, and a verdict of **`DELTA_PASS`** (the cycle-1
`PASS_IMPL` remains valid at `608f68b07`) or **`DELTA_FAIL`** naming what broke. Keep it short — this
is a receipt, not an essay. Commit and **push to a real branch**
(`git push origin HEAD:refs/heads/eval/delta-review-1729`) so the artifact cannot be orphaned. Report
the artifact SHA and branch, post a brief summary as a PR comment on #1729, and stop.
