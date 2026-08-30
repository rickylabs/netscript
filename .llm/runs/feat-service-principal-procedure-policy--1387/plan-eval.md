# PLAN-EVAL — feat-service-principal-procedure-policy--1387

- Plan evaluator session: Anthropic Claude / Fable 5 / medium — fresh native opposite-family session
  (`formal_plan_evaluation`), 2026-08-30. Generator was a Codex thread; this session did not author
  any run artifact it evaluates. Session/thread identifiers intentionally not committed.
- Run: `feat-service-principal-procedure-policy--1387`
- Surface / archetype: `packages/contracts` (Archetype 1 — Small Contract); `packages/service`,
  `packages/plugin` (Archetype 4 — DSL / Builder); `packages/sdk` type fixtures; `packages/mcp`
  projection; docs.
- Scope overlays: `SCOPE-service` plus package doctrine.
- Protocol: `.llm/harness/evaluator/plan-protocol.md` + `.llm/harness/gates/plan-gate.md`. The
  dispatch brief named `PASS` / `FAIL_FIX`; the Plan-Gate vocabulary is `PASS` / `FAIL_PLAN` and is
  used here (`verdict-definitions.md`: `FAIL_FIX` is an IMPL-EVAL verdict).

## Immutable identity (re-derived, not accepted from the brief)

| Item                                             | Value                                                                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Evaluated head                                   | `5fafc3a0fbbe0f7aca69c2c5e35e022b8831f329` = `origin/feat/service-principal-procedure-policy` = PR #1762 `headRefOid`                |
| `origin/main`                                    | `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c`; `git merge-base HEAD origin/main` = `3e5cbabf` (branch is rebased, 3 plan-only commits) |
| Branch commits over main                         | `665e967a` (lock research/plan) → `89d2afda` (baseline drift) → `5fafc3a0` (S0 satisfied)                                            |
| PR #1762                                         | draft; base `main`; milestone `0.0.7`; labels `status:plan`, `type:feat`, `priority:p1`, `area:{service,contracts,plugins,auth}`, `ci:skip-e2e`, `ci:skip-scaffold` |
| PR #1762 `closingIssuesReferences`               | **`[]`** (verified live). Body is partial/plan-only and its repaired wording is intact; not edited by this session.                    |
| Evaluator worktree                               | `worktrees/ns1387-planeval` (detached); `007-leaf-1387` untouched                                                                    |
| Product code in this branch                      | none — `git diff --stat origin/main..HEAD` touches only `.llm/runs/**`                                                                |

## What I re-derived

**S0 precondition (verified on live git/GitHub, not from the worklog):**

- `packages/contracts/src/domain/procedure-meta.ts` exists on `main` `3e5cbabf`; `src/public/mod.ts`
  exports `NetScriptProcedureMeta`, `NetScriptAuthenticationRequirement`, `BaseContractMeta`.
- **Merged shape matches the researched shape exactly**: `interface NetScriptProcedureMeta { readonly
  access?: { readonly authentication?: NetScriptAuthenticationRequirement } }` with the
  `'none' | 'optional' | 'required'` union. `BaseContractMeta = NetScriptProcedureMeta &
  Record<never, never>` (`contract-primitives.ts:113`) and the base contract is
  `oc.$meta<NetScriptProcedureMeta>({})` (`:160`). The plan's stop condition ("stop if the shape
  differs") is **not** triggered. LD-2's additive `access.authorization.{scopes,roles}` extends this one
  type and propagates through `BaseContractMeta` to the SDK fixtures without a second vocabulary — the
  binding constraint is honoured against the merged shape, not merely against the plan's description.
- `.meta(` is used **nowhere** in `packages/**`/`plugins/**` outside contracts primitives and test
  fixtures (only Zod `.meta()` in `packages/aspire`), so no first-party procedure declares access today;
  the 54-undeclared census direction is confirmed.

**Base gates re-run at `5fafc3a0` (tree == `3e5cbabf` for product files):**

| Gate                                                       | Plan claims                | Re-derived                                                                 |
| ---------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------- |
| `G-TEST-contracts`                                         | 8                          | **16** pass (`run-deno-test.ts`, exit 0)                                   |
| `G-TEST-sdk`                                               | 69                         | **77** pass                                                                |
| `G-TEST-service` / `plugin` / `mcp`                        | 90 / 68 / 136              | 90 / 68 / 136 pass                                                         |
| `G-EXPORTS` `docs:exports-drift`                           | PASS                       | PASS                                                                       |
| `G-QUALITY` `quality:gate` (`quality:scan` + `arch:check`) | PASS                       | PASS (exit 0; pre-existing WARNs only)                                     |
| `G-DOC-SERVICE` doc-lint                                   | PASS                       | PASS (0 findings)                                                          |
| doc-lint contracts / plugin / sdk / mcp                    | base-red, excluded         | red (exit 1) — exclusion justified                                         |
| `G-JSR-{contracts,service,sdk,mcp}`                        | PASS                       | PASS                                                                       |
| JSR plugin                                                 | base-red (4 `@module`)     | red: `src/{abstracts,cli,config,testing}/mod.ts` missing `@module` — justified |
| `docs-tagline` (`docs:tagline:check`)                      | not contracted, not probed | **PASS at base** (36 checked, 0 over)                                      |
| `mcp-export-corpus` (`check:mcp-export-corpus`)            | not contracted, not probed | **PASS at base** (7623 symbols)                                            |
| `publish-assets` (`check:publish-assets`)                  | not contracted, not probed | **PASS at base**                                                           |
| `agent-docs-prose` (`check:agent-docs-prose`)              | not contracted, not probed | **not probed** (requires `docs/site` build; not run by this session)       |

**Code facts the plan's locked decisions rest on (spot-checked in the tree):**

- `ContextFactory` returns `Record<string, unknown>` (`packages/service/src/types.ts:270-272`);
  `buildRpcContext` mutates the factory result (`service-builder-impl.ts:259-282`). Finding 1/2 hold.
- `withContext` census: exactly two direct call expressions (`tests/type-assignability_test.ts:26`,
  `plugin/.../create-plugin-service.ts:162`) and seven plugin `context:` configurations
  (workers main + test, sagas main + two test configs, auth main, triggers main). Research census
  holds; `defineService` does **not** forward a context factory.
- Auth middleware is instantiated in `build()` (`service-builder-impl.ts:446-456`) **after** both
  `withAuthn`/`withAuthz` have recorded options, so LD-7's one-resolver-for-both-stages is mechanically
  achievable without changing the fluent order.
- `AuthnResult` is `{ ok: false; reason }` with no absent-vs-invalid distinction and the authenticator
  owns which header/cookie it reads — LD-8's premise holds.
- `arch:check` carries auth-layer rules scoped to `packages/service/src/auth` (`AS7/F-AUTH-CAST`,
  `F-AUTH-IMPORT`, `F-AUTH-INHERITANCE`, no `@ts-*`). The new `contract-policy.ts` /
  `contract-authorizer.ts` land inside that scope; a public `@netscript/contracts` import satisfies
  `F-AUTH-IMPORT`.
- `packages/service` currently imports **nothing** from `@netscript/contracts`; contracts imports no
  other `@netscript/*` package, so the new `service → contracts` edge introduces no cycle. Plugin already
  pins `jsr:@netscript/service@0.0.6` and re-exports `ContextFactory` from it; `Principal` is exported
  from the service root (`mod.ts:81-89`). LD-3 is achievable and survives `arch:check`.
- `wireRpc(buildContext: (c) => Record<string, unknown>)` (`service-rpc.ts:50,96`) and
  `FetchHandler.handle({ context?: Record<string, unknown> })` (`types.ts:211`) are the two seams a
  typed `ServiceHandlerContext<TCustom>` must pass through; a generic `Readonly<TCustom> & {...}` is
  not assignable to an index-signature type inside the generic body, and `quality:scan` forbids the
  `as unknown as` escape.
- oRPC `traverseContractProcedures` is public in `@orpc/server@1.14.6` (Finding 10 holds).
- SDK type fixtures already use `@ts-expect-error` negative proofs and are enforced by
  `procedure-meta-independence_test.ts` — the mechanism LD-11 relies on exists.
- `docs:exports-drift` registry: contracts page is `mode: 'complete'`; service and plugin pages are
  `entrypoints-only`; the MCP page is **not registered**. Slice 1 adds no new contracts symbol, so the
  gate will not trip on Slices 1/2/4/7 for symbol growth — only a new entrypoint would trip it.

## Checklist results

| Plan-Gate item                          | Result   | Evidence / location                                                                                                                                                                                                                       |
| --------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS     | `research.md` re-baselined to `625447f1`; S0 re-derivation on `3e5cbabf` recorded in `worklog.md` and re-verified above; merged metadata shape identical. Census numbers are stale (see F-1) but the load-bearing findings hold.       |
| Decisions locked                        | PASS     | LD-1…LD-12 with rationale (`plan.md` § Locked Decisions). LD-8 and LD-11 adjudicated below.                                                                                                                                              |
| Open-decision sweep                     | PASS     | `plan.md` § Open-Decision Sweep; evaluator sweep below found no un-flagged rework-forcing decision — the two items found are ceiling/gate defects, not open design decisions.                                                            |
| Commit slices (< 30, gate + files each) | **FAIL** | 9 slices, each with gate + files, all 43 ceiling files exist. But Slice 3 cannot land inside its ceiling (F-3), and Slices 2/4/7/9 stale generated carriers whose outputs sit outside every ceiling (F-2).                                |
| Risk register                           | PASS     | `plan.md` § Risk Register — 11 risks with mitigations; "existing red gates obscure regressions" is mitigated but the complementary risk (green gates outside the set) is the #1769 shape and is what F-2 records.                        |
| Gate set selected                       | **FAIL** | Contracted set is base-green and archetype-correct, but (a) two contracted test baselines are stale and would raise a false regression on Slice 1 (F-1); (b) the set is blind to the generated-carrier group this leaf stales (F-2). |
| Deferred scope explicit                 | PASS     | `plan.md` § Non-Scope and `worklog.md` § Deferred Scope name #884/#934/#1352/#1383/#1278/#885, optional-auth runtime, and the 54-procedure/scaffold migration.                                                                            |
| jsr-audit surface scan (pkg/plugin)     | PASS     | `research.md` § jsr-audit surface scan; four audits green, plugin base-red named and excluded; slow-type risk named; re-run confirms.                                                                                                     |

## Open-decision sweep (evaluator-run)

Decisions the plan left open that would force rework if deferred: **none beyond the two the plan
flagged (LD-8, LD-11), both adjudicated below.** Two *ceiling/gate* defects (F-2, F-3) would force a
mid-slice rescope under the plan's own stop rule; they are recorded as findings, not as open design
decisions, because the design itself does not change.

## Findings

### F-1 — Contracted test baselines are stale (blocking; trivial fix)

`plan.md` § Named Validation Contract row 4 contracts `contracts 8, SDK 69`; re-derived at the rebased
base they are **16** and **77** (#1466 landed its contracts metadata suite and SDK propagation tests).
`research.md` § Base gate census and `worklog.md` § Static Gates carry the same stale numbers. As
written, Slice 1's Tier-A stop would compare against 8/69 and report a false signal on the first
slice.

**Required action:** restate row 4 as `contracts 16, service 90, plugin 68, SDK 77, MCP 136 (371 → 387
total)` and add a one-line note that the census was re-measured at `3e5cbabf` after S0. Append (do not
rewrite) the corrected census to `research.md` § Base gate census. Nothing else in the plan was
measured against the pre-merge `main` in a way that changed: the five static/fitness gates, four JSR
audits, and the base-red exclusions all reproduce at `3e5cbabf`.

### F-2 — Gate set is blind to the generated-carrier group this leaf stales (blocking)

This is the #1769 shape. Four base-green gates are sensitive to this leaf's changes and are outside
the contracted set; three of their outputs are product files outside every slice ceiling, so the
plan's own rule ("required file outside the listed ceiling means stop and rescope") would fire on the
first public-surface slice.

| Gate (catalog id)   | Task                        | Sensitive to                                                        | Base     | Output it regenerates                                                                    |
| ------------------- | --------------------------- | ------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `mcp-export-corpus` | `check:mcp-export-corpus`   | **any** public-symbol growth — Slices 2, 4, 7                       | PASS     | `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`     |
| `publish-assets`    | `check:publish-assets`      | package README edits — Slice 9                                      | PASS     | `packages/mcp/src/publish-assets.generated.ts` and the `PUBLISH_ASSET_OUTPUTS` list      |
| `docs-tagline`      | `docs:tagline:check`        | package README first-line edits — Slice 9 (four READMEs)            | PASS     | none (validator)                                                                         |
| `agent-docs-prose`  | `check:agent-docs-prose`    | `docs/site/**` + README corpus inputs — Slice 9                     | unprobed | `prose.json.gz` / `provenance.json` (siblings `assets-barrel`, `publish-assets`)         |

**Required actions:**

1. Contract `mcp-export-corpus` at Slices 2, 4, 7 and at the final readiness run; contract
   `docs-tagline`, `publish-assets`, `agent-docs-prose`, and `assets-barrel` at Slice 9 and the final
   run. Probe `agent-docs-prose` at base before Slice 9 and record the result in `plan.md` (per #1769
   rule 3: a base-red gate is contracted as a delta with the base number named, never as PASS).
2. Amend the ceilings: add the corpus generated file to Slices 2, 4, and 7; add the `PUBLISH_ASSET_OUTPUTS`
   generated files and the agent-docs prose/provenance outputs to Slice 9 — or add one explicit
   sentence under "Product Ceiling" that `gen:*` regeneration of these named generated outputs is
   ceiling-exempt and must be committed in the slice that staled them. Either form is acceptable; the
   silent form is not.

### F-3 — Slice 3 cannot land inside its ceiling (blocking)

LD-4 has runtime build "a fresh `ServiceHandlerContext<TCustom>`" in Slice 3, whose ceiling is
`service-builder-impl.ts` + three tests. The value must pass through `wireRpc`'s
`buildContext: (c) => Record<string, unknown>` (`service-rpc.ts:50,96`) and `FetchHandler.handle`'s
`context?: Record<string, unknown>` (`types.ts:211`). A generic `Readonly<TCustom> & {…}` is not
assignable to an index-signature type inside the generic body, `quality:scan` bans the `as unknown as`
escape, and the auth-layer `F-AUTH-CAST` rule bans `& Record<string, unknown>` widening. So Slice 3
needs a signature change in `service-rpc.ts` (Slice 5's ceiling only) and possibly `types.ts` (Slice 2's
ceiling) — a breach on the first behaviour slice.

**Required action:** move the two widenings into Slice 2 (they are signature-only, which is Slice 2's
charter): add `packages/service/src/builder/service-rpc.ts` to Slice 2's ceiling and name the
`FetchHandler.handle` context type in Slice 2's scope (widen both to `object`, or to
`ServiceHandlerContext<object>`). Slice 3 then stays behaviour-only inside its current ceiling.

### F-4 — LD-11 (router-rename acceptance) — ADJUDICATED: **accepted**, with a required plan addition

Ruling: the issue's acceptance line *"renaming a router breaks a contract-declared policy at compile
time"* is **not achievable with a contract-local policy, and making it achievable would reproduce the
defect**. A policy attached via `.meta()` is a property of the procedure value; a router key rename
moves the procedure and its metadata together, so there is nothing left to break. The only way a
rename can break at compile time is a second declaration indexed by key or path — exactly the
"policy in a second place that can drift" that #1387 exists to remove. LD-11's corrected proofs are
the honest ones: (a) runtime rename-continuity in both REST and RPC projections (Slice 5), and (b) the
old SDK accessor fails type-check via the existing `@ts-expect-error` fixture mechanism (Slice 1).
PLAN-EVAL explicitly accepts this substitution; silence is not authorization, and this is not silence.

**Required addition (process, not design):** acceptance boxes are mirrored by the close-gate from an
`acceptance-evidence` block and validated against the issue's checkbox text; evidence for proofs (a)+(b)
cannot be mapped onto a box that promises a compile-time break. `plan.md` must state that the issue's
acceptance line is to be **amended by the owner/supervisor** to the corrected wording before the
implementation PR's close-gate, and that the implementation PR body must carry the substitution and its
rationale explicitly. Neither the evaluator nor the implementer edits the issue.

### F-5 — LD-8 (`authentication: 'optional'` fails closed at binding) — ADJUDICATED: **accepted**, with one pin

Ruling: with `AuthnResult = { ok: false; reason }` and authenticator-owned credential extraction, the
runtime cannot distinguish "no credential" from "bad credential", so treating an authn failure as
anonymous would let an invalid token through as public. Rejecting `optional` fail-closed until a typed
absent-vs-invalid result exists is the only safe semantics compatible with the current port, and the
contract/OpenAPI/SDK may still carry the declaration (LD-9/LD-10). Accepted.

**Required pin:** "binding time" must mean **at `createContractAuthorizer(contract, …)` construction**
(during contract traversal), not at first request or at `build()`, so a misdeclared contract fails at
module load with a stable namespaced error, and Slice 5 must add that as a named negative test.

### F-6 — Fail-closed migration (brief Q4) — answered in the plan, not deferred

LD-5/LD-6 answer the migration question now: enforcement activates only when
`createContractAuthorizer(...)` is supplied to `.withAuthz()`; existing unguarded services, scope-only
services, and every scaffold keep current behaviour; inside the adapter "no metadata + no matched
fallback ⇒ deny" matches the issue's wording. The 54-procedure census direction is confirmed (no
`.meta()` access declarations exist on `main`). No action.

### F-7 — Scope realism (brief Q7) — one leaf is executable; a fallback split is named

43 ceiling files across five packages, nine slices of ≤10 files each, all files present, each slice
with a named Tier-A stop. With F-2/F-3 fixed the leaf is executable at 0.0.7 as one PR. If the leaf
stalls after Slice 6, the natural split is Slices 7–8 (MCP projection) + Slice 9 (docs) into a
follow-up sub-PR; Slices 1–6 alone satisfy acceptance points 1–7 and 9–10 of #1387. Advisory only.

### Non-blocking notes

- **F-1 file-size WARNs.** `packages/service/src/types.ts` is 272 lines against the 300-line cap for
  `*types.ts`; Slice 2 will likely tip it into an `A8/AP-1/F-1` WARN. `service-builder-impl.ts` is
  already 530/500 (existing WARN). Both are WARN-level in `check-doctrine.ts` and do not fail
  `arch:check`; the plan's "no unexplained threshold growth" should either accept the `types.ts` WARN
  explicitly or house `ServiceHandlerContext` in a new file added to Slice 2's ceiling.
- **`hono-context.ts` is outside every ceiling.** If Slice 5 caches the resolved procedure policy on the
  Hono context (`c.set(...)`) to avoid resolving twice, `ServiceVariables` must change; either resolve
  in both stages or add `packages/service/src/auth/hono-context.ts` to Slice 4's ceiling.
- **New `service → contracts` edge and release order.** Service will import `@netscript/contracts`
  for the first time (type-only suffices). Contracts already publishes before service/plugin, so
  ordering is unchanged; run `check:netscript-jsr-specifiers` and `G-JSR-SERVICE` at Slice 4 to
  confirm the workspace resolution publishes cleanly.
- **Cosmetic:** `research.md` Finding 7 and the first Negative-test row are truncated because an
  unescaped `|` inside the union type broke the Markdown table; escape it when appending F-1's census.

## Verdict

`FAIL_PLAN`

### Required fixes (FAIL_PLAN cycle 1 of 2)

1. **Gate set — stale baselines (F-1):** restate `G-TEST-*` as contracts 16 / SDK 77 in `plan.md`,
   with a note that the census was re-measured at `3e5cbabf`; append the corrected census to
   `research.md`.
2. **Gate set — generated carriers (F-2):** contract `mcp-export-corpus` at Slices 2/4/7 and
   `docs-tagline` + `publish-assets` + `agent-docs-prose` + `assets-barrel` at Slice 9 and the final
   run; probe `agent-docs-prose` at base and record it; add the generated outputs to the staling
   slices' ceilings or declare `gen:*` regeneration ceiling-exempt in one explicit sentence.
3. **Commit slices — Slice 3 ceiling (F-3):** add `packages/service/src/builder/service-rpc.ts`
   (signature-only widening) and the `FetchHandler.handle` context widening to Slice 2.
4. **LD-11 process addition (F-4):** record in `plan.md` that the issue's compile-time-rename
   acceptance line is to be amended by the owner before close-gate and that the implementation PR
   states the substitution.
5. **LD-8 pin (F-5):** state that the `optional` rejection is raised at `createContractAuthorizer()`
   construction and name the Slice 5 negative test.

### Re-evaluation scope

Not terminal. Re-evaluate **only**: `plan.md` § Named Validation Contract (row 4 + added carrier
rows), § Product Ceiling for Slices 2, 3, 4, 7, 9, the LD-8/LD-11 text additions, and the appended
census in `research.md`. LD-1…LD-7, LD-9, LD-10, LD-12, the archetype/overlay selection, the risk
register, non-scope, and the jsr-audit scan are accepted as-is and need no re-review. Because the
design is unchanged, the re-evaluation may run as a short same-family follow-up on the diff of those
sections; a full fresh PLAN-EVAL is not required unless the design text changes.

## Notes

- No product code, `deno.lock`, PR body, label, milestone, or issue was modified by this session.
  `git status` was clean before this file was written; the only change is this artifact.
- Runtime gates (`e2e:cli`, Aspire, Docker, browser) were not run — no runtime lease; the reachable
  DinD sandbox is not authorization.
- `agent-docs-prose` was deliberately not probed by this session (requires a `docs/site` build); the
  plan owner must probe it as part of fix 2.

---

# PLAN-EVAL cycle 2 (bounded re-evaluation of the cycle-1 required fixes)

- Plan evaluator session: Anthropic Claude / Fable 5 / medium — fresh `formal_plan_evaluation`
  session, 2026-08-30, worktree `worktrees/ns1387-planeval2` (detached). Not the cycle-1 session,
  not the Codex generator thread, not the Slice 1 implementer, not `007-leaf-1387`.
- Scope honoured as fixed by cycle 1: row 4 + carrier rows of § Named Validation Contract, § Product
  Ceiling for Slices 2/3/4/7/9, the LD-8/LD-11 text additions, the appended census in `research.md`.
  LD-1…LD-7/9/10/12, archetype/overlays, risk register, non-scope, jsr-audit scan: not reopened.
  Slice 1's implementation (supervisor Tier-A `ACCEPTED`) was not reviewed; it is cited below only
  as evidence about the *gate contract*, which is in scope.

## Immutable identity (re-derived)

| Item                          | Value                                                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evaluated head                | `c0d61e648adaf6db86ee834b88a37857d9438dc8` = `origin/feat/service-principal-procedure-policy` = PR #1762 `headRefOid` (draft, base `main`)                    |
| Merge base with `origin/main` | `24f6642f040617de573c7cef1140eed1ac0efd6d` (`origin/main` itself has moved on to `2a65a8cd`; branch not rebased past `24f6642f` — fine for this evaluation) |
| Plan-repair commit            | `e452f1679` "docs(harness): repair #1387 plan gate contract"; `plan.md` +35/−8, `research.md` **+10/−0**                                                     |
| Product diff `24f6642f..HEAD` | Slice 1 only: 6 files (`packages/contracts/src/domain/procedure-meta.ts`, 3 contracts tests/fixtures, 2 SDK tests/fixtures)                                  |
| Base measurement worktree     | temporary detached worktree at `24f6642f` under the job tmp dir (removed after use); `deno.lock` untouched                                                   |

## Fix-by-fix verification

| Fix | Required by cycle 1                                                                                          | Applied? | Re-derived evidence                                                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1 | Row 4 = contracts 16 / service 90 / plugin 68 / SDK 77 / MCP 136 (387); note re-measured after S0; append census | **Real** | Row 4 now reads exactly that; note under the table names `24f6642f` and the pre-#1466 origin of 8/69. Re-derived by this session at `24f6642f` with `run-deno-test.ts`: **16 / 90 / 68 / 77 / 136, all exit 0** — I accepted neither the plan's nor the supervisor's figure. `research.md` § "Post-S0 corrected census (append-only)" carries the same numbers. |
| F-2 | Contract carriers; probe `agent-docs-prose`; ceilings amended or explicit `gen:*` exemption sentence          | **Applied as prescribed — but the prescription was insufficient; see F-2′** | Rows 13–17 added; `mcp-export-corpus` in the Slice 2/4/7 stops; four carriers in the Slice 9 stop; explicit exemption paragraph under § Product Ceiling naming the corpus file, `PUBLISH_ASSET_OUTPUTS`, `.llm/assets/agent-docs/{prose.json.gz,provenance.json}`, and the `check:assets-barrel` barrels (all verified to exist; all five `check:*` tasks exist in `deno.json`). `agent-docs-prose` probed at base by the plan owner and **re-probed by this session at `24f6642f`: exit 0, 639 files, rendered output OK, `"fresh":true`, `stalePaths:[]`, tracked tree clean**. `check:mcp-export-corpus`, `check:publish-assets`, `docs:tagline:check`, `check:assets-barrel` all exit 0 at base. |
| F-3 | `service-rpc.ts` + `FetchHandler.handle` widening into Slice 2                                                | **Real** | Slice 2 ceiling gains `packages/service/src/builder/service-rpc.ts`; Slice 2 charter text names both widenings ("to `object`"). Slice 3 ceiling and charter unchanged (behaviour-only, four files).                                                                                                                                       |
| F-4 | Owner amends the issue's compile-time-rename line before close-gate; PR body states substitution             | **Real** | Paragraph after the LD table: owner/supervisor amends before close-gate; implementation PR body states substitution + rationale; implementer does not edit the issue.                                                                                                                                                                       |
| F-5 | `optional` rejection raised at `createContractAuthorizer()` construction; Slice 5 negative test named          | **Real** | Paragraph after the LD table pins construction during contract traversal, "not on the first request or later in `build()`"; Slice 5 names `createContractAuthorizer rejects optional authentication during construction`.                                                                                                                  |

`research.md` append check: `git diff --numstat 0a1e6337f..HEAD -- research.md` = `10 0` and zero
`-` lines in the diff body — independently confirmed as a pure append (one new `###` subsection
before "Open questions for PLAN-EVAL"; the cycle-1 truncated-table cosmetic was left as-is, which is
acceptable).

## F-2′ — The corpus contract points are wrong: `mcp-export-corpus` is already red at the branch head (blocking)

This is the cycle-1 question "will the carrier contracting prevent the rescope-rule trip on the
first public-surface slice?" — and the answer, measured rather than reasoned, is **no; it has
already tripped**.

- `deno task check:mcp-export-corpus` at base `24f6642f`: **exit 0**.
- The same command at head `c0d61e64`: **exit 1** — `MCP export-surface corpus is stale; run deno
  task gen:mcp-export-corpus`. Regenerating in a scratch copy changes only the corpus blob
  (`uncompressedBytes 2138501 → 2138580`, +79 bytes, new sha256); the regeneration was discarded, not
  committed, by this session.
- The only product change between those two trees is Slice 1. Cause: the corpus records each public
  symbol's **signature and JSDoc** (`generate-export-surface-corpus.ts` `renderSignature`/
  `renderJsDoc`), not just the symbol list. Slice 1 widened `NetScriptProcedureMeta` (additive
  `access.authorization`), which changes the rendered signature of an exported contracts type.
  Cycle-1's F-2 (and therefore the repair) modelled the gate as sensitive to *symbol growth* and
  contracted it only at the three slices that add symbols (2/4/7). That model was wrong: every slice
  that touches an exported declaration or its JSDoc in contracts/service/plugin/sdk/mcp stales it —
  Slice 1 (done), and plausibly 3, 5, 6, 8 (JSDoc on public ports/adapters) as well as 2/4/7.
- Consequence under the plan's own rules: the exemption paragraph authorises regeneration only "in
  the slice that staled them", and Slice 1 neither regenerated nor was contracted for the gate. The
  `worklog.md` Slice 1 line "the MCP export corpus … had no tracked movement from the content head"
  is true and non-probative — the tracked file did not move *because nobody ran the gate*. Slice 2's
  contracted `mcp-export-corpus` would therefore start red for a reason outside Slice 2's ceiling
  exemption, which is precisely the stop-and-rescope trigger F-2 was meant to remove.

This is not a design defect and not a Slice 1 acceptance question (out of my scope); it is a gate
contract defect in a section cycle 1 explicitly reopened. Cycle 1's prescription was under-specified;
I record that plainly rather than attribute it to the plan owner, who did exactly what was asked.

**Required fix (one contract line + one regen commit):**

1. In `plan.md` § Named Validation Contract row 13 and in every slice's Tier-A stop (Slices 1–9),
   contract `mcp-export-corpus` — it is cheap (<1 min, `deno doc` over five packages) and sensitive to
   any public signature/JSDoc change, so per-slice is the only honest contract point. Keep the
   Slice 9 four-carrier contract as is.
2. Amend the § Product Ceiling exemption sentence so the corpus regeneration is committed "in the
   slice that staled it, or — for the Slice 1 staleness recorded in PLAN-EVAL cycle 2 — in a
   supervisor-signed `chore(harness)`/`chore(mcp)` regeneration commit before Slice 2 starts". No
   hand edits; `gen:mcp-export-corpus` output only; `deno.lock` unchanged.
3. Record the Slice 1 staleness in `drift.md` (severity `minor`, gate-contract class, #1769 shape).

## Sufficiency of the repaired gate set for Slices 2–9

- Rows 4, 14, 15, 17 and the Slice 9 carrier set are correct and base-green as measured here; the
  `agent-docs-prose` base probe is now on record twice (owner + this session) with a fresh bundle.
- Row 13 is correct in *command* and *base result* but wrong in *contract points* (F-2′). With fix 1
  applied, the remaining generated-carrier blind spot closes: the four Slice 9 carriers are
  README/docs-input driven and Slices 1–8 do not touch READMEs or `docs/site`.
- F-3's Slice 2 ceiling is sufficient for Slice 3 to stay behaviour-only; the widening target
  (`object`) is compatible with `quality:scan` and `F-AUTH-CAST`.
- Nothing else in the reopened sections is cosmetic; F-1, F-3, F-4, F-5 are real.

## Verdict

`FAIL_PLAN` — cycle 2 of 2. Per `verdict-definitions.md` / `plan-protocol.md` this is the second
`FAIL_PLAN`, so the unresolved item **escalates to the owner**. The escalated item is narrow and
mechanical (F-2′: three edits, one regeneration commit); no design text changes. The owner may
accept the amended contract on the diff without a further evaluation cycle, or request a bounded
cycle 3 limited to row 13, the per-slice stop lines, the exemption sentence, and the `drift.md`
entry. Slice 2 must not start until the corpus regeneration commit has landed and been
supervisor-signed, because its first contracted gate is otherwise red on arrival.

## Notes

- No product code, `deno.lock`, PR body, label, milestone, issue, or acceptance box was modified.
  The one scratch regeneration of the corpus file was reverted with `git checkout --` before this
  file was written; `git status` shows only this artifact.
- No runtime lease held or acquired; no `e2e:cli`, Aspire, Docker, or browser gate run. The
  `agent-docs-prose` probe is a `docs/site` static build, not a runtime gate.
- All base measurements were taken in a temporary detached worktree at `24f6642f`, removed
  afterwards.
