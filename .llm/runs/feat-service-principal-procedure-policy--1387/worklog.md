# Worklog: #1387 typed principal and procedure policy

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `feat-service-principal-procedure-policy--1387` |
| Branch         | `feat/service-principal-procedure-policy`       |
| Archetype      | contracts: 1; service/plugin: 4                 |
| Scope overlays | `SCOPE-service` plus package doctrine           |

## Design

This section was recorded before any implementation files. This slice contains no product code.

### Public Surface

- `NetScriptProcedureMeta.access.authorization` — optional readonly scopes/roles extending #1466.
- `ContextFactory<TCustom>` — typed custom context factory output.
- `ServiceHandlerContext<TCustom>` — custom fields plus optional service-owned request fields,
  including `Principal | undefined`.
- `ServiceBuilder<TRouter, TCustom>` / `withContext<TNext>()` — fluent generic propagation.
- `createContractAuthorizer(contract, options?)` — opt-in contract metadata adapter.
- Plugin root and `./service` type re-exports — public service-owned identity/context types.
- OpenAPI operation `security` plus `x-netscript-roles` projection.
- MCP operation access summary in list/detail results.

### Domain Vocabulary

- `NetScriptAuthenticationRequirement` — existing #1466 none/optional/required declaration.
- `NetScriptProcedureMeta` — the only procedure metadata vocabulary.
- `Principal` — existing service-owned non-tenant authenticated identity.
- `ServiceHandlerContext<TCustom>` — handler-visible composition with optional framework fields.
- `ProcedureAccessPolicy` — service interpretation of declared contract access.
- `AuthorizerMatch` / match-aware fallback result — distinguishes no rule from a matched deny.
- `OperationAccessSummary` — bounded MCP projection of OpenAPI access.

### Ports

- `AuthenticatorPort` — unchanged provider seam; its current result limitation drives optional-auth
  fail-closed behavior.
- `AuthorizerPort` — compatibility seam retained for standalone authorizers.
- `ProcedurePolicyResolver` — reads the same compiled metadata before authn and during authz.
- `MatchAwareAuthorizerPort` — permits contract fallback without confusing no-match and deny.

### Constants

- Existing auth prefix constants remain standalone defaults; contract binding uses actual builder
  projection configuration.
- OpenAPI uses one documented default bearer scheme name and `x-netscript-roles`; neither becomes a
  second policy vocabulary.
- Explicit deny/error reasons are stable, namespaced strings tested by behavior suites.

### Commit Slices

| # | Slice                           | Gate                                                         | Files                                                   |
| - | ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| 0 | #1466 merge/rebase precondition | Re-run full base census                                      | No product edits                                        |
| 1 | Contract metadata type          | G-CHECK/LINT/FMT, contracts+SDK tests/audits, G-EXPORTS      | Contracts metadata and type fixtures; SDK type fixtures |
| 2 | Typed context public surface    | Static gates, service+plugin tests, service doc/JSR, exports | Service/plugin type/export ceiling                      |
| 3 | Context runtime composition     | Static gates, service tests, quality, lock                   | Builder implementation/tests                            |
| 4 | Policy ports                    | Static gates, service tests/doc/JSR, exports                 | Service auth type ceiling                               |
| 5 | Policy enforcement              | Static gates, service tests, quality/JSR/lock                | Auth adapter/middleware/builder/tests                   |
| 6 | OpenAPI projection              | Static gates, service tests/doc/JSR/quality                  | OpenAPI primitive/tests                                 |
| 7 | MCP result contract             | Static gates, MCP tests/JSR, exports                         | MCP domain/schema/flow types                            |
| 8 | MCP/agent projection            | Static gates, MCP tests/JSR/quality/lock                     | MCP index/flows/tests                                   |
| 9 | Adoption docs                   | Doctests, static gates, exports/audits/quality               | Four READMEs and four docs pages                        |

Exact per-slice ceilings are authoritative in `plan.md`.

### Deferred Scope

- Enterprise organization/membership/assurance — #884.
- Browser gateway — #934.
- SDK credentials — #1352.
- Plugin auth configuration — #1383.
- Whole-router context soundness — #1278.
- Optional-auth runtime support — requires a typed absent-vs-invalid authenticator result.
- Existing 54-procedure and scaffold migration — consumers opt in deliberately.

### Contributor Path

After #1466 lands, a developer annotates a contract procedure with
`.meta({ access: { authentication: 'required', authorization: { scopes: ['x:read'] } } })`, types
the router context as `ServiceHandlerContext<MyContext>`, and installs
`createContractAuthorizer(contract, { fallback: legacyScopeAuthorizer })` through the existing
service auth builder. The same metadata drives enforcement, OpenAPI, SDK type inspection, and MCP
operation summaries.

## Progress Log

| Time       | Slice    | Step                    | Notes                                                                                                                                                                     |
| ---------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | planning | activation              | Read harness, doctrine, PR, Deno toolchain, RTK, repo-tools, and JSR-audit instructions.                                                                                  |
| 2026-08-30 | planning | re-baseline             | Fetched current main and #1466 branch; safely fast-forwarded the clean leaf branch.                                                                                       |
| 2026-08-30 | planning | public-surface research | Used `deno doc` before focused source reads; enumerated context callers, auth ordering, OpenAPI/MCP reach, and consumer contracts.                                        |
| 2026-08-30 | planning | migration research      | Counted 54 undeclared first-party procedures and identified scaffold generators; selected opt-in enforcement.                                                             |
| 2026-08-30 | planning | base gates              | Ran candidate gates on clean base; contracted only green signals.                                                                                                         |
| 2026-08-30 | planning | artifacts               | Wrote research, locked plan, drift, worklog, supervisor, and context pack only; no product code.                                                                          |
| 2026-08-30 | planning | draft recheck           | Main advanced by one unrelated docs/generated-assets commit after the research freeze; inspected the delta and retained the truthful `625447f1` baseline pending Slice 0. |

## Decisions

| Decision                                              | Reason                                                                 | Source                                      |
| ----------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| Extend #1466 metadata, never parallel it              | Policy must remain contract-local and already propagates to SDK types. | Owner constraint, #1466 branch, plan LD-1/2 |
| Service owns Principal; plugin re-exports public type | Correct dependency direction.                                          | Doctrine and package export maps            |
| Enforcement is opt-in                                 | Global activation denies existing procedures/scaffolds.                | Research migration census                   |
| Contract wins; scope authorizer is fallback           | Prevents drift and weakening.                                          | #1387 target, plan LD-6                     |
| Optional runtime binding fails closed                 | Authenticator cannot distinguish absent/invalid.                       | Auth port inspection, plan LD-8             |
| Rename acceptance is corrected                        | Contract-local metadata moves with procedure.                          | Drift entry and plan LD-11                  |

## Drift

| Drift                               | Severity      | Logged in drift.md |
| ----------------------------------- | ------------- | ------------------ |
| Initial branch behind fetched main  | minor         | yes                |
| #1466 not merged                    | significant   | yes                |
| Router-rename acceptance conflict   | architectural | yes                |
| RTK unavailable                     | minor         | yes                |
| Candidate gates red at base         | minor         | yes                |
| Main advanced after research freeze | minor         | yes                |

## Gate Results

### Static Gates

| Gate             | Command or check                                       | Result  | Notes                                                |
| ---------------- | ------------------------------------------------------ | ------- | ---------------------------------------------------- |
| Scoped check     | Structured check wrapper over five roots               | PASS    | 0 diagnostics                                        |
| Scoped lint      | Structured lint wrapper over five roots                | PASS    | 0 findings                                           |
| Scoped format    | Structured format wrapper over five roots, TS/TSX only | PASS    | 417 files, 0 findings                                |
| Contracts tests  | Structured test wrapper                                | PASS    | 8/8                                                  |
| Service tests    | Structured test wrapper                                | PASS    | 90/90                                                |
| Plugin tests     | Structured test wrapper                                | PASS    | 68/68                                                |
| SDK tests        | Structured test wrapper                                | PASS    | 69/69                                                |
| MCP tests        | Structured test wrapper                                | PASS    | 136/136                                              |
| Export drift     | `deno task docs:exports-drift`                         | PASS    | Branch-sensitive public-surface gate                 |
| Service doc lint | Structured doc-lint wrapper                            | PASS    | Other four candidate roots are base-red and excluded |
| Root test        | Owner-declared host infrastructure red                 | NOT_RUN | Must not chase or contract                           |

### Fitness Gates

| Gate                                     | Result | Evidence                 | Notes                                        |
| ---------------------------------------- | ------ | ------------------------ | -------------------------------------------- |
| F-1/F-3/F-5 aggregate                    | PASS   | `deno task quality:gate` | Includes quality scan and architecture check |
| F-6 contracts/service/SDK/MCP            | PASS   | JSR audit commands       | Warnings/info only                           |
| F-6 plugin                               | FAIL   | Base JSR audit           | Existing four module-tag failures; excluded  |
| Public doc lint contracts/plugin/SDK/MCP | FAIL   | Base doc-lint reports    | Existing private type refs; excluded         |

### Runtime Gates

| Gate                      | Result  | Evidence       | Notes                                 |
| ------------------------- | ------- | -------------- | ------------------------------------- |
| E2E/Aspire/Docker/browser | NOT_RUN | Owner boundary | No runtime lease; planning slice only |

### Consumer Gates

| Consumer                            | Result             | Evidence               | Notes                                                      |
| ----------------------------------- | ------------------ | ---------------------- | ---------------------------------------------------------- |
| Seven plugin context configurations | PASS at base       | Five-root scoped check | Must remain compile-only/no-edit consumers                 |
| Current procedures/scaffolds        | PASS at base       | Static census          | Opt-in migration preserves current behavior                |
| SDK metadata propagation            | PENDING_DEPENDENCY | #1466 PR #1731         | Branch inspection proves intended carrier; must land first |

## Handoff Notes

- PLAN-EVAL should inspect the metadata dependency, migration census, authn-before-authz
  consequence, and corrected rename proof first.
- A PLAN-EVAL `PASS` must explicitly affirm LD-8 and LD-11.
- Implementation remains prohibited until both PLAN-EVAL passes and #1466 lands.
- The initial `deno.lock` SHA-256 is
  `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`.

## S0 satisfied — #1466 merged, branch rebased, base-gate census re-run

Executed by the features topic supervisor before PLAN-EVAL dispatch. S0 is a **precondition**, not
an implementation slice; no product code was written.

### S0.1 — #1466 is merged and its vocabulary is on `main`

PR #1731 **`MERGED`** at `e325b7fe`, `2026-08-30T13:41:17Z`; issue #1466 **`CLOSED / COMPLETED`**;
both `status:shipped`. `origin/main` = **`3e5cbabf`**.

Verified on `main` directly rather than inferred from merge status:
`packages/contracts/src/domain/procedure-meta.ts` present, and `src/public/mod.ts` exports
`NetScriptProcedureMeta`, `NetScriptAuthenticationRequirement`, `BaseContractMeta`.

**LD-1's blocker is therefore lifted for the first time.**

### S0.2 — rebased onto `3e5cbabf`

`89d2afda`, clean, two plan-artifact commits replayed. **Rebase is correct here and was correct to
refuse on #1731**: this branch carries plan artifacts only, so no receipt, archive or verdict cites
a SHA that a rebase would rewrite. #1731 had seven archives and eight verdict artifacts addressed by
content head, which is why it took two `--no-ff` merges instead.

### S0.3 — base-gate census at `89d2afda` (== `origin/main` `3e5cbabf`)

| Gate                                             | Result   |
| ------------------------------------------------ | -------- |
| `G-CHECK` (contracts, service, plugin, sdk, mcp) | **PASS** |
| `G-LINT`                                         | **PASS** |
| `G-FMT`                                          | **PASS** |
| `G-QUALITY` (`quality:scan` + `arch:check`)      | **PASS** |
| `G-EXPORTS` (`docs:exports-drift`)               | **PASS** |

### Two contracted baselines moved — a real finding for PLAN-EVAL

| Package   | `plan.md` expected | Measured at the rebased base | Δ      |
| --------- | ------------------ | ---------------------------- | ------ |
| contracts | 8                  | **16**                       | **+8** |
| service   | 90                 | 90                           | —      |
| plugin    | 68                 | 68                           | —      |
| sdk       | 69                 | **77**                       | **+8** |
| mcp       | 136                | 136                          | —      |

Both movements are attributable to #1466 landing: it added the contracts metadata suite (inference
probe, assertion-budget cases, runtime storage, doc-JSON independence) and the SDK propagation
tests. The plan's numbers were measured against `13878a80a` **before** that merge, so they are stale
rather than wrong — but a plan that contracts `contracts 8` as its baseline would now report a false
regression signal on its first slice.

This is precisely what S0 exists to catch, and it is left as a **finding for the PLAN-EVAL to rule
on** rather than silently patched into the locked plan: amending a PLAN-EVAL-approved plan is not
the supervisor's to do, and the numbers are the evaluator's to verify independently.

### Not changed

PR #1762 stays **draft**, `status:plan`, with live `closingIssuesReferences` **`[]`** — a closing
keyword would incorrectly mark #1387 complete on merge of a plan-only PR. The body wording repaired
by the coordinator is preserved verbatim.

## S0 re-run on `24f6642f` — released for implementation under the accepted adapter boundary

`origin/main` advanced to **`24f6642f040617de573c7cef1140eed1ac0efd6d`** (#1763 / issue #1730
shipped, after #1772). Branch rebased onto it: **`0a1e6337`**, clean. Rebase remains correct here —
this branch carries plan artifacts only, so no receipt, archive or verdict cites a SHA it would
rewrite.

**S0 preconditions re-verified, not assumed:** `packages/contracts/src/public/mod.ts` on `main`
exports `NetScriptProcedureMeta`, `NetScriptAuthenticationRequirement` and `BaseContractMeta` — the
metadata shape the research was written against, unchanged.

**Base-gate census at `0a1e6337`** — identical to the previous measurement, so the two `main`
advances since were inert for this leaf's contracted signals:

| Package   | Measured | `plan.md` row 4 says |
| --------- | -------- | -------------------- |
| contracts | **16**   | 8 — **stale (F-1)**  |
| service   | 90       | 90                   |
| plugin    | 68       | 68                   |
| sdk       | **77**   | 69 — **stale (F-1)** |
| mcp       | 136      | 136                  |

The two stale rows are unchanged from what S0 first surfaced and PLAN-EVAL ruled blocking; they are
repaired by the author in step 1, not silently by the supervisor.

**Release status.** PLAN-EVAL cycle 1 returned `FAIL_PLAN` with five required fixes and
**adjudicated both flagged decisions ACCEPTED** — LD-11 (router-rename acceptance) and LD-8
(`optional` fails closed at binding). The coordinator has released the leaf under that accepted
adapter boundary. The design is accepted and unchanged; the five fixes are gate-set, ceiling and
text corrections only, and the evaluator's own re-evaluation scope says a full fresh PLAN-EVAL is
**not** required unless design text changes.

## PLAN-EVAL cycle 1 repair — bounded fixes applied

The implementation author applied only the five corrections required by `plan-eval.md` § Required
fixes; the accepted design and locked adapter boundary did not change.

- Replaced the stale pre-#1466 test census with contracts 16 / service 90 / plugin 68 / SDK 77 / MCP
  136 (387 total) and appended the post-S0 correction to `research.md`.
- Contracted the generated-carrier gates at their staling slices and final readiness, and declared
  only their named `gen:*` outputs ceiling-exempt. The required base `check:agent-docs-prose` probe
  passed after building 639 site files and reporting the bundle fresh in 7.33 seconds; tracked Git
  status remained clean after the probe.
- Added the two signature-only context widenings and `service-rpc.ts` to Slice 2 so Slice 3 remains
  behavior-only inside its ceiling.
- Recorded the owner-only LD-11 issue-text amendment and implementation-PR substitution rule.
- Pinned LD-8 rejection to `createContractAuthorizer()` construction and named the Slice 5 negative
  test.

Validation for this plan-only repair: `git diff --check` passed. No product source, generated
carrier, or `deno.lock` file changed.

## Slice 1 — additive contract metadata type

Slice 1 changed exactly its six-file product ceiling and stopped before Slice 2. The implementation
extends the existing `NetScriptProcedureMeta.access` object with optional readonly
`authorization.scopes` and `authorization.roles`. It adds no enforcement, exported parallel policy
symbol, or second metadata vocabulary.

### Type and independence proofs

- The contracts runtime test stores and retrieves both authorization arrays through oRPC metadata.
- The contracts type fixture accepts readonly scopes/roles, rejects a parallel `public` policy, and
  proves the declared arrays cannot be mutated.
- The SDK type fixture renames the procedure to `renamedList`, proves the metadata survives the
  rename, and marks the former `list` key as an expected type error.
- Contracts and SDK doc-JSON independence tests require the declared exported symbol and its
  `authorization`, `scopes`, and `roles` fields while retaining the no-oRPC/npm leakage assertions.
- An exploratory doc-JSON assertion initially selected a name reference rather than the declaration;
  requiring a node with declarations corrected the test helper without changing product scope.

The product commit is `2ddd60481217f0931ea8f96228d213f10be12a9f`. All durable receipts below attest
that exact content head, with `gitHead == actualGitHead`.

### Named Slice 1 evidence

| Gate / proof   | Exact command or method                                      | Result                                            | Receipt evidence                                               |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------- |
| Scoped check   | `deno task check --include ^packages/(contracts\|sdk)/`      | PASS, 114 files / 0 diagnostics                   | 2,074 ms; structured batch output                              |
| Scoped lint    | `deno task lint --include ^packages/(contracts\|sdk)/`       | PASS, 114 files / 0 findings                      | 648 ms; structured findings output                             |
| Scoped format  | `deno task fmt:check --include ^packages/(contracts\|sdk)/`  | PASS, 114 files / 0 findings                      | 499 ms; structured findings output                             |
| Package tests  | `deno task test packages/contracts/tests packages/sdk/tests` | PASS, 93/93                                       | 4,665 ms; structured test summary                              |
| Export drift   | `deno task docs:exports-drift`                               | PASS, contracts and SDK coverage current          | Exact direct task plus `docs:accuracy` receipt, 4,460 ms       |
| Contracts JSR  | `audit-jsr-package.ts --root packages/contracts`             | PASS; four exports, one sanctioned slow-type info | Exact package audit output                                     |
| SDK JSR        | `audit-jsr-package.ts --root packages/sdk`                   | PASS; 12 exports, two known baseline warnings     | Exact package audit output                                     |
| Quality        | `deno task quality:gate`                                     | PASS                                              | 7,468 ms; quality, architecture, and dependency work in output |
| Publishability | `deno task publish:dry-run`                                  | PASS                                              | 27,863 ms; full package listing and `Dry run complete`         |

The runner catalog does not expose `audit-jsr-package` as a gate ID. The two plan-contracted package
audits therefore ran as exact direct commands; the receipt-backed full publish dry run supplies the
durable publishability backstop. Changing the runner catalog would have breached the Slice 1 file
ceiling, so no gate tooling was modified.

`receipts/evidence-set.json` was recomputed over the seven named durable receipts only and is
`SUFFICIENT` with no reasons. Receipt verification used exact `argv`, positive `durationMs`, and
each receipt's own work output; exit code alone was not treated as evidence.

### Integrity and stop

- `deno.lock` remained byte-identical at
  `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`.
- The MCP export corpus, every `PUBLISH_ASSET_OUTPUTS` path, agent-docs prose/provenance, and
  generated asset barrels had no tracked movement from the content head.
- E2E, Aspire, Docker, and browser gates were not run; no runtime lease was held.
- Slice 1 is awaiting substantive supervisor Tier-A review. The implementation author has not
  self-certified Tier-A acceptance and has not started Slice 2.

## Supervisor catch-up — Slices 1–4 accepted (resume-docs gap closed)

This worklog was not updated after Slice 1, flagged as **F-1** by the Slice 4 IMPL-EVAL
(`evaluate-slice-4-deepseek.md`) as a resume-docs gap: a fresh session trusting this file alone would
have been materially misled about run position, even though the commit trail, per-slice Tier-A
documents (`tier-a-slice-2/3/4.md`), and per-head receipt archives were all current. Catching up here
rather than rewriting history into the earlier entries.

**Slice 1** — Tier-A ACCEPTED at `2ddd6048`. IMPL-EVAL PASS. Metadata extension only, six-file
ceiling, seven durable receipts, evidence set SUFFICIENT.

**Slice 2** — Tier-A ACCEPTED_WITH_FINDINGS at `f9b32b4f7`. Mid-slice ceiling amendment (**D-4**,
owner-ruled) added `service-builder-impl.ts` to a plan that had scoped it to `service-builder.ts`
alone; the same shape as PLAN-EVAL's already-ratified F-3. The author terminated without
`task_complete` after dispatching an out-of-brief reviewer; the supervisor committed its complete,
uncommitted work unchanged rather than re-implementing. IMPL-EVAL (Fable 5) found a real evidence
defect — **D-6**: three Slice 1 receipts sat uncleared at the top level beside Slice 2's set, read as
current. Fixed; catalog gaps for `exports-drift`/`mcp-export-corpus` closed as **D-5**.

**Slice 3** — Tier-A ACCEPTED at `c297064aa`, after **two rescope stops that traced to supervisor
brief errors, not author defects**: **D-7** demanded a non-phantom `TCustom` proof the ceiling could
not reach (the fix belongs to Slice 2's file, on no later slice — withdrawn, filed as **#1787**);
**D-8** offered a false binary on a `traceHeaders` contract mismatch and omitted the correct third
option (fix the runtime composition, which needed no ceiling amendment). The third dispatch resolved
D-8 correctly. **Double-certified**: the native evaluator route hit an account-wide monthly spend
limit, so a coordinator-authorized Opus 5 session evaluated first (`ACCEPTED_WITH_FINDINGS`), then a
sanctioned DeepSeek V4 Flash 0731 session independently concurred without copying the first verdict —
recorded in the topic supervisor's ledger, not duplicated here.

**Slice 4** — Tier-A ACCEPTED at `9cc8c4c5f`. Contract-policy service ports, six-file ceiling,
`AuthorizerPort` compatibility preserved and proven by direct assignment, contract-local design per
research finding 15, fallback-typing invariant proved by a genuine `@ts-expect-error` rejection
(independently reproduced by the DeepSeek evaluator, which removed the directive and confirmed
`TS2741`). Nine receipts, evidence set SUFFICIENT, corpus grew by exactly the twelve new exports.

Slice 5 is the next release: contract-policy adapter and middleware binding, behaviour-only.

## Slice 5 — rescope stop before product edits (D-9)

The Slice 5 implementation surface was inspected against the locked ten-file ceiling before any
product edit. The behavior slice must construct `createContractAuthorizer(contract, ...)`, but both
published service entrypoints use explicit named exports and currently expose only the Slice 4
contract-policy types. The focused command
`deno doc --filter createContractAuthorizer packages/service/mod.ts` returned
`Node createContractAuthorizer was not found!`.

The minimal public-surface completion needs two files outside the ceiling:

- `packages/service/src/auth/mod.ts` — export `createContractAuthorizer` from the `./auth` subpath.
- `packages/service/mod.ts` — export `createContractAuthorizer` from the package root.

No private-path test workaround was introduced: it would make the implementation pass internally
while leaving the promised consumer factory unreachable. Per the ceiling contract, Slice 5 stopped
and D-9 was appended to `drift.md`; no Slice 5 source/test gate, receipt, commit, or PR phase comment
claims a content implementation.

Before the stop, the ten current Slice 4 receipts were checked for their `1387-s4-*` invocation IDs,
matching `gitHead == actualGitHead == 9cc8c4c5f84acef262bca2cec9169ebbaa410eb5`, and positive
durations. They were then moved (not copied) into `receipts/slice-4-9cc8c4c5f/`; post-move SHA-256
comparison was byte-identical for all ten files and the receipt root has no top-level files.

**Next step:** owner/supervisor ceiling adjudication. If D-9 is accepted, add only the two entrypoint
files for named value exports and re-release Slice 5. Do not begin Slice 6.

## Slice 5 — contract-policy adapter and middleware binding

D-9 was owner-approved before this dispatch: the only ceiling amendment was the named value export
of `createContractAuthorizer` from `packages/service/src/auth/mod.ts` and `packages/service/mod.ts`.
Implementation changed 11 of the 12 authorized service files; `contract-policy.ts` required no
behavior edit. The checked-in generator also refreshed the MCP export corpus under the plan's
explicit generated-carrier exception. No other product or generated file changed.

### Behavior delivered

- Contract traversal compiles procedure-local access metadata once during factory construction.
  `authentication: 'optional'` throws there with the stable
  `[netscript.service.contract-policy]` namespace; the required negative test is named exactly
  `createContractAuthorizer rejects optional authentication during construction`.
- The bound resolver matches REST method/path templates, RPC router keys, RPC mount aliases, and
  deprecated RPC route-prefix mappings using the builder's actual wiring configuration. It does not
  assume `/api` or `/api/rpc` when custom paths were configured.
- The builder passes the same resolver object to authentication and authorization middleware. A
  declared-public procedure bypasses both stages; a required procedure outside legacy default
  prefixes is authenticated and authorized.
- Contract metadata wins under LD-6. A match-aware fallback is consulted only for a matched
  procedure with absent metadata; no fallback match denies. The disagreement test defines fallback
  decisions opposite both the declared-public and missing-scope outcomes and proves zero fallback
  calls.
- `createScopeAuthorizer` now implements `MatchAwareAuthorizerPort`, distinguishes no-match from a
  matched deny, and preserves its standalone `authorize()` behavior and assignability to the plain
  `AuthorizerPort` seam.
- Tests cover custom REST/RPC dispatch, aliases, deprecated routes, service-side rename continuity,
  no-policy fallback, missing scope, disagreement precedence, and the public root export through a
  real builder request flow.

The immutable content head is `c2cbfbf0b3c355682732be5805f0f180498576db`.

### Slice 5 evidence

| Gate / proof | Result | Durable evidence |
| --- | --- | --- |
| Scoped check | PASS, 48 files / 0 diagnostics | `1387-s5-check`, 1,344 ms |
| Scoped lint | PASS, 48 files / 0 findings | `1387-s5-lint`, 477 ms |
| Scoped format | PASS, 48 files / 0 findings | `1387-s5-fmt-check`, 412 ms |
| Service tests | PASS, 101/101 | `1387-s5-test`, 4,244 ms |
| Quality gate | PASS | `1387-s5-quality-gate`, 7,272 ms |
| Publish dry run | PASS, full workspace simulation | `1387-s5-publish-dry-run`, 28,587 ms |
| MCP export corpus | PASS, real catalog receipt; 7,654 symbols | `1387-s5-mcp-export-corpus`, 6,063 ms |
| Service JSR audit | PASS; dry-run OK, one sanctioned oRPC slow-type info | Exact direct package audit |

Every receipt above was independently checked for its expected invocation ID, positive
`durationMs`, `outcome: PASS`, and
`gitHead == actualGitHead == c2cbfbf0b3c355682732be5805f0f180498576db`. The recomputed
`receipts/evidence-set.json` is `SUFFICIENT` with no reasons. Receipt success was not inferred from
a shell loop or stale top-level files.

The MCP corpus generator added the expected `createContractAuthorizer` entries for the service root
and `./auth` subpath. `deno.lock` is byte-identical at SHA-256
`edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`.

E2E, Aspire, Docker, and browser gates were not run and no runtime lease was acquired. Slice 6 was
not started. This author stops with Slice 5 awaiting substantive supervisor Tier-A review and a
separate opposite-family IMPL-EVAL; the green evidence is not an author self-certification.
