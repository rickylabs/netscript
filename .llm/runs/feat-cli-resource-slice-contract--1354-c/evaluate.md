# Evaluation: Slice C resource contract and safe reconciler — follow-up IMPL-EVAL (PR #1946, pass 2)

Bounded follow-up to the `FAIL_FIX` receipt below (attested at `b86524bcb`). Criteria 1–5, 7, 8 of that
pass are **not re-derived**; this pass judges only the four items in the follow-up brief.

## Metadata

| Field          | Value                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Run ID         | `feat-cli-resource-slice-contract--1354-c`                                             |
| PR             | #1946 — `feat/cli-resource-slice-contract` → `main`, `Refs #1354`, no closing keyword  |
| Attested head  | `37b3b9b6554484b4a15e1f84877595d8eb6cceda` (`git rev-parse HEAD`; `--ff-only` merge: already up to date; tree clean) |
| Prior head     | `b86524bcb9a74279f1960f9ad9f470e38a1d8f5b` (`FAIL_FIX`, HIGH-1)                         |
| Evaluator      | Separate native Claude Fable 5.1 session (`claude-fable-5-1`), 2026-09-02; product tree read-only, no product byte authored |

Generator ≠ evaluator holds.

## Diff under judgement (`git diff --name-only b86524bcb..37b3b9b65`)

Product: `reconcile-state.ts` (+99/−18), `reconcile-state_test.ts` (+30), `reconcile-resource-slice_test.ts`
(+18), and — for LOW-1 — `plan-resource-slice.ts` (+7/−1) and `reconcile-resource-slice.ts` (+8/−2).
Run artifacts: `context-pack.md`, `drift.md`, `evaluate.md`, `worklog.md`. `git diff --name-only … -- packages`
lists exactly those five files; `reconcile-app-routes.ts`, its test, and `resource-slice-contract.ts` are
byte-identical to the prior head. No generated carrier, lockfile, or public export touched; still ten
children in the directory.

## Judgement

### 1. HIGH-1 closed — `PASS`

- **Mechanism.** `reconcile-state.ts` no longer has a `propertyPattern`; `grep -nE 'propertyPattern|\[\^;\]'`
  returns nothing. `scanStateInterface` (the brace/quote/comment-aware scan already used for the closing
  anchor) now also splits the interface body into members at `;` only when `depth === 1` and no
  parentheses/brackets are open (`reconcile-state.ts:132-135`, plus the trailing unterminated member at the
  close brace). Each member goes through `parseNamedProperty`, which strips leading trivia and an optional
  `readonly`, then anchor-matches the key as bare identifier (with a `(?![A-Za-z0-9_$])` boundary), `'name'`,
  or `"name"` — the only remaining `RegExp` and it runs on an already-isolated top-level member, not on
  source lines, so it is not a resurrection of the line regex. Any match with `optional`, a non-`:`
  remainder, or a type text ≠ `requirement.type.trim()` → `conflict`; a single exact non-optional match →
  `exact`; no match → `insert` (`:48-57`).
- **Counter-examples re-run by this session** (pure probe script in scratchpad, `deno run --allow-read`,
  exit 0), against requirement `{ordersRequest: OrdersRequestState}`:

  | Fixture                                                            | Result     | Occurrences of name in output |
  | ------------------------------------------------------------------ | ---------- | ----------------------------- |
  | `readonly ordersRequest: { id: string; };` (prior repro 1)         | `conflict` | —                             |
  | `'ordersRequest': Other;` (prior repro 2)                          | `conflict` | —                             |
  | `"ordersRequest": OrdersRequestState;`                             | `exact`    | 1 (unchanged source)          |
  | `readonly ordersRequest?: OrdersRequestState;`                     | `conflict` | —                             |
  | `readonly ordersRequest: OrdersRequestState;`                      | `exact`    | 1                             |
  | `readonly ordersRequest: (a: string) => void;`                     | `conflict` | —                             |
  | `readonly label: '}'; readonly ordersRequest: Other;`              | `conflict` | — (string-brace handled)      |
  | nested: `readonly session: { readonly ordersRequest: Other; };`    | `insert`   | 2 (nested + one new member)   |
  | nested in fn return type at depth 2                                | `insert`   | 3 (two nested + one new)      |
  | `readonly ordersRequestExtra: Other;`                              | `insert`   | 2 (boundary, not substring)   |
  | `// readonly ordersRequest: Other;` line comment                   | `insert`   | 2                             |
  | `export type State = Record<string, never>;`                       | `insert`   | 1                             |

  Neither prior counter-example can reach `insert` any more; no path yields a duplicate top-level member.
- **Fixtures.** `reconcile-state_test.ts` adds exactly the three required tests: `conflicts with a same-named
  property whose type is an object literal`, `conflicts with a quoted same-named property`, and `ignores the
  property name inside a nested object member`. The nested test asserts `insert`, exactly two occurrences of
  `ordersRequest` in the output, and the literal inserted line — that is the depth-aware proof: a substring
  match would have produced `conflict` and a naive line match would have produced `exact`/`conflict`; only a
  depth-1 member scan yields `insert` with the count 2. The pre-existing `does not mistake a same-named
  declaration outside State for a State member` test still passes.

### 2. No regression — `PASS`

- Product diff limited to the five files above; `reconcile-app-routes.ts`/`_test` and the contract are
  unchanged (`git diff --quiet` true), and the `STOCK_POST_SLICE_F_ROUTER` fixture is still referenced 10
  times in the app-routes test. The prior criterion-6 app-routes findings therefore carry over verbatim.
- State shapes: `export type State = Record<string, never>;` → interface conversion still `insert`
  (probe, and test `converts the empty Record State alias to a marked interface once`); existing
  `export interface State {` → `insert` preserving unrelated members; `fails closed for conflicting, extended,
  aliased, intersected, duplicate, or missing State` still present and green. Anchors (`INTERFACE_START`,
  `EMPTY_STATE`, `scanStateInterface` close brace) unchanged.
- Test count 32 → 36 = +3 state fixtures +1 ordering test; zero failures, zero ignored.

### 3. LOW-1 — applied

`localeCompare` no longer appears anywhere under `resource-slice/`. Both `plan-resource-slice.ts:113-117` and
`reconcile-resource-slice.ts:107-111` add a local `comparePath` using `<`/`>` (UTF-16 code-unit order,
ICU-independent) and use it for the leaf plan, report, and write-list sorts. New test `orders reports and
writes by code point rather than ICU collation` pins `(_components)/a.tsx` before `_b.tsx` for both `report`
and `applyPlan.files` — the exact pair where ICU and code-point order differ. The two identical private
helpers are a minor duplication; not a finding.

### 4. Layering — `PASS`

`reconcile-state.ts` imports only `type { RequiredResourceState } from './resource-slice-contract.ts'`.
Grep over the five non-test files for `Deno.`, `node:fs`, `@std/fs`, `@std/path`, `fetch(` is empty.

## Gate Results (independently re-run at `37b3b9b65`)

| Gate                    | Command                                                                                  | Result | Evidence                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| Focused tests           | `run-deno-test.ts -- --allow-all packages/cli/src/kernel/application/resource-slice/`     | `PASS` | exit 0; 36 passed / 0 failed / 0 ignored                                                        |
| Structured check        | `run-deno-check.ts --root packages/cli --ext ts,tsx`                                     | `PASS` | exit 0; 926 files, 8 batches, 0 failed batches, 0 diagnostics                                   |
| `deno task arch:check`  |                                                                                          | `PASS` | exit 0; zero `FAIL=[1-9]`; zero `resource-slice` occurrences; only pre-existing DEPS-NPM-CATALOG and F-5/F-6 WARNs |
| `deno task quality:gate`|                                                                                          | `PASS` | exit 0; zero `FAIL=[1-9]`; zero `resource-slice` occurrences                                     |
| PR CI at head           | `gh pr view 1946 --json statusCheckRollup`                                               | `PENDING` | head `37b3b9b65`; `code-quality`, `build`, `close-gate`, `classify docs-site changes` SUCCESS; `check-test` and `quality` still running at evaluation time (their local equivalents above are green) |
| Aspire / Docker / e2e   |                                                                                          | `N/A`  | prohibited for this slice                                                                        |

## Findings

None blocking. Carried observations from the prior pass (LOW-2 union helper → Slice E; LOW-3 task-local
lint/fmt config) are unchanged and remain non-findings against this PR.

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | HIGH-1 is closed by construction: same-name `State` member detection now runs on top-level members isolated by the depth-aware scan, both original counter-examples and every probed variant classify as `conflict`/`exact`, and the three required fixtures (object-literal type, quoted key, nested-at-depth insert with occurrence count) prove the fix is not a substring match. The line-regex path is removed, not bypassed. The product diff is confined to `reconcile-state.ts`, its test, the ordering test, and the LOW-1 comparator swap; app-routes and the contract are byte-identical; both `State` shapes, anchors, and fail-closed cases still hold; layering is unchanged. Tests 36/36, check 926/0, arch and quality exit 0 with `FAIL=0`. |
| Next step | Merge-readiness is the coordinator's call once `check-test`/`quality` CI finish at `37b3b9b65`; no further IMPL-EVAL cycle is required for Slice C. |

[PHASE: IMPL-EVAL] [VERDICT: PASS]

---

# Evaluation: Slice C resource contract and safe reconciler — formal IMPL-EVAL (PR #1946)

Filled from `.llm/harness/templates/evaluate.md`. Allowed result values: `PASS`, `FAIL`, `N/A`,
`PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`. Anti-pattern status values: `CLEAR`, `VIOLATION`,
`DEBT_ACCEPTED`, `N/A`.

This report supersedes the earlier cycle-1/cycle-2 evaluation text that lived in this file (attested
at `bc5120684`). It is the formal IMPL-EVAL for the immutable PR head.

## Metadata

| Field          | Value                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| Run ID         | `feat-cli-resource-slice-contract--1354-c`                                               |
| PR             | #1946 — `feat/cli-resource-slice-contract` → `main`, `Refs #1354`, no closing keyword    |
| Attested head  | `b86524bcb9a74279f1960f9ad9f470e38a1d8f5b` (verified `git rev-parse HEAD` in worktree)   |
| Merge-base     | `850cc7757d11d420b9061dbe6a61536357ab77fe` (`git merge-base HEAD origin/main`)           |
| Target         | `packages/cli/src/kernel/application/resource-slice/` (ten files, internal, IO-free)     |
| Archetype      | `6 — CLI / Tooling`                                                                      |
| Scope overlays | Fresh 2.x static route / `appRoutes` / `State` contract semantics only; no runtime gates |
| Evaluator      | Separate native Claude Fable 5.1 session (`claude-fable-5-1`), 2026-09-02                |

### Evaluator identity (requested vs observed)

| Field   | Requested                                             | Observed                                                                            |
| ------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Route   | native opposite-family Claude Fable 5, separate session | Claude Code session `session_01VyeBXMJmj5uPaQFngpkdgn`, model `claude-fable-5-1`  |
| Author  | Codex implementation session (`supervisor.md`)        | no product byte authored by this session; product tree read-only                    |
| Effort  | per `lane-policy.md`                                  | session default; no explicit effort attestation surface in this transport            |

Generator ≠ evaluator holds.

## Authority read

- Master plan: `git show origin/feat/cli-resource-slice-plan:.llm/runs/feat-cli-resource-slice--1354/plan.md` — D3 (narrowed conflict contract, ownership marker exact format, conflict remedy surface, seven-point required proof), D6 (State shapes), shared-file mutation matrix, Slice C section (ten-file ceiling, expected touch set, required gates, 14-child WARN observation), ceiling rules (generated carriers exempt).
- PLAN-EVAL trail: `plan-eval.md` (cycles 1–2 `FAIL_PLAN`), `plan-eval-cycle3.md` (MEDIUM-3 = #1355 fence + `Refs #1354` shape); the leaf `research.md`/`plan.md` record the final `PASS_PLAN_WITH_FINDINGS` and `PLAN-EVAL: N/A` for this leaf. Note: the caller's brief describes MEDIUM-3 as "static absolute routes only"; the plan text that actually carries that rule is D2/Slice C item 2 ("parameter/catch-all rejection"). Both were judged.
- Leaf run artifacts: `plan.md`, `research.md`, `worklog.md` (§ Design present), `drift.md`, `implement.md`, `context-pack.md`, `supervisor.md`, evaluator briefs.

## Process Verification

| Check                                        | Result | Evidence                                                                                                                                                                              |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation       | `PASS` | `PLAN-EVAL: N/A` recorded in leaf `plan.md` § Locked scope and `worklog.md` bootstrap row before commit `03d4c2519`; master plan carries its own evaluated verdict.                    |
| Design section exists in worklog             | `PASS` | `worklog.md` § Design names surface (none moved), vocabulary, constants, ports (none — IO-free), one commit slice, deferred scope.                                                     |
| Commit slices match design plan              | `PASS` | `03d4c2519` feat, `bc5120684` fix (appRoutes hardening from cycle-1 finding), `ed38ae599`/`b86524bcb` docs. Product diff `850cc7757..b86524bcb` = exactly the ten files + run dir.    |
| Each slice has a passing gate                | `PASS` | Independently re-run at `b86524bcb` (see Gate Results).                                                                                                                               |
| Brief carries `## SKILL` chapter             | `PASS` | `evaluator-brief.md` and `evaluator-followup-brief.md` present in run dir; harness rule satisfied for the briefs in scope.                                                              |
| Close-gate                                   | `N/A`  | `Refs #1354` partial work, no closing keyword, `status:impl`; no `ready-merge` label; close-gate check green on PR.                                                                    |
| Release-gate class                           | `N/A`  | Not a cut or release-gating run.                                                                                                                                                      |

## Judgement against D3 / Slice C (the caller's eight criteria)

### 1. Ceiling and layering — `PASS`

- `git diff --name-only 850cc7757..b86524bcb`: ten product files under `application/resource-slice/` plus ten `.llm/runs/...` artifacts. No generated carrier touched, no lockfile, no public export.
- Imports (non-test): `resource-slice-contract.ts` → `@std/text` only; the other four import only `./resource-slice-contract.ts`. Zero `Deno.*`, `node:fs`, `@std/fs`, `@std/path`, `fetch(`, presentation, or Fresh runtime import. No reconciler reads or writes a filesystem — inputs are `current: Record<string, string|undefined>` and staged strings.
- Overlap with PR #1664's file list (`gh pr view 1664 --json files`): `comm -12` empty. Slice A's four files (`client-selector.ts`/`_test`, `web-scaffold.ts`/`_test`) untouched.

### 2. Ownership marker is exact — `PASS`

- `markOwnedResourceSliceLeaf` emits `RESOURCE_SLICE_MARKER_PREFIX + JSON.stringify({schema, resource, role, options, bodySha256}) + '\n' + body` with object literal key order `schema, resource, role, options, bodySha256` (`resource-slice-contract.ts:243-256`); options pass `normalizeMarkerOptions` (must include `core`, unique, `.sort()` lexicographic); body must end with LF (rejected otherwise); hash = SHA-256 over `TextEncoder().encode(body)` (UTF-8 bytes after the marker line, final newline included).
- `parseOwnedResourceSliceLeaf` re-serialises and requires `line === PREFIX + JSON.stringify(metadata)` — byte-for-byte canonical acceptance; key-order drift, schema≠1, unknown role/variant, non-64-hex are rejected.
- Test pins the literal line `// @netscript/resource-slice {"schema":1,"resource":"orders","role":"page","options":["core","form"],"bodySha256":"68ce9f71…84af"}`. Independently reproduced: `printf 'export const page = true;\n' | sha256sum` = `68ce9f712800f8006bc8177f4525c6a5d69e9fe0e449dfc631f8cd0851ca84af`. Key-order-swapped and `schema:2` markers are pinned as rejected.

### 3. Three-way fail-closed classification — `PASS`

- `classifyResourceSliceLeaf`: `absent` / `exact` (byte-equal, reported `skip`) / `owned` (valid marker, resource+role match, hash matches) / `owned-edited` (hash mismatch) / `unowned` (missing, malformed, unsupported schema, wrong resource, wrong role). `absent`/`exact` are operational states; the D3 three-way ownership split is exact.
- `decideLeaf`: `owned-edited` and `unowned` always `conflict`, remedy never mentions `--force`, and `force` is never consulted for them; `owned` conflicts unless canonical additive transition or `--force`.
- Forgery limitation documented and tested, not hidden: test `recomputed marker forgery is owned by convention but needs force` (default → conflict; `--force` → replaced). Matches D3 verbatim.

### 4. Additive options — `PASS` with observation (LOW-2)

- `normalizeVariants` dedupes and sorts (`['core', ...new Set(variants)].sort()`); planner gives page/view the full selected set and each optional leaf `['core', variant]`.
- `isCanonicalAdditiveTransition` accepts a write without force only when the recorded options are a strict subset of the candidate's and the current bytes equal a caller-supplied prior canonical rendering for those options — D3's "compared with the canonical rendering for its recorded schema/options".
- Later option against an edited base leaf: test `additive option is selected and fully reported before an edited-base dry-run conflict` — dry-run status, exit 1, `form` leaf reported `write/absent`, base leaf `conflict/owned-edited` with "Move or rename" remedy; no `applyPlan`.
- Observation: the D3 step-2 union itself (recognised prior marker options ∪ new flags → effective set) is not computed by any of the ten files; the test hands the union in. Slice E owns "resolve, validate, plan, preflight" and no Slice C touch-set item names a union helper, so this is not a Slice C gap — recorded so Slice E does not inline it into the command file.

### 5. Zero writes before apply, by construction — `PASS`

- Only the `status: 'ready'` arm of `ResourceSliceReconcileResult` carries `applyPlan`; `dry-run`, `conflict`, and `preflight-failed` structurally cannot expose a write list (`resource-slice-contract.ts:165-196`). `preflight-failed` covers all six `ResourceSlicePreflightPhase` values including `fresh-staging` and `shared-source-transform`, and `candidate-validation` is raised internally for duplicate paths / invalid staged markers.
- D3 proof map to named tests in `reconcile-resource-slice_test.ts`: (3) identical second run → `identical second run skips every path and plans zero writes`; (2) default conflict → `default conflict reports every path, force eligibility, and no apply plan`; (4) later option vs edited base → test above; (5) owned-edited under force → `mismatched body hash is owned-edited and never replaceable under force`; (6) owned-only force, exactly one leaf, shared untouched → `force replaces only positively owned leaves and leaves shared/exact bytes alone`; (7) unowned never replaced → `unowned content remains a conflict under force` + five-fixture unowned test; forgery → named above; (1) every pre-apply failure → `each injected pre-apply failure structurally proves zero application writes` + `invalid staged ownership metadata fails before an apply plan exists`.

### 6. Shared files fail closed — `FAIL` (HIGH-1 below)

- `reconcile-app-routes.ts`: requires both stock generated imports; exactly one `export const appRoutes = {` at column 0; brace/quote/comment-aware close; `} as const;` closing anchor; depth-aware top-level property split; quoted/computed/spread entries → conflict; alias reuse, alias-with-other-value, other-alias-same-value → conflict; insert is a single `  alias: generatedRoutes.<keyPath>,\n` line before the close brace; never rewrites the file. The stock post-Slice-F `router.ts` fixture (LOW-5) is present as `STOCK_POST_SLICE_F_ROUTER` and is the must-pass insert case; the current `packages/cli/src/kernel/assets/app/router.ts.template` (pre-Slice-F) has the same import lines and `export const appRoutes = {` / `} as const;` anchors, so the anchor choice survives F. Probe: a same-line trailing block comment on the alias value correctly conflicts rather than duplicating.
- `reconcile-state.ts`: both D6 shapes handled (`export type State = Record<string, never>;` → interface conversion; existing `export interface State {`), extension/alias/intersection/duplicate/missing → conflict, exact same-type property → `exact`, optional or different simple type → conflict, brace-in-comment handled, `utils.ts` never replaced. The stock `utils.ts.template` is exactly the empty-Record shape.
- **Defect:** the same-name detection regex `^\s*(?:readonly\s+)?<prop>(\?)?\s*:\s*([^;]+);\s*$` cannot match a member whose type contains `;` (object-literal type) or whose key is quoted, so the transform falls through to `insert` and emits a second `ordersRequest` member. See HIGH-1.

### 7. Nothing removed by the narrowing crept back — `PASS`

- Grep over the ten files for `keep|replace|abort|recover|journal|lock|backup|rollback`: only hits are `blockComment` locals, `.replace(` regex-escaping, test-fixture `.replace(` calls, and the single remedy string "use --force to replace this generator-owned leaf". No per-leaf disposition, journal, lock, backup, or rollback concept exists.

### 8. Static absolute routes only — `PASS`

- `normalizeStaticRoute` rejects non-leading-slash, `/`, trailing slash, `//`, backslash, any of `? # : [ ] *`, and non-kebab segments. Contract test pins positive (`/orders/history` → `routes/orders/history`, `routes/partials/orders/history/summary.tsx`) and ten rejection cases including `[id]`, `[...path]`, `:id`, `*path`, `?tab=all`, `/Orders`.

## Gate Results (independently re-run at `b86524bcb`)

| Gate                       | Command                                                                                                    | Result | Evidence                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Structured check           | `run-deno-check.ts --root packages/cli --ext ts,tsx`                                                       | `PASS` | exit 0; 926 files, 8 batches, 0 failed batches, 0 diagnostics                                                                         |
| Focused tests              | `run-deno-test.ts -- --allow-all packages/cli/src/kernel/application/resource-slice/`                       | `PASS` | exit 0; 32 passed / 0 failed / 0 ignored (all ten files, five `_test.ts`)                                                              |
| Scoped lint                | `deno lint --config <task-local: root rule tags>` on the directory                                          | `PASS` | exit 0, "Checked 10 files". Root `deno.json` excludes `packages/cli/` from lint/fmt, so wrappers refuse `all-excluded` — a repo config fact, recorded in `worklog.md`, not a slice defect. |
| Scoped fmt                 | `deno fmt --check --config <task-local: root fmt options>` on the directory                                 | `PASS` | exit 0, "Checked 10 files"                                                                                                            |
| `deno task arch:check`     |                                                                                                            | `PASS` | exit 0; every package `FAIL=0`; zero occurrences of `resource-slice` in the report (directory has 10 children; the LOW-4 14-child WARN is expected only after A+C+D) |
| `deno task quality:gate`   |                                                                                                            | `PASS` | exit 0; nested arch gate `FAIL=0`; zero `resource-slice` findings                                                                     |
| `docs:readme-fences`       |                                                                                                            | `PASS` | exit 0; `type_errors=7` = baseline 7                                                                                                  |
| `docs:jsdoc-examples`      |                                                                                                            | `PASS` | exit 0; `unboundName=116` = baseline 116                                                                                              |
| `check:mcp-export-corpus`  |                                                                                                            | `PASS` | exit 0                                                                                                                                |
| PR CI at head              | `gh pr view 1946 --json statusCheckRollup`                                                                 | `PASS` | code-quality, check-test, quality, build, close-gate all SUCCESS at `b86524bcb`                                                       |
| Aspire / Docker / e2e:cli  |                                                                                                            | `N/A`  | prohibited for this slice; no IO exists to exercise                                                                                   |

## Findings (severity-ranked)

### HIGH-1 — `reconcileState` inserts a duplicate `State` member instead of conflicting (D6 breach)

- **Where:** `packages/cli/src/kernel/application/resource-slice/reconcile-state.ts:48-56` — `propertyPattern` uses `([^;]+);` for the type and an unquoted identifier for the key.
- **Repro (pure, no IO):**
  - `export interface State {\n  readonly ordersRequest: { id: string; };\n}\n` with requirement `{property:'ordersRequest', type:'OrdersRequestState'}` → `{"status":"insert"}` whose content contains **two** `ordersRequest` members.
  - `export interface State {\n  'ordersRequest': Other;\n}\n` → `insert`, same duplicate.
  - (`readonly ordersRequest?: OrdersRequestState;` correctly → `conflict`.)
- **Why it matters:** D6 says "A same-name/different-type property … is a conflict before any write" and the matrix says `utils.ts` is "never replaced" on unsupported/conflicting shapes. Here the transform reports `insert` and would write a `utils.ts` that fails `deno check` (TS2717 subsequent property declarations must have the same type) in the user's app. Object-literal member types are a first-class shape in this slice's own fixture (`readonly session: { readonly userId: string; }`), so the case is realistic, not exotic. The shared-candidate path in `reconcileResourceSlice` then treats the insert result as a plain `write`, so nothing downstream catches it.
- **Fix (small, inside the ten files):** detect an existing member by name with the same depth-aware scan already used for the brace matching (any top-level interface member whose key — bare or quoted — equals `property`, regardless of type text), then classify exact-type → `exact`, anything else → `conflict`. Add fixtures: object-literal type, quoted key, and a nested-object member that contains the property name at depth > 0 (must still insert). Re-run the five focused tests and the scoped wrappers.
- **Verdict impact:** blocks `PASS`. Plan remains valid; this is implementation work → `FAIL_FIX`.

### LOW-1 — Planner leaf order uses `localeCompare` (ICU collation), not code-point order

- `plan-resource-slice.ts:98` and `reconcile-resource-slice.ts:73,80` sort by `localeCompare`. Under Deno's bundled ICU the result was identical with `LC_ALL=C` and default, and the planner test pins `(_components)` before `index.*`, so the plan is reproducible today. But ICU collation is not code-point order (`_b.tsx` sorts before `(_components)`), and "deterministic plan" is a stated property. Prefer an explicit `<`/`>` comparator so ordering is independent of ICU data. Non-blocking; may ride along with HIGH-1.

### LOW-2 — D3 step-2 option union is not provided as a pure helper

- No function in the ten files computes `recognisedPriorOptions ∪ requestedFlags`; tests supply the union. Not a Slice C touch-set item (Slice E owns resolve/plan/preflight), so not a finding against this PR. Record for Slice E so the union lands in application logic with its own test rather than inline in `generate-resource.ts`.

### LOW-3 — Scoped lint/fmt verdicts depend on a task-local config

- Root `deno.json` excludes `packages/cli/` from `lint` and `fmt`; `run-deno-lint.ts`/`run-deno-fmt.ts --root …/resource-slice` refuse with `all-excluded`, and raw `deno lint`/`deno fmt` report "No target files found". The PR body's "structured scoped check/lint/fmt — 10/10 files" is true only with the task-local config recorded in `worklog.md`. Pre-existing repo state, not a slice defect; the `code-quality` CI job at head is green.

## Anti-pattern / doctrine status

| Item                                | Status  | Evidence                                                                                          |
| ----------------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| AP-1 file size                      | `CLEAR` | largest `resource-slice-contract.ts` 372 lines                                                    |
| Layering (application ↔ IO)         | `CLEAR` | no IO/presentation/Fresh import; inputs are strings and maps                                      |
| Folder cardinality (F-16)           | `CLEAR` | 10 children now; 14-child WARN after A+C+D is master-plan-locked and not a debt entry             |
| Console / `any` / raw `fetch(`      | `CLEAR` | grep zero in the ten files; planner test scans plan JSON for forbidden generated-content patterns |
| Architecture debt delta             | `CLEAR` | `debt/arch-debt.md` untouched; nothing introduced or deepened                                     |

## Verdict

| Field     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | `FAIL_FIX`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Rationale | At `b86524bcb` the ten-file ceiling, application-layer purity, the byte-exact ownership marker, the three-way fail-closed leaf classification with the documented forgery limitation, additive-option semantics, the type-structural zero-write guarantee with every D3 proof case named in a test, the `appRoutes` transform with the stock post-Slice-F fixture, static-route rejection, and the absence of every narrowed-away concept all verify, and every required gate is independently green (check 926/0, tests 32/32, scoped lint/fmt 10/10, arch/quality exit 0, docs baselines 7 and 116 held). One defect blocks: `reconcileState` fails open for a same-named `State` member with an object-literal type or quoted key and plans a duplicate member instead of a conflict, breaching D6 and the "never corrupt `utils.ts`" invariant. The plan is valid; the fix is local to `reconcile-state.ts` + its test. |
| Next step | Fix HIGH-1 in `reconcile-state.ts` with the three named fixtures (LOW-1 may ride along), re-run the focused tests and scoped wrappers, then request a follow-up IMPL-EVAL at the new head.                                                                                                                                                                                                                                                                                                       |

[PHASE: IMPL-EVAL] [VERDICT: FAIL_FIX]
