# PLAN-EVAL — feat-sdk-client-contribution-seam--1349

- Plan evaluator session: separate dispatched PLAN-EVAL session, 2026-08-31; route recorded by the
  generator in research.md/plan.md as `qwen/qwen3.8-flash · max` (post-#1792 policy). Identity as
  observed from inside this session: qwen/qwen3.8-flash; effort attestation is external to me.
- Run: `feat-sdk-client-contribution-seam--1349`
- Adjudicating plan head: **`4b520ea44`** (branch `feat/sdk-client-contribution-seam`, off main
  `65cd8a077`)
- Surface / archetype: `@netscript/sdk` public DSL/builder (`ports`, `client`) + public preset
  (`presets`), governed by `rfcs/0001-sdk-client-contributions.md` (Status: Accepted) Stage 2
- Scope overlays: none frontend/service; doctrine `packages/sdk` extension-axis + public-surface laws

## Ground-truth note (changes the frame of this eval)

The plan and research adjudicate the **amendment text** and never open the two normative artifacts
that sit in this very tree:

1. `rfcs/0001-sdk-client-contributions.md` — the amendment's precedence clause routes to *RFC 0001
   Stage 2*; the RFC fixes the descriptor shape, helper, error taxonomy, compatibility-default table,
   ordering law, desktop boundary, and gate list **verbatim**.
2. `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` — the RFC's **committed**
   compile-only proof (line 1390–1392 of the RFC: "proves the proposed algebra until implementation
   replaces its local types with public imports"). It pins the field name `contributions`, the
   defaults `= ServiceClientContext`, the desktop rejection-by-excess-property, the 16/17 algebra,
   the server key suffix, and the required-context rest.

Spot-checks of `research.md` against the tree: nine-field `CreateServiceClientOptions`
(`ports/service-client.ts:234-256`), `ports/mod.ts` doc-vs-export contradiction, absent
`src/internal/`, `deno.json` exports lacking `./internal`, and — important — **`NetScriptProcedureMeta`
already exists and is exported from `@netscript/contracts`** (`domain/procedure-meta.ts`,
`application/contract-primitives.ts:160` already initializes `oc.$meta<NetScriptProcedureMeta>`).
The RFC's metadata pre-condition is satisfied on main; no contracts-package creep is needed.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | Re-verified against `65cd8a077`; I re-confirmed five load-bearing claims myself. Caveat: research never read RFC 0001/the fixture, which caused the failures below. |
| Decisions locked                        | **FAIL** | LD-3, LD-6, LD-7 lock decisions that contradict the Accepted RFC and the committed in-tree fixture (F-1, F-2, F-3). |
| Open-decision sweep                     | **FAIL** | Six rework-forcing decisions left open that the plan did not flag (see sweep). |
| Commit slices (< 30, gate + files each) | **FAIL** | Slice 1's ceiling omits acceptance-required type files (query-factory/service-query-utils/query-key/define-services/error module); Slices 2–3 name no files or gates (F-4, F-5). |
| Risk register                           | **FAIL** | Only D-1 (tool cache). No entries for the isolatedDeclarations-vs-deep-recursion mitigation, compile budget, or the ~15-type widening breaking existing consumers/docs (F-6). |
| Gate set selected                       | **FAIL** | Tier-A stop list omits the RFC's mandated gates: fixture `deno check --unstable-kv`, `deno doc --json` port-absence, packed-consumer negative import, scoped zero-oRPC scan, `deno doc --lint`, `arch:check`, `quality:scan` (F-6). |
| Deferred scope explicit                 | **FAIL** | The amendment's own "must cover key algebra … local failure taxonomy" items, the query-context generics, and all Docs/consumer-proof obligations are neither sliced nor recorded as deferred (F-4, F-5, F-7). |
| jsr-audit surface scan (pkg/plugin)     | **FAIL** (re-run required) | LD-8 shows the right instinct, but the rubric was applied to a surface that is not the RFC's ratified one; must be re-applied to the corrected names/arities/defaults before re-slicing (F-1). |

## Per-question adjudication (supervisor's 7 items)

1. **LD-1 / LD-2 — CORRECT, but the clause was applied selectively.** The amendment banner
   (2026-08-13) is *later* than the seed-run reconciliation comment (2026-08-08) and states
   precedence over "conflicting rows"; §3/§5 conflict head-on and acceptance confirms. Verified
   against the tree. However, §1, §2, and §7 of "Target contract" are the **same contradiction class**
   and were not swept — see F-1/F-2. The precedence clause covers them; an implementer following the
   plan's `with?:`/`link?:` and `BaseServiceClientContext` framing would fail the acceptance line the
   plan itself locks.
2. **LD-5 — CORRECT reading; make it *ratified* rather than inferred.** RFC §Internal adapter ports
   defines exactly three package-private ports; step 8 of the composition law puts retry/dedupe/trace/
   fetch/dispatch inside `ClientTransportPolicyPort`, which "MUST NOT invoke contributors"; §Transport
   ownership says "Trace propagation is not a contribution" and lists the SDK's sole ownership. "No
   private fast lane" is honoured as "everything through the port pipeline," built-ins resident in the
   transport port. The plan's conclusion is the RFC's own architecture — restate LD-5 as an RFC
   citation, not an interpretive judgement.
3. **LD-4 — necessary but not sufficient as written.** Negative compile tests prove *cannot supply*
   only for literal tuples (excess-property checks); widened/`unknown` objects need the RFC's
   construction-side plain-object shape validation, and *cannot observe* is fundamentally a
   framework-dataflow property: contributions see only the `SdkClientPrepareOptions` snapshot the SDK
   builds (context projection, signal, procedure `{path, meta}`, transport `{kind, origin, rpcPath,
   secure}` — note: no method; and partition resolvers get no input/transport). RFC Runtime gates
   ("contribution callbacks cannot observe SDK retry/cache/trace fields"; "duplicate validation
   repeated through `unknown`") are the required evidence. Slice 3 must name those runtime tests, not
   only taxonomy errors. Also: unrepresentability only holds if the descriptor is built to the RFC's
   pinned shape (zero extra fields — RFC: no `TypeMarker`, builder, dependency list, priority,
   environment flag, upstream callback, metadata bag), which is precisely why F-2's LD-6/LD-7 must go.
4. **LD-6 / LD-7 — INCORRECT; both contradict the Accepted RFC and the committed fixture.** RFC:
   "version 1 has no `before`, `after`, `requires`, `priority`, or numeric `order` field"; descriptor
   has "no … dependency list … or environment flag"; "order-independence" is on the RFC's *not-open*
   list; "Rejected: last writer wins, priorities, and dependency ordering" is a named alternative.
   LD-6's "contribution declares a dependency on a name" therefore invents a field that the RFC's
   shape validation must *reject* (`SDK_CONTRIBUTION_INVALID`) — internally self-refuting and
   unclosable in Slice 3. Correct mapping of the acceptance line: an attempted dependency/order field
   is an invalid descriptor shape, deterministically rejected and named. LD-7: desktop incompatibility
   is not a descriptor property — `CreateDesktopServiceClientOptions` does not gain `contributions` at
   all, and the **already-committed fixture** (lines 347–351) proves rejection via excess-property
   check with `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED` at construction for JS/widened input. The
   comment's "type/runtime/generator" triple maps to: type = excess-property, runtime = construction
   validation (both in this leaf), generator = CLI lane (must be explicitly *not* this leaf).
5. **The 3-slice split — right shape, wrong Slice 1.** Types-first is contract-first doctrine and the
   committed fixture makes Slice 1 independently judgeable (it already pins every algebra claim —
   `deno check --unstable-kv` on the fixture against real imports is the Slice-1 verdict). But Slice 1
   as scoped cannot satisfy "Client/query context generics … compose to the intersection" (amendment
   + acceptance): the query-side widening table (QueryFactory/ActionMethod/FactoryConfig/
   ServiceQueryUtils/all option types + `SdkClientServerKeySuffix`/`ActionQueryKey<TSuffix>`) and the
   public error/diagnostic contract are type-only and belong in Slice 1's ceiling. **I do NOT judge
   this plan sound enough to implement Slice 1 from as written.** After the fixes below, Slice 1 is
   implementable and correctly independent.
6. **LD-9 — safe, and upgrade "default assumption" to "confirmed".** The three ports are client-side
   only; RFC: "Server plugin reachability is a service-preset problem, not a client-contribution
   field"; the optional incoming-plugin default is RFC open-question #7 owned by service presets,
   #1350 keeps the error channel, #1352 owns the bearer factory and manifest reference. Record §6 as
   a third *swept contradiction* rather than a conditional assumption; keep the stop-and-report rule.
7. **Sibling boundaries — clean, with two tripwires to name explicitly.** (a) The RFC's algebra
   sketch drops `TError` from `ServiceClientMethod`; #1350 stage-1a mandates preserving the concrete
   error channel "exactly as filed", and the real current type is `<TInput, TOutput, TError = Error>`
   with `__error`. The RFC's own rule — new parameters appended — gives the correct form
   `ServiceClientMethod<TInput, TOutput, TError, TContext extends object = ServiceClientContext>`
   (the plan's LD-3 arity is right; lock it against the sketch). (b) `link?:` (§1) must be dropped or
   #1349 pre-empts #451's capability design and forces an isolatedDeclarations-breaking export.

## Open-decision sweep (evaluator-run) — every one forces rework if deferred

1. Field name `contributions?` vs `with?`; `link?` present or absent (F-1).
2. `ServiceClientContext` stays canonical (RFC defaults table + fixture) vs plan's
   `BaseServiceClientContext` + deprecated alias (F-1).
3. `prepare` options are the RFC's five-field snapshot, not the fixture's three-field local model nor
   the plan's undeclared shape (F-2).
4. Public error class + 10-code enum + diagnostic interface: names are RFC-pinned; placement in
   Slice 1 (types) / Slice 3 (throws) must be stated (F-4).
5. Which slice carries the query-surface widening and server-key suffix types (F-4).
6. Whether the generator-side desktop rejection is in this leaf (F-3: it is not; record it).

## Verdict

`FAIL_PLAN` — head `4b520ea44`. The amendment-level reasoning (LD-1, LD-2, LD-5, LD-8, LD-9, the
3-slice shape) is sound and is kept; the failure mode is that the plan treated the amendment's prose
summary as the ground truth instead of the Accepted RFC it references, and the RFC (plus the
committed fixture) contradicts three locked decisions and an entire ceiling. This is a plan-text
revision, not a rescope — cycle 2 can PASS without scope change.

### Required fixes (cycle 2)

- **F-1 (re-baseline LD-3; LD-1/LD-2 unchanged in effect).** Re-derive the public surface from
  `rfcs/0001` §Public contribution contract, §Tuple type algebra, and the compatibility-defaults
  table, cross-checked against `sdk-client-contributions-rfc_type.ts`. Concretely: option field is
  `contributions?` intersected with `ValidateSdkClientContributions<T>` (drop `with?`, drop §1's
  `link?:` escape hatch — same contradiction class as §3); keep `ServiceClientContext` as the live
  default on every widened generic (drop `BaseServiceClientContext` and the deprecation-alias plan);
  descriptor defaults are `TContext extends object = ServiceClientContext` (client) /
  `Record<never, never>` (query surfaces) per the table. Record §1, §2, §7 of "Target contract" as
  superseded rows alongside §3/§5 (five contradictions, not two).
- **F-2 (rewrite LD-6).** Declaration (tuple) order is the composition order; valid contributions
  commute; order determines only deterministic first-failure reporting; the 16-cap is enforced at
  *both* type boundary (named `limit:more-than-16` diagnostic — already modeled in the fixture) and
  construction. No dependency declaration exists in v1: an attempted `dependsOn`/`before`/`after`/
  `priority`/environment field is `SDK_CONTRIBUTION_INVALID` shape rejection, which is how the
  acceptance lines "invalid dependency ordering" and "desktop-incompatible contributions" are
  satisfied.
- **F-3 (rewrite LD-7).** Desktop: `CreateDesktopServiceClientOptions` gains nothing; excess-property
  compile rejection + construction-time `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED` for
  JS/widened `contributions`; cite the committed fixture as the Slice-1 negative proof. State
  explicitly that generator-level rejection is the CLI lane's gate, not this leaf's.
- **F-4 (re-scope Slice 1 ceiling).** Add: `ports/query-factory.ts`, `ports/service-query-utils.ts`,
  `ports/query-key.ts` (`SdkClientServerKeySuffix`, `ActionQueryKey<TSuffix>`),
  `presets/define-services.ts` (`DefineServiceConfig<TContract, TContributions>` + `port`/`timeout`
  deprecation JSDoc), the contribution/error public types (`SdkClientContribution`, protocol,
  prepare/patch/context-declaration/response-cache types, `SdkClientContributionContext`,
  `ValidateSdkClientContributions`, `SdkClientContributionError` + `SdkClientContributionErrorCode`
  + diagnostic). Gate: `deno check --unstable-kv` on the RFC fixture *re-pointed from the local model
  to the public imports* (that migration is the Slice-1 proof), scoped sdk check/lint/fmt/tests,
  `publish:dry-run`, `arch:check`, `quality:scan`, `deno doc --lint`.
- **F-5 (finish slices 2–3 definitions).** Slice 2: RFC-named files `adapter-ports.ts`,
  `prepared-call.ts`, `stable-v1-adapter.ts`; three ports semantics; direct
  `PreparedSdkClientCall` channel (optional package-private `unique symbol` realization per RFC);
  byte-identical omission; unary prepare-once conformance (`context.retry: 1`, count 1,
  byte-equivalence) and reconnect epoch fixture (A→B, count 2, abort starts no epoch). Gate: adapter
  absence set — `deno doc --json` on root/`./client`/`./ports`/`./desktop`, packed-consumer negative
  import fixture rejecting the three specifiers, scoped zero-oRPC identity scan with non-growing
  allowlist. Slice 3: error taxonomy throws + reserved-context/header rejection, forbidden-header list
  (audited Fetch snapshot + prefix rules), cache modes incl. server five-tuple/TanStack suffix,
  `createServiceQueryUtils` recursive wrapper, direct-only runtime omission, partition-cache
  non-observation conformance test.
- **F-6 (risk register + gates).** Add: deep-recursion vs isolatedDeclarations (mitigation: RFC tail
  recursion + named conflict markers, fixture-verified cost); 15-surface generic widening breaking
  consumer/doc snippets (mitigation: RFC compatibility-default fixtures); D-1 kept.
- **F-7 (docs assignment).** Allocate the issue's Docs/consumer proof to a slice: README export table
  lists the *contribution* surface (not a transport seam — the amendment supersedes that clause too);
  delete the "escape hatch = fork the link" paragraph honestly (do not replace it with a lie about an
  exported link seam); worked example compiles under the docs gate; the consumer-proof test asserts
  header-added **and** client-span-still-emitted in one test (needs Slice 2 composition — state that).
  Re LD-1's doc-comment choice: leaving `ports/mod.ts:7` advertising "the transport seam" while the
  RFC's own doc-implications section owns port API docs — fix the sentence as owned docs work **or**
  file an explicit debt entry; "leave it silently" is the one option doctrine does not offer.
- **F-8 (run hygiene, supervisor-facing).** The run dir has no `supervisor.md` and no `worklog.md`
  Design section — required run-start artifacts for a critical/complex run; create them alongside the
  cycle-2 revision.

## Notes

- The 2026-08-08 issue comment ("final reconciliation … prepared-header channel … absence gates …
  type/runtime/generator rejection") is *earlier* than the 2026-08-13 amendment and does not itself
  bind; every load-bearing item in it is independently ratified by the amendment or RFC body, so
  fixes above anchor to the RFC and acceptance text, not the comment. No finding rests on the comment
  having been ignored.
- D-1 (`run-gate.ts` cached zero-byte receipts certifying nothing): accepted as a real tooling
  caveat; verify `stdout.bytes` and re-run the wrapper directly.
- Two-cycle limit noted; this is cycle 1. Expected cycle-2 diff is plan-text only: F-1..F-3 rewrite
  three LDs, F-4/F-5 repair ceilings and gates, F-6/F-7 add register/docs. No scope movement against
  #1350/#1351/#1352/#1353/#451 was found.
