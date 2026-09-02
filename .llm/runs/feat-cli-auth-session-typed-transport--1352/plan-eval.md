# PLAN-EVAL — feat-cli-auth-session-typed-transport--1352

- Plan evaluator session: Claude Fable 5 (`claude-fable-5`), independent native session,
  2026-09-02 — https://claude.ai/code/session_01DgHPiUifsax73QDo5JXXfB
- Run: `feat-cli-auth-session-typed-transport--1352`
- Surface / archetype: `packages/cli` auth-session adapter and command composition — Archetype 6
  (CLI Tooling), constrained by SDK Archetype 2 (Universal Library) boundary
- Scope overlays: none

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselined at `37452f11f` (= worktree `HEAD` = `main`, tree clean except this run dir). Spot-checks by this evaluator: finding 1 — `CreateServiceClientOptions` (`packages/sdk/src/ports/service-client.ts:290-328`) is discovery-based (`serviceName` + path shaping); `port` is deprecated and documented as a no-op; no exact-URL override exists. Finding 2 — `FetchAuthSessionHttp` (`packages/cli/src/public/features/plugins/auth/auth-session-client.ts:7-23`) GETs the supplied stream URL verbatim and POSTs `<authUrl>/signout` with no authorization header. Finding 3 — `packages/sdk/deno.json` exports map has no `./internal` entry. Finding 4 — `SdkClientContribution`/`SdkClientPrepareOptions`/`SdkClientTransportDescriptor` are public exports (`packages/sdk/src/client/mod.ts:30-43`). Coordinator comment on live #1352 verified verbatim (see core question below). |
| Decisions locked                        | PASS   | `plan.md` Locked Decisions D1–D6, each with rationale; doctrine axioms A1/A3/A4/A7 mapped; worklog `## Design` records the same decisions with sources. |
| Open-decision sweep                     | PASS   | `plan.md` Open-Decision Sweep: 4 resolved-now (transport shape, credential source, unmarked-auth metadata, cleartext), 1 safe-to-defer (surface/carrier cascade) with a verify-before-close condition. Evaluator's own sweep below found no unflagged rework-forcing decision. |
| Commit slices (< 30, gate + files each) | PASS   | Worklog Design "Commit Slices": 4 ordered slices (0–3), each naming its proving gate and files. |
| Risk register                           | PASS   | `plan.md` Risk Register: 6 risks with concrete mitigations, including the exact risk this gate was asked to adjudicate (manual `prepare` mistaken for full SDK transport migration → precise boundary naming, no SDK-transport claim). |
| Gate set selected                       | PASS   | `plan.md` Fitness Gates names F-3/F-5/F-6/F-7/F-10/F-19 with bespoke evidence; the remaining Arch-6-required mechanized F-* family is carried by validation steps 10–11 (`deno task quality:gate` = `quality:scan` + `arch:check`; `check-doctrine.ts --all-roots` covers AP-1..AP-30), per the Phase A note in `gates/archetype-gate-matrix.md`. Release-gate class is n/a (no release cut, no scaffold/publish-shape change); runtime/Aspire is optional for Arch 6 and explicitly excluded by user prohibition. |
| Deferred scope explicit                 | PASS   | `plan.md` Non-Scope (7 items with owning issues #1927/#1921/#1922/#1243) plus worklog Design "Deferred Scope". |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` "jsr-audit surface scan": CLI entry surfaces scanned; baseline `doc:lint` exit 0 with 0 diagnostics; `jsr-audit packages/cli` exit 0 with 20 pre-existing advisories; no new public export planned, so no new slow-type/surface risk — consistent with plan Hidden Scope (doc-lint A/B vs baseline) and gate F-5/F-6 evidence rows. |

## Core question: is direct `prepare` invocation sanctioned?

The supervisor asked this session to decide whether directly invoking `prepare` on the public
descriptor returned by `@netscript/plugin-auth-core/sdk` is a sanctioned composition of the public
`SdkClientContribution` contract or an unsound/internal escape hatch. Ruling: **sanctioned**, on
four verified grounds.

1. **Everything needed is public.** `createBearerSdkClientContribution` is exported from the
   published `./sdk` subpath (`packages/plugin-auth-core/deno.json`, `src/sdk/mod.ts`), and its
   return type `SdkClientContribution` — including the `prepare` member — plus every input type
   (`SdkClientPrepareOptions`, `SdkClientProcedureDescriptor`, `SdkClientTransportDescriptor`,
   `SdkClientRequestPatch`) is exported from `@netscript/sdk/client`
   (`packages/sdk/src/client/mod.ts:30-43`). All `SdkClientPrepareOptions` fields are plain,
   caller-constructible values (`packages/sdk/src/ports/sdk-client-contribution.ts:42-55`);
   `procedure.meta` is the public `NetScriptProcedureMeta` from `@netscript/contracts`. No branded
   or internal token forces the SDK's internal dispatcher to be the only possible host, and no
   import from the forbidden `packages/sdk/src/internal/**` is required. The #1349 private
   boundary is untouched.
2. **The ownership sentence constrains the contribution, not the invoker.** "Transport, retry,
   deduplication, tracing, discovery, and dispatch remain SDK-owned"
   (`sdk-client-contribution.ts:91-96`) forbids a *contribution* from seizing those concerns. The
   CLI adapter already owns its exact-URL transport; the contribution contributes only the
   `authorization` header patch, exactly its contracted role. Every security invariant lives
   inside the factory-produced `prepare` itself (`bearer-contribution.ts:74-98`: metadata-gated
   resolution, empty-credential handling, non-local cleartext rejection, no ambient reads) and
   executes identically under manual invocation — provided the host passes honest transport facts,
   which plan Hidden Scope and D4 pin (real origin/secure flags, unmarked=`optional`).
3. **The host obligations the SDK would otherwise enforce are discharged by the plan.**
   `responseCache` is declared `direct-only` and the adapter has no cache, so no
   credential-derived partition can exist (D4); `headerKeys` exclusivity is trivial with one
   contribution, and header-merge precedence is a named risk with a dedicated test.
4. **The issue's own record supports the narrow reading of row 2.** Row 2 reads "Application code
   supplies the bearer token/context, and the CLI's direct auth requests migrate to the typed SDK
   path without a server-only import." The owner's post-merge reconciliation comment on #1352
   (after #1915, verified verbatim this session) states the residual is a design question with
   exactly two admissible resolutions — "extend the transport, or narrow the migration" — and
   assigns that choice to this slice; it also records that #1915's deferral of the raw-fetch
   migration was legitimate because the public SDK transport cannot express explicit URLs (this
   evaluator re-verified that constraint against `CreateServiceClientOptions`). The issue's
   normative 2026-08-13 amendment requires composition "only through the Stage-2 public protocol",
   which public-descriptor `prepare` satisfies. The narrow migration is therefore not vague
   wording being stretched: the credential path (the part of the request this auth issue owns)
   migrates to the typed contribution protocol, application code supplies the context (D3), no
   server-only import appears, and the plan commits to naming the retained exact-URL boundary
   precisely and never claiming SDK transport migrated (Risk Register row 1, Risks section).

Residual worth carrying into implementation (not a fail): manual invocation bypasses the SDK's
internal prepared-call error wrapping (`SdkClientContributionError` redaction/diagnostics). The
bearer `prepare`'s own error messages contain no credential, and the plan's non-disclosure test
(insecure-origin failure asserted to exclude a random credential) covers the gap; IMPL-EVAL should
confirm that test exists and passes.

## Open-decision sweep (evaluator-run)

Checked independently for decisions that would force rework if deferred:

- Construction of `SdkClientPrepareOptions` for non-contract endpoints (what `procedure.path`,
  `meta`, transport facts to pass) — resolved by D4 + Hidden Scope (unmarked `optional`, real URL
  facts, no invented `policy.public` dialect).
- Cleartext behavior change (a supplied credential over non-local HTTP now throws where before no
  credential existed) — resolved: canonical guard applies, loopback/HTTPS fixtures in tests; the
  no-context path preserves current unauthenticated behavior, so no regression for existing users.
- New CLI dependency on `@netscript/plugin-auth-core` and lock impact — flagged as a risk with a
  hard fail condition (lock hash `e52c167…` must be unchanged at close).
- Header merge precedence between contribution patch and endpoint-owned headers — flagged risk
  with a dedicated GET/POST test.
- Acceptance-evidence wording for row 2 (overclaim risk) — flagged; plan commits to precise
  boundary naming and to `Refs #1352` + leaving the issue open if any row remains outstanding.

None unflagged. **none**

## Verdict

`PASS`

## Notes

- Slice 0 gate condition is now satisfied by this document; implementation (slices 1–2) may begin.
- Boundary reminders binding from the plan itself: no SDK source/export change (D6), no
  `packages/sdk/src/internal/**` or server-only import, exact URLs/methods/bodies preserved
  (D1/D5, #1243 untouched), no token flag or ambient credential source (D3, AP-12), `deno.lock`
  hash unchanged.
- IMPL-EVAL should specifically verify: (a) the transport facts handed to `prepare` are honest
  (origin/secure derived from the actual URL, not hardcoded `secure: true`); (b) the
  non-disclosure test asserting the credential never appears in error text; (c) the PR/evidence
  block states the narrow boundary — credentials migrated to the typed contribution protocol,
  exact-URL transport retained — without claiming SDK transport migration.
- Drift already logged (`rtk` unavailable on this host) is minor and does not affect the plan
  verdict.
