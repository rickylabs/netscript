# IMPL-EVAL — S2 + S4 (epic #1169)

Evaluator: Claude (Qwen 3.7-max route, open-model, separate session from generators and
supervisor). Protocol: `.llm/harness/evaluator/protocol.md`, verdict vocabulary:
`verdict-definitions.md`. Plan-Gate: owner-waived in `drift.md` of the design run — not
evaluated here. Read-only verification; no file outside this verdict was modified.

## Verdict table

| Slice | PR | Closes | Verdict | Rationale |
| --- | --- | --- | --- | --- |
| S2 `agentic:pr-checks` | #1177 | #1170 | **PASS** | Latest-run-per-name rollup classifies correctly; exit non-zero only on current-fail; all static gates clean; live demo against merged PR #1094 labels superseded/stale. |
| S4 post-merge / deleted-ref CI hardening | #1178 | #1142, #1174 | **PASS** | Transactional heredoc writes in every `<<__EOF__` site; merged-PR short-circuit + `diff_unavailable` skip chain in `e2e-cli.yml`; every openhands-agent step after the ls-remote guard gated on `exists == 'true'`; negative-case transcripts reproduced. |

---

## S2 evidence (PR #1177, worktree `/home/codex/repos/ns004-s2-prchecks`)

### Gate 1 — unit tests

```
$ deno test --allow-read .llm/tools/agentic/github/pr-checks_test.ts
running 6 tests from ./.llm/tools/agentic/github/pr-checks_test.ts
cancelled run with newer green sibling is superseded and clean ... ok (1ms)
genuinely failed latest run is an exit-relevant current failure ... ok (162µs)
in-progress latest run is pending and clean, never a pass ... ok (167µs)
post-merge run on deleted head ref is stale and not a failure ... ok (214µs)
only latest run with the same name counts ... ok (273µs)
report includes head SHA and evaluation timestamp ... ok (142µs)
ok | 6 passed | 0 failed (17ms)
```

The "in-progress → pending, never a pass" test is the review finding the supervisor flagged on the
thread and the Codex agent fixed before sign-off; the negative fixture is present and passing.

### Gate 2 — scoped check / lint / fmt on `.llm/tools/agentic/github`

- `run-deno-check.ts --root .llm/tools/agentic/github --ext ts,tsx` → 0 occurrences, 0 paths.
- `run-deno-lint.ts --root .llm/tools/agentic/github --ext ts,tsx` → 0 occurrences, 0 rules.
- `run-deno-fmt.ts --root .llm/tools/agentic/github --ext ts,tsx` → 0 findings.

### Gate 3 — code review of `pr-checks.ts`

| Requirement | Location | Status |
| --- | --- | --- |
| Exit non-zero ONLY on current-fail | `buildPrCheckReport`: `ok = currentFailures === 0`; `Deno.exit(report.ok ? 0 : 1)` (lines 109, 232) | ✓ |
| In-progress runs classify `pending` (never current-pass) | `classifyCheckRuns` line 84-85: `run.status !== 'completed'` check precedes all conclusion branches | ✓ |
| Superseded = non-latest per name | `latestByName` map built lines 72-76; line 80-81 marks `latestByName.get(run.name)?.id !== run.id` as `CHECK_SUPERSEDED` | ✓ |
| Report carries `headSha` + `evaluatedAt` | `PrCheckReport` interface lines 38-39; `buildPrCheckReport` populates both (lines 112-113) | ✓ |

### Gate 4 — live read-only run against PR #1094

```
$ deno task agentic:pr-checks -- --repo rickylabs/netscript --pr 1094 --pretty
stale-post-merge scaffold CI lane visibility status=completed conclusion=success ...
stale-post-merge desktop-native-linux (deb + signed updater) ...
stale-post-merge scaffold-runtime (aspire + docker + postgres) ...
stale-post-merge scaffold-static (deno-only) ...
stale-post-merge classify changes status=completed conclusion=failure ...
superseded scaffold CI lane visibility ...
...
current-pass close-gate status=completed conclusion=success ...
current-pass quality status=completed conclusion=success ...
current-pass check-test status=completed conclusion=success ...
current-pass deps-report status=completed conclusion=success ...
current-pass code-quality status=completed conclusion=success ...
pr-checks PASS rickylabs/netscript#1094 headSha=f186033908d8653615f176cd6578906e9e7162b8
    evaluatedAt=2026-08-03T19:36:06.286Z checks=31 currentFailures=0
EXIT_CODE=0
```

PR #1094 is the documented "superseded reads red" case from #1169 failure 2. The tool labels the
old failed `classify changes` run as `superseded` (not `current-fail`), labels the five post-merge
re-runs against the deleted head ref as `stale-post-merge`, and exits 0 because no **current**
failure exists. The report's `headSha` and `evaluatedAt` fields are populated.

### S2 findings

None. All four requested gates pass with direct evidence.

---

## S4 evidence (PR #1178, worktree `/home/codex/repos/ns004-s4-ci-hardening`, read-only)

### Gate 1 — `<<__EOF__` heredoc sites are transactional

```
$ grep -rn '<<__EOF__' .github/workflows/
.github/workflows/surface-diff.yml:52:            echo "changed<<__EOF__"
.github/workflows/ci.yml:135:            echo "changed<<__EOF__"
.github/workflows/e2e-cli.yml:132:            echo "changed<<__EOF__"
```

All three occurrences are the temp-file-then-append shape — the diff is computed into a `$diff_file`
via `mktemp` first, and the heredoc block (`echo "changed<<__EOF__" / cat $diff_file / echo
"__EOF__"`) is appended to `$GITHUB_OUTPUT` only after the `git diff` succeeded. `e2e-cli.yml` adds
the strongest framing: `if ! git diff ... > "$diff_file" 2> "$error_file"` sets
`diff_unavailable=true` on failure and `exit 0`s before the heredoc block is reachable. **No
occurrence is the unsafe `echo "changed<<__EOF__" >> $GITHUB_OUTPUT` before a fallible command.**

### Gate 2 — openhands-agent.yml per-step guard audit

Every step after "Verify target ref still exists" (id `target-ref`, lines 298-333) carries
`steps.target-ref.outputs.exists == 'true'`:

| Step | Line | Condition |
| --- | --- | --- |
| Acknowledge trigger (`ack`) | 337 | `steps.target-ref.outputs.exists == 'true' && output_mode != 'summary-only' && issue_number != ''` |
| Checkout repository | 393 | `steps.target-ref.outputs.exists == 'true'` |
| Hydrate OpenHands automation | 402 | `steps.target-ref.outputs.exists == 'true'` |
| Load NetScript toolchain | 419 | `steps.target-ref.outputs.exists == 'true'` |
| Prepare OpenHands artifact paths | 428 | `steps.target-ref.outputs.exists == 'true'` |
| Prepare OpenHands request files | 473 | `steps.target-ref.outputs.exists == 'true'` |
| Setup Deno | 551 | `steps.target-ref.outputs.exists == 'true'` |
| Setup .NET SDK | 558 | `steps.target-ref.outputs.exists == 'true'` |
| Setup Docker | 564 | `steps.target-ref.outputs.exists == 'true'` |
| Bootstrap NetScript toolchain | 571 | `steps.target-ref.outputs.exists == 'true'` |
| Set up Python | 580 | `steps.target-ref.outputs.exists == 'true'` |
| Install uv | 586 | `steps.target-ref.outputs.exists == 'true'` |
| Install OpenHands SDK | 592 | `steps.target-ref.outputs.exists == 'true'` |
| Resolve provider credentials | 602 | `steps.target-ref.outputs.exists == 'true'` |
| Run OpenHands | 656 | `steps.target-ref.outputs.exists == 'true'` |
| **always()** Materialize OpenHands trace | 674 | `always() && steps.target-ref.outputs.exists == 'true'` |
| **always()** Commit run artifacts | 845 | `always() && steps.target-ref.outputs.exists == 'true' && is_pr == 'true' && trace_dir != ''` |
| **always()** Create pull request (non-PR triggers) | 910 | `always() && steps.target-ref.outputs.exists == 'true' && run-agent.outcome == 'success' && is_pr != 'true'` |
| **always()** Post review-thread replies | 924 | `always() && steps.target-ref.outputs.exists == 'true' && output_mode == 'thread-replies' && is_pr == 'true'` |
| **always()** Publish final status comment | 967 | `always() && steps.target-ref.outputs.exists == 'true'` |
| **always()** Upload OpenHands artifacts | 1202 | `always() && steps.target-ref.outputs.exists == 'true' && run_dir != ''` |

The two `always()` steps called out in the brief (trace materialization and final status comment)
are both gated. A deleted ref takes the notice path at line 327-328, sets `exists=false`, exits 0,
and every subsequent step becomes a clean skip — no red check, no orphaned ack comment, no artifact
push against a missing ref.

### Gate 3 — e2e-cli.yml merged-PR short-circuit and `diff_unavailable` skip chain

- **Merged-PR short-circuit** — classify job `if:` line 76:
  `github.event_name != 'pull_request' || github.event.pull_request.merged != true`. A merged PR
  event (the post-merge `closed`/`labeled` retrigger failure mode of #1142) never enters the
  classify job. ✓
- **`diff_unavailable` declared** — line 85 in job outputs. ✓
- **Diff step writes transactionally** — lines 118-128: mktemp + `if ! git diff > $diff_file 2>
  $error_file` → emits `diff_unavailable=true`, stderr prints the real git error, exits 0. ✓
- **All three downstream jobs skip on `diff_unavailable`:**
  - `scaffold-static` line 175: `needs.classify.outputs.diff_unavailable != 'true'` in job `if:`. ✓
  - `scaffold-runtime` line 231: same guard. ✓
  - `desktop-native-linux` line 314: same guard. ✓
- **`decide` step also guarded** — line 157: `if: github.event_name != 'pull_request' ||
  steps.diff.outputs.diff_unavailable != 'true'` so the classifier never runs against a missing
  diff. ✓

### Gate 4 — S4 worklog negative-case transcripts

`.llm/runs/fix-1142-postmerge-ci--s4/worklog.md` (in the S4 worktree) contains three transcripts:

1. **#1142 old-pattern corruption** — `bash -e` reproduction with the old opener → diff → closer
   ordering. `OLD status: 128`, fake `$GITHUB_OUTPUT` contains `changed<<__EOF__` and no closer.
   Git stderr: `fatal: Invalid symmetric difference expression deadbeef...badc0ffee...`. ✓
2. **#1142 new-pattern clean** — Same failure, temp-file-first ordering. `NEW status: 0`,
   `$GITHUB_OUTPUT` contains only `diff_unavailable=true`, no heredoc opened. True git error
   preserved on stderr. ✓
3. **#1174 deleted-ref guard** — Simulated with `git rev-parse --verify` against a nonexistent
   ref. `exists=false`, `::notice::OpenHands skipped because target ref
   rickylabs/netscript@refs/heads/__s4-deleted-ref-does-not-exist__ no longer exists.` ✓

The worklog's gate table also records Deno YAML parse PASS for all four touched workflows and an
honest "actionlint unavailable" note (not a fake pass).

### S4 findings

None. All four requested gates pass with direct evidence. The unchecked #1142 acceptance box
("verified against a real merge") is correctly flagged by the PR body as empirically fillable only
after merge — the structural guards are in place and the negative case is reproduced, which is the
maximum pre-merge evidence available.

---

## Lane provenance

Evaluator route: `claude-openrouter` provider, `qwen/qwen3.7-max` (open-model per
`.llm/harness/workflow/lane-policy.md`). Separate session from both Codex Sol·low generators and
the Claude Fable supervisor. No implementation changes made.

## Process notes

- Plan-Gate waived by owner in the design-run `drift.md`; not evaluated here per the brief.
- S2 worklog at `.llm/runs/feat-1170-pr-checks--s2/`; S4 worklog at
  `.llm/runs/fix-1142-postmerge-ci--s4/`. Both examined.
- Supervisor sign-offs recorded: `d071ecd26` (S2), `705d7fbca` (S4).
