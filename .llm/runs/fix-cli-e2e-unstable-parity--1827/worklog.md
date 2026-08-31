# Worklog: #1827 CLI/E2E compiler-lib parity

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-cli-e2e-unstable-parity--1827` |
| Branch | `fix/cli-e2e-unstable-parity` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Design

### Public Surface

- No public surface changes. The only behavioral contract is an E2E configuration invariant.

### Domain Vocabulary

- `DenoConfig` — minimal local test shape containing `compilerOptions.lib`.
- compiler-lib parity — exact value and ordering equality with production CLI configuration.

### Ports

- None; the test uses `Deno.readTextFile` on checked-in local configuration.

### Constants

- None; expected finite values intentionally come from production `packages/cli/deno.json` rather
  than a copy.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove missing compiler-lib parity with a focused failing test. | focused test exits nonzero for array mismatch | `packages/cli/e2e/tests/config-lib-parity_test.ts`, run artifacts |
| 2 | Restore exact production order and prove all requested gates. | focused/relevant/Tier-A-prep/isolated-check gates exit 0 | `packages/cli/e2e/deno.json`, run artifacts |

### Deferred Scope

- Features #1762 implementation and all health/runtime changes remain with their owning lane.

### Contributor Path

Start at `packages/cli/e2e/tests/config-lib-parity_test.ts`; production
`packages/cli/deno.json` remains the single expected-list authority, and member parity is restored
in `packages/cli/e2e/deno.json`.

## Plan Gate

`PLAN-EVAL: N/A` by owner ruling: this is a mechanical config leaf with fixed contract, exact scope,
acceptance criteria, commit sequence, and gates. The supervisor owns the separate IMPL-EVAL.

## Evidence

The earlier RED receipt from commit `86443f47a` and GREEN commit `bbed08071` are invalid because the
test used repository-root `deno.json` as its oracle. Those commits were pushed before the supervisor
stop/correction arrived. They are superseded in local history and must not be used as gate evidence.

Corrected RED and GREEN commands, real exits, and counts are recorded below as they run.

### Corrected Slice 1 — RED

Command (real exit captured without a pipeline):

```bash
out=$(deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/config-lib-parity_test.ts 2>&1); rc=$?
```

| Gate | Exit | Counts | Result |
| --- | ---: | --- | --- |
| Focused CLI-oracle parity test before config change | 1 | 0 passed, 1 failed, 0 ignored; 1 total / 1 unique failure | Expected RED. Actual `["deno.ns", "dom"]`; programmatically read expected `["deno.ns", "deno.unstable", "dom"]`; assertion diff showed only the missing middle `deno.unstable`. |

At capture, `git status --short` showed only run-artifact edits; the config path was absent.
`git diff --exit-code -- packages/cli/e2e/deno.json` and
`git diff --exit-code -- deno.lock` both exited 0. `HEAD` and disk therefore both contained the
pre-fix `["deno.ns", "dom"]` array. This receipt supersedes every earlier RED claim.

### Corrected Slice 2 — pending

Apply the one-line config fix only after this RED receipt is committed. Then recapture GREEN and all
final-freeze gates; do not reuse earlier GREEN results.
