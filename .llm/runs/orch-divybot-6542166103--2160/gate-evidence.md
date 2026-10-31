# Local gate evidence

Commands ran against the S1 implementation; structured sanitized reports are in
`reports/`. These are wrapper reports, not run-gate durable receipts. No lock or
cache deletion/reload. No local full scaffold runtime run.

| Gate | Exact invocation | Result |
| --- | --- | --- |
| Saga tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv --frozen packages/plugin-sagas-core plugins/sagas` | exit 0; 328 pass, 0 fail, 18 environment-dependent skips |
| Type check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/sagas --root packages/plugin-sagas-core --ext ts,tsx --deno-arg --frozen` | exit 0; 262 files, 0 findings |
| Lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/sagas --root packages/plugin-sagas-core --ext ts,tsx` | exit 0; 262 files, 0 findings |
| Format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/sagas --root packages/plugin-sagas-core --ext ts,tsx` | exit 0; 262 files, 0 findings |
| Broad quality | `deno task quality:gate` | exit 0; quality scan and dependency/architecture checks pass, existing advisories |
| Plugin JSR audit | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root plugins/sagas --text` | exit 0; publish dry-run succeeds; existing cardinality/banner warnings |
| Core JSR audit | same audit wrapper with `--root packages/plugin-sagas-core --text` | exit 0; publish dry-run succeeds; existing advisories |
| Plugin doc lint | `deno task doc:lint --root plugins/sagas --pretty` | exit 1; 30 pre-existing privateTypeRef errors, same grouped files/counts as baseline |
| Core doc lint | `deno task doc:lint --root packages/plugin-sagas-core --pretty` | exit 1; 7 pre-existing privateTypeRef errors, same grouped files/counts as baseline |
| Patch hygiene | `git diff --check` | exit 0 |
| Scaffold runtime | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | NOT RUN locally by explicit owner instruction; coordinator must arm e2e-cli CI |

Doc-lint baseline was measured by temporarily restoring every tracked modified saga
TypeScript file to abe9d3e4303411544502ceb519f39a09d3723fcd, executing the same two
wrapper commands, then restoring the implementation exactly. Both package reports
have identical grouped file/count findings before and after. This run does not
claim doc lint is green. Broader quality:gate is green on both baseline and S1.

## Acceptance and negative controls

- `instance-read_test.ts`: direct GET performs precisely `['sagas','correlation',
  sagaId,correlationKey]` then `['sagas','state',instanceId]`. Three populations: 0,
  100 and 1,000 unrelated valid canonical instances/query documents. Instance ID is
  opaque, so deriving it instead of consulting the index cannot pass.
- State collision fixture includes business status, metadata, state, identifiers,
  version, dates and lastMessageType. KV persisted projection plus list and direct
  GET preserve it. Prisma writer plus GET/list preserve it separately from runtime
  `compensating`. Prisma GET spy allows exactly one indexed findFirst and rejects
  list/count. These are structural Prisma adapter tests, not live SQL execution.
- Missing index/dangling envelope return NOT_FOUND with 1/2 reads respectively.
- `instance-query_test.ts`: all six durable/projection combinations, nested
  processor settings, env precedence, default KV and runtime-only Prisma client.

Negative controls (structured test wrapper, `--filter`, instance-read_test.ts):

1. Restore original projectionState/readModel behavior from baseline while keeping
   new exported mapper available. Filter `/KV projection and list API|Prisma
   projection, GET and list/`: exit 1, 2 assertion failures. Both persisted state
   payloads differ from business state. Canonical code restored afterward.
2. Restore original list/sort/find KV helper. Filter `GET instance reads exactly`:
   exit 1, 3 assertion failures: actual indexed-store reads are [] instead of the
   required two keys. Count assertion executes in Promise.finally, including on
   a failed lookup. Direct implementation restored afterward.
3. Restore Prisma findMany/orderBy/take:1 GET. Filter `Prisma projection, GET and
   list`: exit 1, 1 failure: forbidden list/sort call. Keyed query restored.

After all controls, the complete test suite passes again. Source restoration is
exact; the negative-control mutations are not committed.

4. Restore the baseline stream reconciliation mapper. Filter `stream
   reconciliation of versioned`, producer_reconciliation_test.ts: exit 1, exactly
   1 state-preservation failure. New shared validator/version-aware mapper
   restored; legacy behavior is covered separately. Full suite after review fix:
   328 pass, 0 fail, 18 environment-dependent skips; scoped gates select 262 files.

## S2 current-CI corrections

- `command-postgres` run 41194298113 failed two old-format fixture assumptions
  (first failure reached; second would follow). Latest main run 41152000845 passed.
  Both assertions now validate nested state, including business status, preserving
  all transition/replay/compensation proof. Live rerun is required on the next head.
- Local saga wrapper suite after fixture repair: exit 0, 328 passed, 18 skips;
  `reports/tests-s2.json`. The live PostgreSQL template remains skipped locally.
- `quality` job 124517429796 failed only stale agent-docs-prose after its lint,
  formatting, examples and README gates passed. Generated the updated saga page
  carrier through gen:agent-docs-prose then gen:publish-assets; both exit 0.
- `check:agent-docs-prose`: exit 0, fresh=true, stalePaths=[];
  `check:mcp-export-corpus`: exit 0; `check:publish-assets`: exit 0.
- Canonical generation changes exactly one page row in the CLI carrier, which
  decodes identically to docs/site/_site/durable-workflows/sagas/index.md.
- `check:assets-barrel` is the post-commit validation because it compares generated
  outputs against Git. No source or policy gate has been weakened.
