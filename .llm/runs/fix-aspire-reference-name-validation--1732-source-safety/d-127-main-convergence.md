# D-127 main convergence

Date: 2026-08-31

## Baseline and ancestry

- Old branch head: `0d0f6747e6bb70c705f7760674ea16d51c5cc569`.
- Coordinator-supplied main head: `8a925764276b25ef7cef484db273604f44557cef`.
- The first rebase used that exact head. The only conflicted non-generated source path was
  `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts`.
- The same logical conflict surfaced twice while Git replayed the source-safety commit and then the
  D-119 follow-up. No other source path conflicted.
- During verification, live `origin/main` advanced to unrelated docs-only commit
  `6bb27e46ab1bd4b9534068b2a9eb58039ae287d1` (#1796). A second clean rebase preserved the ruled
  resolution and made the live main head the merge base.
- Pre-signoff rebased head: `d3a55503d71dc930f8d8e7e7f52a65ab67cce0f3`.

`PLAN-EVAL: N/A` and no evaluator rerun: D-127 supplied a complete mechanical merge ruling and
explicitly retained the existing evaluation process unless semantics changed. The semantic
reconciliation below is therefore called out rather than silently attributed to the earlier verdict.

## Fixture resolution

Main's comment-delimited block slice is retained. The binding discovery is generic and
quote-agnostic:

```ts
const workersExecutableMatch = /const ([A-Za-z_$][\w$]*) = builder\.addExecutable\((["'])workers\2,/
  .exec(
    workersBackgroundBlock,
  );
const workersBinding = workersExecutableMatch[1];
```

Both injected references use that discovered binding:

```ts
`        await ${workersBinding}.withEnvironment('services__users__http__0', usersEndpoint);`;
`        await ${workersBinding}.withEnvironment('services__sagas-api__http__0', sagasEndpoint);`;
```

The set anchor is the exact matched on-disk substring, and main's missing-reference union is inserted
through it:

```ts
const workersSetAnchor = new RegExp(
  `    backgroundProcessors\\.set\\((["'])workers\\1, ${workersBinding}\\);`,
).exec(workersBackgroundBlock)?.[0];

const missingBackgroundReferences = [
  workersBackgroundBlock.includes('services__users__http__0') ? undefined : usersReference,
  workersBackgroundBlock.includes('services__sagas-api__http__0') ? undefined : sagasReference,
].filter((reference): reference is string => reference !== undefined);

const configuredBackgroundBlock = missingBackgroundReferences.length === 0
  ? workersBackgroundBlock
  : workersBackgroundBlock.replace(
    workersSetAnchor,
    `${missingBackgroundReferences.join('\n\n')}\n\n${workersSetAnchor}`,
  );
```

The comment/config/executable/set/closing-brace guards remain explicit, and the post-replacement
guard still requires both `services__users__http__0` and `services__sagas-api__http__0`.

## Generator reconciliation and semantic note

The first replay cleanly restored #1747's older ordinal `bg_N` identifiers over main's newer
name-derived binding scheme. The main-relative review caught that before gates. The final generator
retains main's `safeIdentifier(name)` binding, `// --- ${name} ---` marker, and reference bindings;
the branch diff is limited to four `JSON.stringify(name)` literal sites: config lookup,
`addExecutable`, OTEL resource name, and the processor map key.

This intentionally supersedes #1747's earlier direct-generator ordinal-binding behavior. Inputs such
as `class`, `await`, and `builder` are no longer claimed to parse/execute when the generator is called
directly, because the coordinator explicitly prohibited reintroducing `bg_N`. The earlier evaluator
verdict is not presented as coverage for that discarded behavior. The retained product contract is
Aspire name validation plus source-safe processor-name literals on main's binding scheme.

## Verification

| Command / gate | Exit | Summary |
| --- | ---: | --- |
| Initial seven-file structured check | 0 | 7 selected; 1 batch; 0 failures/occurrences |
| Initial combined structured lint | 2 | Coverage refusal: root config dropped 3 CLI-kernel files |
| Initial combined structured format | 2 | Same coverage refusal; also found the fixture regex formatting |
| Final Aspire structured check/lint/fmt | 0 / 0 / 0 | 3/3 files processed; zero findings |
| Final CLI-E2E fixture structured check/lint/fmt | 0 / 0 / 0 | 1/1 file processed; zero findings |
| Final CLI-generator structured check/lint/fmt | 0 / 0 / 0 | 3/3 files processed; zero findings; lint/fmt used a deleted scratch config that mirrors repo rules without the broad CLI exclusion |
| Aspire config/name tests | 0 | 84 passed, 0 failed |
| Generator tests, first run | 1 | New four-site test did not enable telemetry; corrected so the OTEL site is emitted |
| Generator tests, intermediate rerun | 1 | Type-check rejected `Telemetry` on the narrow helper input; corrected without a cast |
| Generator tests, final run | 0 | 54 passed, 0 failed |
| `deno task quality:gate` | 0 | Quality scan `ok: true`, zero findings; doctrine completed with `FAIL=0` |
| `deno task check` | 0 | 2,971 selected; 25 batches; `failedBatches: 0`; `totalOccurrences: 0` |
| Scaffold-only fixture reproduction | 0 | Init + workers install + discovery/replace path passed |

No `any`, casts, lint ignores, quality allowances, lock changes, Aspire/Docker/AppHost process, or
runtime/E2E suite was introduced or run.

## Static reproduction evidence

```json
{
  "workersBinding": "workers",
  "workersConfigAnchor": "  if (config.BackgroundProcessors['workers']?.Enabled !== false) {",
  "executableAnchor": "const workers = builder.addExecutable('workers',",
  "workersSetAnchor": "    backgroundProcessors.set('workers', workers);",
  "missingReferenceCount": 2,
  "configuredContainsUsersReference": true,
  "configuredContainsSagasReference": true,
  "usersReferenceLine": "        await workers.withEnvironment('services__users__http__0', usersEndpoint);",
  "sagasReferenceLine": "        await workers.withEnvironment('services__sagas-api__http__0', sagasEndpoint);"
}
```

The throwaway scaffold was moved to trash by an exit trap, and both scratch parser/config files were
deleted after use.
