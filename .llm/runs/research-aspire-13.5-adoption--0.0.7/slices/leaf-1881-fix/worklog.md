# Worklog: readme.quickstart install-root isolation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix` |
| Branch | `fix/aspire-1881-readme-install-isolation` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Design

### Public Surface

- No published surface changes.
- Internal gate entry: `executeReadmeQuickstartCommand`, extended with an optional command runner.
- Shared edge: `runAspireCommand`, extended with optional environment variables.

### Domain Vocabulary

- `ReadmeWalkState.denoInstallRoot` — persisted run-owned install root.
- `ReadmeCommandReceipt.environment` — hosted isolation evidence.
- `AspireCommandRunner` — injectable command edge; extended only as needed for optional env.

### Ports

- The existing command runner is the process seam. The README executor receives it as an optional
  parameter defaulting to the real runner; tests supply a recording fake.

### Constants

- `DENO_INSTALL_DIRECTORY = '.deno-install'` (if a named constant improves the final code).
- PATH separator comes from `@std/path` `DELIMITER`; no local platform abstraction.

### Archetype 6 checkpoint applicability

This nested E2E leaf does not change the CLI's five spine abstracts, layer-2 abstracts, feature
catalog, extension registries, public command surface, composition, generated outputs, or permission
contract. Those checklist fields are N/A for this gate-only patch. The relevant existing process
port is the command runner, and the semantic test asserts argv plus environment rather than a giant
snapshot.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | RED recording spawn contract | focused test exits non-zero for absent env | focused test, minimal seam, run artifacts |
| 2 | GREEN isolated command environment and receipt | focused + existing tests exit 0 | two gate source files, run artifacts |
| 3 | Scoped validation and separate evaluation | requested wrapper/listing commands + IMPL-EVAL | run artifacts |

### Deferred Scope

- Hosted production rerun, cleanup behavior, README content, workflow install ownership, and issue
  closure remain outside this leaf.

### Contributor Path

Future README command execution changes start in `readme-command.ts`, use the injected command seam,
and add semantic assertions in the focused application test; shared subprocess options belong in
`aspire-walk.ts`.

## Plan Gate

`PLAN-EVAL: N/A` recorded before implementation. This is a small mechanical fix whose exact red,
cause, contract, test assertions, scope, gates, and prohibited alternatives were owner-decided.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-03 | bootstrap | complete | Clean requested branch at exact base; required skills/doctrine/harness files read. |
| 2026-09-03 | 1 | RED | Recording runner drove README indexes 0 and 1 without real subprocesses. Focused structured test exited 1: expected `DENO_INSTALL_ROOT=<temp>/run/.deno-install`, actual `undefined`; 0 passed, 1 failed. Exact install argv and absence of `-f` passed before the environment assertion. |

## Gate Results

### RED

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| Focused recording-spawn test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-read --allow-write --allow-env packages/cli/e2e/tests/application/readme-command_test.ts` | EXPECTED FAIL (exit 1) | Structured summary: 0 passed, 1 failed; `DENO_INSTALL_ROOT` actual `undefined`, expected `<runRoot>/.deno-install`. |

## Handoff Notes

Evaluator should inspect argv preservation, cross-index state persistence, optional-env default
behavior, receipt evidence, and the prohibition on runtime execution.
