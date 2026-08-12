# Slice D — #1428 evidence

Date: 2026-08-12
Worktree: `/home/codex/repos/ns006-f-d-island`
Branch: `fix/1428-db-island-emitted-imports`
Base: `01aa12b67e36b643e1ca4f94421ecba07e030db5`

## Design and scope

- Archetype: 6 (CLI/tooling).
- PLAN-EVAL: N/A per the issue/run D-2 specification; the contract, acceptance, and gates were
  already locked.
- IMPL-EVAL: owner waiver is conditional on the executable negative controls below.
- Fixture choice: extend the existing semantic fixture with a Postgres-backed service scaffold.
  The additional scaffold increased the focused Deno test runtime from 415–429 ms to 792–825 ms,
  keeping the guard sub-second after warmup while checking memory and DB variants in one place.
- Import resolution: relative imports resolve from the emitted source; import-map aliases resolve
  through the emitted app's `deno.json`; scheme-bearing imports (`npm:`, `jsr:`, and other URL
  schemes) are external and are not treated as emitted-tree paths; unmapped bare specifiers fail.

## Negative controls

Every template mutation below was followed by `deno task gen:assets-barrel` and real execution of:

```text
deno test -A packages/cli/src/public/features/root/public-command-tree_test.ts
```

### Before fix: DB-only break stayed green

Mutation in `ServiceShowcaseLab.tsx.template`:

```diff
-} from '../(_lib)/optimistic-list-mutation.ts';
+} from '../service/(_lib)/optimistic-list-mutation.ts';
```

Output (exit 0):

```text
Task gen:assets-barrel deno run --no-lock --allow-read --allow-write --allow-run=deno .llm/tools/generate-cli-assets-barrel.ts
Check packages/cli/src/public/features/root/public-command-tree_test.ts
running 3 tests from ./packages/cli/src/public/features/root/public-command-tree_test.ts
public root command reports the package version ... ok (22ms)
public init --dry-run leaves the target directory absent ... ok (28ms)
public init emits resolvable app conventions with and without the example service ... ok (354ms)

ok | 3 passed | 0 failed (415ms)

real 4.58
user 8.24
sys 1.02
```

This is the falsified pre-fix guard: the DB template was broken, but `--db none` never emitted it.

### After fix: DB-backed island break goes red

Same DB template mutation. Output (exit 1):

```text
Task gen:assets-barrel deno run --no-lock --allow-read --allow-write --allow-run=deno .llm/tools/generate-cli-assets-barrel.ts
Check packages/cli/src/public/features/root/public-command-tree_test.ts
running 3 tests from ./packages/cli/src/public/features/root/public-command-tree_test.ts
public root command reports the package version ... ok (20ms)
public init --dry-run leaves the target directory absent ... ok (27ms)
public init emits resolvable app conventions with and without the example service ... FAILED (350ms)

ERRORS

public init emits resolvable app conventions with and without the example service => ./packages/cli/src/public/features/root/public-command-tree_test.ts:54:6
error: Error: Unresolved emitted import: routes/examples/users/(_islands)/ServiceShowcaseLab.tsx imports ../service/(_lib)/optimistic-list-mutation.ts but routes/examples/users/service/(_lib)/optimistic-list-mutation.ts does not exist
        throw new Error(
              ^
    at assertExampleImportsResolve (file:///home/codex/repos/ns006-f-d-island/packages/cli/src/public/features/root/public-command-tree_test.ts:209:15)
    at async file:///home/codex/repos/ns006-f-d-island/packages/cli/src/public/features/root/public-command-tree_test.ts:135:5

FAILURES

public init emits resolvable app conventions with and without the example service => ./packages/cli/src/public/features/root/public-command-tree_test.ts:54:6

FAILED | 2 passed | 1 failed (409ms)

error: Test failed
```

### Memory island unchanged: its break still goes red

Mutation in `ServiceShowcaseLab.memory.tsx.template` used the same broken relative specifier. Output
(exit 1):

```text
Task gen:assets-barrel deno run --no-lock --allow-read --allow-write --allow-run=deno .llm/tools/generate-cli-assets-barrel.ts
Check packages/cli/src/public/features/root/public-command-tree_test.ts
running 3 tests from ./packages/cli/src/public/features/root/public-command-tree_test.ts
public root command reports the package version ... ok (30ms)
public init --dry-run leaves the target directory absent ... ok (43ms)
public init emits resolvable app conventions with and without the example service ... FAILED (319ms)

ERRORS

public init emits resolvable app conventions with and without the example service => ./packages/cli/src/public/features/root/public-command-tree_test.ts:54:6
error: Error: Unresolved emitted import: routes/examples/users/(_islands)/ServiceShowcaseLab.tsx imports ../service/(_lib)/optimistic-list-mutation.ts but routes/examples/users/service/(_lib)/optimistic-list-mutation.ts does not exist
        throw new Error(
              ^
    at assertExampleImportsResolve (file:///home/codex/repos/ns006-f-d-island/packages/cli/src/public/features/root/public-command-tree_test.ts:209:15)
    at async file:///home/codex/repos/ns006-f-d-island/packages/cli/src/public/features/root/public-command-tree_test.ts:124:5

FAILURES

public init emits resolvable app conventions with and without the example service => ./packages/cli/src/public/features/root/public-command-tree_test.ts:54:6

FAILED | 2 passed | 1 failed (403ms)

error: Test failed
```

### Broken non-relative specifier goes red

Mutation in the DB island:

```diff
-} from '../(_lib)/optimistic-list-mutation.ts';
+} from 'broken/optimistic-list-mutation.ts';
```

Output (exit 1):

```text
Task gen:assets-barrel deno run --no-lock --allow-read --allow-write --allow-run=deno .llm/tools/generate-cli-assets-barrel.ts
Check packages/cli/src/public/features/root/public-command-tree_test.ts
running 3 tests from ./packages/cli/src/public/features/root/public-command-tree_test.ts
public root command reports the package version ... ok (28ms)
public init --dry-run leaves the target directory absent ... ok (50ms)
public init emits resolvable app conventions with and without the example service ... FAILED (598ms)

ERRORS

public init emits resolvable app conventions with and without the example service => ./packages/cli/src/public/features/root/public-command-tree_test.ts:54:6
error: Error: Unresolved emitted import-map specifier: routes/examples/users/(_islands)/ServiceShowcaseLab.tsx imports broken/optimistic-list-mutation.ts
    throw new Error(
          ^
    at resolveEmittedTreeImport (file:///home/codex/repos/ns006-f-d-island/packages/cli/src/public/features/root/public-command-tree_test.ts:241:11)
    at assertExampleImportsResolve (file:///home/codex/repos/ns006-f-d-island/packages/cli/src/public/features/root/public-command-tree_test.ts:202:26)
    at async file:///home/codex/repos/ns006-f-d-island/packages/cli/src/public/features/root/public-command-tree_test.ts:135:5

FAILURES

public init emits resolvable app conventions with and without the example service => ./packages/cli/src/public/features/root/public-command-tree_test.ts:54:6

FAILED | 2 passed | 1 failed (698ms)

error: Test failed
```

### Legitimate npm:/jsr: specifiers do not false-positive

Temporary DB-island imports:

```ts
import 'npm:example-package';
import 'jsr:@example/package';
```

Output (exit 0):

```text
Task gen:assets-barrel deno run --no-lock --allow-read --allow-write --allow-run=deno .llm/tools/generate-cli-assets-barrel.ts
Check packages/cli/src/public/features/root/public-command-tree_test.ts
running 3 tests from ./packages/cli/src/public/features/root/public-command-tree_test.ts
public root command reports the package version ... ok (26ms)
public init --dry-run leaves the target directory absent ... ok (49ms)
public init emits resolvable app conventions with and without the example service ... ok (808ms)

ok | 3 passed | 0 failed (892ms)
```

The temporary imports were then removed and the barrel regenerated.

### Restored final focused run

Output (exit 0):

```text
Task gen:assets-barrel deno run --no-lock --allow-read --allow-write --allow-run=deno .llm/tools/generate-cli-assets-barrel.ts
running 3 tests from ./packages/cli/src/public/features/root/public-command-tree_test.ts
public root command reports the package version ... ok (26ms)
public init --dry-run leaves the target directory absent ... ok (51ms)
public init emits resolvable app conventions with and without the example service ... ok (736ms)

ok | 3 passed | 0 failed (825ms)
```

`git diff` against `origin/main` for both island templates and
`packages/cli/src/kernel/assets/embedded.generated.ts` was empty after restoration.

## Required gates

### `rtk proxy deno task check`

Exit 0. Complete emitted verdict:

```text
Task check deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx --exclude "^(.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)"
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-f-d-island"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":2876,"batches":24,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
```

### `rtk proxy deno task test`

Exit 0. The command emitted the complete per-test stream in the implementation session and ended:

```text
ok | 3182 passed (617 steps) | 0 failed | 17 ignored (5m22s)
```

The modified focused test also appeared in the root stream as:

```text
running 3 tests from ./packages/cli/src/public/features/root/public-command-tree_test.ts
public root command reports the package version ... ok (27ms)
public init --dry-run leaves the target directory absent ... ok (48ms)
public init emits resolvable app conventions with and without the example service ... ok (817ms)
```

### `rtk proxy deno task lint`

Exit 0. Complete emitted verdict:

```text
Task lint deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)"
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-f-d-island","exitCode":0},"selection":{"filesSelected":2010,"batches":11},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
```

### `rtk proxy deno task fmt:check`

Exit 0. Complete emitted verdict:

```text
Task fmt:check deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)" --ignore-line-endings
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-f-d-island","mode":"check","summary":{"filesSelected":2010,"batches":11,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
```

### Focused CLI check

Command:

```text
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
```

Exit 0. Complete emitted verdict:

```json
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-f-d-island"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":861,"batches":8,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
```

Additional CLI-scoped lint and format wrappers were run because the root lint/fmt tasks exclude
`packages/cli`; both exited 0 over 861 files with zero findings.

### `rtk proxy deno task quality:gate`

Exit 0. Complete decisive output:

```text
Task quality:gate deno task quality:scan && deno task arch:check
Task quality:scan deno run --allow-read .llm/tools/quality/scan-code-quality.ts
{"ok":true,"mode":"repository","scanned":["packages/cli/src","plugins"],"findings":[],"allowCount":7}
Task arch:check deno task deps:check && deno run --allow-read .llm/tools/fitness/check-doctrine.ts [...]
Task deps:check:zod deno run --allow-read .llm/tools/deps/check-zod-alignment.ts
zod-alignment PASS instances=zod@3.25.76,zod@4.4.3 residual-v3=@ag-ui/core@0.0.52,@olli/kvdex@3.6.7
```

The command also emitted the repository's existing warning-only npm catalog and doctrine readiness
inventory. Every doctrine section reported `FAIL=0`; no warning points at the changed test.

## Expensive gate

`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` was not run. The slice brief
requires orchestrator authorization before taking the serialized gate, and this change specifically
establishes a cheap substitute for this defect class.

## Restoration/hazard audit

- Both deliberate-break templates match `origin/main` after regeneration.
- Generated embedded asset barrel matches `origin/main`.
- No `deno.lock` change.
- No new `deno-lint-ignore`, `as unknown as`, or `@ts-ignore`.
- Intended source diff is restricted to
  `packages/cli/src/public/features/root/public-command-tree_test.ts`.
