# IMPL-EVAL — test-jsdoc-example-compile-gate--1533 (cycle 1)

- Evaluator session: Native Claude · Fable 5 · opposite-family, fresh; did not plan or implement
  this leaf · job `e6d0ed7b` · 2026-08-30
- Run: `test-jsdoc-example-compile-gate--1533` · PR #1756 (draft) · branch
  `test/jsdoc-example-compile-gate`
- **Evaluated head: `c73fee39c86f08882ba8a1214fd87c07d628672d`** (confirmed `git rev-parse HEAD` in
  the detached evaluator worktree `/home/agent/projects/netscript/worktrees/007-eval-1533-impl`)
- Remote / PR head: `303be12eab5e54ada654d55f60e8cfbf1921ea73` — **knowingly different**, per the
  dispatch: the local head carries `e1ea9d3a` (`ci.yml`) and the PAT lacks `workflow` scope. Not a
  leaf defect; not asserted as equal.
- Merge base with `origin/main`: `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` (the branch was rebased;
  `13878a80` is the original base). Leaf diff vs merge base: 48 files, all under `.llm/`,
  `.github/workflows/ci.yml`, `deno.json`, 23 JSDoc-bearing `packages/`/`plugins/` files, and the
  regenerated MCP corpus.
- Evaluator boundary: exactly one new file (`impl-eval.md`); `git diff HEAD -- . ':!.llm/runs'` is
  empty. Throwaway worktrees at `72ca345f` (RED) and `c73fee39` (two mutation copies) lived under
  the job tmp dir and were removed afterwards.

## Verdict

**`FAIL_FIX`** — the gate mechanism is sound and every attack I ran against the *tool* went red for
the stated reason; the failures are in what the repairs and the ratchet fixture assert about the
corpus. Three bounded fixes are required (F1–F3); two are recorded for the record (F4–F5). None of
them reshapes the plan or the coordinator's narrowed contract, so this is not `FAIL_PLAN`.

## Attack narrative

### 1. Owner-set rescope ceiling (D14) — survived, with one provenance caveat

- History order is real: `72ca345f test(docs): capture classified JSDoc example RED census` commits
  `red-census.md` + the failing corpus test; the color fix `f1a39faf`, plumbing `da90eca5`, the
  narrowing `322c2d26`, and only then the repair `02957fc9` and CI activation `e1ea9d3a`. No repair
  precedes the census.
- **Re-executed RED at `72ca345f`** in a throwaway worktree:
  `env -u FORCE_COLOR NO_COLOR=1 deno test … jsdoc-example-corpus_test.ts` → exit 1,
  `{"badSpecifier":27,"typeError":21,"unboundName":116,"unfenced":0,"malformed":1}`, 165 failing,
  `Found 262 errors`. **Matches `red-census.md` exactly by class.** The corpus denominator at that
  commit is 2021 files / 351 examples (the artifact says 2020 / 349) because the whole branch was
  later rebased onto `3e5cbabf`, which adds two clean `procedure-meta.ts` examples; `drift.md`
  records this and neither deferred number moved. Benign.
- Ceiling: the repair commit touches 13 members, 27 specifier repairs + 1 fence label, 0 type-error
  repairs — under 25 / 90 / 8 for the narrowed scope; the original 144 / 21 breach was escalated,
  not baselined.
- **Caveat (F5):** on this host `FORCE_COLOR=3` is exported and Deno lets it override `NO_COLOR`
  (`NO_COLOR=1 deno check bad.ts` still emits SGR). At `72ca345f` the RED census therefore reads
  **24** (`17/6/0/0/1`) with `NO_COLOR=1` alone — the historical color defect — and 165 only with
  `FORCE_COLOR` unset. The committed number is right; the "NO_COLOR=1 reproduces it" narrative is
  environment-dependent.

### 2. Over-ceiling → rescope, never baselining — survived

Exemption count is 0 at head; `maximumExempt: 0`. The over-ceiling result became a coordinator
rescope (`plan.md` § Coordinator-authorized asserted contract, `drift.md` 2026-08-30) with two
filed follow-ups (#1765, #1766) carrying classifier-emitted lists. Nothing was converted to a
`no-check` marker.

### 3. Exemption list audit (D5) — N/A at head; the softer joint moved elsewhere (F1, F4)

There are zero exemptions to audit. The equivalent pressure point turned out to be the **typed
supports** in `snippet-supports.ts`, which this leaf grew by `@database` (root), `@app/lib/orders.ts`,
`@app/router.ts`, `@app/auth.ts`, `@app/streams/schemas.ts` — several typed `any`. A support is an
exemption the author writes in TypeScript instead of on the fence; see F1.

### 4. Empty selection (D8/D17) — survived, driven end-to-end

Through the real extractor with an injected `loadDoc` (not the unit fixtures):

| Selection | Census | Result |
| --- | --- | --- |
| every `deno doc` payload empty | `examples=0 candidates=0 checked=0` | `code=1`, `denoCheckSpawned=false`, "empty selection refused: zero candidates" |
| every module doc has one `ts no-check:…` fence | `candidates=2021 checked=0 exempt=2021` | `code=1`, not spawned, "zero checked modules" |
| every candidate is `import "./dead.ts"` | `checked=2021`, `enforcedFailureCount=2021` | `code=1`, not spawned, "zero checked modules" |

All three refuse before spawning and name the zero condition.

### 5. Bare fences (D4) — survived (mutation)

In a throwaway copy of head I deleted `text` from `packages/cron/ports/types.ts`'s fence, reverted
`packages/service/mod.ts` to `./router.ts`, put `typescript no-check:illustrative wiring` on a
`define-service.ts` fence that also imports `./router.ts`, and added a new module example to
`packages/kv/mod.ts` calling an undeclared function. One run:

```text
jsdoc examples: FAIL … examples=352 candidates=351 checked=350 exempt=1 … malformed=1 failures=3
enforcedFailureCensus={"badSpecifier":2,"unfenced":0,"malformed":1}
deferredCensus={"unboundName":117,"typeError":21}
ratchet failure: exempt 1 > 0
ratchet failure: deferred unboundName 117 > 116
packages/cron/ports/types.ts · symbol CronExpression · example 1: fence has no language
```

Bare fence → malformed; relative import → bad specifier; an exemption does **not** excuse the bad
import and trips the exempt ratchet; a new unbound example trips the deferred ratchet. Exit 1.

### 6. Motivating defects — caught, but by the deferred lane, and not repaired (by design)

`filters.ts` (TS2345) and `transform-helpers.ts` (TS2304/TS18046) both appear in
`deferred-classes.md` with those codes. Under the coordinator-narrowed contract they are deferred to
#1766 / #1765, not enforced and not repaired. The gate *detects* them; a green run does not claim
they compile. Consistent with the record.

### 7. Stand-in repairs / narrowing — **not survived** (F1, F4)

I restored the three narrowed bodies (`TracedQueue`, `createServiceQueryUtils`,
`createAuthStreamDB`) with the **repaired** specifiers kept, and re-ran the gate:
`deferredCensus={"unboundName":116,"typeError":24}`, `ratchet failure: deferred typeError 24 > 21`.
Each narrowing removed a genuine published-API type error rather than surfacing it:

- `TracedQueue.listen` — `TS2339 Property 'span' does not exist on type 'MessageContext'`. The public
  signature types the handler context as `MessageContext`; the implementation passes a
  `TracedMessageContext` (not exported from `@netscript/telemetry/instrumentation`) and the JSDoc
  prose promises "provides the span in the context". The example documented the real feature; the
  type is what is wrong. Now unrecorded anywhere.
- `createAuthStreamDB` — `TS2322 … 'unknown' is not assignable to QueryBuilder…` and
  `TS2339 Property 'state' does not exist on type 'never'` on the `useLiveQuery` shape. Same for the
  three sibling plugins (not re-tested; identical edit).
- `createServiceQueryUtils` — one diagnostic on the `useQuery(...)` line.

`plan.md` permits narrowing "when the stand-in would exceed the substance", so this is not a
violation of D12; but D5's own rule says a type error against the documented symbol's real signature
may not be *excused*, and silently editing it out of the example is the same outcome with less
visibility. The removed defects must at least be listed (F4).

### 8. RED honesty — survived (see § 1)

### 9. Receipt honesty — survived

All 19 SHAs cited across `worklog.md`, `drift.md`, `plan-eval.md`, the PR body and phase comments
resolve as commits (`a1a4328b`, `0f30c4f4`, `551f4edc`, `9b34b657`, `e63f1b85`, `b4a4a40c`,
`b8d271e9`, `0495c9b6`, `c9216c2d`, `4840ed23`, `fa11f2d3`, `0bf00d70`, `303be12e`, `3e5cbabf`,
`952cc106`, `e1ea9d3a`, `65c2f99c`, `d558f9ab`, `13878a80`). PR #1756: draft, base `main`,
milestone `0.0.7`, labels `type:test area:docs area:tooling status:impl`, body `Closes #1533`.

### 10. Color invariance at head — survived

`env -u NO_COLOR FORCE_COLOR=1 deno task docs:jsdoc-examples` and `NO_COLOR=1 …` produce identical
census, enforced, and deferred lines (`PASS members=35 files=2021 examples=351 candidates=350
checked=350 exempt=0 non_ts=1 … failures=0`; `{"badSpecifier":0,"unfenced":0,"malformed":0}`;
`{"unboundName":116,"typeError":21}`). Because `FORCE_COLOR` still reaches the child (the compiler
*merges* `NO_COLOR=1`, it does not clear the env), the invariance is delivered by `stripAnsi`, which
is the correct layer to rely on. `--deferred-output` regenerated `deferred-classes.md` byte-identical
to the committed artifact.

## Findings

| # | Severity | Finding | Required fix (bounded) |
| --- | --- | --- | --- |
| **F1** | **high** | Five `@netscript/service` examples (`mod.ts`, `presets/define-service.ts` ×3, `auth/auth-middleware.ts`) were "repaired" from `./router.ts` to `@app/router.ts` / `@app/auth.ts`. The **service** scaffold's `deno.json` (`generate-service-deno-json.ts:67-71`) generates only `@<project>/contracts`, `@database` (when `hasDatabase`) and `@netscript/service`; `@app/` is generated only for the Fresh app (`generate-app-deno-json.ts:136`), and the generated service entrypoint itself uses `import { router } from './router.ts'`. The examples now document a specifier a scaffolded service **cannot resolve** — the #1425 class this gate exists to prevent — and the gate is green only because `snippet-supports.ts` maps `@app/router.ts` → `router: any`. No D11 generator-alignment test exists for any support (`grep generateAppDenoJson\|materializeSharedSupports` over `.llm/tools/**/*_test.ts` is empty), although I2 promised one. | Make those five examples self-contained per D12 option (a) (e.g. `import type { AnyRouter } from '@orpc/server'; declare const router: AnyRouter;` and an `AuthenticatorPort` stand-in from `@netscript/service/auth`) and drop the `@app/router.ts` / `@app/auth.ts` supports, **or** keep the supports only where the owning member is an app-context package, and in either case add the D11 alignment test binding each `@app/`-family support to `generateAppDenoJson` and each `@database` use to `generateServiceDenoJson({hasDatabase:true})`. Re-run the gate; deferred numbers must not move. |
| **F2** | high | `.llm/tools/docs/jsdoc-example-corpus_test.ts` asserts `failureCensus` **exactly equals** `typeError: 21, unboundName: 116`. `deno test` walks dot-directories (verified: a `.hidden/a_test.ts` is discovered), so root `deno task test` — and the CI test job — runs it. The first example #1765 or #1766 fixes turns root tests red: a reverse ratchet contradicting D13 ("may later shrink without ceremony"). | Assert only `code === 0` and `jsdocExampleRatchetFailures(...) === []` (the `<=` ceilings), or assert `<=` on the two deferred counts. Keep the ceiling constants in `JSDOC_EXAMPLE_RATCHET` as the single home. |
| **F3** | medium | The pre-batch `invalidPlaceholder` regexes fire on **comment text**. Of the six examples pre-classified as `TS1109`/`TS1005`, three (`parseAppSettings`, `buildOtelEnvVars`, `getMssqlConfig`) match only on `// … {...}` comments. Those examples never reach `deno check`. Compiling them with comment ellipses neutralised: `parseAppSettings` **compiles clean** (a false deferred entry — the true deferred `typeError` count is 20, and #1766 lists an example that is not broken), the other two fail with **TS2451** (real, but not the TS1109 the artifact and #1766 record). Pre-classified examples also bypass the enforced check for a non-`@netscript`, non-relative bare specifier (only TS2307 would catch it). | Strip `//` and `/* */` comment content before applying the placeholder regexes (or anchor the ellipsis regex to non-comment code). Regenerate `deferred-classes.md`, set `maximumDeferredTypeError` to the measured value, and update the #1766 list. |
| F4 | low | Narrowing the `TracedQueue`, `createServiceQueryUtils`, and four `create*StreamDB` bodies deleted three classes of genuine published-API type error (restored-body run: deferred `typeError` 24 > 21). The `TracedQueue.listen` case is an API/typing gap — the public handler type is `MessageContext`, the runtime passes an unexported `TracedMessageContext`, the prose promises `span`. | Append a `drift.md` entry naming the removed diagnostics and add the three to #1766 (or a `@netscript/telemetry` typing issue for `listen`). No corpus change required. |
| F5 | low | "The compiler forces `NO_COLOR=1`" is only true when `FORCE_COLOR` is absent; Deno prioritises `FORCE_COLOR`. Invariance holds via `stripAnsi`. | Optional hardening: set `FORCE_COLOR: ''`/`clearEnv` alongside `NO_COLOR` in the `Deno.Command` env; one sentence in `drift.md`. |

Observations (no action): `checked=350` counts blocks *selected* for compilation; at head six are
pre-classified and never spawned (344 actually reach `deno check`). The `analysis.blocks` order is
stable, so ordinals in the deferred artifact are deterministic. Gate wall-clock ≈ 32 s.

## Gates recorded

| Gate | Result | Evidence |
| --- | --- | --- |
| Head equals dispatch target | PASS | `c73fee39c86f08882ba8a1214fd87c07d628672d` |
| Local == remote == PR | NOT ASSERTED | remote/PR at `303be12e`; PAT `workflow` scope, per dispatch |
| Evaluator scope (diff outside `.llm/runs/`) | PASS | empty |
| `deno task docs:jsdoc-examples` (colour on / `NO_COLOR=1`) | PASS ×2, identical | census above |
| `--deferred-output` vs committed `deferred-classes.md` | PASS | `diff` empty |
| RED re-execution at `72ca345f` (`FORCE_COLOR` unset) | RED as claimed | 165 = 27/21/116/0/1 |
| RED re-execution at `72ca345f` (host env, `FORCE_COLOR=3`) | 24 (historical color defect) | F5 |
| `deno task docs:jsdoc-examples:test` | PASS 15/15 | 3 s |
| `deno task gates:test` | PASS 68/68 | 6 s |
| `deno task check:mcp-export-corpus` | PASS | exit 0 |
| Targeted `deno check --unstable-kv` over the five tool modules | PASS | exit 0 |
| Empty-selection drive (3 shapes) | PASS (all refused, not spawned) | § 4 |
| Mutation a–d (bare fence, relative, exempt+relative, new unbound) | PASS (all red, attributed) | § 5 |
| Restored-body mutation | deferred 24 > 21 | § 7 / F4 |
| Root `deno task test` | NOT_RUN by me | author reports 4,291 pass; the two known `main` failures are not this leaf's; F2 is a latent, not current, failure |
| Aspire / Docker / browser / `e2e:cli` / `scaffold.runtime` | NOT_RUN | no expensive-gate lease; not needed for a compile-only tooling verdict |

## Lessons for promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| A typed support is an exemption written in TypeScript | Every alias in an import map used by a doc gate needs the same provenance proof as a `no-check` reason; an `any`-typed support can turn a #1425 defect green | docs gates | high |
| Ratchet fixtures must use the same inequality as the ratchet | An `assertEquals` on a "may shrink" count is a reverse ratchet that traps the follow-up issues | tooling gates | high |
| `NO_COLOR` is not a guarantee; strip, don't trust | Deno honours `FORCE_COLOR` over `NO_COLOR`; a parser must normalise what it consumes | subprocess parsers | high |
| Pre-batch syntax heuristics must not read comments | Comment text is free-form; a regex that skips an example before the compiler sees it must be code-only | docs gates | medium |
