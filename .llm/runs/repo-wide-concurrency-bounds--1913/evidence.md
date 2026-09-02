# Evidence — #1913 repo-wide concurrency bounds

## Baseline

- Branch/base: `ci/repo-wide-concurrency-bounds` at
  `77ad823dcb1874ccfc8964b4679ad92a3a145e0b`.
- Worktree was clean before the run.
- Issue correction measurement: latest 100 Pages runs contained 88 pull requests and 12 main
  pushes. Close main-push pairs occurred at 06:01:58/06:02:25 (27s),
  06:39:22/06:43:33 (4m11s), and 06:43:33/06:49:46 (6m13s) UTC.
- The latest-100 count is a sliding-window observation, not a stable inventory: the evaluator's
  later recheck found 11 main pushes while reproducing the same close-gap values above.

## Required gate exits

| Gate | Real exit | Verdict |
| --- | ---: | --- |
| Focused structured test wrapper | 0 | 6 passed / 0 failed |
| `.llm/tools` structured check wrapper | 0 | 342 files / 3 batches / 0 failures |
| `.llm/tools` structured format wrapper | 0 | 342 files / 2 batches / 0 findings |
| Independent YAML parse/readback | 0 | both edited concurrency mappings exact |
| Base-to-head `git diff --check` | 0 | no whitespace errors |

The format wrapper initially returned exit 1 for mechanical wrapping in the new test. The file was
formatted directly (`TARGETED_FMT_WRITE_REAL_EXIT=0`) and the complete final gate set above was
rerun; the table records the final-head verdicts.

## Post-IMPL-EVAL findings follow-up

The four evaluator findings required comments and evidence only. After those edits, the focused
release test passed 6/6 (`REAL_EXIT=0`), the `.llm/tools` check passed across 342 files and three
batches (`REAL_EXIT=0`), and `git diff --check` passed (`REAL_EXIT=0`). An independent YAML parse
compared each complete `concurrency` object with evaluated head `47c3b4241`; both serialized values
were byte-identical (`REAL_EXIT=0`). The evaluated logic therefore did not change.

## Parsed concurrency sweep

The test enumerates all 13 `.yml` files and parses mapping/scalar paths before collecting
concurrency blocks. It found 10 blocks across 8 workflows; the other 5 workflows have none.

| Workflow / scope | Group | Class | Cancel | Queue |
| --- | --- | --- | ---: | --- |
| `ci.yml` / workflow | `ci-${{ github.workflow }}-${{ github.ref }}` | ref-templated | `true` | default |
| `e2e-cli-prod-local.yml` / workflow | `e2e-cli-prod-local-${{ github.workflow }}-${{ github.ref }}` | ref-templated | `false` | default |
| `e2e-cli-prod.yml` / workflow | `e2e-cli-prod-${{ github.workflow }}-${{ github.ref }}` | ref-templated | `false` | default |
| `e2e-cli.yml` / `jobs.scaffold-runtime` | `e2e-scaffold-runtime-global-v2` | repo-wide literal | `false` | `max` |
| `e2e-cli.yml` / `jobs.scaffold-runtime-sqlite` | `e2e-scaffold-runtime-sqlite-global-v2` | repo-wide literal | `false` | `max` |
| `e2e-cli.yml` / workflow | `e2e-cli-${{ github.workflow }}-${{ github.ref }}` | ref-templated | `true` | default |
| `openhands-agent.yml` / workflow | `openhands-${{ github.event_name }}-${{ github.event.issue.number || github.event.pull_request.number || github.ref }}` | entity-keyed / ref fallback | `false` | default |
| `openhands-phase-eval.yml` / workflow | `openhands-phase-eval-${{ github.event.pull_request.number }}` | entity-keyed | `false` | default |
| `pages.yml` / workflow | `pages-${{ github.event_name == 'pull_request' && github.ref || 'deploy' }}` | PR ref-templated / non-PR repo-wide literal | `false` | `max` |
| `release-canary.yml` / workflow | `release-canary-${{ inputs.republish-version || inputs.target-version }}` | version entity-keyed | `false` | `max` |

No concurrency blocks: `code-quality.yml`, `fresh-ui-quality.yml`, `jsr-settings.yml`,
`publish.yml`, and `surface-diff.yml`.

The class assertion requires `queue: max` for every block whose classification contains a
repo-wide literal. This covers both job-level runtime literals and the literal non-PR arm of the
Pages expression.

## Hosted acceptance

### Safety preflight

- Environment API exit `0`: `github-pages` has custom branch policies for `main`,
  `docs/user-site`, `release/jsr-readiness`, and `v*` only. The feature branch was protected from
  publication.
- Pages traffic API exits `0`: zero queued and zero in-progress runs before the exercise.
- Current `main` remained on the unbounded concurrency mapping; the feature branch carried the
  fixed mapping.

### Admission sequence and receipts

| Role | Run / branch | Per-job terminal conclusions | Executed-step counts |
| --- | --- | --- | --- |
| Occupant | [`33624345836`](https://github.com/rickylabs/netscript/actions/runs/33624345836), feature branch | classify `100228473847`: success; build `100228589261`: success; deploy `100228804476`: failure | classify 10; build 14; deploy **0** |
| Pending victim | [`33624383095`](https://github.com/rickylabs/netscript/actions/runs/33624383095), `main` | classify `100228814665`: success; build `100228906759`: operator-cancelled; deploy `100228949753`: operator-cancelled | classify 10; build 1; deploy **0** |
| Fixed third arrival | [`33624408650`](https://github.com/rickylabs/netscript/actions/runs/33624408650), feature branch | operator-cancelled while pending; no jobs admitted | no jobs / no steps |

The occupant's classify job was admitted at `11:23:37Z`. The main victim was observed in
`pending` state before the third dispatch and remained `pending` after fixed run `33624408650`
joined the same group. When the occupant released the group, the main victim's classify job was
admitted at `11:24:49Z` and completed successfully. That later job admission is decisive evidence
that the third arrival did not evict it. The main run was then deliberately cancelled; only its
build setup ran and its deploy job had `steps: 0`, so no Pages deployment action executed.

The feature-branch occupant completed before its cancellation request arrived. This stayed safe:
its environment-protected deploy job failed with `steps: 0`, exactly as the preflight predicted.
GitHub nevertheless created deployment object `6221263357`, which moved from `waiting` to
`failure`; that record did not execute a deployment action. No real deployment occurred in any of
the three runs.

### Acceptance interpretation

- Box 1: satisfied by both parsed mappings plus the per-group justification.
- Box 2: satisfied by the pending-before-and-after observation, later main job admission, and
  terminal per-job/step receipts above.
- Box 3: satisfied by the exhaustive parsed 13-workflow/10-block regression test.
