# PLAN-EVAL — docs-rfc-sdk-client-contribution--rfc (RFC-A, PR #1390)

| Field | Value |
| --- | --- |
| Verdict | **FAIL_PLAN** (PR-comment vocabulary: CHANGES_REQUESTED) — cycle 1 of 2 |
| Evaluator | Claude Fable 5 · high — owner-designated cross-family PLAN-EVAL authority (in-turn owner directive, 2026-08-08), separate session/family from the generator (Codex GPT-5.6 Sol xhigh, thread `019fe242-2bd9-7ff3-8044-bd9d09585397`) |
| Route override | The lane-policy Minimax-over-OpenRouter route is superseded by explicit owner direction: this Fable session evaluates; OpenRouter/OpenHands/Qwen prohibited here; the root orchestrator owns a later Qwen 3.8 Max adversarial pass |
| Evaluated | RFC `rfcs/0000-sdk-client-contributions.md` @ `7a0d39808` (branch HEAD `7be129d80`), run artifacts, PR #1390 body+comments, live board (#1348–#1353, #451, #928, #934, #1093), worktree source at baseline `fac9e339042c` |
| Delegations | Workflow `wf_b3416478-edf` (script committed pre-execution on the seed-run branch): `dd:orpc-v2-audit` + `dd:rfc-a-types`, both Opus 5 · xhigh, read-only/return-only; evidence synthesized and adopted by this evaluator after review |

## Plan-gate checklist walk

| Box | Status | Evidence |
| --- | --- | --- |
| Research present and current | ✓ | `research.md` re-baselines the 755-line carried proposal against `fac9e339042c`, live board, locked oRPC 1.14.6, and primary upstream sources; spot-checks below confirmed its load-bearing findings (closed 9-field options, unused `port`/`timeout`, v2 status) |
| Decisions locked | ✓ | 20-row locked-decision table (`plan.md`), each with rationale; proposal-challenge record adjudicates every carried-in choice |
| Open-decision sweep | **✗** | The RFC's 11 FCP questions are individually safe, but the evaluator sweep found **six open decisions the plan did not flag** that force rework if deferred (Findings 1–6). Per the gate: automatic unchecked box |
| Commit slices | ✓ | Docs-run slices S1–S3 executed and evidenced; implementation staged in 8 ordered stages with owners and exit conditions |
| Risk register | ✓ | Present with mitigations; drift-watch list is strong |
| Gate set selected | **✗** | The zero-oRPC-symbol gate is **unpassable as written** (Finding 1); the private-port claim has no asserting gate (Finding 6) |
| Deferred scope explicit | ✓ | Non-goals + separate v2 RFC boundary are exemplary |
| jsr-audit | ✓ | Four-package baseline audit + publish-consequence table present; baselines recorded, not waived |

## Verdict: FAIL_PLAN — findings (severity-ranked)

**None of the following overturns the RFC's core thesis.** Headers + typed per-call context, the
three private ports, prepare-once above retry, partition/direct-only cache law, auth+locale
dogfoods, upstream-major neutrality, and stay-on-stable-v1 are all **verified sound** — including
by execution against the locked family. The failures are completeness failures at the gate bar.

### F-A1 (critical) — The zero-oRPC-symbol gate fails on unchanged code; scope it

RFC "Conformance and fitness gates" (type gates, last bullet) and the publish gate apply a
zero-oRPC-symbol scan to public/generated declarations including `contracts`. Executed evidence:
`deno doc --json packages/sdk/src/ports/mod.ts` contains `~orpc` ×2 — `ContractProcedureLike`
(`ports/service-client.ts:78-86`) requires the literal `'~orpc'` metadata-accessor property, and
`ContractLike` is the bound on `CreateServiceClientOptions<TContract>` — the exact type RFC-A
extends. Doctrine `02-public-surface.md:218-240` further *sanctions* raw `@orpc/contract` builder
types in `packages/contracts` (`BaseContract = ReturnType<typeof oc.errors>`,
`BaseContractRoute = ContractProcedureBuilderWithInputOutput<…>`).
**Repair:** scope the gate normatively — it binds (a) the new RFC-A protocol/descriptor/context
types and (b) generated client declarations; pre-existing `ContractLike`/contracts leakage is
named existing debt owned by #1350/#1278, with the gate's allowlist referencing those issues.
Without this the first implementation PR either fails its own gate or silently waives it.

### F-A2 (critical) — Server query-key algebra: the partition suffix changes public exported types the RFC never names

The RFC specifies the suffix only for TanStack full keys. The server path has a **fixed public
3-tuple**: `createActionQueryKey(): readonly [string, string, string]`
(`ports/query-key.ts:36-42`), `ActionMethod.key: (props) => readonly [string, TAction, string]`
(`ports/query-factory.ts:57-59`), plus `CacheKey = Deno.KvKey` (`ports/cache-store.ts:24`),
`key-bridge.ts`, `kv-cache-persister.ts`, and `collections/create-query-collection.ts` — none
mentioned. Also: TanStack key injection is not free — `optionsIn.queryKey` must be precomputed
per procedure × option-kind × nesting level, replacing today's zero-cost cast
(`create-service-query-utils.ts:57-63`), and the checked-in fixture
`tests/type-fixtures/service-query-utils-upstream_type.ts:39-40` pins upstream assignability that
a context-generic `ServiceQueryUtils` breaks.
**Repair:** add a normative "server key algebra" subsection deciding the suffix's type-level shape
on the 3-tuple surfaces (or explicitly widening them with compatibility defaults), enumerate the
six touched surfaces, acknowledge the wrap cost, and disposition the upstream-assignability
fixture. Deferring this reworks Stage 2.

### F-A3 (major) — The additive-compatibility claim is contradicted by the type sketches

`ServiceClientMethod<TInput, TOutput, TContext>` and `ServiceClientShape<TContract, TContext>`
are shown without context defaults yet are public exports (`client/mod.ts:16-33`,
`ports/mod.ts:65-83`); `ServiceQueryClientContext = Record<never, never>` is public too. As
written this is a breaking public type change, contradicting "additive for consumers that do not
opt in". **Repair:** state compatibility defaults (`TContext extends object =
ServiceClientContext` / `Record<never, never>` as appropriate) on every widened public generic.

### F-A4 (major, security) — Streaming reconnect under prepare-once: frozen credential

Verified on the locked family: the v1 retry plugin re-enters `next({error})` from inside
async-iterator consumption (`@orpc/client@1.14.6` `plugins/index.mjs:337-360`) — after the
logical call has returned. Under prepare-once, a long-lived SSE/stream procedure reconnects
indefinitely with the original prepared credential. The mandatory fixture only forces "at least
one retry". **Repair:** an explicit rule — e.g. streaming procedures with a credential-bearing
contribution are reconnect-bounded, reconnect constitutes a new logical call (re-prepare), or
streaming is `direct-only`/no-retry in v1 — plus a fixture covering iterator-phase reconnect.
This lands directly on the auth dogfood.

### F-A5 (major) — Desktop transport bypass unaddressed

`@netscript/sdk/desktop` (`desktop-rpc-client.ts:1-32`) constructs a second `createORPCClient`
over a MessagePort link; contributions attached via `createServiceClient` never apply. A desktop
webview calling the same contract silently sends no bearer. **Repair:** scope the desktop link
in, out, or explicitly rejected-with-consequence; if out, the auth-core docs must state the
boundary.

### F-A6 (major) — Private-port location and absence gate

`src/ports/` is the **public** `@netscript/sdk/ports` barrel; the RFC never states where the
three private ports live, and no conformance gate asserts their absence from `deno doc` despite
the normative MUST-NOT-appear claim. **Repair:** name the private location (e.g. `src/internal/`)
and add the absence assertion to the adapter-compatibility gates.

### F-A7 (medium) — `ServiceClientContext` retry fields are upstream-shaped and contribution-visible

`retry|retryDelay|shouldRetry|onRetry` are a hand-copy of `ClientRetryPluginContext`
(intersected at `http-client-link.ts:27`); their semantics are the upstream plugin's, and
`SdkClientPrepareOptions.context` exposes them to every contribution — making the public protocol
upstream-*coupled* while upstream-type-*free*. Related mechanics the RFC must state: retry is off
by default (`{default:{retry:0}}`), so the forced-retry fixture must drive `context.retry`; and
the dedupe plugin replaces downstream context (`plugins/index.mjs:236-248`) so the
"same immutable snapshot on every attempt" gate wording collides with an existing context-swap
path (signal/cache read from the replaced context). **Repair:** either define NetScript-owned
semantics for the retry fields or exclude them from the contribution-visible context projection;
reword the snapshot gate to the contributor-header/context projection it actually governs; state
the prepared-header channel (private context symbol vs wrapper) explicitly.

### F-A8 (medium) — v2-audit amendment corrections (adopt into the RFC + v2 gate list)

The amendment's status facts are **verified accurate** (v1.15.0 stable, `2.0.0-beta.26`
pre-release, `middleapi/orpc` is the correct repo — the charter's `dinwwwh` is stale), and
`RequestHeadersHandlerPlugin` is correctly treated as an incoming-server companion (confirmed in
shipped v2 types: `reqHeaders?: Headers | undefined`, handler plugin, not a client seam). Four
corrections: (a) **GET direction is inverted** — GET inference is enabled *today*
(`http-client-link.ts:82`); v2 *rejects* GET by default (`allowMethods` defaults to
POST/PUT/PATCH/DELETE, verified in shipped beta.26 source). Rewrite the boundary and Q10 as
keep-GET (server `allowMethods` + Sec-Fetch-Mode CSRF story) vs accept-losing-GET. (b) v2 removes
`inferRPCMethodFromContractRouter` (absent from all three beta.26 packages) — the exact symbol at
`http-client-link.ts:17`; add re-implementation to the v2 gate list. (c) The GET-only dedupe
filter (`http-client-link.ts:109`) becomes a silent no-op if v2 lands without GET — add a
dedupe-effectiveness gate. (d) `@orpc/opentelemetry` already ships on the v1 line (1.14.11+, not
deprecated) — the package-rename decision belongs to #1351, only span-topology/double-span proof
is v2-scoped. Also state that only `deno.lock` pins the family (all manifests are `^1.14.6`) —
name lock-only pinning as the gate for the "separate v1.15.0 decision" or require exact pins.

### F-A9 (minor) — Inference-budget evidence is not reproducible in-tree

The probe is gitignored and excluded from the repo checker, and it models a stripped
`ServiceClientContext`, not the real `ContractLike`/`defineServices`/`ServiceQueryUtils` algebra.
**Repair:** commit the type fixture in-tree (tests/type-fixtures) modeling the real surfaces
before the 16-budget is ratified; keep the numbers informational.

### F-A10 (minor, adopt-as-strengthening)

Prepare-once per-attempt behavior is now **verified on locked v1.14.6** (headers resolve in
`encode`, retry re-enters upstream of it) — upgrade the RFC's "must be tested rather than
assumed" to cited fact. Dedupe is header-safe (key includes headers) — state it. Stage-0
reconciliation of #1350's live scope (its filed title is the `safe()` repair; RFC Stage 1 adds
metadata initialization) is already planned — keep it explicit. `input: unknown` reaching
third-party `prepare` deserves one privacy sentence. v1.15.0 shipped hours *after* beta.26 —
v1 is actively maintained; this strengthens the stay-on-v1 decision.

## FCP-question adjudication

Q1–Q4, Q7–Q9, Q11: safe to defer (policy/naming/sequencing; no rework risk). Q5 (wrapper vs
memo): safe **only after** F-A7's context-channel statement lands — both realizations then remain
fixture-provable. Q6 (metadata placement): safe; the vocabulary itself is normative either way.
Q10: must be **rewritten** per F-A8(a) before FCP — as posed it gates the wrong direction.

## Required for PASS (cycle 2)

Amend the RFC to resolve F-A1–F-A6 and F-A8(a); fold F-A7's statements and F-A8(b–d) into the
gate lists; F-A9/F-A10 may land as part of the same edit or as recorded stage conditions. No
structural redesign is requested; every repair is a scoped amendment to an RFC whose core law
survived adversarial verification.
