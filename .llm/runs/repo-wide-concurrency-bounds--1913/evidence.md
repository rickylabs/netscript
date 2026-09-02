# Evidence — #1913 repo-wide concurrency bounds

## Baseline

- Branch/base: `ci/repo-wide-concurrency-bounds` at
  `77ad823dcb1874ccfc8964b4679ad92a3a145e0b`.
- Worktree was clean before the run.
- Issue correction measurement: latest 100 Pages runs contained 88 pull requests and 12 main
  pushes. Close main-push pairs occurred at 06:01:58/06:02:25 (27s),
  06:39:22/06:43:33 (4m11s), and 06:43:33/06:49:46 (6m13s) UTC.

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

Pending remote push and safe construction. This section will record immutable run IDs, job IDs,
per-job conclusions, and step counts, or an exact blocker without claiming acceptance.
