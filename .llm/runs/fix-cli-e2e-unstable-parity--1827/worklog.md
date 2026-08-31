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

### Corrected Slice 2 — GREEN and final freeze

The honest RED is commit `4c0db7fea`. The one-line production-order config fix is commit
`27285b72a`, producing exactly `['deno.ns', 'deno.unstable', 'dom']`. Exact main
`a3e0a5aa8beebbd1f7a488d564d31980a7d74619` was integrated only after GREEN, in merge commit
`fef770b18`.

All commands below used `out=$(command 2>&1); rc=$?` and reported `rc` separately; no gate used a
pipeline.

| Gate | Exact command | Exit | Counts / observation |
| --- | --- | ---: | --- |
| Focused GREEN | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/config-lib-parity_test.ts` | 0 | 1 passed, 0 failed, 0 ignored |
| Existing check-runner tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/run-deno-check_test.ts` | 0 | 3 passed, 0 failed, 0 ignored |
| CLI/E2E scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts,tsx` | 0 | 185 files, 2 batches, 0 failed, 0 diagnostics |
| CLI/E2E scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/e2e --ext ts,tsx --exclude '^packages/cli/e2e/fixtures/desktop-native/'` | 0 | 178 files processed, 0 dropped/refused, 0 findings |
| CLI/E2E scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx` | 0 | 185 files, 2 batches, 0 findings |
| Package-path quality gate | `deno task quality:gate` | 0 | quality scan: 0 findings; doctrine: repository roots report `FAIL=0` |
| Generated agent-doc prose | `deno task check:agent-docs-prose` | 0 | 639 site files; `fresh: true`, zero stale paths |
| Generated assets barrel | `deno task check:assets-barrel` | 0 | fresh |
| Generated publish assets | `deno task check:publish-assets` | 0 | fresh |
| Generated MCP export corpus | `deno task check:mcp-export-corpus` | 0 | 35 packages, 271 subpaths, 7,677 symbols; sha256 `3a3ff013a8149db1e832166646a7fb4056da210a4f1b178bfa980d337a2d380a` |
| Cold full check | `DENO_DIR=/tmp/netscript-1827-final-check.ccLig9 deno task check` | 0 | 2,971 files, 25 batches, 0 failed batches, 0 diagnostics; directory was created immediately before the command with `mktemp -d` |

The first broad lint diagnostic, before applying the nested-workspace exclusion, exited 2 with zero
lint occurrences because seven files under `fixtures/desktop-native/` use a standalone config that
is not a root-workspace member and cannot resolve its local `zod` catalog. It is not counted as a
passing gate. The recut above excludes exactly that nested fixture and fully processes the remaining
178 CLI/E2E workspace files.

### #1762 originating-root proof

This proof ran in a disposable detached worktree at the actual current #1762 head
`686eedb62db189907936dee8a0edc5acf295529a`, not at this leaf's older RED base. Its checked-in E2E
config was the pre-fix `['deno.ns', 'dom']`.

Deno's resolved graph for the one failing initiating root was:

```text
packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts
 -> packages/cli/src/public/features/root/public-command-tree.ts
 -> packages/cli/src/public/features/root/public-command-dependencies.ts
 -> packages/cli/src/kernel/adapters/config/plugin-registry.ts
 -> packages/plugin/mod.ts
 -> packages/service/mod.ts
 -> packages/service/src/primitives/health.ts
```

Before, with `/tmp/netscript-1827-feature-red-deno.SYtvoo` created as an isolated `DENO_DIR`:

```bash
out=$(DENO_DIR=/tmp/netscript-1827-feature-red-deno.SYtvoo deno check --unstable-kv packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts 2>&1); rc=$?
```

`rc=1`; the only diagnostic was TS2551 at `packages/service/src/primitives/health.ts:184:29`,
stating that `Deno.openKv` was absent and `deno.unstable` should be added to `lib`. The original
full `deno task check` in the same pre-fix tree also exited 1: 2,974 files, 25 batches, one failed
batch, the same sole diagnostic.

After inserting only `deno.unstable` between `deno.ns` and `dom` in that disposable copy, the
identical initiating-root command exited 0. The identical full command:

```bash
out=$(DENO_DIR=/tmp/netscript-1827-feature-red-deno.SYtvoo deno task check 2>&1); rc=$?
```

also exited 0: 2,974 files, 25 batches, zero failed batches and zero diagnostics. No #1762-owned
working tree or source file was modified; the temporary config edit exists only to provide the
controlled before/after.

### Lock and hard non-scope

| Proof | Exact comparison | Exit / result |
| --- | --- | --- |
| Lock byte identity | `git diff --exit-code 0274c0a707e36ded3b4470a3911315f963e642d4 -- deno.lock` | 0 |
| Lock worktree identity | `git diff --exit-code -- deno.lock` | 0 |
| Forbidden files | `git diff --exit-code a3e0a5aa8beebbd1f7a488d564d31980a7d74619 -- packages/service/src/primitives/health.ts .llm/tools/run-deno-check.ts` | 0 |
| #1762-owned package roots | `git diff --exit-code a3e0a5aa8beebbd1f7a488d564d31980a7d74619 -- packages/contracts packages/plugin packages/service packages/sdk packages/mcp` | 0 |
| Leaf product paths | `git diff --name-only a3e0a5aa8beebbd1f7a488d564d31980a7d74619 -- packages plugins` | 0; only `packages/cli/e2e/deno.json` and `packages/cli/e2e/tests/config-lib-parity_test.ts` |
| Final-freeze main ancestry | `git merge-base --is-ancestor a3e0a5aa8beebbd1f7a488d564d31980a7d74619 HEAD` | 0 |
