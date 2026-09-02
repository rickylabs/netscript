# IMPL-EVAL — test-jsdoc-example-compile-gate--1533 (cycle 2)

- Evaluator session: Native Claude · Fable 5 · opposite-family, fresh; did not plan, implement, or
  evaluate cycle 1 of this leaf · job `9316340d` · 2026-08-30
- Run: `test-jsdoc-example-compile-gate--1533` · PR #1756 (draft) · branch
  `test/jsdoc-example-compile-gate` · closes exactly #1533
- **Evaluated head: `4cdee82fbb27c222e1a5cbd807b84a079d01cbda`** (confirmed `git rev-parse HEAD` in
  the detached evaluator worktree `/home/agent/projects/netscript/worktrees/007-eval-1533-c2`)
- Remote / PR head: `303be12eab5e54ada654d55f60e8cfbf1921ea73`; remote `main`
  `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` — **knowingly different and not asserted equal**: the
  branch carries `e1ea9d3a` (`.github/workflows/ci.yml`) and the PAT lacks `workflow` scope. A
  coordinator credential boundary, not a leaf defect. This artifact is committed locally only.
- Cycle-1 artifact `impl-eval.md` and `plan-eval.md`/`plan.md` are bit-identical to `6d85d4f2`
  (`git diff --quiet 6d85d4f2 HEAD -- <three files>` exits 0).
- Evaluator boundary: exactly one new file (`impl-eval-cycle-2.md`);
  `git diff HEAD --stat -- . ':!.llm/runs'` is empty (`IMPL-EVAL-BRIEF.md` is the untracked
  dispatch brief and predates this session). One throwaway worktree at `4cdee82f` lived under the
  job tmp dir for corpus mutations and was removed afterwards.

## Verdict

**`PASS`** — every cycle-1 repair does what it claims under direct attack, in both directions
(the #1425 class fails; legitimate app examples still pass; the ratchet is free to shrink and
fails on growth; every empty-selection shape is refused before `deno check` is spawned; no
exemption exists and none can be admitted; the printed deferred census matches the classifier
artifact and the two follow-up issues). Four low findings and two observations are recorded for the
follow-up lanes; none reopens the narrowed contract or changes the verdict.

## Attack narrative

### 1. F1 repair — the false green is now red, and the legit path is still green

The repair is two parts: the five `@netscript/service` examples were rewritten to
`declare const router: ServiceRouter` / `declare const authenticator: AuthenticatorPort` (both are
real exports of `@netscript/service`: `packages/service/src/types.ts:11`,
`packages/service/src/auth/types.ts:75`, re-exported from `mod.ts`; `defineService<T extends
ServiceRouter>(router: T, …)` at `define-service.ts:219` — so the stand-in matches the documented
signature), and `scaffoldAliasViolation()` now rejects an alias family whose owning member is not a
matching scaffold context. The `@app/router.ts` / `@app/auth.ts` supports are gone.

Driven through the real `compileJsdocExamples` with synthetic owners (job tmp `attack-unit.ts`):

| # | Owner | Body | Result |
| --- | --- | --- | --- |
| A1 | `@netscript/service` symbol | `import { router } from '@app/router.ts'` | `code=1`, `badSpecifier=1`, *app-generated alias "@app/router.ts" is not generated for @netscript/service* |
| A2 | same | `await import('@app/router.ts')` | same rejection (dynamic import covered) |
| A3 | same | `export { router } from "@app/router.ts"` | same rejection (export-from covered) |
| A4 | `@netscript/fresh` module | `import { definePage } from '@app/utils.ts'` | `code=0`, spawned, `badSpecifier=0` — legitimate app example still passes |
| A5 | `@netscript/fresh` module | `import { router } from '@app/router.ts'` (support removed) | `code=1`, spawned, TS2307 → `badSpecifier=1` — the alias family alone is not a free pass |
| A6/A7 | `@netscript/cron` symbol | `@database` / `@database/zod` | rejected: *service-generated alias … not generated for @netscript/cron* |
| D3 | service symbol | import of a non-existent export from a declared subpath | TS2305 → `badSpecifier=1`, enforced |
| D4 | service symbol | the repaired shape (`declare const router: ServiceRouter; await defineService(router, …)`) | `code=0`, no deferred entry — the repair compiles against the real signature |

**Corpus-level** (throwaway worktree at head, run 1): reverting `packages/service/mod.ts` example 1
to `import { router } from '@app/router.ts'` — the exact cycle-1 false green — produced
`jsdoc examples: FAIL … failures=2`, `enforcedFailureCensus={"badSpecifier":2,…}`, with the line
`packages/service/mod.ts · module · example 1 · fence 1: app-generated alias "@app/router.ts" is
not generated for @netscript/service`. Exit 1.

**Alignment test vs real generators.** `scaffold aliases align to app and service generators per
documented owner` (passes, 2 s) executes `generateAppDenoJson` and `generateServiceDenoJson` via
`deno eval` and asserts `app.imports['@app/'] === './'`, `service.imports['@app/'] === undefined`,
`typeof service.imports['@database'] === 'string'` (`hasDatabase: true`), then asserts the rule
table's `{prefix, scaffoldKind}` pairs and drives a service-owner rejection plus a fresh-owner
acceptance through the compiler. The **prefixes and their scaffold kinds** are therefore bound to
the generators. The **`allowedMemberNames` lists are hand-maintained** and not derived from any
generator output (observation O1 below). Independently verified provenance of the remaining
supports: `@database/zod` is generated at the workspace level
(`packages/cli/src/kernel/templates/workspace/deno-json.ts:47`,
`application/scaffold/workspace-init.ts:17`), `@<project>/contracts` by both the app
(`generate-app-deno-json.ts:64-66`) and service (`generate-service-deno-json.ts:68`) generators;
the only corpus users of these families at head are `@netscript/contracts` (`@database/zod`),
`@netscript/database`/`@netscript/prisma-adapter-mysql`/`@netscript/service` (`@database`),
`@netscript/sdk` (`@app/lib/orders.ts`, `@my-app/contracts`), `@netscript/fresh`
(`@app/streams/schemas.ts`). The `@app/utils.ts` hit under `packages/cli` is a scaffold template
string in `web-scaffold.ts:29`, not a JSDoc example.

### 2. F2 — ratchet is monotonic in the right direction

- The corpus test now asserts only `{ code: 0, ratchetFailures: [] }`; the exact-census
  `assertEquals` is gone; `JSDOC_EXAMPLE_RATCHET` is the single ceiling source
  (`maximumDeferredTypeError: 20`, `maximumDeferredUnboundName: 116`).
- **Shrink (corpus run 2):** deleting the `ServeOptions` `@example` (a deferred TS2304 entry) from
  `packages/service/src/types.ts` → `PASS … examples=350 candidates=349 checked=349 exempt=0`,
  `deferredCensus={"unboundName":115,"typeError":20}`, exit 0. Shrinking is free.
- **Growth (corpus run 1):** adding a module example calling an undeclared `openMysteryStore()` to
  `packages/kv/mod.ts` → `ratchet failure: deferred unboundName 117 > 116`, exit 1.
- The focused policy test additionally asserts `accepted.slice(0, -1)` is accepted and
  `[...accepted, deferred('typeError')]` fails with the ceiling read from the constant.

### 3. F3 — placeholders are code-only; pre-classified examples still hit the specifier policy

- `invalidPlaceholder` now runs on `maskCommentsAndStrings(block.body)`. C3: a body whose only
  ellipsis is `// ... { anything }` followed by a real signature misuse reaches `deno check` and is
  classified deferred `typeError` TS2322 (not TS1109). C4: an ellipsis inside a string literal is
  not a placeholder (`code=0`, spawned). C5: an object-member fragment is still pre-classified
  TS1005.
- Ordering: `forbiddenSpecifier` runs **before** the placeholder check, so C2 (`import x from
  './ghost.ts'` + real `...`) is `badSpecifier=1`, enforced, exit 1.
- Regenerated `deferred-classes.md` via `--deferred-output` is byte-identical to the committed
  artifact; `parseAppSettings` is gone; `buildOtelEnvVars`/`getMssqlConfig` carry TS2451. Three
  examples remain pre-classified at head (`createTransformer` TS1109, `traceJobDispatch` TS1109,
  `createTraceContext` TS1005); their only imports are declared `@netscript/*` subpaths, which the
  static policy covers — see F9 for the latent gap.

### 4. The narrowed contract — exactly specifier + fence integrity

Enforced (exit 1): relative/absolute import (A10, B1m, C2, run 1), undeclared `@netscript/*`
subpath (D2), scaffold alias outside its owner set (A1–A3, A6, A7), alias without a support
(A5, TS2307), missing export from a declared subpath (D3, TS2305), bogus bare specifier reaching
the compiler (C6, TS2307), bare fence / blank exemption reason (E5: 2021 × *malformed ts fence:
expected no-check:<nonblank reason>*), exemption growth and deferred growth (run 1).
Deferred (exit 0, counted, printed): a type error against the documented symbol's real signature
(D1 → `deferredCensus.typeError=1`, `code=0`). That is the coordinator's narrowed contract as
written in `plan.md` D13/D17 — nothing more is red, and the #1425 class is red.

### 5. Empty selection — every shape refused before spawn

| Shape | Route | Census | Result |
| --- | --- | --- | --- |
| zero blocks (unit) | compiler | `candidates=0` | `code=1`, `denoCheckSpawned=false`, *zero candidates* |
| all blocks exempt (unit, D5) | compiler | `checked=0` | `code=1`, not spawned, *zero checked modules*; ratchet `exempt 2 > 0` |
| all blocks pre-classified placeholders (unit, D6) | compiler | `modules.length=0` | `code=1`, not spawned, both TS1109 listed |
| real analyzer, every `deno doc` payload empty (E1) | injected `loadDoc` | `examples=0 candidates=0 checked=0` | `code=1`, not spawned |
| real analyzer, every example a `js` fence — nothing matches TypeScript (E3) | injected `loadDoc` | `examples=2021 candidates=0 nonTypeScript=2021` | `code=1`, not spawned |
| real analyzer, every example `ts no-check: illustrative` (E4) | injected `loadDoc` | `candidates=2021 checked=0 exempt=2021` | `code=1`, not spawned; ratchet `checked 0 < 348`, `exempt 2021 > 0` |

The refusal in `compileJsdocExamples` (`candidates === 0 || checked === 0`) precedes any temp dir or
`deno check` spawn; the post-materialization `modules.length === 0` guard covers the all-pre-classified
case. I did not read a zero-path `deno check` exit as anything.

### 6. Exemptions — none exist, and none can smuggle the D5 classes past the static policy

`exempt=0` at head, `maximumExempt: 0`. With an exempt block beside a clean checked block (so the
`checked=0` refusal does not mask the result): B1m relative import, B2m undeclared subpath, B3m
service-owner `@app/` alias — all three are `badSpecifier=1`, `code=1` **plus** `exempt 1 > 0`: the
exemption does not excuse them. B4m (type error against the real `defineService` signature), B5m
(bogus bare specifier), B6m (TS2305 missing export) — the exempt block skips the compiler, so the
compiler-detected classes are **not** reported (`enforced=0`, `code=0`); only the `exempt 1 > 0`
ratchet fails the run. See F8. At the corpus level (run 1) a `typescript no-check: illustrative
wiring` fence over a `./router.ts` import was printed as `exemption=…define-service.ts:1
reason=illustrative wiring`, counted `badSpecifier`, and tripped `exempt 1 > 0`.

### 7. Deferred honesty

`deno task docs:jsdoc-examples --deferred-output …` at head, my run: exit 0,
`PASS members=35 files=2021 examples=351 candidates=350 checked=350 exempt=0 non_ts=1 unfenced=0
malformed=0 failures=0`, `enforcedFailureCensus={"badSpecifier":0,"unfenced":0,"malformed":0}`,
`deferredCensus={"unboundName":116,"typeError":20}` — printed on a **passing** run. The regenerated
artifact `diff`s empty against `deferred-classes.md`, whose section headers read *116 examples* /
*20 examples* (136 list entries). Matches #1765 (116) and #1766 (20) as dispatched.

### 8. Receipt honesty

Every hex string cited in the PR body/comments and in the cycle-2 `drift.md`/`worklog.md` additions
resolves as a commit: `02957fc9`, `0495c9b6`, `0f30c4f4`, `13878a80`, `303be12e`, `3e5cbabf`,
`4840ed23`, `4cdee82f`, `551f4edc`, `65c2f99c`, `6d85d4f2`, `72ca345f`, `9b34b657`, `a1a4328b`,
`b4a4a40c`, `b8d271e9`, `c73fee39`, `c9216c2d`, `e1ea9d3a`, `e63f1b85`, `f9e17f4a`, `fa11f2d3`,
`faf03851`. Two non-resolving strings are not SHAs and are labelled as such in context: `e6d0ed7b`
(cycle-1 evaluator job id) and `5469163308` (a PR comment id). PR #1756: draft, base `main`,
milestone `0.0.7`, labels `type:test area:docs area:tooling status:impl`, body contains
`Closes #1533`. CI wiring: `ci.yml:373-375` runs `run-gate.ts --gate jsdoc-example-compile`.

## Findings

| # | Severity | Finding | Suggested handling (non-blocking) |
| --- | --- | --- | --- |
| F6 | low | `scaffoldAliasViolation` matches by bare `startsWith(prefix)`; the `@database` rule fires on any specifier starting with `@database`, e.g. the real npm scope `@databases/pg` (A8 → *service-generated alias "@databases/pg" is not generated for @netscript/cron*). No corpus example hits it today. | Match `specifier === prefix \|\| specifier.startsWith(prefix + '/')` for non-slash-terminated prefixes. |
| F7 | low | `IMPORT_SPECIFIER` runs on the **unmasked** body while `invalidPlaceholder` runs on the masked one: a commented-out `// import { router } from '@app/router.ts'` (A9) or a string containing `from './router.ts'` (A10) is an enforced `badSpecifier`. False-red only; no corpus example hits it. | Apply `maskCommentsAndStrings` (keeping string *contents* of import specifiers) or mask comments only before the specifier scan. |
| F8 | low | An exempt block skips the compiler entirely, so compiler-detected specifier failures (TS2305 missing export B6m, TS2307 bogus bare specifier B5m) and D5's "type error against the real signature" (B4m) are invisible on the exempt path; today only `maximumExempt: 0` makes them fail. D5 holds at head solely through the zero ceiling. | Record in `drift.md`/#1766: if the exempt ceiling is ever raised, exempt blocks must still compile their import lines (or TS2305/2307 must be statically pre-checked). |
| F9 | low | A pre-classified placeholder example (real `...` in code) never reaches the compiler, so a bogus bare specifier in it passes (C1: `import x from 'ghost-pkg-zzz'` + `{ ... }` → deferred TS1109 only, `badSpecifier=0`). Latent: the three pre-classified examples at head import only declared `@netscript/*` subpaths, and adding a new one grows the ratchet. | Same handling as F8: statically resolve bare specifiers of pre-classified blocks against the import map, or note in #1766. |

Observations (no action): **O1** — `allowedMemberNames` in `JSDOC_SCAFFOLD_ALIAS_RULES` is a
hand-maintained list (`@app/` → fresh, sdk; `@database` → contracts, database, prisma-adapter-mysql,
service); the alignment test binds prefixes/kinds to the generators but nothing binds the member
sets, so adding a member there is an unreviewed policy widening. **O2** — `plan.md` D13 still
reads "21 type-error examples"; the corrected 20 is recorded in `drift.md` (2026-08-30) and
`JSDOC_EXAMPLE_RATCHET`, so the plan text is stale by one, not the gate.

## Gates recorded

| Gate | Result | Evidence |
| --- | --- | --- |
| Head equals dispatch target | PASS | `4cdee82fbb27c222e1a5cbd807b84a079d01cbda` |
| Local == remote == PR | NOT ASSERTED | remote/PR `303be12e`; PAT lacks `workflow` scope, per dispatch |
| `impl-eval.md` / `plan-eval.md` / `plan.md` bit-identical since `6d85d4f2` | PASS | `git diff --quiet` exit 0 |
| Evaluator scope (diff outside `.llm/runs/`) | PASS | empty |
| `deno task docs:jsdoc-examples --deferred-output` | PASS | exit 0; 116/20; exempt=0; artifact `diff` empty |
| `deno task docs:jsdoc-examples:test` | PASS 17/17 | incl. generator alignment test |
| Root `deno task test` (run by me) | PASS | exit 0 · 4,293 passed · 0 failed · 19 ignored · 230 s |
| `deno task arch:check` | PASS | exit 0 |
| `deno task check:publish-assets` | PASS | exit 0 |
| Unit attack matrix A1–A10, B1m–B6m, C1–C6, D1–D7 | as tabulated | § 1, 3, 4, 6 |
| Empty-selection drive (6 shapes, 3 via real analyzer) | PASS (all refused, not spawned) | § 5 |
| Corpus mutation run 1 (F1 revert + exempt/relative + growth) | FAIL as required | `badSpecifier=2`, `exempt 1 > 0`, `unboundName 117 > 116`, exit 1 |
| Corpus mutation run 2 (shrink one deferred example) | PASS as required | `unboundName=115`, exit 0 |
| `quality:scan`, `check:assets-barrel` | NOT_RUN by me | supervisor reports exit 0; not needed for this verdict |
| Aspire / Docker / browser / `e2e:cli` / `scaffold.runtime` | NOT_RUN | coordinator-owned expensive-gate lease; not needed for a compile-only tooling verdict |

## Lessons for promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| An all-exempt fixture tests the refusal, not the exemption | To prove an exemption cannot hide X, pair it with a checked sibling or the `checked=0` refusal answers first | gate evaluators | high |
| Alias-prefix rules need a delimiter | `startsWith('@scope')` also matches `@scope-other/…` and `@scopes/…` | specifier policies | medium |
| A zero ceiling is a policy, not a mechanism | When "cannot be exempted" is delivered by `maximumExempt: 0`, say so, so raising the ceiling is known to reopen the class | ratchet design | high |
