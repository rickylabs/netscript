# prior:1390-sdk — RFC-A "Typed SDK client contributions" (PR #1390 / issue #1348)

Stage-B discovery corpus. Baseline of this run: `main` @ `2256a67bf` in
`/home/codex/repos/ns-rfc-devtools-contribution`. RFC text read at branch
`docs/rfc-sdk-client-contribution` HEAD `14b5c858c` in worktree `/home/codex/repos/ns-rfc-sdk-client`
(same as PR #1390 `headRefOid`, verified below). Saved artifacts under
`.llm/runs/plan-devtools-contribution--seed/research/sources/`.

Line citations of the form `rfc:NNN-MMM` refer to
`/home/codex/repos/ns-rfc-sdk-client/rfcs/0000-sdk-client-contributions.md` at `14b5c858c`, a byte
copy of which is saved at
`.llm/runs/plan-devtools-contribution--seed/research/sources/rfc-a-sdk-client-contributions@14b5c858c.md`.

## Summary

RFC-A is **not** a general "SDK extension mechanism". It is a deliberately narrow, versioned,
outbound **request-header preparation** axis for `@netscript/sdk`'s HTTP client, plus the type
plumbing needed to keep the contributed per-call context alive through `defineServices()`, the
server query factories, and the TanStack Query utils (rfc:15-24, rfc:706-720). A contribution is a
literal descriptor `{ protocol, id, context, headerKeys, responseCache, prepare }` (rfc:466-486);
the composed client's per-call `context` type is the intersection of the declared contexts of a
literal `as const` tuple passed as `contributions:` to `createServiceClient` /
`defineServices` (rfc:237-256, rfc:258-276). The SDK keeps exclusive ownership of discovery, method
inference, codec, `fetch`, retry, dedupe, cancellation, tracing and dispatch; the descriptor has
**no** `fetch`, `link`, `plugins`, `interceptors` or error-map fields (rfc:954-968). Auth is *not*
framework-resolved: a bearer contribution simply declares `context: { auth: 'required' }` and the
**caller** passes a token-getter and a non-secret `cachePartition` per call (rfc:178-206). Client
construction is environment-neutral — universal modules may not read `Deno.env`, `window`,
localStorage or cookies; env-reading factories must live behind explicit `.../sdk/server` or
`.../sdk/browser` exports (rfc:321-324), and the maintainer disposition keeps such a helper out of
the first slice entirely (sources/pr-1390-fcp-comment.md, disposition 2).

Status: the RFC is **accepted-in-principle but not merged and not numbered**. PR #1390 is still
`DRAFT`/`OPEN` with label `status:review` (`gh pr view 1390`), Fable-5 PLAN-EVAL cycle 2 returned
PASS/APPROVED (sources/rfc-a-plan-eval.md:3), a Qwen adversarial pass returned `PASS_ACCEPT`, and a
formal FCP with disposition **accept** runs to **2026-08-15 22:00 Europe/Zurich**
(sources/pr-1390-fcp-comment.md). Today is 2026-08-11, so the FCP window is open. Nothing of RFC-A
exists in code at the DevTools baseline: `rfcs/` on `main` contains only `0000-template.md` and
`README.md`, and `rg 'SdkClientContribution|contributions' packages/sdk/src` returns 0 matches.

For a DevTools RFC the load-bearing consequences are: (a) there is a ratified-in-FCP vocabulary
(`protocol {family, major}`, namespaced `id`, duplicate rejection, explicit static selection) that a
DevTools contribution axis should mirror rather than reinvent (rfc:1179-1187); (b) RFC-A does **not**
give a plugin-authored panel any way to *obtain* a client — a client only exists where the host app
or a generator writes a literal `defineServices` call and supplies context per call; (c) RFC-A is
HTTP-only and explicitly rejects contributions on the Desktop MessagePort link (rfc:983-998), so any
DevTools transport that is not HTTP-with-headers is outside it; (d) hard-depending on RFC-A means
depending on an unmerged RFC whose implementation children #1349–#1353 are all OPEN on milestone
`0.0.7`, behind a lock-only oRPC v1.15.0 family move (disposition 8).

## Findings

### F1 — PR #1390 is an unmerged draft; the RFC file exists only on its branch

`gh pr view 1390 --json isDraft,state,headRefName,headRefOid,mergeable` →
`{"headRefName":"docs/rfc-sdk-client-contribution","headRefOid":"14b5c858c...","isDraft":true,
"mergeable":"MERGEABLE","state":"OPEN"}`. Labels include `rfc`, `status:review`, `type:docs`,
`type:test`, `area:sdk`, `area:plugins`, `priority:p1` (sources/pr-1390-body.txt). At the DevTools
baseline, `ls rfcs` in `/home/codex/repos/ns-rfc-devtools-contribution` returns only
`0000-template.md` and `README.md` — the RFC is not on `main`. Kind: **observed**.

### F2 — Zero RFC-A code exists at baseline

`rtk grep -n "SdkClientContribution|contributions" packages/sdk/src` → `0 matches` in
`/home/codex/repos/ns-rfc-devtools-contribution`. Kind: **observed**.

### F3 — As-is baseline: the SDK client options record is closed and context is a fixed interface

`packages/sdk/src/ports/service-client.ts:203-222` defines `CreateServiceClientOptions` with exactly
nine fields (`contract`, `serviceName`, `routerName`, `protocol`, `apiPath`, `apiVersion`, `port`,
`timeout`, `propagateTraceContext`); `port` and `timeout` are documented "Reserved …" and
`packages/sdk/src/client/service-client.ts:44-51` never destructures them.
`packages/sdk/src/ports/service-client.ts:129-155` defines `ServiceClientContext` as a concrete
interface with only transport knobs (`signal`, `cache`, `retry`, `retryDelay`, `shouldRetry`,
`onRetry`, `traceHeaders`), and `:160-171` types `ServiceRequestOptions { context?:
ServiceClientContext }` / `ServiceClientMethod<TInput,TOutput>` with **no** context generic.
`deno doc packages/sdk/src/ports/mod.ts` (run from `/home/codex/repos/ns-rfc-devtools-contribution/packages/sdk`)
confirms the public surface: `type ServiceClientMethod<TInput, TOutput> = (input, options?:
ServiceRequestOptions) => Promise<TOutput>`, `type CacheKey = Deno.KvKey`,
`function createActionQueryKey(resource, action, input): readonly [string, string, string]`.
Kind: **observed**.

### F4 — The proposed chain, precisely

Public normative shape (rfc:399-486):

```ts
type SdkClientContributionId = `${string}:${string}`;
interface SdkClientContributionProtocol { family: 'netscript.sdk-client'; major: 1 }
interface SdkClientProcedureDescriptor { path: readonly string[]; meta: NetScriptProcedureMeta }
interface SdkClientTransportDescriptor { kind: 'http'; origin: URL; rpcPath: string; secure: boolean }
interface SdkClientPrepareOptions<TContext> { context; signal?; procedure; transport; input: unknown }
interface SdkClientRequestPatch { headers?: Readonly<Record<string,string>> }
type SdkClientResponseCache<T> = {mode:'invariant'} | {mode:'partitioned'; partition(o):string} | {mode:'direct-only'}
interface SdkClientContribution<TId, TContext, TContextDeclaration, THeaderKeys> {
  protocol; id; context; headerKeys; responseCache;
  prepare(o: SdkClientPrepareOptions<TContext>): SdkClientRequestPatch | PromiseLike<…>;
}
```

Authored through a curried helper `defineSdkClientContribution<TContext>()(descriptor)` that pins
literals and statically checks context/header declarations (rfc:154-176, rfc:558-572).
Kind: **observed** (RFC text; not implemented).

- **Client construction**: `contributions: [a, b] as const` on `createServiceClient` /
  `defineServices` (rfc:237-256, rfc:258-268). Omitting it is byte-identical to today
  (rfc:1215-1222).
- **Credentials**: not resolved by the framework. `createBearerSdkClientContribution` takes a
  caller-supplied `resolveCredential` and adds the `Bearer` scheme itself; it owns exactly the
  `authorization` header, defaults `unmarked: 'none'` and `allowInsecureTransport: false`
  (rfc:576-604).
- **Transport**: contributions never touch it. Three package-private ports under
  `packages/sdk/src/internal/client-contributions/` — `PreparedOutboundHeadersPort`,
  `ProcedureMetadataPort`, `ClientTransportPolicyPort` — with no `mod.ts` and absent from
  `packages/sdk/deno.json` exports (rfc:488-546).
- **Policy metadata**: `@netscript/contracts` gains
  `NetScriptProcedureMeta { access?: { authentication?: 'none'|'optional'|'required' } }`, set with
  `baseContract.meta({...})` and surfaced to contributions as
  `SdkClientProcedureDescriptor.meta` (rfc:340-398, rfc:208-226). The RFC states explicitly that
  client metadata does not enforce server authorization (rfc:228-230).
- **Query invalidation / cache**: each contribution declares one of `invariant` /
  `partitioned` / `direct-only` (rfc:737-745). `partitioned` appends a canonical
  contribution-id-sorted suffix to **full** keys only; prefix invalidation and
  `query-client/key-bridge.ts` are unchanged (rfc:280-303, rfc:757-800, rfc:812-820). `direct-only`
  services are omitted from both `queries` and `queryUtils` at compile time and runtime
  (rfc:300-303, rfc:743-745).

### F5 — Composition law: order-independent, duplicate-rejecting, prepare-once-per-epoch

Construction validates protocol/id grammar/limits, rejects contribution ownership of the seven
reserved framework context keys (`signal`, `cache`, `retry`, `retryDelay`, `shouldRetry`, `onRetry`,
`traceHeaders`), canonicalizes headers to lower case, reserves framework + Fetch-forbidden headers,
and rejects duplicate ids/context keys/header keys (rfc:830-846, rfc:478-486, rfc:865-886).
Contributors never see accumulated headers, so valid contributions commute (rfc:857-862). Version 1
has no `before`/`after`/`requires`/`priority`/`order` field (rfc:861-862). Budgets: ≤16 contributions
per service, ≤8 context keys and ≤16 header keys per contribution, ids ≤128 ASCII, partitions ≤64
printable ASCII (rfc:1190-1198). `prepare` runs exactly once per **logical call epoch** — unary
retries replay the same immutable prepared record; an iterator-phase stream reconnect starts a new
epoch and re-resolves credentials (rfc:305-320, rfc:888-900). Kind: **observed** (RFC text).

### F6 — Failure model is a single package-owned error class, aggressively redacted

Ten stable codes (`SDK_CONTRIBUTION_INVALID|VERSION|CONFLICT|LIMIT|RUNTIME`, `SDK_CONTEXT_MISSING`,
`SDK_HEADER_INVALID`, `SDK_CACHE_PARTITION_INVALID`, `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED`,
`SDK_PREPARATION_FAILED`) on `SdkClientContributionError` with `phase:
'construction'|'partition'|'preparation'` (rfc:1036-1066). Allowed diagnostics are only code, phase,
contribution id, procedure path, declared header name, service name, duration; header values, input,
context, credentials and source error causes MUST NOT be recorded, and **debug mode does not relax
this list** (rfc:1091-1103). `prepare` receives raw `input: unknown` as sensitive borrowed data that
may not be logged, hashed for telemetry, or used as a partition (rfc:1105-1110). Kind: **observed**.

### F7 — Plugin discovery is a static module reference, never an activation

`@netscript/plugin/config` gains
`SdkClientContributionReference { protocol; id; module; export; targets: ('browser'|'server')[] }`
under a new optional `PluginContributions.sdkClients` group (rfc:1136-1156). At baseline,
`packages/plugin/src/config/domain/plugin-contributions.ts:11-39` has twelve groups and none is
client-side; `:14-17` is a closed literal `doctorChecks?: readonly 'auth-backend'[]`. The reference
"does not contain a serialized function and does not automatically activate it" (rfc:1158-1159);
"No runtime scans installed packages, filesystem manifests, globals, or environment variables"
(rfc:1176). Generated code emits **static imports and explicit literal `as const` tuples**
(rfc:1161-1174). Generic collection of these references is delegated to #1093 (rfc:1155-1157).
Kind: **observed**.

### F8 — End-to-end path for "a plugin-contributed panel gets a typed client": RFC-A does not close it

Traced from the RFC: (1) the plugin package exports a contribution descriptor from a named module
export and declares it in its manifest as an `SdkClientContributionReference` (rfc:1136-1156);
(2) plugin discovery (#1093, not RFC-A) collects references (rfc:1155-1157); (3) a **generator or
the application author** writes a literal `defineServices({ accounts: { contract, contributions:
[bearerContribution, localeContribution] as const } })` (rfc:1161-1174); (4) **call sites** pass the
composed context object per call — `services.clients.accounts.profile({}, { context })` or
`services.queryUtils.accounts.profile.queryOptions({ input, context })` (rfc:276-296).
The chain therefore terminates at a *statically generated services map plus a caller-supplied
context object*. There is no registry, no locator, no `useClient()`, and no ambient/global client.
A panel shipped by a plugin can only receive a client (or a context) that the host passes to it
through some **other** contract — which RFC-A does not define. This is the single most important
consumption fact for a DevTools RFC. Kind: **inference**, inferred from rfc:1158-1176 (explicit "no
runtime scans", "installation makes a contribution available; a scaffold/app selection attaches it
to a named service") plus the absence of any locator surface in the normative type list
(rfc:399-486) and zero occurrences of "devtool" in the RFC (`grep -i devtool rfcs/0000-…md` → no
matches).

### F9 — Auth/principal propagation: no `Principal` type crosses the seam

The contributed context carries a caller-owned object (e.g.
`auth: { getAccessToken(): Promise<string|undefined>; cachePartition: string }`, rfc:184-193). The
partition MUST be a "random session/principal epoch or another non-secret identifier" and MUST NOT
be the access token, refresh token, session id, email, or a reversible encoding (rfc:201-206).
Partition values are "intentionally visible in query keys and developer tools" and the docs MUST say
so (rfc:1117-1119) — a direct DevTools-relevant statement. Tenancy/`Principal` typing is explicitly
deferred to #884 (issue #1348 "Boundaries"). The bearer factory must refuse cleartext non-local
origins unless `allowInsecureTransport: true`, never attach credentials across a cross-origin
redirect, and cookie auth is explicitly *not* implemented via a `cookie` header — `cookie` is a
Fetch-forbidden name (rfc:1121-1133, rfc:872-878). Kind: **observed**.

### F10 — Server-side vs client-side construction

Universal contribution modules "do not read `Deno.env`, `window`, local storage, or cookies. The
framework does not guess the runtime from globals"; env-reading convenience factories, if shipped,
must live under explicit `.../sdk/server` or `.../sdk/browser` exports (rfc:321-324). The manifest
reference carries `targets: readonly ('browser'|'server')[]` and generators must filter by target
and **fail generation** rather than silently omit an incompatible one (rfc:1147, rfc:1172-1174).
Maintainer disposition 2: keep the env-reading bearer helper as an *application example* in the
first slice (sources/pr-1390-fcp-comment.md). An optional incoming **server** companion
(v1 request-header handler / v2 `RequestHeadersHandlerPlugin`) is discussed and explicitly is *not*
the RFC-A seam; whether a preset installs it is deferred, and disposition 7 rules it must be
explicitly selected, not preset-global (rfc:1004-1022, sources/pr-1390-fcp-comment.md).
Kind: **observed**.

### F11 — Desktop / MessagePort is a hard exclusion

`@netscript/sdk/desktop` uses an oRPC MessagePort link with no HTTP header channel.
`CreateDesktopServiceClientOptions` does **not** gain `contributions`; both the excess-property check
and runtime construction MUST reject it with `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED`; `targets`
excludes desktop; generators fail. A future MessagePort contribution seam "requires a separate RFC
and cannot reuse `headerKeys` as if MessagePort had headers" (rfc:983-998, rfc:1081). Kind:
**observed**.

### F12 — Status, blockers, and the sequencing chain

- PLAN-EVAL cycle 1 = `FAIL_PLAN / CHANGES_REQUESTED` (F-A1…F-A10); cycle 2 = **PASS / APPROVED**
  at content SHA `78a7cecd1` (sources/rfc-a-plan-eval.md:3-5, :43-46).
- Qwen 3.8 Max adversarial final = `PASS_ACCEPT`; cross-RFC composition with RFC-B = PASS
  (sources/pr-1390-fcp-comment.md).
- FCP disposition **accept**, objection deadline **2026-08-15 22:00 Europe/Zurich**; on expiry the
  maintainer assigns number **0001**, marks ready, merges. #1348 stays open for implementation
  (sources/pr-1390-fcp-comment.md).
- `gh issue view 1348` → OPEN, milestone `0.0.6`, `status:review`. RFC frontmatter
  `target-milestone: 0.0.7`, and the FCP comment ratifies that `target-milestone` means the first
  *implementation* milestone.
- All five implementation children are OPEN on milestone `0.0.7`
  (`gh issue view 1349..1353 --json number,state,milestone`): #1349 client seam, #1350 `safe()`
  error repair, #1351 transport/method consolidation, #1352 auth dogfood, #1353 trace ownership.
- Disposition 8 inserts a prerequisite: move the exact oRPC family to **stable v1.15.0 under #1351
  before** the client-seam implementation, lock-only, proving a single-family lock
  (sources/pr-1390-fcp-comment.md). Disposition 6 defers procedure metadata to a **new dependent
  child not yet filed**. Kind: **observed**.

### F13 — Sequencing risk for a DevTools RFC, characterized

A DevTools RFC that hard-depends on `SdkClientContribution` inherits a four-link chain, none of which
is code today: FCP close + merge/numbering (earliest 2026-08-15) → #1350 Stage-1a error repair →
an *unfiled* metadata child (disposition 6) → #1351 stable-v1.15.0 family move (disposition 8) →
#1349 client seam → #1352 auth dogfood. Milestone for all of them is `0.0.7`, one milestone beyond
#1348's own `0.0.6`. Risk classes: (i) **shape risk** is low — the text is FCP-accepted and
disposition 4 preserves the public names for v1; (ii) **availability risk** is high — no symbol
exists to import, so a DevTools RFC cannot cite a `deno doc` surface for it; (iii) **ordering risk**
— any DevTools deliverable that needs a *credential-bearing* typed client cannot ship before #1352.
Mitigation shape available from RFC-A's own precedent: depend only on the *vocabulary*
(`protocol {family, major}`, namespaced `id`, duplicate rejection, static module reference +
explicit selection) which the RFC already declares shared with #928 (rfc:1179-1187), and treat
credentialed data access as a later stage. Kind: **inference**, from F12 evidence.

### F14 — What DevTools needs that RFC-A does not provide

Each row is grounded in the RFC's own explicit statement of scope.

| DevTools need | RFC-A position | Citation |
| --- | --- | --- |
| A panel obtains a client for *its own* plugin's service without the host app hand-writing it | Not provided. Selection is explicit and static; installation only makes a contribution *available* | rfc:1158-1176 |
| Any runtime registry / locator / ambient client | Explicitly rejected ("Rejected: fluent client builder or global registry") | rfc:1501-1506 |
| Non-HTTP transport (MessagePort, WS, in-process) | HTTP-only; Desktop MessagePort rejection is normative; in-process link is #451 | rfc:983-998, rfc:110-113 |
| Server-push / subscription channel for live panels | Streams are transport-owned; contributions only prepare headers per epoch | rfc:954-968, rfc:888-900 |
| Response/body observation (what a network panel wants) | Descriptor has no response hook; only `SdkClientRequestPatch { headers }` | rfc:436-438, rfc:962-966 |
| Telemetry/diagnostic access to header values, input, context | Forbidden even in debug mode | rfc:1091-1110 |
| A typed `Principal` propagated to a panel | Out of scope; deferred to #884 | issue #1348 "Boundaries" |
| Arbitrary query defaults, invalidation callbacks, stale times for a panel's data layer | Explicitly rejected; only `invariant`/`partitioned`/`direct-only` | rfc:822-824, rfc:1489-1494 |
| Cache introspection safe across principals | Partition suffix appended to full keys only; prefixes unsuffixed; partitions deliberately visible in devtools | rfc:812-820, rfc:1117-1119 |
| A UI/panel contribution envelope | Out of scope by construction — "UI contributions and SDK request contributions are separate named extension axes, not one universal envelope" (#928 owns UI) | rfc:1179-1187 |

Kind: **observed** for each RFC-side position; the "need" column is the DevTools framing, not an
RFC claim.

## Contracts

Types a DevTools RFC would consume or align with. **None of these exist in code**; all are RFC-A
proposals except where marked baseline.

| Name | Shape | Status | Evidence |
| --- | --- | --- | --- |
| `SdkClientContribution` | `{ protocol; id: \`${string}:${string}\`; context: Decl<TContext>; headerKeys: readonly string[]; responseCache; prepare(o) => Patch \| PromiseLike<Patch> }` | proposed | rfc:466-486 |
| `SdkClientContributionProtocol` | `{ family: 'netscript.sdk-client'; major: 1 }` | proposed; the `(family, major)` idiom is declared shared with #928 | rfc:405-408, rfc:1179-1183 |
| `SdkClientPrepareOptions<T>` | `{ context: Readonly<T>; signal?; procedure: SdkClientProcedureDescriptor; transport: SdkClientTransportDescriptor; input: unknown }` | proposed | rfc:420-430 |
| `SdkClientResponseCache<T>` | `{mode:'invariant'} \| {mode:'partitioned'; partition(o): string} \| {mode:'direct-only'}` | proposed | rfc:450-460 |
| `NetScriptProcedureMeta` | `{ access?: { authentication?: 'none'\|'optional'\|'required' } }` on `@netscript/contracts` | proposed; owner deferred to a not-yet-filed child | rfc:340-352, FCP disposition 6 |
| `SdkClientContributionReference` | `{ protocol; id; module: string; export: string; targets: readonly ('browser'\|'server')[] }` under `PluginContributions.sdkClients?` | proposed | rfc:1136-1156 |
| `PluginContributions` | 12 existing groups, none client-side; `cli.doctorChecks?: readonly 'auth-backend'[]` closed literal | **baseline** | `packages/plugin/src/config/domain/plugin-contributions.ts:11-39` |
| `CreateServiceClientOptions<TContract>` | closed 9-field record; `port`/`timeout` accepted and unused | **baseline** | `packages/sdk/src/ports/service-client.ts:203-222`; `packages/sdk/src/client/service-client.ts:44-51` |
| `ServiceClientContext` | fixed interface: `signal, cache, retry, retryDelay, shouldRetry, onRetry, traceHeaders` — all reserved to transport under RFC-A | **baseline** | `packages/sdk/src/ports/service-client.ts:129-155`; reservation rfc:478-486 |
| `ServiceClientMethod<TInput,TOutput>` | `(input, options?: ServiceRequestOptions) => Promise<TOutput>` — no context generic | **baseline** (`deno doc packages/sdk/src/ports/mod.ts`) | `packages/sdk/src/ports/service-client.ts:160-171` |
| `createActionQueryKey` | baseline `(resource, action, input) => readonly [string,string,string]`; RFC-A adds a defaulted `TSuffix` so the default stays the exact 3-tuple | baseline + proposed | `deno doc packages/sdk/src/ports/mod.ts` line 16; rfc:759-782 |
| `SdkClientContributionError` / `…ErrorCode` | 10 codes, `phase: 'construction'\|'partition'\|'preparation'`, `toJSON(): Diagnostic` | proposed | rfc:1036-1066 |
| Internal adapter ports | `PreparedOutboundHeadersPort`, `ProcedureMetadataPort`, `ClientTransportPolicyPort` under `packages/sdk/src/internal/client-contributions/`, no barrel, not exported | proposed, **package-private by construction** | rfc:488-546 |

## Drift candidates

1. **`target-milestone` / tracking-issue milestone mismatch.** RFC frontmatter says
   `target-milestone: 0.0.7` (rfc:1-9) while #1348 carries milestone `0.0.6`
   (`gh issue view 1348`). The FCP comment resolves the *convention* ("target-milestone will
   consistently mean the first implementation milestone") but the board field itself was not
   changed at time of reading. Severity: **minor**.
2. **RFC file is still numbered `0000`.** `rfcs/0000-sdk-client-contributions.md` with
   `rfc: 0000`, while the FCP comment states the assigned number will be **0001**
   (sources/pr-1390-fcp-comment.md). Any DevTools RFC citing "RFC-A" by number today would cite a
   number that does not yet exist. Severity: **minor**.
3. **PLAN-EVAL accepted SHA vs branch HEAD.** The cycle-2 record accepts content SHA `78a7cecd1`
   with branch HEAD `4978f7d84` (sources/rfc-a-plan-eval.md:45-46), while the live PR head is
   `14b5c858c` (`gh pr view 1390 --json headRefOid`) — three commits later, the last of which is
   the eval record itself (`rtk git log --oneline -3` in `/home/codex/repos/ns-rfc-sdk-client`:
   `14b5c858c docs(harness): PLAN-EVAL cycle 2 …`, `9f45404ac`, `4978f7d84`). The RFC *text* read
   here is therefore post-accepted-SHA; I did not diff `78a7cecd1..14b5c858c` for the RFC file.
   Severity: **minor**, but it is the reason every citation above is pinned to `14b5c858c`.
4. **A load-bearing implementation owner is unfiled.** Disposition 6 defers
   `NetScriptProcedureMeta` to "a dependent metadata child after acceptance"; no such issue exists
   (children enumerated are only #1349–#1353). Auth dogfood #1352 cannot ship before it
   (rfc:1271-1275). Severity: **significant** for anything sequencing on RFC-A.
5. **`ci:skip-e2e` / `ci:skip-scaffold` on a PR that now carries a source-tree type fixture.** The
   evaluator ruled the skips still valid and added `type:test`, noting "the docs-lane CI skip does
   not itself compile the fixture; the fixture check stays a recorded PR-body gate"
   (sources/rfc-a-plan-eval.md, lane/label honesty audit). Documented, not hidden — recorded here
   because a DevTools RFC PR will face the same lane question. Severity: **minor**.

## Open questions

1. If a DevTools panel is contributed by a plugin, what supplies its data-access context? RFC-A
   terminates at "the app or generator writes the literal tuple and the caller passes context per
   call" (F8) — DevTools must either define its own host→panel context contract or require the host
   app to inject a pre-built client. Neither is in #1390.
2. Does a DevTools RFC depend on `SdkClientContribution` at all, or only on its *vocabulary*
   (`protocol {family, major}`, namespaced id, duplicate rejection, static module reference)?
   Only the latter is available before merge (F13).
3. If DevTools is a Fresh/browser surface talking to a NetScript service over HTTP, does it need a
   credential at all, or does it ride the host app's existing session? RFC-A's bearer path requires
   an explicit caller-supplied token getter (F9), which a self-contained panel does not have.
4. Is any DevTools transport MessagePort/in-process? If so RFC-A is structurally inapplicable
   (F11) and #451 becomes the relevant issue, not #1390.
5. Does DevTools need response/body or timing observation? RFC-A provides no response hook and
   forbids recording header values, input, and context even in debug mode (F6, F14) — a
   network-inspector-style panel would need a *different* seam, and RFC-A's redaction law would
   constrain what it may display.
6. Should a DevTools panel be allowed to read query keys containing partition values? RFC-A states
   partitions are "intentionally visible in query keys and developer tools" and non-secret
   (rfc:1117-1119) — this is a green light, but only for partitions, never for context.
7. Which milestone can a DevTools deliverable target given #1349–#1353 are all `0.0.7` and gated
   behind an unfiled metadata child plus the #1351 v1.15.0 family move (F12)?
8. Does the RFC file change between accepted SHA `78a7cecd1` and current head `14b5c858c` touch any
   normative text? (Verifiable with `git diff 78a7cecd1..14b5c858c -- rfcs/0000-sdk-client-contributions.md`
   in `/home/codex/repos/ns-rfc-sdk-client`; not run here.)

## Sources

Repo (baseline `main` @ `2256a67bf`, `/home/codex/repos/ns-rfc-devtools-contribution`):

- `packages/sdk/src/ports/service-client.ts:129-155, 160-171, 203-222`
- `packages/sdk/src/client/service-client.ts:44-68`
- `packages/sdk/src/presets/define-services.ts:97-123`
- `packages/plugin/src/config/domain/plugin-contributions.ts:11-39`
- `packages/sdk/deno.json:6-19` (export map — no `internal/` entry today)
- `rfcs/` on `main` → `0000-template.md`, `README.md` only

Commands actually run:

- `deno doc ./src/ports/mod.ts` from `/home/codex/repos/ns-rfc-devtools-contribution/packages/sdk`
- `rtk grep -n "SdkClientContribution|contributions" packages/sdk/src` → 0 matches
- `gh pr view 1390`, `gh pr view 1390 --json isDraft,state,headRefName,headRefOid,mergeable`
- `gh pr diff 1390 --name-only`
- `gh issue view 1348 --comments`
- `gh issue view 1349|1350|1351|1352|1353 --json number,title,state,milestone,labels`
- `gh api repos/rickylabs/netscript/issues/comments/5227723835 -q .body`
- `rtk git log --oneline -3` in `/home/codex/repos/ns-rfc-sdk-client`

RFC branch worktree `/home/codex/repos/ns-rfc-sdk-client` @ `14b5c858c`:

- `rfcs/0000-sdk-client-contributions.md` (1611 lines)
- `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` (503 lines)
- `.llm/runs/docs-rfc-sdk-client-contribution--rfc/plan-eval.md`

Saved artifacts (this run):

- `.llm/runs/plan-devtools-contribution--seed/research/sources/rfc-a-sdk-client-contributions@14b5c858c.md`
- `.llm/runs/plan-devtools-contribution--seed/research/sources/rfc-a-plan-eval.md`
- `.llm/runs/plan-devtools-contribution--seed/research/sources/pr-1390-body.txt`
- `.llm/runs/plan-devtools-contribution--seed/research/sources/pr-1390-fcp-comment.md`
- `.llm/runs/plan-devtools-contribution--seed/research/sources/issue-1348.txt`

External URLs referenced *by the RFC* (cited by it, not independently fetched by this agent):
`https://v1.orpc.dev/docs/client/rpc-link`, `https://v2.orpc.dev/docs/migrations/from-v1`,
`https://v2.orpc.dev/docs/plugins/request-headers`, `https://fetch.spec.whatwg.org/#forbidden-request-header`,
`https://www.rfc-editor.org/rfc/rfc9110.html#section-17.16.1`, `https://www.w3.org/TR/trace-context/`.
Marked **unverified** as external facts; verified only as claims present in the RFC text.

No GitHub mutation was performed; no file outside this corpus and the `sources/` directory was
written.
