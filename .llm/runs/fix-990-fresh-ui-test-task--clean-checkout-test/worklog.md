# Worklog: fresh-ui clean-checkout test task

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-990-fresh-ui-test-task--clean-checkout-test` |
| Branch | `fix/990-fresh-ui-test-task` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `none` |

## Design

### Public Surface

- No exported function, type, or entrypoint changes.
- The developer-facing surface is the existing `deno task test` command.

### Domain Vocabulary

- `test task capability contract` — permissions required by subprocess integration tests.
- `workspace temp parent` — ignored in-repo directory that the test must establish itself.

### Ports and Constants

- Ports: none; the test directly exercises Deno filesystem/process primitives.
- Constants: retain `REPO_ROOT`, `CLI_ENTRY`, and `REGISTRY_ROOT`; introduce no speculative value.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Self-contained fresh-ui integration test task | Three owner-specified scoped commands | `packages/fresh-ui/deno.json`; `packages/fresh-ui/tests/registry/markdown-renderer.test.ts`; run artifacts |

### Deferred Scope

- Product source, exported APIs, browser E2E, scaffold output, CI, and unrelated package debt.

### Contributor Path

Future subprocess integration tests belong under `tests/` and may rely on the documented
read/write/run task capabilities, but must create every ignored or temporary parent they require.

## Progress Log

| Date | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | 1 | research | Reproduced missing write, then run permission, and absent `.llm/tmp` independently. |
| 2026-08-01 | 1 | plan amendment | Replaced reflexive `--allow-all` with measured read/write/run; recorded `.llm/tmp` location as owner-imposed and added publish dry-run evidence. |
| 2026-08-01 | 1 | implementation | Added the scoped task permissions and recursive creation of the existing temp parent. |
| 2026-08-01 | 1 | clean-checkout gate | Removed `.llm/tmp`; full task passed 166 tests in 5m59s with read/write/run only. |
| 2026-08-01 | 1 | static gates | Scoped check passed 149 files; lint checked 149 files; publish dry-run succeeded with `--allow-dirty`. |
| 2026-08-01 | 1 | slice review | Initial review blocked the JSONC comment because repo release tools strict-parse manifests; moved the rationale into the affected test file. |

## Gate Results

### Static Gates

| Gate | Command | Result | Notes |
| --- | --- | --- | --- |
| Type-check | `deno run -A .llm/tools/run-deno-check.ts --root packages/fresh-ui --ext ts,tsx` | PASS | 149 files, 2 batches, 0 failed batches/diagnostics. |
| Lint | `deno lint packages/fresh-ui` | PASS | `Checked 149 files`. |
| Publish config | `deno publish --dry-run --allow-dirty` from `packages/fresh-ui` | PASS (pre-final-fix) | Ran before the JSONC comment was removed. Removing the comment narrows toward baseline strict JSON; final-state `publish:readiness`, `check:publish-assets`, and evaluator `JSON.parse` all pass. |
| Publish readiness | `deno task publish:readiness` | PASS | All gates PASS; final `{"gate":"publish-readiness","ok":true,"version":"0.0.2"}`. |
| Publish assets | `deno task check:publish-assets` | PASS | Exit 0 after removing the JSONC manifest comment. |

### Fitness and Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| AP-19 / F-9 permissions | PASS | Task grants read/write/run only; full suite passed. | Read resolves suite/files, write owns temp workspaces, run spawns Deno children; no env/net. |
| F-10 clean test shape | PASS | Exact `.llm/tmp` removal followed by full task. | Test recursively establishes its ignored parent. |
| Full package tests | PASS | `ok | 166 passed | 0 failed (5m59s)` | Both subprocess integration tests passed. |
| Broader harness quality gates | NOT_RUN | Owner constraint in `supervisor.md`/`drift.md`. | No product source changed. |

### Reconcile Note

- Slice scope remains exactly two implementation files plus required run artifacts. No public
  surface, dependency, scaffold, or architecture debt changed. Issue #990 acceptance evidence is
  complete locally; PR creation is intentionally reserved for the owner.

## Handoff Notes

- IMPL-EVAL should inspect the test-file capability comment, parent creation ordering, clean-parent
  166-test pass, and restored lock hygiene.
