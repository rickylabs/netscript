# Evaluation: CLI auth-session typed credential transport (#1352 residual)

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `feat-cli-auth-session-typed-transport--1352` |
| Target         | `packages/cli` auth-session adapter and command composition; #1352 seven-row acceptance audit |
| Archetype      | `6 - CLI Tooling`; SDK boundary `2 - Universal Library` (unchanged) |
| Scope overlays | `none` |
| Evaluator      | Claude Fable 5 (`claude-fable-5`), fresh independent native session, 2026-09-02 — https://claude.ai/code/session_01BbyCcP5ekEWVfgRCDmgqCa |
| Effort         | Lane-policy IMPL-EVAL route (Claude Fable 5 / medium, fresh session per `supervisor.md`); native session, generator was OpenAI Codex / GPT-5.6 — opposite-family separation holds |
| Evaluated      | branch `feat/cli-auth-session-typed-transport` @ `f4969d7b5` vs `origin/main` @ `37452f11f` |

All gate evidence below marked **(re-run)** was executed independently by this evaluator session in
this worktree; **(verified)** means the artifact/source was directly inspected; **(inherited)**
means evidence from merged PR #1915 and its IMPL-EVAL, spot-checked against `main` source this
session.

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | **PASS** |
| Rationale | All seven acceptance rows of live #1352 are SHIPPED under the coordinator-sanctioned reading of row 2 (see ruling below). Every claimed gate reproduced exactly under independent re-execution: focused tests 14/14, full package-owned CLI suite 1233/1233, CLI structured check 916 files / 0 diagnostics, root `deno task check` clean, quality+arch gates exit 0, CLI doc-lint exit 0, publish dry-run exit 0 (646 files), JSDoc examples 357/357 with `unboundName=116` at ceiling, `deno.lock` SHA-256 unchanged at `e52c167e…`, arch-debt unchanged. The disclosed lint/fmt wrapper exit-2 is a pre-existing baseline tool/configuration defect and does not block (ruling below). No blocking finding remains. |

## Row-2 semantic ruling (core judgment)

Row 2: *"Application code supplies the bearer token/context, and the CLI's direct auth requests
migrate to the typed SDK path without a server-only import."*

**Ruling: SHIPPED under the narrow interpretation, which this evaluator independently confirms is
both sanctioned and honest.** Grounds, each re-verified in this session:

1. **The strict reading is not implementable against the public SDK.**
   `CreateServiceClientOptions` (`packages/sdk/src/ports/service-client.ts:290`) is discovery-based
   (`serviceName` + path shaping); its `port` field is documented compatibility-only and ignored;
   there is no exact-URL/origin override. The two CLI endpoints are an explicit caller-supplied
   stream URL (GET, verbatim) and `<authUrl>/signout` (POST) — neither is expressible as a
   discovery-driven `createServiceClient` call without widening the public SDK surface, which plan
   D6 and the review boundary forbid for this slice.
2. **The narrowing is coordinator-sanctioned, not self-granted.** The owner's post-#1915
   reconciliation comment on live #1352 (read verbatim this session) states the residual is a
   design question with two admissible resolutions — "extend the transport, or narrow the
   migration" — and assigns the choice to this slice. Independent PLAN-EVAL (separate Fable 5
   session, `plan-eval.md` = PASS) ruled direct public-descriptor `prepare` composition sanctioned.
   The issue's normative 2026-08-13 amendment requires composition "only through the Stage-2 public
   protocol", which is exactly what shipped.
3. **Every clause of the row's text is satisfied by the diff:**
   - *Application code supplies the bearer token/context* —
     `AuthPluginCommandDependencies.resolveSessionContext` (`auth-plugin-command.ts:24-29`) is an
     application-composition seam resolved exactly once per direct `session list`/`session revoke`
     invocation (`auth-plugin-command_test.ts` asserts `contextCalls === 2` and identical `{context}`
     option objects at both ports). Context is the typed `AuthSessionClientContext`
     (`auth-types.ts:48-53`). No flag, environment variable, cookie, session store, or ambient
     reader exists on this path (diff-verified; source-boundary test).
   - *migrate to the typed SDK path* — the credential half of both requests now flows exclusively
     through the public typed SDK contribution protocol:
     `createBearerSdkClientContribution(...).prepare(...)` from `@netscript/plugin-auth-core/sdk`
     (`auth-session-client.ts:10-16,64-86`), with **honest URL-derived transport facts** (`origin`
     from the real endpoint, `rpcPath` = pathname+search, `secure` = `protocol === 'https:'`) —
     the specific condition PLAN-EVAL required. No bearer logic is duplicated in the CLI; metadata
     gating, empty-credential handling, cleartext guard, and non-disclosure all execute inside the
     canonical factory-produced `prepare`.
   - *without a server-only import* — the adapter imports only
     `@netscript/plugin-auth-core/sdk`; a source regression test
     (`auth-session-client_test.ts:58-71`) forbids `/internal/`, `@netscript/service`, and
     auth-core server/services subpaths, and `deno task arch:check` + `quality:gate` pass (re-run,
     exit 0). No `packages/sdk/src/internal/**` import exists.
4. **The non-migrated remainder is honestly bounded.** The exact-URL fetch, methods, bodies, and
   JSON projection parsing remain CLI-owned, and PR #1931's body states this precisely ("This
   slice therefore migrates the credential path only. The CLI remains transport owner") — it does
   **not** claim the requests became SDK discovery-transport calls. The final acceptance-evidence
   block MUST keep this wording discipline (see close-gate section).

Residual PLAN-EVAL carried item confirmed discharged: the manual-invocation redaction gap is
covered by `auth session adapter preserves bearer cleartext guard without disclosure`
(random-UUID credential asserted absent from the thrown error; fetch stub proves preparation fails
before any request is issued). Re-run: passes.

## Seven-row acceptance reclassification (independent)

| Row | Verdict | File / symbol evidence | Test / gate evidence |
| --- | --- | --- | --- |
| 1 — browser-safe bearer factory on the #1349 public descriptor contract; no cookie/session transport; no env reads | **SHIPPED** (inherited, spot-checked) | `packages/plugin-auth-core/src/sdk/bearer-contribution.ts` / `createBearerSdkClientContribution`; `src/sdk/mod.ts` exports exactly three symbols; return type is public `SdkClientContribution` from `@netscript/sdk/client` | `bearer-contribution_test.ts:422` (`universal and has no ambient credential reader`), `:437` (npm consumer pack); factory source verified: no `Deno.env`, no cookie/session code |
| 2 — application supplies token/context; CLI direct auth requests migrate to typed SDK path; no server-only import | **SHIPPED** (narrow, sanctioned — ruling above) | `auth-types.ts` (`AuthSessionClientContext`, `AuthSessionRequestOptions`), `auth-session-client.ts` (`prepareHeaders` → public `prepare`), `auth-plugin-command.ts` (`resolveSessionContext`) | Focused suite 14/14 **(re-run, exit 0)**; source-boundary test; full CLI suite 1233/1233 **(re-run, exit 0)** |
| 3 — guarded-call integration: header arrives, unauthenticated rejected, absence sends no credential | **SHIPPED** (inherited + extended) | Bearer prepare returns `Authorization: Bearer …` patch; CLI adapter applies it | Inherited: `bearer-contribution_test.ts:209` (end-to-end server auth incl. unauthenticated rejection, credentials undisclosed). This slice: CLI test asserts `authorization: Bearer <uuid>` on GET and POST, and `assertFalse(requests[2].headers.has('authorization'))` when context is absent **(re-run)** |
| 4 — access decisions use #1350/#1466 procedure metadata; no separate `policy.public` dialect | **SHIPPED** (inherited, spot-checked) | `auth.contract.ts:212,216` (`access: { authentication: 'none' \| 'required' }`); `bearer-contribution.ts:89-90` reads `procedure.meta.access?.authentication` | `bearer resolution follows explicit and unmarked authentication policy` (`:87`); CLI passes `meta: {}` + `unmarked: 'optional'` — it consumes the same `NetScriptProcedureMeta` shape, inventing no dialect |
| 5 — identity in response-cache partitioning; direct-only explicit; removing contribution removes typed context | **SHIPPED** (inherited + this slice) | `SdkClientResponseCache` modes; CLI declares `responseCache: { mode: 'direct-only' }` and has no generated cache, so no credential-derived partition can exist | `bearer cache policy remains caller-selected and non-secret` (`:161`, asserts partition excludes credential); `bearer contribution makes its declared client context required` (`:178`) |
| 6 — cookies, sessions, CORS topology, `__Host-`, env-reading convenience stay deferred to the auth pack | **SHIPPED** (verified) | Diff adds none of these; no env/cookie/session source anywhere on the new path; docs assign policy to the auth pack | `bearer contribution module is universal…`; diff inspection: only the five CLI auth files + run dir changed |
| 7 — docs show one authenticated typed-client call; root check/test/publish dry-run pass | **SHIPPED** (verified + re-run) | `docs/site/services-sdk/sdk.md:170-215` — complete authenticated typed `createServiceClient` call with the bearer contribution and metadata/cleartext/partition rules | Root `deno task check` **(re-run this session, exit 0)**; full CLI suite 1233/1233 **(re-run)**; CLI `deno publish --dry-run` **(re-run, exit 0, 646 files, 7 pre-existing dynamic-import warnings)**; root test inherited from #1915 IMPL-EVAL — nothing outside `packages/cli` changed on this branch, and the workspace-wide `quality:gate`/`arch:check` re-ran clean |

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | PASS | `plan-eval.md` = PASS (separate Fable 5 session `0a21b6d5…`), dated before product commits `8bd0e117c`/`9fad445ab`; commit order verified |
| Design section exists in worklog | PASS | `worklog.md` `## Design` with public surface, vocabulary, ports, constants, slices |
| Commit slices match design plan | PASS | Slices 0–3 as designed; commits `80a53ad42` (audit), `8bd0e117c` (adapter), `9fad445ab` (wiring), `f4969d7b5` (evidence); per-slice PR comments present on #1931 (commit trail verified) |
| Each slice has a passing gate | PASS | Slice comments carry exits/counts; all reproduced by this evaluator |
| Generator ≠ evaluator | PASS | Generator OpenAI Codex/GPT-5.6 session `01a0620d…`; PLAN-EVAL and IMPL-EVAL are distinct fresh Fable 5 sessions |
| No speculative seams | PASS | Every added type/parameter is consumed by the command wiring or tests; no dead exports |
| Constants for finite vocabularies | PASS | No new public vocabulary; module-local canonical contribution instance |
| Concurrent-owner boundaries respected | PASS | Diff touches only `packages/cli/src/public/features/plugins/auth/**` + run dir; no SDK client-contribution internals, tracing, or locale paths (#1927/#1921/#1922 untouched) |

## Static Gates (independently re-run unless noted)

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| Structured typecheck | `run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS | exit 0; 916 selected, 8 batches, 0 diagnostics — matches claim exactly |
| Root typecheck | `deno task check` | PASS | exit 0 (re-run this session) |
| Lint (mandated wrapper) | `run-deno-lint.ts --root packages/cli --ext ts,tsx` | BASELINE_BLOCKED — not blocking (ruling below) | exit 2 reproduced: coverage refusal (root config excludes `packages/cli/`) + desktop-native e2e fixture `Package 'zod' not found in catalog`; **0 lint diagnostics** |
| Lint (changed files) | `deno lint --no-config --rules-tags=recommended,jsr --rules-include=no-process-global,no-node-globals <5 files>` | PASS | exit 0, 5 checked, 0 diagnostics |
| Format (mandated wrapper) | `run-deno-fmt.ts --root packages/cli --ext ts,tsx` | BASELINE_BLOCKED — not blocking | exit 2 reproduced, same mechanism, **0 format findings** |
| Format (changed files) | `deno fmt --check --no-config --single-quote --line-width 100 <5 files>` | PASS | exit 0, 5 checked |
| Doc lint | `deno task doc:lint --root packages/cli --pretty` | PASS | exit 0, 0 diagnostics (A/B delta 0 vs recorded clean baseline) |
| Publish dry-run | `deno publish --dry-run --allow-dirty` in `packages/cli` | PASS | exit 0, 646 files, "Dry run complete"; 7 pre-existing dynamic-import warnings |
| Lock hygiene | `sha256sum deno.lock`; `git diff origin/main..HEAD -- deno.lock` | PASS | `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`; diff empty |
| Suppression scan | grep of diff for `deno-lint-ignore` / `as unknown` / `: any` | PASS | zero occurrences in the product diff |
| Hygiene | `git diff --check` claim; configs | PASS | root `deno.json`, `packages/cli/deno.json`, e2e fixture configs byte-identical to `origin/main` (diff empty) |

## Fitness Gates

| Gate | Function | Result | Evidence |
| --- | --- | --- | --- |
| F-3 | Layering / typed public boundary | PASS | check + arch:check exit 0; adapter stays behind `AuthSessionHttpPort`; no package export change (doc-lint A/B +0) |
| F-5/F-6 | Public surface / JSR publishability | PASS | doc-lint exit 0; publish dry-run exit 0; auth-core `./sdk` surface still exactly three symbols (`deno doc`-equivalent source inspection) |
| F-7 | Doc-score / JSDoc examples | PASS | `deno task docs:jsdoc-examples` re-run: 357/357 checked, 0 failures, deferred `unboundName=116` (at, not above, the coordinator-owned ceiling), `typeError=14` |
| F-10 | Test-shape / behavior | PASS | focused 14/14 + package-owned 1233/1233, both re-run exit 0; new `auth-session-client_test.ts` colocated per convention |
| F-19 | Scoped source gate runners + secrets | PASS with disclosed baseline defect | structured check/test wrappers used; random-credential non-disclosure test passes; `quality:gate` exit 0 (workspace scan: 0 findings, warnings pre-existing) |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Adapter behavior | exact URLs/methods/bodies preserved; header patch applied; omission on no-context; cleartext guard pre-fetch; non-disclosure | PASS | `auth-session-client_test.ts` 3/3 (re-run within focused 14) |
| Command behavior | context resolved once per direct call, reaches both ports; parser regression intact | PASS | `auth-plugin-command_test.ts` 11/11 (re-run) |
| Full package-owned CLI | `run-deno-test.ts -- --allow-all --ignore=packages/cli/e2e packages/cli` | PASS | exit 0; **1233 passed, 0 failed, 0 ignored** (re-run, 54s) |
| Aspire/Docker/browser/e2e:cli | prohibited for this evaluation | N/A | per task instruction; consistent with plan Non-Scope |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| --- | --- | --- | --- |
| JSR consumer of `@netscript/cli` | publish dry-run | PASS | exit 0, 646 files (re-run) |
| Workspace resolution of new dependency | focused tests + check + publish all resolve `@netscript/plugin-auth-core/sdk` with no import-map entry and no lock movement | PASS | empirically proven by every re-run gate; lock hash unchanged |

## Anti-Pattern Check

| AP | Status | Evidence |
| --- | --- | --- |
| AP-1 (duplicate helper) | CLEAR | No bearer logic duplicated; canonical factory composed |
| AP-3 (policy in adapter) | CLEAR | Command policy stays in application wiring; adapter owns transport only |
| AP-8 (internal/private import) | CLEAR | Source-boundary test + arch:check; only `@netscript/plugin-auth-core/sdk` imported |
| AP-12 (ambient credential/flag) | CLEAR | No flag, env, cookie, session, or storage read; context is injected per call |
| Others | N/A | Outside the touched surface; workspace `quality:gate`/`arch:check` exit 0 |

## Gate assessment: the lint/fmt baseline defect (explicit ruling)

**Ruling: disclosed baseline tool/configuration defect — does NOT block acceptance.**

- Reproduced independently: both wrappers exit 2 with **zero** source findings. Mechanism
  confirmed: root `deno.json` `lint.exclude`/`fmt.exclude` contain `packages/cli/` (pre-existing on
  `origin/main`), so the wrapper drops the whole tree as a coverage refusal; it then descends into
  `packages/cli/e2e/fixtures/desktop-native/deno.json`, an isolated non-workspace config whose
  `catalog:` `zod` dependency cannot resolve.
- All three relevant configs are byte-identical to `origin/main`; this branch neither created nor
  worsened the defect, and repairing root lint/fmt ownership or e2e fixture configs is explicitly
  outside this slice's scope (and would itself violate the concurrent-ownership constraints).
- The substantive lint/fmt verdict is covered: changed-file repo-style lint and format both exit 0
  (re-run), and the workspace `quality:gate` (which catches the `any`/casting classes the wrappers
  miss) exits 0.
- **Required follow-up (non-blocking):** file a `type:chore` `area:tooling` issue for the
  wrapper/root-config ownership mismatch so `run-deno-lint.ts`/`run-deno-fmt.ts` can own
  `packages/cli` (or the gate matrix names the sanctioned substitute). This slice's drift entry is
  the evidence seed. Not architecture debt — it is a tooling defect, so no `arch-debt.md` entry is
  required (`FAIL_DEBT` inapplicable).

## Scope / boundary review

- Diff = 5 files under `packages/cli/src/public/features/plugins/auth/` + run artifacts. Nothing in
  `packages/sdk`, `packages/plugin-auth-core`, tracing, locale, or diagnostics paths.
- Exact URL semantics preserved (`list` GETs the supplied URL verbatim including query;
  `revoke` POSTs `<authUrl>/signout`); #1243's dead-default defect untouched, as required.
- Plan D1–D6 all honored; no drift beyond the three logged entries (rtk absence, wrapper defect,
  reverted import-map experiment — the last resolved with an empty final lock diff).
- `.llm/runs/**` artifacts complete and resumable; arch-debt delta zero (file unchanged).

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| low (informational) | New failure mode: a supplied credential over non-local cleartext HTTP now throws before fetch where the old adapter would have sent an unauthenticated request. Intended (canonical guard), tested, and only reachable when application code newly supplies context. | `auth-session-client_test.ts` cleartext test | none — record only |
| low | `drift.md` cites CLI `@netscript/kv` imports as the workspace-resolution precedent, but those occurrences are template/string content, not module-graph imports. The resolution claim is nevertheless true — proven empirically by check/tests/publish. | grep of `packages/cli/src` | none — precedent citation imprecise, conclusion correct |
| low (release-lane note) | The published CLI will depend on `@netscript/plugin-auth-core` whose `./sdk` subpath exists on `main` but is not yet in any published version (both at `0.0.6` in-repo). Fine for the coordinated 0.0.7 cut where both publish together; the release captain should not publish `@netscript/cli` ahead of `@netscript/plugin-auth-core`. | `deno.json` versions; publish dry-run exit 0 | note for `netscript-release` lane |
| — (non-blocking follow-up) | Lint/fmt wrapper cannot own `packages/cli` (baseline defect, ruling above). | drift.md + this session's repro | file follow-up tooling issue |

No high- or medium-severity findings. No blocking finding.

## Close-gate: is `Closes #1352` justified?

**Yes, conditionally on wording.** All seven acceptance rows are SHIPPED with linked evidence; the
plan is complete; every user-requested gate has real, reproduced results; the sole gate anomaly is
a pre-existing baseline defect with zero findings. Conditions for the coordinator's closing flow:

1. Add exactly one structured `acceptance-evidence` block to PR #1931 whose row-2 entry uses the
   narrow wording verbatim in spirit: application-supplied typed context + credentials routed
   through the public typed SDK contribution protocol + no server-only import + **exact-URL
   transport retained because the public SDK is discovery-only**. It must not state or imply that
   the requests became SDK discovery-transport calls.
2. Switch the PR body's `Refs #1352` to `Closes #1352` (body keyword, per the close-gate rules) and
   let the label-gated acceptance mirror tick the boxes — never hand-tick.
3. Keep `Refs #1243` (the dead-default URL stays that issue's scope).

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| A public contribution descriptor's `prepare` can be host-composed outside the SDK dispatcher when every input type is public and the host passes honest transport facts — the sanctioned narrow alternative to widening transport surfaces | boundary-preserving partial migration | Archetypes 2/6 seams | medium |
