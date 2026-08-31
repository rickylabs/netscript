# PLAN-EVAL — feat-sdk-client-contribution-seam--1349 (cycle 2)

- Plan evaluator session: separate supervisor-dispatched PLAN-EVAL session, 2026-08-31. Identity as
  observed from inside this session: qwen/qwen3.8-flash; effort attestation is external to me.
  This file replaces the cycle-1 verdict; cycle 1 is preserved in git history at `1ada3e1c9`.
- Run: `feat-sdk-client-contribution-seam--1349`
- Adjudicating plan head: **`fcc0f29b1`** (branch `feat/sdk-client-contribution-seam`, baseline
  `65cd8a077`). Verified: the cycle-2 commit touches only the three run-dir plan artifacts;
  `packages/`, `plugins/`, and `deno.lock` are untouched.
- Surface / archetype: `@netscript/sdk` (Archetype 2 — Integration) public contribution contract +
  private stable-v1 adapter, governed by `rfcs/0001-sdk-client-contributions.md` (Status: Accepted)
  Stage 2.

## Normative reads (cycle-1 root cause explicitly closed)

I read both normative artifacts directly rather than trusting the plan's citations:

1. `rfcs/0001-sdk-client-contributions.md` — full text (1612 lines).
2. `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` — full text (503 lines),
   and I ran its check myself: `deno check --unstable-kv` **passes clean on this head**. The
   Slice-1 gate command is the RFC's own repository/publish-gate line (RFC:1390-1392) verbatim,
   including the "until implementation replaces its local types with public imports" migration
   framing the plan adopts.

Tree spot-checks of load-bearing plan claims (all confirmed): `CreateServiceClientOptions` has the
nine closed fields with no `contributions`/`link`; `ServiceClientMethod` is currently
`<TInput, TOutput, TError = Error>` with `__error` (service-client.ts:176-179);
`NetScriptProcedureMeta` exists and is exported from `@netscript/contracts`
(`domain/procedure-meta.ts`, `application/contract-primitives.ts`, `public/mod.ts`);
`packages/sdk/src/internal/` does not exist; `deno.json` exports contain no `./internal` subpath;
`ports/mod.ts:7` still carries the "transport seam" sentence (owned by Slice 3 per LD-1); every
Slice-named file exists (`ports/{query-factory,service-query-utils,query-key,client-link-factory,service-client}.ts`,
`presets/define-services.ts`, `client/{errors,http-client-link,service-client}.ts`,
`query/query-factory.ts`, `query-client/{create-service-query-utils,query-client-factory,types}.ts`,
`desktop/domain/types.ts`, `desktop/application/desktop-rpc-client.ts`); every named fixture
(`sdk-assignability_type.ts`, `define-services_type.ts`, `service-query-utils-upstream_type.ts`)
exists; every named task (`doc:lint`, `quality:scan`, `arch:check`, `publish:dry-run`) exists.

## Cycle-1 finding adjudication

| Finding | Cycle-2 status | Evidence (verified against RFC/fixture, not just the plan) |
| ------- | -------------- | ------------------------------------------------------------ |
| F-1 | **CLOSED** | `plan.md` §"Authority re-baseline" sweeps **all five** rows (§1, §2, §3, §5, §7). `link?:` is explicitly killed (§1 row, LD-3, LD-1, and the #451 tripwire "forbidden in #1349") — #1349 no longer pre-empts #451. LD-3 re-derived from RFC §Public contribution contract / §Tuple type algebra / compatibility table: field name `contributions?` ∩ `ValidateSdkClientContributions<T>` (RFC:672-674), `ServiceClientContext` canonical as client-side default, `Record<never, never>` query-side default, `readonly []` suffix default — each checked against RFC:685-701 row by row. Descriptor/prepare/partition shapes match RFC:411-476 exactly (`{ kind: 'http', origin, rpcPath, secure }`, no method; partition resolver gets context + procedure only). |
| F-2 | **CLOSED** | LD-6 now reads from the RFC's ordering law (RFC:830-863): tuple order = sequential first-failure reporting only; valid contributions commute; "no `before`/`after`/`requires`/`priority`/numeric `order`/environment field" (RFC:858-859, 571-572). An attempted dependency field is closed-shape `SDK_CONTRIBUTION_INVALID` — the acceptance line resolves as shape invalidity, not a dependency DSL. 16 cap enforced at both boundaries (named `limit:more-than-16`, fixture:150-171/497-503; construction step 1 validates tuple/key limits, RFC:834). |
| F-3 | **CLOSED** | LD-7 matches RFC:984-991 verbatim in effect: `CreateDesktopServiceClientOptions` gains nothing; excess-property compile rejection (committed fixture:347-352, compiles today) **plus** construction-time `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED` for JS/widened input, "never ignored"; the acceptance line resolves as shape/transport invalidity with no descriptor flag. Generator-level rejection is explicitly the CLI lane's deferred gate (RFC:991, 1383). |
| F-4 | **CLOSED** | Slice-1 ceiling now covers `ports/query-factory.ts`, `ports/service-query-utils.ts`, `ports/query-key.ts` (`SdkClientServerKeySuffix`, `ActionQueryKey<TAction, TSuffix = readonly []>`), `presets/define-services.ts`, the contribution/error public types, the query-side generics, and the error contract; the amendment's "key algebra + local failure taxonomy" obligations are inside Slice 1, with the throws mapped in Slice 3. Gate 1 is the RFC's fixture command with `--unstable-kv`, re-pointed from local model to public imports as the Slice-1 proof. |
| F-5 | **CLOSED** | Slice 2 names exactly the RFC's three files (`adapter-ports.ts`, `prepared-call.ts`, `stable-v1-adapter.ts`, RFC:490-493), the direct `PreparedSdkClientCall` channel with optional package-private `unique symbol` (RFC:545-552), unary `context.retry: 1` count-1 + byte-equivalence and A→B reconnect count-2 + abort-no-epoch conformance (RFC:905-929), and the full absence set: four-entrypoint `deno doc --json`, the three rejected packed-consumer specifiers (RFC:1369-1371), non-growing zero-oRPC allowlist (RFC:1372-1373). Slice 3 carries the RFC runtime gates: unknown-boundary duplicate validation, forbidden-header list, cache non-observation, recursive `createServiceQueryUtils` wrapper with the cast fast path limited to the empty-context specialization (RFC:813-820), direct-only runtime omission. |
| F-6 | **CLOSED** | Risk register R-1…R-8 + D-1 with named mitigations/proving gates, including both cycle-1 misses (deep recursion vs isolatedDeclarations; ~15-surface widening). Final gate set contains every RFC-mandated gate: fixture check, port-absence, packed negative import, zero-oRPC scan, `deno doc --lint`, `arch:check`, `quality:scan`, publish dry-run, JSR audit, doctest, and the scaffold-runtime E2E correctly restricted to merge readiness (RFC:1398-1399). |
| F-7 | **CLOSED** | Slice 3 owns the Docs/consumer proof: README export table documents the **contribution** surface, the "fork the link" paragraph is deleted rather than replaced with a false seam, the worked example compiles under the README doctest, and one consumer test asserts header-added **and** CLIENT-span-still-emitted — sequenced after Slice 2's composition. The `ports/mod.ts` sentence is owned correction work (LD-1), not silence. |
| F-8 | **CLOSED** | `supervisor.md` (identity + routes + eval history) and `worklog.md` with a full `## Design` checkpoint exist and are in the adjudicated commit. |

## Requested upgrades

- **LD-5 — CLOSED as citation.** It now states "This is a direct RFC rule, not an inference" and
  the content matches RFC:538-543: `ClientTransportPolicyPort` owns every attempt/retry/encoding/
  trace/dispatch action, accepts only prepared output, and MUST NOT invoke contributors;
  `ProcedureMetadataPort` is the sole upstream-node interpreter.
- **LD-9 — CLOSED as confirmed.** No longer an assumption: `NetScriptProcedureMeta` exists and is
  exported on the baseline (I verified in `packages/contracts`), the "server plugin reachability is
  a service-preset problem" quote is RFC:47, and the stop-and-report rescope tripwire is retained.
- **`TError` retention — CONFIRMED.** LD-3 pins
  `ServiceClientMethod<TInput, TOutput, TError = Error, TContext extends object = ServiceClientContext>`
  — third slot kept, context appended fourth — and states this intentionally corrects the RFC
  sketch's omission per the RFC's own append rule (RFC:682-683) and #1350's "exactly as filed"
  boundary. Verified against the real current type (service-client.ts:176). Slice-1 gate 5 asserts
  it.

## Plan-Gate checklist

| Plan-Gate item                          | Result | Evidence |
| --------------------------------------- | ------ | -------- |
| Research present and current            | PASS   | `research.md` tree claims re-verified by me on this head; the cycle-1 authority gap it caused is now closed by the plan's explicit five-row re-baseline against the Accepted RFC. |
| Decisions locked                        | PASS   | LD-1…LD-9 all derive from the RFC/fixture (rows above); rationale stated per decision. |
| Open-decision sweep                     | PASS   | My own sweep found no unflagged rework-forcing decision. Realization (outer epoch wrapper) locked per RFC preference; every remaining item maps to an RFC open question that the RFC itself leaves to named siblings (#1350/#1351/#1352/#1353/#451/#1093) or post-implementation evidence (budget raise, RFC question 1). |
| Commit slices                           | PASS   | 3 ordered slices, each with proves/files/gates; all named paths and commands verified to exist. |
| Risk register                           | PASS   | R-1…R-8 + D-1, mitigations tied to named gates. |
| Gate set selected                       | PASS   | Archetype 2 static/fitness/runtime/consumer set plus every RFC-mandated gate; expensive E2E merge-readiness-only. |
| Deferred scope explicit                 | PASS   | §"Deferred scope and tripwires" with sibling owners and stop-and-report boundary. |
| jsr-audit (package wave)                | PASS   | Re-applied to the RFC-ratified surface: entrypoints fixed, isolated-declaration-safe annotations, no slow-type exception, packed-consumer probe kept as separate gate; surface risks (tuple recursion, ~15 widenings) named before slicing. |

## The gate question

**Is Slice 1 implementable from this plan as written? Yes.** The RFC supplies the normative shapes
verbatim; the plan supplies the ceiling (every type file), the per-generic defaults cross-checked
against the RFC compatibility table, the `TError`-preserved arity, the dual 16-cap law, the
fixture-re-point proof, and a concrete gate command list whose primary check I confirmed compiles
clean on this head. An implementer executes Slice 1 without re-deriving design decisions. Cycle 1's
answer was no; that failure mode is closed.

## Non-blocking notes for the implementation lane (not findings)

1. The RFC compatibility table (RFC:685-701) is the authority for per-generic defaults; e.g.
   `ServiceProcedureMutationOptions` keeps its existing `unknown` for `TMutationContext` before the
   appended context parameter. Apply from the table directly.
2. Between Slice 1 (types accepted) and Slice 3 (construction validation), an options-supplied
   `contributions` tuple is not yet consumed. That is a legal intermediate on a draft branch — the
   "never silently accepted" law is enforced before merge by Slice-3 gate 1 — but no release or
   publish may happen at that boundary.
3. The RFC's compatibility section requires implementation packages to bump versions per the
   release plan; that is release mechanics owned outside these slices, not an open design decision.
4. `ports/mod.ts` is touched in Slice 1 (export list) and corrected in Slice 3 (LD-1 sentence);
   keep the Slice-1 edit to exports only.

## Verdict

`PASS` — head `fcc0f29b1`. All cycle-1 findings verified closed against the Accepted RFC and the
committed fixture directly; no new rework-forcing decision found. Implementation may proceed,
slice by slice, with the supervisor's lane assignments and the slice review gate in force. Cycle
limit reached without escalation.
