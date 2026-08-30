# IMPL-EVAL cycle 4 (fourth and final authorized cycle) — #1734 / PR #1736 (`packages/fresh` query hydration boundary)

PASS

| Field | Value |
| --- | --- |
| **Evaluated carrier (PR head)** | `662be2e9df930fed24918aaf0eddef71bc58c7b5` (evidence-only child: `worklog.md` correction, +35 lines) |
| **Product + runtime head** | `d2c7f16c624c5028cd837595d01ab3b516cb1c23` |
| Product diff `d2c7f16c` → `662be2e9` outside `.llm/runs/` | **empty** (`git diff --stat d2c7f16c 662be2e9 -- . ':!.llm/runs'` → no output) — verified, not accepted on claim |
| Fix commit (product) | `4cd899bcc0f8faa143557f1148eec39ecd40b793` — product diff `4cd899bcc` → `662be2e9` outside `.llm/runs/` also empty |
| RED commit (test-only) | `059ca9421a46618a0fd6d4bdf14c513522d705b7` |
| Base (`main`, owner-pinned) | `24f6642f040617de573c7cef1140eed1ac0efd6d` — confirmed ancestor of HEAD |
| Live `origin/main` at evaluation | `2a65a8cd0f3872c2b95b00fe0a9edae10531921b` (already recorded as drift by the leaf; not a finding) |
| Hosted runtime proof | GitHub run `33327199769`, `headSha` `d2c7f16c624c5028cd837595d01ab3b516cb1c23` |
| Cycle-3 verdict head | `74457d26788af6b2a69801dd6d9e55839d8cc185` (product `40ab61a7ef43633bf946af06f7f15c7e1fd567fd`) |
| Evaluator | Claude · Fable 5 (opposite family to the Codex author), fresh separate session, detached worktree `/home/agent/projects/netscript/worktrees/007-eval-1734-c4` |
| Date | 2026-08-30 |

The verdict applies to the carrier `662be2e9` **and** to the product tree `d2c7f16c` because they are byte-identical outside
`.llm/runs/`. The coordinator-accepted evidence-only carrier exception is applied on that basis: the hosted run's `headSha`
differing from the PR head is **not** a finding and no rerun was demanded.

## Head-equality assertion

- `git rev-parse HEAD` → `662be2e9df930fed24918aaf0eddef71bc58c7b5`
- `git rev-parse origin/fix/fresh-query-hydration-readonly-state` after `git fetch` → `662be2e9df930fed24918aaf0eddef71bc58c7b5`
- PR #1736 `headRefOid` (GitHub API) → `662be2e9df930fed24918aaf0eddef71bc58c7b5`; base `main`; draft; labels
  `type:fix`/`status:impl`/`area:fresh`/`priority:p1`; milestone `0.0.7`
- Leaf worktree `/home/agent/projects/netscript/worktrees/007-leaf-1736` HEAD (read-only) → `662be2e9df930fed24918aaf0eddef71bc58c7b5`
- `git rev-parse 662be2e9^` → `d2c7f16c624c5028cd837595d01ab3b516cb1c23`
- `git status --short` at start and after every gate: only the untracked owner brief `IMPL-EVAL-BRIEF.md`. `deno.lock` untouched
  (all ad-hoc probes ran `--no-lock`; scratch files lived only in throwaway worktrees under the job tmp dir, deleted afterwards).

## Prior-verdict integrity

`git diff --quiet` exit 0 for: `impl-eval.md` vs `ed8a8e9c`; `impl-eval.md` + `impl-eval-cycle-2.md` vs `eb765629`;
all three (`impl-eval.md`, `impl-eval-cycle-2.md`, `impl-eval-cycle-3.md`) vs `4ed83071c` and vs `662be2e9`. **Bit-identical.**

## Scope (vs `main` `24f6642f`, outside `.llm/runs/`)

Exactly six files, all under `packages/fresh`: `src/application/query/hydration.ts` (M, +227/−1 cumulative),
`tests/query-hydration-roundtrip_test.tsx` (A), `tests/query-hydration-version-compat_test.ts` (A),
`tests/query-hydration_test.ts` (A), `tests/type-fixtures/query-hydration-5.101.0-deno.json` (A),
`tests/type-fixtures/query-hydration-5.102.8-deno.json` (A). `git diff --stat 24f6642f HEAD -- query-types.ts query/mod.ts
packages/fresh/deno.json deno.lock .github` → **empty**. `packages/fresh/deno.json:57` still
`"@tanstack/query-core": "npm:@tanstack/query-core@^5.101.0"`. The RED commit `059ca9421` touches exactly one non-run file
(the round-trip test, +137/−1); the fix commit `4cd899bcc` touches exactly one non-run file (`hydration.ts`).

Forbidden constructs (`\bany\b|as unknown as|@ts-ignore|@ts-expect-error|deno-lint-ignore|quality-allow|\bas [A-Z]`) over the
four TS/TSX files: only the pre-existing `dehydrate(queryClient) as DehydratedState` (`hydration.ts:35`, present at base) and the
type-import alias on line 16. Nothing added.

The cycle-3 → cycle-4 product diff (`40ab61a7` → `4cd899bcc`, `hydration.ts` only): `RevivedError` union deleted;
`reviveSerializedError(value: unknown): Error` with `try/catch` around `instanceof Error` and around `isPlainRecord`;
`serializedErrorMessage` (record `message` via guarded `readStringField`, else string / number / bigint / boolean, else the
fallback) replaces bare `String(value)`; `readStringField` guards every property read; the four call sites keep the `null`
sentinel (`value.x === null ? null : reviveSerializedError(value.x)`) and no longer have a `valid` branch to reject on.

## Attack narrative

### 1. Is it actually total? — yes, behaviourally

Scratch probe (throwaway worktree at `4cd899bcc`, product-identical to HEAD; imports HEAD's `hydrateFromDehydrated` and a copy of
`main`'s at `24f6642f`). Each value below was placed as `failureReason` of a paused mutation **with a sibling success query** on
the direct-state (in-memory) path, and additionally through the real `renderToString(<QueryHydrationScript/>)` → `JSON.parse`
transport whenever `JSON.stringify` could serialize it. Assertion per row: HEAD accepts, hydrated `failureReason` is an `Error`,
sibling query survives (`q=1 m=1`), input JSON snapshot unchanged.

| Value | HEAD (in-memory) | `main` |
| --- | --- | --- |
| `undefined`, `Symbol('s')`, `() => 1` | `Error("Serialized hydration error")`, `cause` = the value | pass-through |
| `10n` (bigint) | `Error("10")`, `cause` bigint | pass-through |
| `NaN`, `-0`, `''`, `0`, `false` | `Error("NaN")`/`("0")`/`("")`/`("0")`/`("false")` | pass-through |
| revoked `Proxy` over `{}`, over a function, over `[]` | fallback `Error`, `cause` = revoked proxy — **no throw** from `instanceof`/`Array.isArray`/`getPrototypeOf` | pass-through |
| `Proxy` whose `getPrototypeOf` / `get` / `has` / `ownKeys` trap throws | fallback `Error` (ownKeys-trap case reads `message:"ok"` through the guarded read) | pass-through |
| `Proxy` with `getPrototypeOf → Error.prototype` and throwing `get` | returned **by reference** (it *is* an `Error` per `instanceof`) — same as `main`; consumer reading `.message` throws, as it would on `main` | pass-through |
| plain record whose `message`/`name`/`stack` getters throw; null-prototype record whose `message` getter throws | fallback `Error`; `name` still applied when only `message` throws | pass-through |
| `Object.create(null)` with `message`, cyclic record, deep-frozen record, frozen array | `Error("np")` / `Error("cyc")` / fallback / fallback | pass-through |
| class instance, `Date`, `Map`, `Set`, `RegExp`, `Promise`, `Uint8Array`, `WeakRef`, boxed `String`/`Number` | fallback `Error`, `cause` = the object — **in-memory host objects now hydrate** (cycle-3 observation closed) | pass-through |
| array with throwing-`toString` element / symbol element / null-prototype element (cycle-3 F2 triggers) | fallback `Error` — **no escape**; also hydrates on the wire | pass-through |
| object with throwing `Symbol.toPrimitive`/`valueOf`/`toString` | fallback `Error` — never coerced | pass-through |
| `{message:'x', name:123, stack:null}` | `Error("x")`, non-string fields ignored | pass-through |
| `JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"p":1}},"message":"pp"}')` | `Error("pp")`; afterwards `({}).polluted === undefined` and `({}).p === undefined` | pass-through |
| `ApiError extends Error` with own `status`, `DOMException`, `Error` whose `message` getter throws | by reference (subclass/name kept) | by reference |
| `null` | stays `null` (sentinel honoured) | `null` |

45 value kinds, 0 rejections, 0 throws, 0 input mutations, 0 partial hydrations. The same 20 leading kinds placed as **both**
query-side twins (`error` and `fetchFailureReason`, `status:'error'`) with a sibling success query: all hydrate as
`Error`/`Error` with the sibling kept. Totality holds behaviourally, not just structurally.

### 2. Did totality buy openness at the cost of the guard? — no

Envelope attacks at HEAD, each asserting `REJECT`, client left at `q=0 m=0`, input snapshot unchanged: `{}` mutation; bad
query `status`; a query missing `queryHash` **after** a valid query (index 1, no partial hydration); non-array `queryKey`;
`failureCount:'1'`; `scope.id` numeric; `promise: {}`; string entry; `null` entry; `queries: {}`. All reject with an
indexed `TypeError` (or the arrays message for the envelope root). The committed cycle-2 suite
`hydrateFromDehydrated rejects the evaluator guard-attack cases without mutation` passes inside the 22/22 Fresh run.
The reviver is total; the envelope validation is unchanged and still not permissive.

### 3. Both directions, per assertion

- **Must still hydrate (over-strictness direction):** every row in §1 (`main` accepted → HEAD accepts); the committed
  `rejectionCases` loop (string/number/boolean/array/plain-object on the real transport); the three cycle-4 tests
  (`…failure reason is omitted on the wire`, `…omitted query error twins and sibling query`,
  `…cannot escape through hostile rejection coercion`); the cycle-1/2 wire tests for the default paused mutation with and
  without variables; `null` sentinel preserved (`null stays null`).
- **Must still be rejected (envelope direction):** §2 above, plus the committed guard-attack suite.

### 4. RED honesty — real transition

Throwaway detached worktrees, `run-deno-test.ts -- --allow-all --no-lock packages/fresh/tests/query-hydration-roundtrip_test.tsx`:

- `059ca9421` (test-only): **exit 1, 11 passed / 3 failed.** Failures are exactly the three new titles and for the stated reasons:
  `Error: hostile Symbol.toPrimitive … at String … at reviveSerializedError` (cycle-3 F2's bare `String(value)`),
  `TypeError: Invalid dehydrated mutation at index 0` (omitted `failureReason`, cycle-3 F1),
  `TypeError: Invalid dehydrated query at index 1` (omitted query twins, cycle-3 F1 query path).
- `4cd899bcc` (fix): **exit 0, 14 passed / 0 failed.** 11 + 3 = 14. No test was weakened: the RED diff only adds tests
  (+137/−1, the one deletion is the import line gaining `dehydrate`).

### 5. Range ends

`deno check --unstable-kv --no-lock --config <fixture> packages/fresh/src/application/query/hydration.ts` → exit 0 under both
fixtures; `deno info` resolves `npm:@tanstack/query-core@5.101.0` and `@5.102.8` respectively. `query-hydration-version-compat_test.ts`
at HEAD: 2 passed / 0 failed. **Extra (runtime, not only types):** in the throwaway worktree with `packages/fresh/deno.json`
temporarily pinned to `query-core@5.102.8`/`preact-query@5.102.8` (`--no-lock`, reverted afterwards), the round-trip and
hydration suites ran **17 passed / 0 failed** with `deno info` confirming `query-core@5.102.8` — `hydrate()` at the upper range end
consumes the revived `Error` values. (Note: the fixture configs are scoped to compile `hydration.ts` only; pointing them at the
test files yields 26 import-map/JSX diagnostics under *either* version — a fixture-scope property, not a leaf defect.)

### 6. Sealing honesty — reproduced, not trusted

| Gate | Command | Exit | Result |
| --- | --- | ---: | --- |
| **Root test** | `.llm/tools/run-deno-test.ts -- --allow-all` at `662be2e9` | **0** | **4,294 passed / 0 failed / 19 ignored / 4,313 total** — exact match with the worklog and PR body |
| Scoped check / lint / fmt | `run-deno-{check,lint,fmt}.ts --root packages/fresh --ext ts,tsx` | 0 / 0 / 0 | 200 files, 0 findings each |
| Fresh test dir | `run-deno-test.ts -- --allow-all packages/fresh/tests/` | 0 | 22 passed / 0 failed |
| `deno task quality:scan` | wrapper | 0 | `ok:true`, `findings:[]`, `allowCount:7` |
| `deno task arch:check` | wrapper | 0 | no `packages/fresh` FAIL line; inherited `fresh-ui` catalog warnings only |
| `deno task check:assets-barrel` | wrapper | 0 | clean |

Worktree clean after all gates.

### 7. Receipt honesty

Every 7–40-char hex token in the PR body (11 distinct) resolves with `git cat-file -e <sha>^{commit}`. Across all 16 PR comments
the only non-resolving tokens are all-digit comment IDs (not SHAs) and the two cycle-1-era fragments `d48861c82bc8…` /
`81448d2b5f4c…` already recorded in cycles 2 and 3 — nothing new. Every SHA cited in this artifact was resolved locally.

## Runtime evidence — read from the hosted run, not reproduced

GitHub run **`33327199769`** (`e2e-cli`, `workflow_dispatch`, created 2026-08-30T18:08:18Z): `status: completed`,
`conclusion: success`, `headSha: d2c7f16c624c5028cd837595d01ab3b516cb1c23`, `headBranch` this branch. The
`scaffold-runtime (aspire + docker + postgres)` job log shows the checkout of `d2c7f16c…`, the single one-pass command
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty --report …`, `database.init: Initialize generated database`
**PASSED**, `cleanup.aspire-stop` PASSED, `Summary: passed=89 failed=0 skipped=0`, zero `FAILED` lines. The sibling
`scaffold-runtime-sqlite` job: `Summary: passed=84 failed=0 skipped=0`. `scaffold-static`, `desktop-native-linux`, and
`classify changes` jobs: success. Product tree at `d2c7f16c` == `662be2e9`, so this is the acceptance proof for the carrier.

Not run locally, per brief: Aspire, Docker, browser, `e2e:cli`, `scaffold.runtime`. Read-only `docker ps -a` / `docker volume ls`
against `DOCKER_HOST`: **0 containers / 0 volumes** — local runtime remained at exact zero. The earlier interrupted local run
(37/1 at `database.init`) is **not cited** in either direction; the worklog's correction (supervisor `aspire stop` at 18:06:46.537,
not D-55) is consistent with the PR body and no PR comment carries the superseded D-55 attribution.

## Observations (not findings)

- **Plan-approved behaviour change vs `main`, stated for the record:** a rejection value that `main` passed through as
  `undefined`/`NaN`/a symbol/a host object now hydrates as an `Error` with `cause` = the original (or `undefined` for an
  absent key). This is the cycle-4 plan amendment's explicit choice and it keeps TanStack's `Error | null` honest without a
  cast; sibling entries are never lost. `cause` remains one-hop (non-enumerable), as cycle 3 noted.
- **Envelope-level hostility is not total, by design and by brief:** a hostile *state envelope* (`state` = a `Proxy` whose `get`
  trap throws, or a revoked proxy) escapes as a non-indexed error (`Error: env-get`, `TypeError: Cannot perform 'IsArray' …`)
  rather than the indexed `TypeError`. Still `q=0 m=0`, no mutation, and no package path produces such an envelope; the brief
  scopes totality to the reviver. Not graded.
- **Hosted report artifact absent:** the runtime job's `Upload E2E report artifact` step found no files for
  `.llm/tmp/**/report*.json` (`if-no-files-found: ignore`), so the run exposes only the static and desktop artifacts; the step
  log is the proof. Workflow-owned; outside this leaf.
- **PR body:** does not yet cite run `33327199769`, and leaves "Owner-hosted exact-head runtime acceptance" and
  "Independent cycle-4 IMPL-EVAL verdict" unchecked — honest at the time it was written; both are now satisfied and the
  coordinator can refresh the body. Every SHA in it resolves. Out of my boundary to edit.
- `origin/main` has advanced to `2a65a8cd…`; the leaf correctly stayed on the owner-pinned `24f6642f…` and recorded the drift.

## Checks executed (index)

| # | Check | Result |
| --- | --- | --- |
| 1 | Heads: local == remote == PR == leaf == `662be2e9`; parent `d2c7f16c`; product diff empty | confirmed |
| 2 | Scope vs `main` `24f6642f`: 6 files under `packages/fresh`; contract/range/lock/workflow diff empty | confirmed |
| 3 | Forbidden constructs | none added |
| 4 | RED `059ca9421` 11/3 → GREEN `4cd899bcc` 14/0 in throwaway worktrees | confirmed |
| 5 | Both range ends compile; runtime 17/0 under `query-core@5.102.8` | confirmed |
| 6 | Totality probe: 45 value kinds × {memory, wire where serializable} + 20 query-twin kinds | 0 unexpected |
| 7 | Envelope attacks: 12 cases + committed cycle-2 suite | all reject, `q=0 m=0`, unmutated |
| 8 | Root test 4,294/0/19; scoped check/lint/fmt 0/0/0; fresh tests 22/0; quality:scan ok; arch:check 0; assets-barrel 0 | reproduced |
| 9 | Hosted run `33327199769` at `d2c7f16c`: success, runtime 89/0, sqlite 84/0 | read |
| 10 | Receipts: PR body 11/11; comments — only known cycle-1-era misses | confirmed |
| 11 | Prior verdict artifacts bit-identical vs `ed8a8e9c` / `eb765629` / `4ed83071c` / `662be2e9` | confirmed |
| 12 | Local runtime zero: 0 containers / 0 volumes; nothing started, nothing killed | confirmed |

## Verdict

`PASS` at evaluated carrier `662be2e9df930fed24918aaf0eddef71bc58c7b5` (product + runtime head
`d2c7f16c624c5028cd837595d01ab3b516cb1c23`).

The allowlist that failed cycles 1–3 is gone rather than extended: `reviveSerializedError(value: unknown): Error` cannot
reject and cannot throw, and I could not make it do either with revoked proxies, throwing traps and getters, symbols, bigints,
cyclic/frozen/null-prototype objects, host objects, hostile coercion hooks, or a prototype-pollution payload — on the
in-memory path and, wherever JSON can carry the value, on the real `QueryHydrationScript` transport. Everything that hydrated
on `main` still hydrates with the sibling entries intact; every malformed envelope still rejects with no partial hydration and
no input mutation. RED→GREEN is real (11/3 → 14/0, test-only RED preceding the fix), scope is exactly `hydration.ts` plus tests
and fixtures under `packages/fresh` with the public type, exports, and `^5.101.0` range untouched, both range ends compile and
the upper end passes at runtime, every sealing claim including the root test reproduced at this head, every cited SHA
resolves, and the hosted `scaffold.runtime` run at the byte-identical product head is green. No finding survives.
