# Worklog: PR-reachable docs-site gates

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1408-docs-gates-on-pull-request--leaf` |
| Branch | `fix/1408-docs-gates-on-pull-request` |
| Archetype | N/A — infrastructure workflow only |
| Scope overlays | docs |

## Design

### Public Surface

- GitHub required-check surface for docs changes; no product API changes.

### Domain Vocabulary

- `needs_docs` — classifier output selecting docs quality work.
- PR docs build — path-scoped validation run that never deploys.

### Ports

- GitHub Actions events and existing Deno tasks.

### Constants

- Existing task names and `github.event_name`; no new code constants.

### Commit Slices

Slices 3.1–3.6 are enumerated in `plan.md`, each with its proof, gate, and files. Slice 3.7 is the
Tier-A A1 least-privilege correction: deploy-only token scopes move from workflow level to the
guarded `deploy` job without changing triggers, guards, concurrency, or gate commands. Slice 3.8
restores deploy-event serialization while preserving PR isolation and corrects acceptance evidence
to distinguish PR failure proof from required-context merge blocking.

### Deferred Scope

- `diagrams:check` remains local due to its networked Mermaid CLI dependency.
- Separate-session IMPL-EVAL and lifecycle transition remain supervisor-owned.

### Contributor Path

Future docs gate routing changes start in `docs/site/deno.json`, then use `ci.yml` for cheap docs checks and `pages.yml` for built-site checks.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-10 | 3.1 | bootstrap | Fetch/status clean; live issue and baseline verified; PLAN-EVAL N/A recorded. |
| 2026-08-10 | 3.2 | implement | Added source-format production check and focused checker unit test to the docs-aware quality lane. |
| 2026-08-10 | 3.3 | implement | Added path-scoped PR trigger to existing Pages build; guarded all Pages/deploy mutations and keyed concurrency per ref. |
| 2026-08-10 | 3.4 | RED fixture | Added isolated `issue-1408-red-proof` raw-newline Vento defect; local checker fails with the expected named diagnostic. |
| 2026-08-10 | 3.5 | GREEN revert | Deleted only the deliberate fixture after capturing the failing run; local checker and full build pass at clean head. |
| 2026-08-10 | 3.6 | acceptance/locks | Recorded GREEN run, exact lock equality, acceptance mapping, and repo-native current-check PASS; retained draft state for supervisor evaluation. |
| 2026-08-10 | 3.7 | least privilege | Scoped `pages: write` and `id-token: write` to `deploy`; build explicitly retains only `contents: read`. |
| 2026-08-10 | 3.8 | eval corrections | Isolated PR concurrency by ref, serialized all deploy-capable events, and corrected box 1 evidence to name required `quality` context ruleset proof. |

## Gate Results

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Source format | `deno task check:source-format` from `docs/site` | PASS | Pure `--no-lock` source walk. |
| Checker unit test | `deno task test:source-format` from `docs/site` | PASS | Focused positive/negative regression suite. |
| Full docs build | `deno task build` from `docs/site` | PASS | Source format, Lume render, and rendered-output all pass. |
| RED negative control | Pages run 31365789097 | PROVEN FAIL | https://github.com/rickylabs/netscript/actions/runs/31365789097; exit 1 with exact raw-newline diagnostic. |
| GREEN source check | `deno task check:source-format` from `docs/site` | PASS | Deliberate fixture deleted; unique marker absent from docs source. |
| GREEN full build | `deno task build` from `docs/site` | PASS | Existing full chain passes at clean branch head. |
| GREEN CI | Pages run 31365881454 | PASS | Build/source/render, links, and caveats pass; Pages/deploy steps skip on PR. |
| Lock diff | `git diff --exit-code da40fbfe3...HEAD -- deno.lock docs/site/deno.lock` | PASS | Exit 0, no lockfile change. |
| Lock hashes | `git hash-object deno.lock docs/site/deno.lock` | PASS | `a541d4088071ac84c024ed3497be3d761b6d1c58`; `311255423e2d9e1799d654fefb73f87a6629fdc5`. |
| Current PR checks | `deno task agentic:pr-checks --repo rickylabs/netscript --pr 1440 --pretty` | PASS | Head `c2c837302...`, 17 checks, zero current failures. Core required contexts remain skipped by the repository's draft policy and must materialize after the supervisor's ready-for-review transition. |
| Workflow syntax | `python3 -c "import yaml;print(list(yaml.safe_load(open('.github/workflows/pages.yml'))['jobs'].keys()))"` | PASS | Parses with jobs `build` and `deploy`. |
| Permission review | Inspect `.github/workflows/pages.yml` | PASS | Workflow/build are `contents: read`; guarded deploy owns `pages: write` and `id-token: write`. No deploy was triggered. |
| Concurrency syntax | `python3 -c "import yaml;print(yaml.safe_load(open('.github/workflows/pages.yml'))['concurrency'])"` | PASS | Literal expression recorded; PRs use their ref, all deploy-capable events use `deploy`, and cancellation remains disabled. |

## Reconcile Notes

- 3.1: issue #1408 remains open on milestone 0.0.6; required labels confirmed; draft PR opening follows this commit.
- 3.2: PR #1440 has no new reviewer comments or issue changes; D8 and the planned slice remain current.
- 3.3: no new reviewer direction; extending the existing Pages workflow remains the smallest single-source implementation of D8.
- 3.4: no new reviewer direction; the standalone negative-control commit follows the locked acceptance protocol and will remain at branch history only after slice 3.5 deletes the fixture.
- 3.5: RED run and diagnostic are posted on PR #1440; no reviewer changes; GREEN revert stays within planned scope.
- 3.6: no reviewer changes; acceptance is evidenced. Mandatory separate-session IMPL-EVAL and the ready-for-review transition remain supervisor-owned, so draft-only skipped core contexts are explicitly not claimed as executed.
- 3.7: supervisor A1 finding F1 accepted and fixed without altering any docs gate or its reachability. Await the PR build on this commit before handoff.
- 3.8: formal IMPL-EVAL PASS accepted. F2 concurrency regression fixed; F1 evidence correction will be applied to the PR body after push. F3 is explicitly refuted by the supervisor and F4 requires no action.

## Handoff Notes

- Evaluator should inspect workflow event/permission/concurrency semantics, RED/GREEN provenance, and lock equality first.
- RED: https://github.com/rickylabs/netscript/actions/runs/31365789097; GREEN: https://github.com/rickylabs/netscript/actions/runs/31365881454.
- Formal separate-session IMPL-EVAL passed; the PR stays draft at `status:impl-eval`. The supervisor owns the ready-for-review transition and verification of the then-materialized required contexts.
- Slice 3.7 hardens token scope only. The unchanged main/release/workflow-dispatch path still reaches the guarded deploy job, whose job-local permissions satisfy Pages deployment; reasoning from the definition is the required deploy evidence, not a live deploy.
- Slice 3.8 concurrency expression properties: `github.event_name == 'pull_request' && github.ref` gives each PR its own ref-derived group; `|| 'deploy'` collapses push, release, and workflow-dispatch into one serialized deploy group; `cancel-in-progress: false` queues rather than cancels overlapping members.
- Box 1 evidence must not call Pages `build` required. RED run 31365789097 proves PR execution/failure; ruleset 18459345 makes `quality` required, and the supervisor will verify its source-check/test steps execute successfully after ready-for-review.
