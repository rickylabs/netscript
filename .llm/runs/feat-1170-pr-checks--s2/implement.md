use harness

## SKILL

Read `.agents/skills/netscript-tools/SKILL.md` and `.agents/skills/netscript-pr/SKILL.md`. You are
the implementation lane (Codex · GPT-5.6 Sol · low) for slice **S2** of epic #1169, closing #1170.
Supervisor reviews before sign-off; commit but do NOT push; do not open PRs.

## Slice S2 — `agentic:pr-checks`: latest-run-per-name honest check rollup

Worktree `/home/codex/repos/ns004-s2-prchecks`, branch `feat/1170-pr-checks`.
Scope: new files under `.llm/tools/agentic/github/` + one `deno.json` task entry + run-dir worklog.
Nothing else. Read issue #1170 (`gh issue view 1170 --repo rickylabs/netscript`) for the contract.

### Design contract (LOCKED)

1. New `.llm/tools/agentic/github/pr-checks.ts`, task `agentic:pr-checks` (mirror the permission
   flags of the sibling `agentic:review-threads` task). Usage:
   `deno task agentic:pr-checks -- --repo <owner/name> --pr <n> [--json|--pretty]`.
2. **Separation for testability**: a pure `classifyCheckRuns(runs, headSha, mergedAt?)` domain
   function (no fetch) + a thin adapter fetching via the `gh` CLI (`gh api`) the PR head SHA,
   merge state, and check runs for the head commit. Reuse repo conventions from
   `.llm/tools/agentic/github/review-threads.ts` (arg parsing, output shape).
3. Classification per check **name** (`CheckRunClassification`):
   - keep only the latest run per name (max `started_at`); older ones → `superseded`
   - latest run cancelled with a newer completed sibling of same name → `superseded`; cancelled
     with no successor → `cancelled` (reported, not a failure)
   - run attached to a commit that is no longer the PR head, or executed after merge against a
     deleted head ref → `stale-post-merge`
   - otherwise `current-pass` / `current-fail`
4. **Exit code**: non-zero ONLY if at least one check classifies `current-fail`. The output always
   states the head SHA evaluated and the evaluation timestamp (verdict provenance — same rule as
   the rest of #1169).
5. No hardcoded model ids/endpoints; no network beyond `gh`. Named constants for classification
   strings.

### Tests (negative cases are the point)

`pr-checks_test.ts` beside the tool, pure-function fixtures only (no gh calls):
- cancelled run + newer green run of same name → `superseded`, exit-relevant failures = 0
- latest run genuinely failed → `current-fail` (non-zero exit path)
- post-merge run on deleted ref → `stale-post-merge`, not a failure
- two runs same name → older is `superseded`, only latest counts
- output includes headSha + evaluatedAt

### Gates to run and record in `.llm/runs/feat-1170-pr-checks--s2/worklog.md`

```
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic/github --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic/github --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic/github --ext ts
deno test --allow-read .llm/tools/agentic/github/pr-checks_test.ts
```

Also run one **live** read-only demonstration against a real merged PR
(`deno task agentic:pr-checks -- --repo rickylabs/netscript --pr 1094 --pretty`) — #1094 is a
documented case of a superseded red — and paste the output in the worklog. No mutation anywhere.
No `any`, no `deno-lint-ignore`, no `as unknown as`.

### Done means

Gates green, worklog evidence written, single commit on `feat/1170-pr-checks`:
`feat(agentic): pr-checks — latest-run-per-name rollup; superseded and cancelled runs never read as current (#1170)`.
Commit, do not push.
