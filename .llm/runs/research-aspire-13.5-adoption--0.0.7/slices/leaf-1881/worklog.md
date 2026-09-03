# Worklog: root README Quickstart clean-runner walk

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `research-aspire-13.5-adoption--0.0.7/slices/leaf-1881` |
| Branch | `test/aspire-1881-readme-quickstart` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | docs |

## Design

### Public Surface

- `parseReadmeQuickstartCommands(markdown)` — pure extraction of line-aware executable commands.
- `README_QUICKSTART_EXPECTED_COMMANDS` — stable ordered contract consumed by the drift test/suite.
- `createReadmeQuickstartSuite()` — built-in hosted published-CLI suite.
- CLI suite id `readme.quickstart` and stable gate ids/titles.

### Domain Vocabulary

- `ReadmeQuickstartCommand` — exact command text plus its one-based README line number.
- `ReadmeQuickstartSubstitutions` — the only authorized `<version>` and `<port>` values.
- Command evidence — argv, cwd, exit, duration, and bounded stdout/stderr captured by each gate.

### Ports

- Existing `CommandExecutor` — process edge and bounded output capture.
- Existing `Reporter` — carries earlier command evidence used by the later port substitution.
- Existing cleanup command gate — exact-AppHost and resource-ownership proof.

No new external port is introduced.

### Constants

- `QUICKSTART.README` / `QUICKSTART_TITLE.README` — suite identity.
- `GATE.README_QUICKSTART_*` — one stable id per README command.
- `README_QUICKSTART_EXPECTED_COMMANDS` — exact marker-block sequence.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Activate the leaf run with current research/design and `PLAN-EVAL: N/A`. | Artifact review + coordinator-specified static gates before push | leaf run artifacts |
| 1 | Prove marker parsing and executable readiness are exact and line-aware. | Parser unit tests, drift test, carrier check | `README.md`, parser/tests, leaf artifacts |
| 2 | Prove `readme.quickstart` registers one no-retry receipt gate per printed command and preserves cleanup. | Full scoped tests + `suites`/`gates` + quality gate | suite, runtime edge, registry/constants/tests/docs, leaf artifacts |
| 3 | Wire the hosted clean runner and artifact/failure trail. | Workflow inspection + full pre-push gate set | `.github/workflows/e2e-cli-prod.yml`, leaf artifacts |

### Deferred Scope

- Hosted runtime transcript — deferred to the next canary because this slice has no runtime lease.
- Issue acceptance mirroring / ready-to-merge transition — supervisor-owned after hosted evidence and
  separate-session IMPL-EVAL.

### Contributor Path

Edit commands only inside the root README markers, update the expected command contract, and run the
presentation drift test. Add execution behavior through the `readme.quickstart` suite while keeping
all parsing pure and all runtime IO in the gate command layer.

### Archetype 6 Existing Spine and Axes

This slice adds no spine abstract, layer-2 abstract, registry, adapter, export, permission, or
composition-root change. It consumes the existing E2E `CommandExecutor`, reporters, suite registry,
and CLI constants. Existing vertical feature catalog and extension axes are unchanged.

## Plan-Gate

`PLAN-EVAL: N/A` — the coordinator supplied a current baseline, exact goal, locked substitutions,
file scope, gate list, cleanup invariant, commit order, hosted-runtime boundary, and PR contract.
There is no material architecture or scope decision left for adversarial planning.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-03 | 0 | bootstrap | Verified HEAD and remote `main` at `79adb103b`; read harness/doctrine/tooling contracts and Aspire 13.5.3 wait help. |
| 2026-09-03 | 0 | pre-push gates | Check 223 files PASS; tests 302/302 PASS; fmt 223 files PASS; suites/gates listings PASS; lint wrapper refused seven unchanged desktop fixture files with zero findings. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Use executable `aspire wait postgres --status healthy --timeout 60`. | Exact CLI 13.5.3 help supports it. | Aspire help + coordinator item 4 |
| Preserve cleanup unchanged. | Foreign/unknown ownership behavior is already centralized. | `createCleanupGates()` + #1855 doctrine |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Parent research file named by the brief is absent in this baseline. | minor | yes |

## Gate Results

### Static Gates

| Gate | Result | Notes |
| --- | --- | --- |
| Scoped check | PASS | 223 files, 2 batches, 0 diagnostics. |
| Full CLI E2E unit tests | PASS | 302 passed, 0 failed. |
| Scoped lint | FAIL (baseline tooling refusal) | 0 lint findings; existing standalone desktop fixture cannot resolve root `catalog:` entry. Logged in `drift.md`. |
| Scoped format | PASS | 223/223 files processed, 0 findings. |

### Consumer Gates

| Gate | Result | Notes |
| --- | --- | --- |
| `e2e:cli suites` | PASS | Existing suite registry prints successfully. |
| `e2e:cli gates quickstart.walk` | PASS | Existing gate registry prints without starting runtime resources. |

### Runtime Gates

| Gate | Result | Notes |
| --- | --- | --- |
| Runtime suites | NOT_RUN | No runtime lease; hosted next-canary proof only. |

## Handoff Notes

- Review parser fail-closed behavior, one-command/one-attempt evidence, prior-evidence port
  extraction, process lifecycle, and unchanged cleanup first.
