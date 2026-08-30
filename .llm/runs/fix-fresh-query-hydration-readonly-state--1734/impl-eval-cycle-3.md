# IMPL-EVAL cycle 3 (final authorized cycle) — #1734 / PR #1736 (`packages/fresh` query hydration boundary)

FAIL_FIX

| Field | Value |
| --- | --- |
| Evaluated head | `74457d26788af6b2a69801dd6d9e55839d8cc185` (evidence-only child) |
| Product head | `40ab61a7ef43633bf946af06f7f15c7e1fd567fd` |
| RED head (test-only) | `5d16fe17cf9fde4e410965b9c7814085b1989917` |
| Parked head (cycle-2 artifact) | `eb765629206092f97b3dd8f76a64fa0c3769bcb8` |
| Remote `main` used for comparison | `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` |
| Branch | `fix/fresh-query-hydration-readonly-state` |
| Evaluator | Claude · Fable 5 (opposite family to the Codex author), separate session, detached worktree `/home/agent/projects/netscript/worktrees/007-eval-1734-c3` |
| Date | 2026-08-30 |

## Head-equality assertion

- `git rev-parse HEAD` → `74457d26788af6b2a69801dd6d9e55839d8cc185`
- `git ls-remote origin refs/heads/fix/fresh-query-hydration-readonly-state` → `74457d26788af6b2a69801dd6d9e55839d8cc185`
- PR #1736 `headRefOid` (GitHub API) → `74457d26788af6b2a69801dd6d9e55839d8cc185`
- Leaf worktree `/home/agent/projects/netscript/worktrees/007-leaf-1736` HEAD → `74457d26788af6b2a69801dd6d9e55839d8cc185` (read only)
- `git diff --stat 40ab61a7 74457d26 -- . ':!.llm/runs'` → empty. The evidence commit is not product change and no
  self-referencing receipt was demanded.
- `impl-eval.md` bit-identical vs `ed8a8e9c` and vs `eb765629`; `impl-eval-cycle-2.md` bit-identical vs `eb765629`
  (`git diff --quiet`, all exit 0).
- `git status --short` at start: only the untracked owner brief `IMPL-EVAL-BRIEF.md`; identical after every probe and gate
  (scratch probe files were created under `packages/fresh/**`, run, and deleted; `deno.lock` untouched — all probes `--no-lock`).

PR state at evaluation: draft, `status:impl`, labels `type:fix`/`area:fresh`/`priority:p1`, milestone `0.0.7`. Nothing changed by me.

## What was verified as sound (both directions, stated per assertion)

The cycle-2 repair is correct for everything it targeted. Through the real transport
(`renderToString(<QueryHydrationScript/>)` → `JSON.parse`), against `main`'s `hydrateFromDehydrated` and this head's,
on a default-dehydrated paused mutation (`retry: 1`, offline set inside `mutationFn`) with a sibling success query:

| Rejection value | Wire `failureReason` | `main` | HEAD (wire) | HEAD (in-memory) | Direction covered |
| --- | --- | --- | --- | --- | --- |
| `'offline'`, `''` | string | accept | accept, `Error("offline")`, `cause` = string | same | over-strictness (F1 cycle 2) |
| `503`, `0` | number | accept | accept, `cause` = number | same | over-strictness |
| `NaN`, `Infinity` | `null` (JSON) | accept | accept `null` | accept, `Error("NaN")` `cause` = NaN | over-strictness |
| `true`, `false` | boolean | accept | accept, `cause` = boolean | same | over-strictness |
| `[]`, `[1,['a',{b:2}]]` | array | accept | accept, `cause` deep-equal | same | over-strictness |
| `{status:503, body:'nope'}` | record | accept | accept, `Error("Serialized hydration error")`, **`cause` = the full record** | same | over-strictness + F2 preservation |
| `{message,name,stack,code}` | record | accept | `Error(N:"m")`, name/stack applied, `cause` keeps `code` | same | F2 preservation |
| `new Error`, `DOMException`, `ApiError extends Error` w/ own `status` | `{}` / `{status,name}` | accept | fallback `Error`, `cause` = record | passed by reference, subclass + `status` kept | in-memory identity |
| `null` | `null` | accept | accept `null` | same | both |
| `Object.assign(Object.create(null), {message,extra})` | record | accept | `Error("np")`, `cause` keeps `extra` | same | both |
| `JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"p":1}},"message":"pp"}')` | record | accept | `Error("pp")`; `({}).polluted === undefined`, `({}).p === undefined` | same | over-permissiveness |
| `Date`, `Map`, `Set`, `RegExp`, `Uint8Array`, `Response`, `Promise`, class instance | string / `{}` / record | accept | accept (wire form is a string or record) | **reject** (see observations) | both |
| Query path, `shouldDehydrateQuery: () => true`, `queryFn` rejecting string / number / object | primitive / record | accept | accept | accept | over-strictness |

No case mutated the caller's input (JSON snapshot equal before/after in every row). No case produced partial hydration:
every rejection leaves the client at `q=0 m=0`. Cycle-2's committed attack suite
(`hydrateFromDehydrated rejects the evaluator guard-attack cases without mutation`) passes inside the 19/19 Fresh test run.

`{ cause: value }` is a genuine preservation mechanism for the single hop it is designed for: `cause` is an own
(non-enumerable) property, typed `unknown` on `Error` in ES2022 lib (the committed test reads `hydratedFailure.cause`
under `deno check` without a cast), deep-equal to the wire value for records and arrays and `===` for primitives.

RED honesty: re-executed in throwaway detached worktrees, `run-deno-test.ts -- --allow-all --no-lock …roundtrip_test.tsx`.
At `5d16fe17` (test-only; `git show --stat` confirms the only non-`.llm/runs` file is the test): **exit 1, 6 passed / 5
failed** — four `TypeError: Invalid dehydrated mutation at index 0` (string/number/boolean/array = cycle-2 F1) and one
`AssertionError` on `cause` (`{body:"unavailable",status:503}` vs `undefined` = cycle-2 F2). At `40ab61a7`: **exit 0,
11 passed / 0 failed**. 6 + 5 = 11; the failing titles are exactly the five new tests. RED is real and for the stated reason.

## Findings

### F1 — major — a rejection value that JSON drops (bare `Promise.reject()`, `throw undefined`, symbol, function) now rejects the entire state; it hydrated on `main`

**Contract clause violated:** issue acceptance 5 (no behavioural narrowing of the public `DehydratedState` contract);
the cycle-3 plan amendment's own first direction ("values that hydrated on `main` must not reject the state").

**Mechanism.** The plan amendment excludes `undefined`/functions/symbols on the premise that "the JSON transport cannot
preserve" them. The transport does not need to preserve them: `JSON.stringify` **omits the key**, the wire mutation state
arrives with no `failureReason` property, `normalizeMutationState` reads `value.failureReason` → `undefined`,
`reviveSerializedError(undefined)` is not `null`, not `Error`, not record, not array/string/number/boolean → `{ valid: false }`
→ `TypeError: Invalid dehydrated mutation at index 0` → the whole state is thrown away inside `HydrationBoundary`'s
`useEffect`, **including every sibling success query**. `hydrate()` consumes an absent key without complaint — that is what
`main` did. This is the identical damage mode to cycle-2 F1 with a different trigger, and it is the exact failure shape the
owner warned about: "cannot preserve" was verified, "cannot reach" was assumed.

**Reproduction (executed at this head through the real transport; probe output verbatim, `MAIN` = `origin/main`
`hydrateFromDehydrated`, `HEAD` = this head):**

```text
## undefined (bare reject)  (in-memory failureReason=undefined; wire failureReason=undefined; key present on wire=false)
  wire MAIN: ACCEPT q=1 m=1 fr=undefined:undefined
  wire HEAD: REJECT TypeError: Invalid dehydrated mutation at index 0 q=0 m=0
  mem  MAIN: ACCEPT q=1 m=1 fr=undefined:undefined
  mem  HEAD: REJECT TypeError: Invalid dehydrated mutation at index 0 q=0 m=0

## symbol  (in-memory failureReason=Symbol(s); wire failureReason=undefined; key present on wire=false)
  wire MAIN: ACCEPT q=1 m=1 fr=undefined:undefined
  wire HEAD: REJECT TypeError: Invalid dehydrated mutation at index 0 q=0 m=0

## function  (in-memory failureReason=()=>1; wire failureReason=undefined; key present on wire=false)
  wire MAIN: ACCEPT q=1 m=1 fr=undefined:undefined
  wire HEAD: REJECT TypeError: Invalid dehydrated mutation at index 0 q=0 m=0

## q undefined (wire error=undefined)      [shouldDehydrateQuery: () => true, queryFn rejects undefined, retry:false]
  wire MAIN: ACCEPT q=2 m=0
  wire HEAD: REJECT TypeError: Invalid dehydrated query at index 1 q=0 m=0
```

The mutation row is the package's **default** path (`shouldDehydrateMutation = isPaused`), produced by TanStack itself —
the reducer stores `failureReason: action.error` verbatim, so a `mutationFn` that does `return Promise.reject()` or
`throw undefined` yields it. Trigger frequency is honestly lower than cycle-2's string case, but the consequence is the same
whole-state loss, and the value is not "unreachable": it reaches the boundary as an absent key on every such mutation.

**Why the committed tests did not catch it.** `rejectionCases` covers string/number/boolean/array/plain object and asserts
`assertEquals(wireMutationState.failureReason, rejection)`; no case exercises a rejection whose key JSON omits, and no
assertion covers the absent-key shape. Cycle 2's observation that "`error: undefined` (key absent) … no package path
reaches this" was wrong for `failureReason`/`fetchFailureReason`/`error` when the rejection value itself is `undefined`; the
leaf inherited that belief. I record that correction here rather than soften it.

**Required change (bounded, same function).** In `reviveSerializedError`, treat `undefined` as valid — either pass it through
as the value `hydrate()` received on `main`, or normalise to `null` (TanStack's own "no error" value) — and add a RED
round-trip test whose `mutationFn` does `return Promise.reject()` with a sibling success query that must survive, plus the
query-path twin. No public type, export, or range change is needed; the stop condition does not fire.

### F2 — minor — `String(value)` on an in-memory array is unguarded: a consumer-controlled element can make the guard throw an arbitrary, un-indexed error

**Observed (in-memory `HydrationBoundary state={…}` path; all three hydrated on `main`):**

```text
## array w/ null-proto element        mem HEAD: REJECT TypeError: Cannot convert object to primitive value q=0 m=0
## array w/ symbol element            mem HEAD: REJECT TypeError: Cannot convert a Symbol value to a string q=0 m=0
## array w/ throwing toString         mem HEAD: REJECT Error: boom-toString q=0 m=0
```

The message construction `String(value)` for arrays invokes element `toString`; a null-prototype element, a symbol
element, or a throwing `toString` escapes the guard as a non-indexed error (in the third case not even a `TypeError`),
breaking the guard's own "invalid → indexed `TypeError`" contract. No partial hydration (the throw precedes `hydrate()`) and
no input mutation. Wire-only consumers are unaffected (JSON cannot carry these). Fix: build the message defensively
(`try { String(value) } catch { 'Serialized hydration error' }` or a JSON-based summary) — one expression in the same
function; fold into the F1 repair.

### Observations (not findings)

- **In-memory host objects are rejected where `main` hydrated them**: `Date`, `Map`, `Set`, `RegExp`, `Uint8Array`,
  `Response`, `Promise`, and non-`Error` class instances as rejection values reject on the `state` prop path only (`REJECT
  TypeError: Invalid dehydrated mutation at index 0`); on the wire all of them arrive as a string or record and hydrate.
  This is the boundary the plan amendment states and cycle 2 accepted (attack #8). Recorded because `HydrationBoundaryProps.state`
  ("dehydrated state passed directly as a prop") is a documented in-memory path, and because island props also cross Fresh's
  own prop serializer, which was not exercised by any cycle. Not graded; the owner may want a stated position.
- **`cause` is one-hop.** It is non-enumerable, so a second serialization of the revived `Error` collapses to `{}`
  (`hop2 wire failureReason={}` → fallback `Error`, `cause = {}`). Same as any `Error` crossing JSON; worth one sentence
  in the PR body so consumers do not expect persistence across re-dehydration.
- **PR body is stale at this head.** It still states "Final pushed head: `3b3044f7…`", lists `deno task test` as
  **FAIL (host infrastructure)**, and leaves the root-test DoD box unchecked, while the worklog seals root test green at
  `40ab61a7` and the branch head is `74457d26`. Every SHA in the body resolves; nothing is fabricated — but the body must be
  refreshed with the cycle-3 slice SHAs and the green root-test row before any ready-flip. Out of my boundary to edit.
- **Tier-A GREEN comment wording**: "`null`, `undefined`, functions and symbols remain rejected" — `null` is accepted
  (correctly, and tested). Cosmetic, but it is the sentence that would have hidden F1 from a reader.
- Array-derived messages are cosmetic (`"1,a,[object Object]"`); `cause` carries the real value.
- The four non-resolving SHAs (`d48861c82bc8…`, `81448d2b5f4c…`) remain only in the cycle-1-era S1/S2 comments, already
  recorded in cycle 2. The two apparent misses in `cycle3-brief.md` (`01a04fa4`, `6290bf3585cb`) are fragments of a Codex
  thread UUID, not SHAs.

## Checks executed

| # | Check | Command | Exit | Result |
| --- | --- | --- | --- | --- |
| 1 | Scope vs parked head | `git diff --stat eb765629 40ab61a7 -- . ':!.llm/runs'` | 0 | exactly `hydration.ts` (+17/−4) and `query-hydration-roundtrip_test.tsx` (+62). Evidence child `74457d26` adds nothing outside `.llm/runs`. |
| 2 | Public contract / range | `git diff eb765629 HEAD -- query-types.ts query/mod.ts packages/fresh/deno.json deno.lock` | 0 | empty; range still `npm:@tanstack/query-core@^5.101.0` |
| 3 | Forbidden constructs | `grep -nE '\bany\b|as unknown as|@ts-ignore|@ts-expect-error|deno-lint-ignore|quality-allow|\bas [A-Z]'` over both files | — | only the pre-existing `dehydrate(queryClient) as DehydratedState` (`hydration.ts:35`) and the type-import alias; nothing added |
| 4 | RED re-executed at `5d16fe17` | throwaway worktree, `run-deno-test.ts -- --allow-all --no-lock …roundtrip_test.tsx` | 1 | 6 passed / 5 failed (4× F1 `TypeError`, 1× F2 `cause` assertion) |
| 5 | GREEN at `40ab61a7` | same | 0 | 11 passed / 0 failed |
| 6 | Both range ends | `deno check --unstable-kv --no-lock --config <fixture> hydration.ts` ×2 | 0 / 0 | `deno info` confirms fixtures resolve `npm:@tanstack/query-core@5.101.0` and `@5.102.8` |
| 7 | **Root test (spot-checked myself)** | `run-deno-test.ts -- --allow-all` at `74457d26` | **0** | **4,258 passed / 0 failed / 19 ignored / 4,277 total** — matches the sealing claim exactly; 0 PID-1 zombies at start |
| 8 | Scoped check / lint / fmt | `run-deno-{check,lint,fmt}.ts --root packages/fresh --ext ts,tsx` | 0 / 0 / 0 | 200 files each, 0 findings |
| 9 | `deno task quality:scan` | wrapper | 0 | `ok: true`, `allowCount: 7` |
| 10 | `deno task arch:check` | wrapper | 0 | inherited catalog warnings only, no Fresh FAIL |
| 11 | `deno task check:assets-barrel` | wrapper | 0 | clean |
| 12 | Fresh test dir | `run-deno-test.ts -- --allow-all packages/fresh/tests/` | 0 | 19 passed / 0 failed, includes cycle-2 attack suite |
| 13 | Two-direction probe | scratch `.tsx` under `packages/fresh/tests/` importing HEAD and `origin/main` `hydrateFromDehydrated`; 33 mutation value kinds × {wire, memory} × {main, HEAD} + 4 query-path kinds + second-hop + pollution check; deleted afterwards | 0 | tables above; F1, F2 |
| 14 | Receipt honesty | every 8/12/40-char hex in PR body, all 13 PR comments, and every run artifact resolved with `git cat-file -e` | — | PR body 100%; cycle-2/3 comments 100%; only the known cycle-1-era misses (see observations) |
| 15 | Artifact integrity | `git diff --quiet` on both prior verdict files vs their sealing heads | 0 | bit-identical |
| 16 | Runtime lease gates | Aspire / Docker / browser / `e2e:cli` / `scaffold.runtime` | — | **NOT_RUN** — coordinator-owned serialized expensive-gate lease; not a finding |

## Host conditions

PID 1 `tini`, 0 zombies at start; `deno 2.9.5`; `rtk` not installed (plain commands used). No process I did not start was
touched. Root test was a usable verdict source and is green at this head — the earlier worklog RED rows are correctly marked
superseded.

## Verdict

`FAIL_FIX` at `74457d26788af6b2a69801dd6d9e55839d8cc185` (product `40ab61a7ef43633bf946af06f7f15c7e1fd567fd`).

Cycle-2 F1 and F2 are genuinely repaired on the real transport and in memory, RED→GREEN is real, both range ends compile,
the public contract and range are untouched, no forbidden construct was added, the guard resists prototype/shape attacks
without partial hydration or input mutation, and every sealing claim — including the root test — reproduced at this head.
What remains is one bounded defect in the same function, of the same shape as the two before it: `reviveSerializedError`
still rejects the value that the transport carries as an **absent key** (`undefined` from a bare `Promise.reject()`, or a
symbol/function rejection), which hydrated on `main` and now drops every sibling success query on the package's default
paused-mutation path (F1), plus an unguarded `String(value)` that lets consumer-controlled array elements throw past the
guard in memory (F2). Both are one-line fixes inside `hydration.ts` with one RED round-trip test each and no change to
`query-types.ts`, `query/mod.ts`, or the dependency range.

This was the third and final authorized cycle. The failure is stated as found; escalation to the owner is required for any
further cycle.
