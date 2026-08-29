# IMPL-EVAL — #1734 / PR #1736 (`packages/fresh` query hydration readonly boundary)

FAIL_IMPL

| Field | Value |
| --- | --- |
| Evaluated head | `e537b2c1f06e9bc3345efe84597740a72844440b` |
| Branch | `fix/fresh-query-hydration-readonly-state` |
| Base used for scope diff | `21d516224fe35e92957f0998ee848bbf2024eda0` |
| Evaluator | Claude · Fable 5 (opposite family to the Codex author), separate session, worktree `/home/codex/repos/netscript-007-eval-1734` |
| Date | 2026-08-30 |

## Head-equality assertion

- `git rev-parse HEAD` → `e537b2c1f06e9bc3345efe84597740a72844440b`
- `git ls-remote origin refs/heads/fix/fresh-query-hydration-readonly-state` → `e537b2c1f06e9bc3345efe84597740a72844440b`
- PR #1736 `head.sha` (GitHub API) → `e537b2c1f06e9bc3345efe84597740a72844440b`
- Brief SHA → `e537b2c1f06e9bc3345efe84597740a72844440b`

All four equal. `git status --short` at start: clean. Verdict below applies to this head only.

## Findings

### F1 — major — the boundary guard rejects the package's own serialized paused-mutation state (regression on the shipped wire path)

**Contract clause violated:** brief check 7 ("a well-formed dehydrated state still hydrates") and
issue acceptance 5 (no behavioural narrowing of the public `DehydratedState` contract). Pre-fix
behaviour hydrated this state; post-fix throws inside `HydrationBoundary`'s `useEffect`.

**Mechanism.** `hydration.ts` `isMutationState()` requires
`Object.hasOwn(value, 'context') && Object.hasOwn(value, 'data') && … && Object.hasOwn(value, 'variables')`.
The package's own transport is JSON: `QueryHydrationScript` → `JSON.stringify(state)` →
`readDehydratedState` → `JSON.parse` → `hydrateFromDehydrated`
(`packages/fresh/src/application/query/hydration-script.tsx:64-66`). A paused mutation dehydrated
by `dehydrateQueryClient()` with its **default** `shouldDehydrateMutation` (= `mutation.state.isPaused`)
carries `context: undefined` and `data: undefined`; `JSON.stringify` drops those keys, so
`Object.hasOwn` is false and the guard throws.

**Reproduction (executed, exit 0 for the probe file; output below is verbatim):**

```ts
// scratch probe, run: deno test --allow-all --no-check --config deno.json <file>
import { QueryClient, onlineManager } from 'npm:@tanstack/query-core@5.101.0';
import { dehydrateQueryClient, hydrateFromDehydrated } from '<worktree>/packages/fresh/src/application/query/hydration.ts';
import { hydrateFromDehydrated as hydratePreFix } from '<copy of hydration.ts at d48861c82 / base>';

onlineManager.setOnline(false);
const c = new QueryClient();
const m = c.getMutationCache().build(c, { mutationKey: ['m'], mutationFn: async () => 1 });
m.execute(7).catch(() => {});
await new Promise((r) => setTimeout(r, 20));           // m.state.isPaused === true
const raw = dehydrateQueryClient(c);                   // raw.mutations.length === 1 (default option)
const wire = JSON.parse(JSON.stringify(raw).replaceAll('<', '\\u003c')); // == serializeDehydratedState
hydratePreFix(new QueryClient(), wire);                // PRE-FIX : hydrated, mutations=1
hydrateFromDehydrated(new QueryClient(), wire);        // POST-FIX: TypeError: Invalid dehydrated mutation at index 0
```

Observed:

```text
mutation isPaused: true status: pending
dehydrated mutations: 1  state keys: [context, data, error, failureCount, failureReason, isPaused, status, variables, submittedAt]
wire     mutation state keys: [error, failureCount, failureReason, isPaused, status, variables, submittedAt]
PRE-FIX  result: hydrated, mutations=1
POST-FIX result: TypeError: Invalid dehydrated mutation at index 0
```

The same `hasOwn('variables')` check rejects a paused mutation whose `mutate()` was called without
variables once it crosses JSON. Success queries are unaffected (their `data` is always defined and
`error`/`fetchMeta` serialize as `null`); the probe `wire: success query through JSON — pre-fix vs
post-fix` passed on both.

**Why the committed tests did not catch it.** `packages/fresh/tests/query-hydration_test.ts`
hydrates the in-memory object returned by `dehydrateQueryClient` (frozen arrays, no JSON round trip)
and only exercises a success query. No test covers a mutation, and none crosses the JSON boundary
that the package's own `QueryHydrationScript`/`HydrationBoundary` pair is built on.

**Required change.** Validate the JSON-serializable shape, not the in-memory shape: treat absent
`context`/`data`/`variables` as `undefined` (drop the `hasOwn` requirements) and add a test that
round-trips a paused mutation through `JSON.stringify`/`JSON.parse` before hydrating. Keep the
structural checks that are genuinely load-bearing for `hydrate()` (arrays for `mutations`/`queries`,
object entries, `queryHash`/`queryKey` for queries, `state` object present).

### Observation (not a finding — outside the package's default API)

`isErrorOrNull` requires `instanceof Error`. A consumer who builds state with raw
`dehydrate(client, { shouldDehydrateQuery: () => true })` and serializes an error query gets
`error: {}` after JSON; pre-fix hydrated it (`queries=1`), post-fix throws
`Invalid dehydrated query at index 0`. Reached only by bypassing `dehydrateQueryClient`, so recorded
as an observation. Fixing F1 the same way (serialized-shape validation) would also cover this.

## Checks executed

| # | Check | Command | Exit | Result |
| --- | --- | --- | --- | --- |
| 1 | Scope | `git diff --name-only 21d516224...HEAD` | 0 | 11 files: 5 in `packages/fresh/**`, 6 in the run dir. No lock/cache/workflow churn on the branch. |
| 2 | RED is real | throwaway worktree at `d48861c82`; `run-deno-test.ts -- --allow-all packages/fresh/tests/query-hydration-version-compat_test.ts` | 1 | 0 passed / 1 failed; child diagnostic is exactly `TS2345 … 'readonly unknown[]' is 'readonly' and cannot be assigned to the mutable type 'DehydratedMutation[]'` at `hydration.ts` for the 5.102.8 case. Confirmed. |
| 3 | Both range ends at HEAD | `run-deno-test.ts -- --allow-all …version-compat_test.ts …query-hydration_test.ts` | 0 | 4 passed / 0 failed. |
| 3b | Fixtures resolve what they name | `deno info --no-lock --config <fixture> --json …/hydration.ts` | 0 | `npm:@tanstack/query-core@5.101.0` and `npm:@tanstack/query-core@5.102.8` respectively. Root lock pins `^5.101.0 → 5.101.0`. |
| 4 | Conversion honest — guard attacks | scratch probe, 8 attack cases | 0 | Rejected with `TypeError` and an index-bearing message: `{}` mutation; `{queryHash:'x'}` query at index 1 (client left with 0 queries — no partial hydrate); bad `state.status`; non-array `queryKey`; `null`/string/number/array entries in either list; `scope.id` non-string; non-array `mutationKey`; bad mutation `status`. Input object not mutated (JSON snapshot equal before/after). |
| 4b | Conversion honest — wire path | scratch probe (F1) | — | **Regression** — see F1. |
| 5 | Public contract | `git diff --stat 21d516224...HEAD -- query-types.ts query/mod.ts packages/fresh/deno.json` | 0 | Empty diff. `DehydratedState` still `readonly mutations: readonly unknown[]; readonly queries: readonly unknown[]`. Range still `npm:@tanstack/query-core@^5.101.0`. |
| 6 | Forbidden constructs | `grep -nE '\bany\b\|as unknown as\|@ts-ignore\|@ts-expect-error\|deno-lint-ignore\|quality-allow'` over `hydration.ts` + both new tests | 1 (no match) | none. |
| 7 | Happy path | scratch probe | 0 | 3 success queries hydrate in order `[['a'],['b'],['c']]`, count 3; paused mutation hydrates **in-memory** (no JSON). JSON path fails for mutations — F1. |
| 8 | `deno task check` | wrapper | 0 | 0 diagnostics. |
| 8 | `deno task test` | wrapper | 0 | 4,246 passed / 0 failed / 19 ignored / 4,265 total. |
| 8 | `deno task lint` | wrapper | 0 | 0 findings. |
| 8 | `deno task fmt:check` | wrapper | 0 | 2,045 files, 0 findings. |
| 8 | `deno task quality:scan` | wrapper | 0 | `findings: []`, `allowCount: 7` (required 7). |
| 8 | `deno task arch:check` | wrapper | 0 | Fresh `FAIL=0 WARN=3 INFO=1` (two >500-line files, `src/runtime/ai` cardinality — all pre-existing). |
| 8 | `check:assets-barrel` | — | — | N/A: no generated asset in the diff. |

Worktree state after all gates: `git status --short` clean. One line of `deno.lock` churn
(`"npm:@tanstack/query-core@5.101.0": "5.101.0"`) was introduced by the evaluator's own scratch
probe specifier, not by the branch, and was reverted with `git checkout -- deno.lock`.

Not run (per brief, no runtime lease): Aspire, Docker, browser, `scaffold.runtime`, `e2e:cli`.
Their absence is not a finding.

## Verdict

`FAIL_IMPL` — `FAIL_FIX` class. Items 1–4 and 6 of the acceptance hold at this head (dual-version
compile, no forbidden constructs, RED regression pinned, range decision stated and honoured across
both ends, exports unchanged). F1 is a runtime behaviour regression on the package's own
server→island transport for the default dehydrated-mutation case, reproduced against pre-fix and
post-fix source. It is narrow to fix (serialized-shape validation + one JSON round-trip test) and
does not require reopening the type-level design.
