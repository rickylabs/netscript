# Plan: root README Quickstart clean-runner walk

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `research-aspire-13.5-adoption--0.0.7/slices/leaf-1881` |
| Branch | `test/aspire-1881-readme-quickstart` |
| Phase | `plan` |
| Target | `packages/cli/e2e`, root README, production E2E workflow |
| Archetype | `6 - CLI / Tooling` (nested E2E harness) |
| Scope overlays | docs |

## Archetype

Archetype 6 applies because this is executable CLI gate infrastructure. The nested E2E workspace is
not independently published, but it preserves the package's CLI/tooling gate boundaries: parsing is
pure, process and filesystem IO remain at the gate runtime edge, and suite registration uses stable
constants.

## Current Doctrine Verdict

`packages/cli` is **Keep**: preserve the Archetype-6 kernel/surface split. The known
`packages/cli/e2e` scaffold-runtime cardinality debt is not touched or deepened.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A6/A7 | The parser must encode README policy without wrapping or retrying commands. |
| A8 | Parser, runtime execution, suite composition, and tests keep one reason per file. |
| A13 | Every printed command fails explicitly at its README line; no recovery hides the boundary. |
| A14 | Drift tests and hosted receipts preserve the documentation contract. |

## Goal

Make the GitHub-hosted production E2E runner execute the root README Quickstart command sequence in
order, once per command, with only the two authorized placeholder substitutions and unchanged
foreign-resource cleanup behavior.

## Scope

- Add README executable-block markers and a printed Aspire readiness command.
- Add a pure, line-aware README command parser with unit tests.
- Add and register `readme.quickstart`, its stable suite/gate constants, drift test, and docs row.
- Add the hosted workflow step, failure-summary inputs, and artifacts as the last commit.
- Preserve per-command command-gate receipts and append `createCleanupGates()` unchanged.

## Non-Scope

- Product code outside `packages/cli/e2e`, plugins, lockfiles, generated files, release refs, tags,
  publish surfaces, Canary 8, and any local runtime suite execution.
- Retry, poll-loop, manual recovery, or undocumented cleanup behavior.

## Hidden Scope

- The curl placeholder must resolve from prior scaffold/run evidence without adding a README command.
- `aspire start` must use the established bounded process edge while remaining one printed command.
- README carrier checks may require the prescribed generator chain; generated outputs are never
  hand-edited.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Parser returns ordered line-aware commands from marked `bash` fences and drops full-line comments/output examples. | Enables exact drift and line-named failures without IO in the parser. |
| D2 | Substitute only `<version>` from the exact requested JSR CLI and `<port>` from captured prior command evidence. | Matches the coordinator's allowed drift contract. |
| D3 | One command gate per parsed README command; `cd` gates validate/change the logical cwd for subsequent gates; no retry policies. | Preserves README order and one verdict per printed line. |
| D4 | Reuse the existing bounded process handling pattern for the long-running Aspire command and append `createCleanupGates()` unchanged. | Keeps runtime lifecycle and cleanup at established edges. |
| D5 | Hosted workflow is an isolated final commit. | Preserves the workflow-credential handoff boundary. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Readiness syntax | resolved now | CLI 13.5.3 help proves `aspire wait postgres --status healthy --timeout 60`. |
| Runtime proof | safe to defer | Explicitly owned by the next hosted canary; no local lease granted. |
| README carrier regeneration | resolved during gates | Run the carrier check and prescribed chain only if the marker edit moves a carrier. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A parser silently accepts prose or unsupported shell | Fail closed on marker/fence structure and unsupported executable lines; unit-test line numbers and comments. |
| Port substitution guesses a default | Extract it from prior captured command evidence; fail at the README curl line if absent or ambiguous. |
| Aspire command hangs | Use the existing bounded subprocess pattern without retry. |
| Cleanup affects foreign resources | Reuse `createCleanupGates()` without alteration. |
| Workflow push lacks scope | Keep workflow last; report one exact rejected push and do not retry with alternate credentials. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-11/AP-25 | risk | Pure parser has no IO; gate runtime edge owns reads/spawns. |
| AP-18 | risk | Assert semantic ordered commands and line numbers, not a giant README snapshot. |
| AP-21 | risk | Add the suite beside the existing quickstart suite; do not grow the known scaffold gate directory. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-10 | yes | Scoped source/test wrappers; focused files remain bounded. |
| F-3/F-11/F-16 | yes | `quality:gate`, structural review; no new forbidden folder/cardinality debt. |
| F-CLI process-edge rules | yes | Manual review plus `quality:gate`; no IO in the pure parser. |
| F-6/F-7 | N/A | No published surface changes. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `scaffold-runtime-a8-f16-1333` | none | This slice does not edit the over-cap runtime registry or scaffold gate folder. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | check/test/lint/fmt | Coordinator-specified scoped `run-deno-*` commands | PASS |
| 2 | CLI surface | `deno task e2e:cli suites` and `gates readme.quickstart` | Suite and ordered gates print without runtime start |
| 3 | doctrine | `deno task quality:gate` | PASS or only unchanged recorded baseline debt |
| 4 | carrier | `deno task check:agent-docs-prose` and prescribed chain if required | PASS |
| 5 | runtime | Hosted `e2e-cli-prod.yml` at next canary | Deferred, never run locally |

## Dependencies

- Aspire CLI 13.5.3, exact published `jsr:@netscript/cli@<version>`, GitHub-hosted Ubuntu runner.

## Drift Watch

- Any unprinted setup command, retry, port guess, parser rewrite beyond `<version>`/`<port>`, cleanup
  change, carrier movement, or mismatch with the pinned coordinator baseline.
