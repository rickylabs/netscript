# PLAN-EVAL — #1102 completion (S4A / S4B / S5)

**Role:** independent plan evaluator, read-only. You did not write this plan.
**Route:** Claude · Anthropic · Fable 5 · medium (native opposite-family; Codex-authored plan).
**Protocol:** `.llm/harness/evaluator/plan-protocol.md` + `.llm/harness/gates/plan-gate.md` + `verdict-definitions.md`.
**Verdict:** `PASS` or `FAIL_PLAN`.

## Subject

The plan lives in the writer's branch `feat/mcp-intent-activation-s4-s5` at its **final immutable
head `71c0a29c2f356859e3071b74680cb4ddc7ec98cb`** (verified identical local, remote and pushed;
the plan was introduced in `42eec6996` and the head adds a harness close-gate artifact), at
`.llm/runs/release-0.0.5--orchestration/slices/w3-b1-1102/plan.md` (plus `research.md`,
`context-pack.md`, `drift.md` in the same directory).

**You must not enter `/home/codex/repos/ns005-w3b1`** — the writer owns it. Read the plan from git
instead, e.g. from your own read-only worktree `/home/codex/repos/ns005-planeval-s4s5`:

```
git fetch origin feat/mcp-intent-activation-s4-s5
git show 71c0a29c2:.llm/runs/release-0.0.5--orchestration/slices/w3-b1-1102/plan.md
```

Your worktree is checked out at `main` (`51a58b4f5`) so you can inspect the *current* code the plan
proposes to change. Read-only: no edits, commits, or pushes. No Aspire, containers, or `e2e:cli`.

## Context you need

S1–S3 merged as PR #1404. #1102 stayed open because two acceptance rows are unsatisfied:

- **Row 6** (activation): `MCP_AGENT_INSTRUCTIONS` names `search_docs` but not `find_guidance`, and
  no `find_guidance` reference exists in CLI init, generated `AGENTS.md`, or skills assets.
- **Row 3** (concept mismatch): the issue's own paraphrase `"avoid hitting my service every render"`
  returns rank 1 `pages/services-sdk/services#services-contracts`, not `web-layer/query`.

A prior IMPL-EVAL also established that the **locked five-row evaluation cannot detect a broken
scorer**: inverting the BM25 comparator leaves all five rows passing, because `routeIndex` consults
hard-coded `routeHints` before score and every fixture intent contains a concept alias verbatim.

## What to judge

1. **Does the plan actually make scoring falsifiable?** This is the crux. D15/S4A propose adding a
   score-only row that activates **zero** concepts, so `routeIndex` is equal across candidates and
   inverting `right.score - left.score` must fail it. Judge whether that reasoning holds against the
   **real code** in your worktree (`guidance-index.ts`, `guidance-concepts.ts`): is it actually true
   that a zero-concept query yields an equal `routeIndex` for all candidates, and that ordering then
   depends solely on score? If a fallback, tie-break, or link-boost path could still determine that
   row's order, the control is an illusion and this is `FAIL_PLAN`.
2. **Is the chosen score-only intent genuinely uncovered?** The plan names
   `"pick direct application ownership versus a reusable integration"` and claims zero concept
   activation. Verify against the current alias tables rather than trusting it.
3. **Row-3 repair honesty.** D14 extends `cache-freshness` aliases to cover the exact paraphrase.
   Judge whether that genuinely repairs concept mismatch or merely hard-codes the one sentence the
   acceptance row quotes. If it only satisfies the literal example, say so — passing the quoted
   paraphrase while the class remains broken would be false completion.
4. **The locked five rows and 15 citations must stay byte-for-byte.** Confirm the plan commits to
   that and does not retune ranking constants to make new rows pass.
5. **Activation (S4B) is real.** Row 6 needs the actual `agent init --with-docs` → MCP → `find_guidance`
   path returning rank-1 `llms#task-router`, not merely the tool appearing in a list. Judge whether
   the proving gate would fail if activation were absent.
6. **Byte budget.** Current embedded assets are 253,535 bytes / 12 documents against a 262,144 cap
   (8,609 headroom). Judge whether S4A/S5 can land within it, and whether the plan says what happens
   if not — a plan that silently assumes headroom is a finding.
7. **Gate ordering and cost.** All non-Aspire gates must be green before requesting the serialized
   runtime token, and exactly one `scaffold.runtime` run. Confirm the plan sequences that.
8. **Plan-Gate compliance** per `gates/plan-gate.md`: contract-first ordering, named files per slice,
   per-slice proving gates, falsification/pre-fix-red table, drift discipline, and honest scope.

## Standard and timebox

Judge the plan, not its prose. Where a claim about current behaviour is checkable, check it in your
worktree rather than accepting it.

**Timebox: rule as soon as you have judged items 1–3 plus Plan-Gate compliance.** Do not exhaustively
audit every table. If something is unexamined when you rule, say so explicitly in that item's row.

Report per item: item → what you checked → observed → judgement. Then the overall verdict, exactly
`PASS` or `FAIL_PLAN`. If `FAIL_PLAN`, list only concrete required changes, phrased so the writer can
act on them. Deliver the verdict in that message; do not end by saying you will wait for anything.
