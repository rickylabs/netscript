# IMPL-EVAL cycle 2 — #1734 / PR #1736 (`packages/fresh` query hydration boundary)

FAIL_FIX

| Field | Value |
| --- | --- |
| Evaluated head | `3b3044f7af178e740b577a80f83e785c1fd6ee7f` |
| Branch | `fix/fresh-query-hydration-readonly-state` |
| Base used for scope diff | `21d516224fe35e92957f0998ee848bbf2024eda0` |
| Cycle-1 head (FAIL_IMPL) | `e537b2c1f06e9bc3345efe84597740a72844440b` |
| Cycle-1 artifact head | `ed8a8e9ca9be2e72da4a00bff830caf260ee94ea` |
| Evaluator | Claude · Fable 5 (opposite family to the Codex author), separate session, detached worktree `/home/agent/projects/netscript/worktrees/007-eval-1734` |
| Date | 2026-08-30 |

## Head-equality assertion

- `git rev-parse HEAD` → `3b3044f7af178e740b577a80f83e785c1fd6ee7f`
- `git ls-remote origin refs/heads/fix/fresh-query-hydration-readonly-state` → `3b3044f7af178e740b577a80f83e785c1fd6ee7f`
- PR #1736 `headRefOid` (GitHub API) → `3b3044f7af178e740b577a80f83e785c1fd6ee7f`
- Brief SHA → `3b3044f7af178e740b577a80f83e785c1fd6ee7f`

All four equal. `git status --short` at start: clean; clean again after every gate and probe
(`deno.lock` untouched — all probes ran `--no-lock`). Verdict below applies to this head only.

## Findings

### F1 — major — the guard rejects primitive rejection values that JSON preserves and `hydrate()` consumes (regression on the default paused-mutation path)

**Contract clause violated:** issue acceptance 5 (no behavioural narrowing of the public
`DehydratedState` contract); cycle-1 R1 ("keep the structural checks that are genuinely
load-bearing for `hydrate()`"). A `string`/`number`/`boolean`/array in `failureReason` (or `error`,
`fetchFailureReason`) is not load-bearing for `hydrate()` — it stores whatever it is given.

**Mechanism.** `reviveSerializedError()` (`hydration.ts`) returns `{ valid: false }` for any value
that is not `null`, not `instanceof Error`, and not a plain record. `normalizeMutationState` /
`normalizeQueryState` then return `undefined` and the whole state is rejected with an indexed
`TypeError`. A mutation whose `mutationFn` rejected with a non-`Error` value
(`Promise.reject('boom')`, or any fetch wrapper that rejects with a status code) and then paused
offline carries that value in `failureReason`; `dehydrateQueryClient()` with its **default**
`shouldDehydrateMutation` (= `isPaused`, confirmed in `query-core@5.102.8/build/modern/hydration.js:42-49`)
emits it, `QueryHydrationScript` serializes it faithfully (primitives survive JSON), and
`HydrationBoundary` → `hydrateFromDehydrated` throws inside `useEffect`. Every other entry in the
state — including all success queries — is dropped with it. TanStack supports non-`Error` `TError`
through the documented `Register.defaultError` augmentation, so this is a supported consumer
configuration, not misuse.

**Reproduction (executed at this head through the real transport — `renderToString(<QueryHydrationScript/>)` → `JSON.parse` — against the base `hydration.ts` and this head's; output verbatim):**

```text
A. default paused mutation, mutationFn rejected with a STRING
wire failureReason: "boom"
PRE wire   ACCEPT failureReason="boom"
POST wire  REJECT TypeError: Invalid dehydrated mutation at index 0 m=0 q=0
PRE mem    ACCEPT failureReason="boom"
POST mem   REJECT TypeError: Invalid dehydrated mutation at index 0 m=0 q=0

D. number / boolean / array / null rejection values on the wire
42     PRE ok= true | POST ok= false TypeError: Invalid dehydrated mutation at index 0
true   PRE ok= true | POST ok= false TypeError: Invalid dehydrated mutation at index 0
["a"]  PRE ok= true | POST ok= false TypeError: Invalid dehydrated mutation at index 0
null   PRE ok= true | POST ok= true

E. query error path via non-default shouldDehydrateQuery: () => true
wire errors: ["str-err",{}]
PRE : true q=2
POST: false TypeError: Invalid dehydrated query at index 0
```

`PRE` = `hydrateFromDehydrated` from base `21d516224` (hydrated on `main`); `POST` = this head.
Case A/D is the package's default API; case E is the non-default query path and fails for the same
reason.

**Why the committed tests did not catch it.** `query-hydration-roundtrip_test.tsx` exercises
`Error` instances only (`Promise.reject(failure)` with `failure = new Error(...)`), so every
serialized error record on the wire is `{}` or a `{message,name,stack}` record. No test rejects
with a primitive.

**Required change (bounded, same location as the R2 repair).** Non-`null`, non-`Error`, non-record
values must not reject the state. Either pass them through or, to keep TanStack's declared
`Error | null` honest without a cast, wrap them (`new Error(String(value), { cause: value })`) —
`cause` keeps the original value reachable for the consumer. Add a RED round-trip test whose
`mutationFn` rejects with a string on the default paused path. No public type, export, or range
change is needed; the stop condition does not fire.

### F2 — minor — the revive silently discards every field of a plain-object rejection value, on the in-memory path as well as the wire, and this is neither stated nor tested

**What the PR/plan state (D5, PR body "F1 repair / R2 decision"):** "JSON erases ordinary `Error`
values to `{}`"; "an empty record gets a neutral fallback message"; `message`/`name`/`stack` are
retained. That describes `Error` instances crossing JSON. It does not state what happens to a
rejection value that *was* a plain object before serialization, nor that the same collapse happens
in memory where no JSON occurred.

**Observed (same probe, verbatim):**

```text
B. default paused mutation, mutationFn rejected with PLAIN OBJECT {status:500,body}
wire failureReason: {"status":500,"body":"nope"}
PRE wire   ACCEPT failureReason={"status":500,"body":"nope"}
POST wire  ACCEPT failureReason=Error("Serialized hydration error") keys=
PRE mem    ACCEPT failureReason={"status":500,"body":"nope"}
POST mem   ACCEPT failureReason=Error("Serialized hydration error") keys=

C. default paused mutation, real Error with own prop code
wire failureReason: {"code":"E_X"}
PRE wire   ACCEPT failureReason={"code":"E_X"}
POST wire  ACCEPT failureReason=Error("Serialized hydration error") keys=
POST mem   ACCEPT failureReason=Error("real") keys=code
```

Pre-fix a consumer's error UI received `{status: 500, body: 'nope'}`; post-fix it receives an
`Error` whose message is the synthetic fallback and which carries none of the original fields —
with no signal that anything was lost. For the `{}`-from-`Error` case the collapse is
unavoidable and the fallback is defensible; for records with extra keys it is lossy by choice.
The in-memory path (`HydrationBoundary state={...}` prop, no JSON) is affected identically, where
the "serialized" premise of the revive does not hold.

**Required change.** Either preserve the record (`cause`, or copy own enumerable keys onto the
revived `Error`), or state the lossy collapse explicitly in the PR body / plan D5 and pin it with a
test. This folds into the F1 repair; it is not a separate design question.

### Observations (not findings)

- The four non-resolving SHAs `d48861c82bc8…`, `81448d2b5f4c…` (full and 12-char forms) still
  appear in the cycle-1-era S1/S2 comments (`5465295164`, `5465321781`). Cycle 1 / Tier-A already
  recorded and corrected them in the PR body; the body and both cycle-2 comments resolve 100%.
  Recorded for completeness, not re-raised.
- `error: undefined` (key absent) in a hand-built mutation/query state is rejected. TanStack always
  emits `null`, JSON never produces `undefined`, so no package path reaches this. Not a finding.
- Behaviour of the **revive itself** is sound: see attack table below.

## Attack narrative — what was tried and did not break

| # | Attack | Result |
| --- | --- | --- |
| 1 | RED re-executed at `8dac327d` in a throwaway worktree, `run-deno-test.ts -- --allow-all …roundtrip_test.tsx` | exit 1; **1 passed / 4 failed**, all four `TypeError: Invalid dehydrated mutation at index 0` from `toMutableDehydratedState` — RED is real and for the stated reason |
| 2 | Real transport: `renderToString(<QueryHydrationScript/>)` → parse, default paused mutation with/without variables, success query | hydrates; wire mutation state keys `error,failureCount,failureReason,isPaused,status,variables,submittedAt` (no `context`/`data`) accepted; hydrated state `{"error":null,…,"variables":"x"}` |
| 3 | `<` escaping: data `{"html":"</script><script>alert(1)</script>","lt":"<<>>"}` | raw script body contains no literal `</script>`, contains `<`; parsed data restored byte-exact |
| 4 | Cycle-1's eight guard-attack cases (committed table) | all reject with indexed `TypeError`; client left with 0 queries / 0 mutations; input JSON snapshot unchanged (11/11 focused) |
| 5 | Revive: `__proto__` key, `constructor` key (via `JSON.parse`) | revived `Error`; `'polluted' in {}` → `false`; input not mutated |
| 6 | Revive: `stack: 123`, `name: {a:1}` | non-string fields ignored, real stack kept |
| 7 | Revive: deeply nested junk in `message` | fallback message, accepted, no throw |
| 8 | Revive: array / string / number / `undefined` / `Date` / `Map` | rejected, indexed, `m=0 q=0`, input unchanged — **but see F1: string/number/array are legitimate wire values** |
| 9 | Revive: null-prototype record | revived (plain-record check accepts `Object.create(null)`) |
| 10 | Real `TypeError` and an `Error` subclass with own `status` in memory | passed by reference (`sameRef=true`), subclass and `status=503` preserved |
| 11 | Pending query with a live `promise`, `shouldDehydrateQuery: () => true`, across JSON (`promise: {}`) | POST rejects `Invalid dehydrated query at index 0`; PRE crashed inside `hydrate()` with `promise.then is not a function` — rejection is the strictly better outcome |
| 12 | Deep-frozen in-memory state (success query + paused mutation) | hydrates `q=1 m=1`; input unchanged |
| 13 | `null` rejection value | accepted pre and post |

## Checks executed

| # | Check | Command | Exit | Result |
| --- | --- | --- | --- | --- |
| 1 | Scope vs base | `git diff --stat 21d516224…HEAD -- . ':!.llm/runs'` | 0 | 6 files, all `packages/fresh/**` (3 from cycle 1 + `hydration.ts`, `query-hydration-roundtrip_test.tsx`, `query-hydration_test.ts`). No lock/workflow/cache churn. Only `hydration.ts` is `M`; every test is `A` — no pre-existing test modified or deleted. |
| 1b | Scope vs cycle-1 artifact head | `git diff --name-only ed8a8e9c…HEAD` | 0 | exactly the three `packages/fresh` files + run-dir artifacts |
| 1c | `impl-eval.md` integrity | `git diff --quiet ed8a8e9c HEAD -- …/impl-eval.md` | 0 | bit-identical |
| 2 | RED re-executed | see attack 1 | 1 | 1 passed / 4 failed — confirmed |
| 3 | Focused suites at HEAD | `run-deno-test.ts -- --allow-all` compat + hydration + roundtrip | 0 | **11 passed / 0 failed** |
| 3b | Both range ends, raw child exit | `deno check --unstable-kv --no-lock --config <fixture> src/application/query/hydration.ts` ×2 | 0 / 0 | both compile |
| 3c | Fixtures resolve what they name | `deno info --no-lock --config <fixture> --json …/hydration.ts` | 0 | `npm:@tanstack/query-core@5.101.0` / `@5.102.8` respectively. Note: 5.101.0 declares `hydrate(client, dehydratedState: unknown)`, 5.102.8 declares `Partial<DehydratedState>` — which is why only 5.102.8 raised TS2345. |
| 4 | Guard / revive attacks | scratch probe (deleted; worktree clean) | 0 | see F1, F2, attack table |
| 5 | Public contract | `git diff --stat 21d516224…HEAD -- query-types.ts query/mod.ts packages/fresh/deno.json deno.lock .github` | 0 | empty. Range still `npm:@tanstack/query-core@^5.101.0`. |
| 6 | Forbidden constructs | `grep -nE '\bany\b\|as unknown as\|@ts-ignore\|@ts-expect-error\|deno-lint-ignore\|quality-allow\|\bas [A-Z]'` over the 4 files | — | only `dehydrate(queryClient) as DehydratedState` (`hydration.ts:35`), pre-existing at base (line 27 there). Nothing forbidden added. |
| 7 | Scoped check | `run-deno-check.ts --file` ×4 | 0 | 4 files, 0 diagnostics |
| 7 | Scoped lint | `run-deno-lint.ts --file` ×4 | 0 | 4 files, 0 findings |
| 7 | Scoped fmt | `run-deno-fmt.ts --file` ×4 | 0 | 4 files, 0 findings |
| 7 | `deno task quality:scan` | wrapper | 0 | `ok: true`, `findings: []`, **`allowCount: 7`** |
| 7 | `deno task arch:check` | wrapper | 0 | Fresh `FAIL=0 WARN=3 INFO=1` (two >500-line files, `src/runtime/ai` cardinality — inherited baseline, unchanged) |
| 8 | Receipt honesty | every SHA in PR body + all comments resolved with `git cat-file -e` | — | PR body 8/8; cycle-2 IMPL comment 4/4; Tier-A comment all resolve. Four `MISS` only in the cycle-1-era S1/S2 comments (see observations). Gate claims in the cycle-2 comments (11/11, check/lint/fmt 0, `allowCount: 7`, Fresh WARN=3) all reproduced here. |
| 9 | Close-gate | PR body DoD | — | one box deliberately unchecked ("Full root test is green on a host with available watcher/cancellation capacity") — honest, consistent with host conditions below; PR is draft at `status:impl`, not `ready-merge`, so no close-gate violation at this head. |

## Host conditions (recorded, not laundered)

- `ps -eo stat,ppid | awk '$1 ~ /^Z/ && $2==1' | wc -l` → **7,769** PID-1-owned zombie processes at
  evaluation time.
- Per the brief, the full root `deno task test` was **not run**; the author's and Tier-A's reports
  of `codex-follow_test` (`Too many open files`) and `hybrid-launcher_test` (surviving cancellation
  child) are host conditions under `.llm/tools/agentic/**`, outside the scope diff, and are not
  findings against this leaf. No foreign process was stopped.
- Not run and not findings: Aspire, Docker, browser, `scaffold.runtime`, `e2e:cli` (no runtime
  lease; `scaffold.runtime` restoration is CI-owned).

## Verdict

`FAIL_FIX` at `3b3044f7af178e740b577a80f83e785c1fd6ee7f`.

Acceptance items 1–4 and 6 continue to hold, cycle-1 F1 (JSON-dropped `context`/`data`/`variables`)
and the `{}`-from-`Error` case are genuinely repaired on the real transport, RED was real, both
range ends compile against the versions they name, the public contract and range are untouched,
no forbidden construct was added, and the revive resists prototype/shape attacks without partial
hydration or input mutation. What remains is one bounded defect in the same function the R2 repair
introduced: `reviveSerializedError` treats every non-`Error`, non-record value as invalid, which
rejects state that `hydrate()` consumes and that hydrated on `main` for the package's default
paused-mutation path (F1), plus an unstated lossy collapse of plain-object errors (F2). Both are
fixable inside `hydration.ts` with one RED round-trip test and no change to `query-types.ts`,
`query/mod.ts`, or the dependency range.
