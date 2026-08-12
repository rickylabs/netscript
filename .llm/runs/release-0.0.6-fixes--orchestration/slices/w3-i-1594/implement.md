use harness

# Slice W3-I — race-safe pre-spend evaluator claim (#1594)

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-w3-1594` |
| Branch | `fix/1594-evaluator-claim-race` |
| Base | `origin/main@e85d8d28c` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **medium** |
| Slice dir | `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/slices/w3-i-1594/` |
| Priority | **p0 — this defect spends real money per occurrence** |
| PLAN-EVAL | N/A — the seam is identified and the required invariant is specified below |
| IMPL-EVAL | **One separate native Claude Opus 5 medium exact-head evaluation**, arranged by the orchestrator. **You must NOT trigger the automatic evaluator** — see the self-trigger prohibition. |

**Read `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/context-pack.md` first.**

## SKILL

- `netscript-harness` · `netscript-tools` · `netscript-pr` · `rtk`
- `openhands-handoff` — the handoff/trigger contract you are hardening

## The defect, and the exact seam

Two **paid** OpenHands runs fired one second apart from `issue_comment` and had to be cancelled:

```
31615108125  2026-08-12T15:57:30Z  cancelled
31615110254  2026-08-12T15:57:31Z  cancelled
```

The seam is in `.github/workflows/openhands-phase-eval.yml` — a **non-atomic read-then-write**:

```js
:225  const marker = `<!-- openhands-phase-eval generation=${generationEvent.id} phase=${phase} head=${pr.head.sha} -->`;
:226  const comments = await github.paginate(github.rest.issues.listComments, { … });   // READ
:232  const existing = comments.find((c) => String(c.body ?? '').includes(marker));
:233  if (existing) { core.notice('already claimed'); … }                               // check
:240  const { data: comment } = await github.rest.issues.createComment({ … });          // WRITE
```

Between the read at :226 and the write at :240 there is no atomicity. Two concurrent runs both
observe "no existing marker" and both create a trigger comment — **two paid agent runs for one
logical phase transition.**

Note the marker already encodes exactly the right identity: **`generation` + `phase` + `head`**.
The key is correct; the *claim* is not race-safe.

## Required invariant (owner-specified, non-negotiable)

1. **A race-safe pre-spend claim keyed by `(generation, phase, head)`.** Exactly one concurrent
   attempt may win the claim; losers must not spend.
2. **Rejection happens BEFORE spend.** Not deduplicated after launch, not cancelled by a concurrency
   group after the model has been billed. A GitHub Actions `concurrency:` block **does not satisfy
   this** — `cancel-in-progress` stops a job that has already started paying. The refusal must occur
   at the claim, before the trigger comment that starts the paid work.
3. **Distinct `(generation, phase, head)` tuples are still accepted.** The fix must not collapse
   legitimate re-evaluations: a new head, a different phase, or a fresh generation is a *different*
   claim and must proceed.

## The proof you must produce

**Two concurrent attempts on the same tuple yield exactly one paid trigger.** Demonstrated by
execution, not argued from the code.

Design the test so it can actually fail. A test that runs two attempts *sequentially*, or that
serialises them by construction, proves nothing — it would pass against the current broken code too.
Force genuine concurrency against the claim primitive, then assert:

- exactly **one** trigger comment exists for the tuple, and
- the loser exited **without** creating one and **without** starting paid work.

Then the complement: **distinct tuples are accepted** — vary `head`, vary `phase`, vary `generation`,
and assert each proceeds. That guard is what stops the fix from over-rejecting and silently
suppressing real evaluations, which would be a worse defect than the one you are fixing.

State plainly in `evidence.md` how you forced concurrency and why that construction is genuinely
racy rather than nominally so.

## CRITICAL — self-trigger prohibition

**This PR changes the very workflow that would evaluate it.** A self-triggered evaluation here could
run the *old* trigger logic against the *new* code, or re-enter the defect you are fixing and spend
money doing it.

Therefore:

- **Do not apply, cycle, or remove any `status:` label.** The orchestrator owns all label movement on
  this PR.
- **Do not flip draft → ready.** The orchestrator does that, deliberately, after arranging evaluation.
- **Never post a comment containing the invocation or marker syntax** — no `@` + `openhands-agent`
  mention token, no `openhands-phase-eval generation=` marker, no `openhands-agent-summary`, no
  `openhands-run:` JSON. Your own PR body must not contain them either; if you need to show the
  marker format in prose, break it so it cannot match (e.g. describe it, or split the token).
- If you need an evaluation, **say so and stop.** The orchestrator arranges one separate native
  session.

Getting this wrong costs money and could corrupt the very evidence the PR needs.

## Scope

Keep it focused. This is the claim primitive and its tests — plus, if and only if it is genuinely the
same seam, the sibling defect where the mirror **throws** rather than no-ops on malformed evidence
(entries referencing non-existent boxes; the runtime lane filed the empty-entry-list variant as
**#1561**). If that is a different file and a different failure mode, **leave it alone and say so** —
do not widen a p0 cost fix into general evaluator robustness.

## Gates

```
rtk proxy deno task check
rtk proxy deno task test
rtk proxy deno task lint
rtk proxy deno task fmt:check
```

`quality:gate` is required **only if** you touch `packages/**` or `plugins/**` — you probably will
not. `quality:scan` covers neither `.llm/tools/**` nor `.github/**`, so **your own diff scan** for
`deno-lint-ignore` / `as unknown as` / `@ts-ignore` is the real protection; the orchestrator runs one
too.

Do **not** start `scaffold.runtime` — irrelevant here and serialized across lanes.

## Hazards

- **Never wrap an attached session in a shell `timeout`** — it kills the turn ~25s later, and the
  slice looks alive inside that window.
- `deno fmt` rewraps and can silently undo a scripted edit — verify after formatting.
- Explicit-path `git add`, never `-A`. Assert `git diff --stat -- deno.lock packages/fresh-ui/deno.lock`
  empty before each commit.
- These worktrees are **shallow clones**: `merge-base --is-ancestor` returns false silently when
  connecting history is absent. Any ancestry claim must use
  `gh api /repos/rickylabs/netscript/compare/A...B`.
- **No publication of any kind.** Another lane holds the release train.

## Deliverables

1. The fix on `fix/1594-evaluator-claim-race`.
2. `slices/w3-i-1594/evidence.md` — gate output untruncated, the concurrency proof (one trigger from
   two racing attempts, loser spending nothing), the distinct-tuple acceptance proof, and your
   statement of how concurrency was forced.
3. A **draft PR against `main`** via `netscript-pr`: `Closes #1594` in the **body**; labels
   `type:fix`, `area:tooling`, `priority:p0`, exactly one `status:`; milestone `0.0.6`; an explicit
   acceptance checklist ticked only where truthfully done. **Check whether #1594 has acceptance
   checkboxes before adding any structured evidence block** — if the issue has none, do not add one;
   an evidence block referencing non-existent boxes makes the mirror throw.
4. Report back and **stop**. Do not merge, do not mark ready, do not touch labels.
