# Docs eval loop fix — worklog

## Identity

- Worktree: `/home/codex/repos/wt-docs-eval-fix`
- Branch: `fix/docs-eval-loop`
- Baseline: `fbb32119` (`origin/main` at slice start)
- Implementer: Codex GPT-5.6 Sol, medium
- Supervisor/reviewer: Fable 5 orchestrator `86d308d5`

## Design

- Public surface: GitHub Actions event and check behavior only.
- Domain vocabulary: eligible docs PR, ready transition, explicit re-request, head SHA, durable
  dispatch claim, skipped-on-demand result, actionable dispatch failure.
- Ports: GitHub pull-request events, issue comments, Actions checks, repository secrets.
- Constants: existing workflow name/check name, `docs-eval:skip`, `ci:full`, Minimax M3 open-model
  route, per-head marker.
- Commit slice: one workflow/test slice proving the event matrix, durable per-SHA dedupe, escape
  hatches, and failure semantics.
- Deferred scope: no evaluator dispatch, no merge, no release, no milestone closure.
- Contributor path: workflow policy remains visible in `.github/workflows/docs-openhands-eval.yml`;
  any extracted decision helper will be colocated with focused tests.

## Evidence log

### Diagnosis

- Pulled live PR/workflow/job/comment evidence for #858, #861, and #862 through the GitHub API via
  `resolveGithubToken()`.
- Confirmed trigger storm counts: #858 1, #861 14, #862 18 trigger markers.
- Confirmed every sampled downstream job failed before a verdict with
  `ModuleNotFoundError: No module named 'fastapi'`, not model credits/auth/timeout.
- Reviewed #806 body, patch, run artifacts, and review lineage. Preserved its trusted-base prompt,
  PAT-only chain, open-model route, and skip label; replaced its answered-trigger reopening rule.

### Implementation

- `.github/workflows/docs-openhands-eval.yml`
  - listens only to `ready_for_review` and exact authorized `/docs-eval rerun` PR comments;
  - accepts docs labels or `ci:full`, honors `docs-eval:skip`;
  - serializes by PR and treats any per-head marker as a permanent claim;
  - retains PAT-only chainability and trusted-base evaluator instructions.
- `.github/workflows/openhands-agent.yml`
  - explicitly installs FastAPI, the missing LiteLLM MCP import dependency observed in all sampled
    failures.
- `.llm/tools/agentic/openhands/docs-eval-workflow_test.ts`
  - models the event matrix and asserts the workflow's durable claim and runner dependency.

### Event matrix

| Event/state                                     | Result                             |
| ----------------------------------------------- | ---------------------------------- |
| Draft opened                                    | no workflow dispatch               |
| Draft synchronize/push                          | no workflow dispatch               |
| Arbitrary label added                           | no workflow dispatch               |
| Eligible PR transitions ready, no marker        | one dispatch                       |
| Eligible PR transitions ready, `docs-eval:skip` | attributed skip; no dispatch       |
| Eligible `ci:full` PR transitions ready         | one dispatch                       |
| Authorized exact `/docs-eval rerun`, no marker  | one dispatch                       |
| Unauthorized or non-exact comment               | no workflow dispatch               |
| Ready/comment race for one head                 | serialized; one marker/trigger     |
| Any later event for an already marked head      | durable dedupe; no second dispatch |

### Gate evidence

| Gate                      | Command                                                                                    | Result                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Event/dedupe/runner tests | `deno test --no-lock --allow-read .llm/tools/agentic/openhands/docs-eval-workflow_test.ts` | PASS, 4/4                                                 |
| YAML parse                | `deno eval --no-lock` with `jsr:@std/yaml` over both edited workflows                      | PASS, 2/2                                                 |
| Focused format            | `deno fmt --check` on both workflows, test, research, worklog                              | PASS after focused formatting                             |
| Whitespace                | `git diff --check`                                                                         | PASS                                                      |
| Actionlint                | `command -v actionlint`                                                                    | NOT AVAILABLE; YAML parse + focused structural tests used |
| Volatile config guard     | `deno test --no-lock --allow-read .llm/tools/agentic/config/no-hardcoded-volatile_test.ts` | PASS, 4/4                                                 |

### Reconcile / handoff

- No evaluator was dispatched; supervisor owns opposite-family review and formal evaluation.
- No merge, release operation, milestone closure, or #824 board action was performed.
- Draft PR creation and gate-evidence comment follow after the final local gate rerun and commit.
