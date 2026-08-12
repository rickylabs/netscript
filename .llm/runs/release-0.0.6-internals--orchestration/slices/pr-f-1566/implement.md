use harness

# PR-F — #1566: phase-eval status cleanup races on an event snapshot and 404s the run

You are the **implementation agent** for a small, deterministic automation fix. The defect is fully
characterised and reproduced; your job is the fix plus the tests that prove it, not investigation.

Your orchestrator is a Claude Opus 5 high session in `/home/codex/repos/netscript-006-internals`. It
holds merge authority.

## SKILL

- `netscript-harness` — run artifacts, slice discipline, commit trail.
- `netscript-tools` — scoped validation wrappers; what is a verdict and what is not.
- `netscript-pr` — branch/PR/label mechanics, closing keywords, the fenced `acceptance-evidence` block.
- `openhands-handoff` — the phase-eval dispatch contract you must not break.
- `rtk` — prefix read-heavy `git`/`gh`/`grep`.

## Identity

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-labelrace` |
| Branch | `fix/1566-phase-eval-label-race` |
| Base | `e67c1ba13` (= `origin/main`) |
| Slice dir | `.llm/runs/release-0.0.6-internals--orchestration/slices/pr-f-1566/` |
| Closes | #1566 |
| Route | Codex · gpt-5.6-sol · **low** |

Work only in that worktree. No rebase, no force-push. Push with an explicit refspec.

## The defect, already reproduced — do not re-investigate

`.github/workflows/openhands-phase-eval.yml`, step **"Enter IMPL-EVAL status on ready transition"**:

```js
const labels = context.payload.pull_request.labels.map((label) => label.name);
for (const label of labels.filter((name) => name.startsWith('status:'))) {
  await github.rest.issues.removeLabel({ owner, repo, issue_number, name: label });
}
await github.rest.issues.addLabels({ owner, repo, issue_number, labels: ['status:impl-eval'] });
```

`context.payload.pull_request.labels` is a **snapshot from event-creation time**; the loop then issues
unconditional deletes against live state.

Observed on PR #1541, head `0503991ab`, two dispatch runs **two seconds apart**:

```text
31596291515  failure  12:24:36Z    DELETE …/issues/1541/labels/status%3Aimpl - 404
31596293364  success  12:24:38Z    posted the authoritative trigger
```

**Exactly-once was not violated** — verified: one trigger marker for that head,
`generation=29339092792`. The generation dedup worked. Only the cleanup raced. So this is a **false red on
a PR whose evaluation succeeded**, which is the stimulus that teaches operators to discount red runs. It has
already cost this milestone an investigation into an apparent duplicate evaluator run that turned out not to
exist.

## Design decision, made for you — the logic must become testable

#1566's acceptance requires a **race regression test**. Inline `actions/github-script` JS in a workflow
cannot be unit-tested. So extract the decision into a checked-in module under `.github/scripts/` and have
the workflow call it — following the precedent already in that directory (`ci-classify-changes.ts` +
`ci-classify-changes.test.ts`, `draft-workflow-policy.test.ts`, `e2e-cli-event-policy.test.ts`).

Shape that keeps it testable: a **pure** function deciding *which labels to remove and add* given the live
label set, plus a thin caller that performs the API calls and applies the narrow error tolerance. Inject the
GitHub client (or just the two operations you need) so the test can drive a client that throws on demand.
Do not invent a framework; match the neighbouring files' style.

## Contract

### C1 — cleanup is idempotent

Read **live** labels immediately before removing (`issues.listLabelsOnIssue`) and remove only what is
actually present. Reading live is the primary fix; the tolerance in C2 is the belt to that braces, because
even a live read is racy in principle.

### C2 — tolerance is narrow, and this is the part that is easy to get wrong

Tolerate **only** a `404` that means *this label is not on this issue*. Rethrow everything else.

A blanket `try { … } catch { }` around `removeLabel` **fails this slice**. It would swallow a `403` from a
permissions regression and a `404` from a wrong `issue_number`, converting a real failure into a silent
pass — which is the same false-green class the whole 0.0.6 internals lane exists to remove. Do not ship the
convenient version.

Leave the workflow's `retry-exempt-status-codes` behaviour untouched; 404 being retry-exempt is correct.

### C3 — generation deduplication is unchanged

It already works under a genuine race. Do not restructure it, do not "improve" it. Prove it still holds
(acceptance box 4).

### C4 — terminal state is exactly one `status:` label

Per the taxonomy's single-status rule. After cleanup, `status:impl-eval` and nothing else `status:`-prefixed.

## Acceptance mapping

#1566 has **6** boxes. Read them from the live issue. Provide a fenced `acceptance-evidence` block in the PR
body using **`box-index: 1..6`** — **not** exact box text. Reason, learned expensively on PR #1560 two hours
ago: `acceptanceCheckboxes` keeps only each checkbox's **first raw line, backticks preserved**, so any box
that wraps in the issue body is unmatchable by exact text, and the author cannot see the wrapping. `box-index`
is stable against it. Do not repeat that failure.

Box 2 is **proven RED** and box 3 is a **narrow-tolerance assertion** — both need tests that fail before your
change. Commit the failing tests, then the fix.

## Gates — deliverables, not a checklist

Paste real output with exit codes into your per-slice PR comment.

| # | Gate | Command |
| --- | --- | --- |
| 1 | script tests | `deno test --allow-read --allow-env --allow-write --allow-run .github/scripts/` |
| 2 | scoped type-check | `.llm/tools/run-deno-check.ts --root .github/scripts --ext ts` |
| 3 | scoped lint | `.llm/tools/run-deno-lint.ts --root .github/scripts --ext ts` |
| 4 | scoped format | `.llm/tools/run-deno-fmt.ts --root .github/scripts --ext ts` |
| 5 | **asset-barrel freshness** | `deno task gen:assets-barrel`, then `git status --porcelain` **must be empty** |
| 6 | workflow YAML still parses | confirm the edited workflow loads (a `gh workflow view` or a YAML parse is fine) |

Gate 5 is not optional and is not obvious: tool sources are embedded as strings in
`packages/cli/src/kernel/assets/*.generated.ts`, so touching a bundled file makes them stale and reds
`ci.yml`'s `quality` job. This cost PR-E a full CI cycle. Run it **before** you consider the slice done —
if `.github/scripts/` turns out not to be bundled, the command is a no-op and costs nothing, and the empty
`git status` is your proof either way.

`deno task e2e:cli` is out of scope. Do **not** apply `ci:skip-e2e`/`ci:skip-scaffold` yourself; the
orchestrator decides labels.

## PR mechanics

1. First commit is the slice-dir bootstrap; open the **draft PR** in that same session and comment per slice.
2. Slice artifacts in `.llm/runs/release-0.0.6-internals--orchestration/slices/pr-f-1566/`:
   `worklog.md`, `context-pack.md`, `drift.md`, updated in the **same commit** as the code they describe.
3. `## Scope` carries `Closes #1566` on its own line. Nothing else gets a closing keyword.
4. Labels: `type:fix`, `area:tooling`, `priority:p2`, `status:impl`, milestone `0.0.6`. Exactly one
   `status:`. Do **not** apply `status:ready-merge` or `status:impl-eval`.
5. **Leave the PR in draft.** Draft → ready fires the formal IMPL-EVAL and is the orchestrator's action.
6. Resolve commit hashes in a **separate shell step** and paste the literal value — a previous slice posted
   `(git rev-parse --short=10 HEAD)` unexpanded into two comments.

## Boundaries

- Touch only `.github/workflows/openhands-phase-eval.yml`, new/edited files under `.github/scripts/`, and
  your slice dir.
- Do **not** change the workflow's `on:` triggers or dispatch conditions.
- Do **not** touch model resolution, the `eval:model:*` mapping, or the trusted-base-ref logic from #1552.
- Do **not** retrigger PR #1541 or comment on it. Its evaluation succeeded and its trigger is authoritative.
- Do **not** widen into #1564 (stale `base.sha` range computations). Same defect class, different surface.
- Do **not** add `deno-lint-ignore`, `@ts-ignore`, `as any`, `as unknown as`, or `quality-allow:`.
- Do **not** merge.

## Escalate instead of going idle

If a gate is red and you cannot green it, or a contract here is wrong, write it in your slice `drift.md`,
post it as a PR comment, and continue with what is not blocked. On this lane escalation has twice found the
orchestrator's brief wrong rather than the code — that is a good outcome, so raise it.
