# Discovery Across Dynamic Ports (canonical design, rev 2)

> Draft — design document only. Rev 2 integrates Sol stage-2 findings S-4, S-7–S-12
> (`../../adversarial-triage.md`). The producer mechanism is **P1-arbitrated, not chosen**
> (S-7); the manifest carries identity, not just liveness hints (S-8); the directory contract
> reports source outcomes (S-9), deterministic precedence (S-10), bounded fetches (S-11), and a
> single status mapping (S-12).

## The problem, stated precisely

Aspire assigns service ports at run time and communicates them by injecting
`services__<name>__<protocol>__<index>` env vars **into the processes it starts**
(`packages/sdk/src/discovery/service-url.ts:55-61`); `getServiceUrl()` (`:97-129`) and
`getAllServices()` (`:162-176`) read exactly those vars. The MCP server is **not such a
process**: `agent init` configures the agent host to spawn it directly
(`deno run -A jsr:@netscript/cli agent mcp --project-root <root>`,
`init-agent.ts:127-172`). Its environment contains no `services__*` vars, so #1117's "dynamic
ports largely solved" holds only inside the AppHost graph. The design must carry resolved
endpoints across a process boundary that Aspire does not bridge.

What the MCP process *does* reliably have: `--project-root`, and therefore the project's files —
including `aspire/appsettings.json` (`NetScript.Services`, generated at
`generate-appsettings.ts:341-370`), which authoritatively lists the services but not their
runtime ports.

## Options considered

| Option | Verdict |
| --- | --- |
| (a) **AppHost-published endpoint manifest** — generated Aspire code writes `{service → resolved URL}` to a run-state file the MCP reads | **Preferred, contingent on [P1]** (see producer section — the currently generated helper body provably runs *before* endpoint allocation, S-7) |
| (b) MCP queries the `aspire` CLI for running resources | Activated if [P1] fails. The port contract below already contains this source and its failure states (S-10) — the earlier claim that the fallback "changes nothing" is withdrawn |
| (c) Host the MCP inside the AppHost as an Aspire resource (per #1117's original sketch) | Rejected: requires an HTTP MCP transport that does not exist (`stdio only`, research §2.2), reintroduces the port problem for the MCP itself, and forces `.mcp.json` churn from static command to per-run URL |
| (d) Fixed ports for all services | Rejected: regresses #952-era ephemeral-port behavior and collides on shared machines |

## The endpoint manifest (option a) — and why it is not yet locked

**The S-7 correction.** The rev-1 text nominated `register-services.mts` as the producer. The
reviewer showed that is unreachable as written: `createNetScriptAppHost()` registers resources
and returns (`generate-index-1.ts.template:33-72`) **before** the entry point calls
`builder.build().run()` (`apphost.ts.template:6-11`), and the helper's `getEndpoint()` values
are deferred references consumed by `withEnvironment`
(`generate-register-services-1.ts.template:64-85`) — endpoint values resolve during application
startup, readable only via lifecycle eventing (Aspire resource-lifecycle docs). A write in the
helper body would emit placeholders, not `http://localhost:<allocated>`.

**[P1] is therefore the arbitration, with a positive artifact (S-17/plan):** demonstrate a
generated, run-mode, **post-allocation** callback (Aspire lifecycle event surfaced to the
generated code — TS or the C# AppHost side) that resolves each endpoint *from the host network
perspective* and writes the manifest. The proof commits `proofs/P1-verdict.md` with the working
mechanism or a negative verdict; a negative verdict activates option (b), and Wave-1's discovery
slice has a hard prerequisite on that artifact.

**The manifest, when produced (either mechanism):**

```jsonc
// <project-root>/.netscript/run/endpoints.json   (location: owner fork F1; gitignored)
{
  "schemaVersion": 1,
  "projectRoot": "/home/u/apps/acme-notes",     // identity binding (S-8)
  "runId": "0198f3c2-…",                        // fresh per AppHost run; not PID-derived
  "writtenAt": "2026-08-03T14:02:11Z",
  "services": {
    "publisher": { "http": "http://127.0.0.1:61432" },
    "workers-api": { "http": "http://127.0.0.1:61433" }
  }
}
```

Write is atomic (temp + rename, temp files cleaned on startup), byte-idempotent per the codegen
precedent (`generate-runtime-schemas.ts:107-176`). URLs are written as **literal loopback
hosts** (S-4 §security below).

## Identity and staleness (S-8)

PID + wall-clock freshness is insufficient (PID reuse; writer clock skew; copied
worktrees/run dirs; `--project-root` mismatch). Rev 2 binds identity instead:

- A manifest is **eligible** only if its `projectRoot` equals the MCP's resolved
  `--project-root` (real-path compared). A copied worktree's manifest is refused with an
  explicit `manifest_foreign` source outcome, never silently used.
- `runId` is minted per AppHost run and is the freshness token; `writtenAt` is advisory
  display only, never a guard.
- **Before an endpoint is reported as `running` — and always before any v2 invocation — the
  fetched service must prove it belongs to the binding:** the spec fetch is cross-checked
  against the service's self-identification (`withServiceInfo` is on every preset,
  `define-service.ts:230`; the served name must equal the directory entry's name). A reused
  port serving some *other* project's service fails the cross-check and the row reports
  `identity_mismatch` — it does not become a healthy row, and v2 will not send to it.

## The directory port (S-9, S-10)

```ts
// packages/mcp/src/domain/service-endpoint-directory-port.ts
export interface ServiceEndpointDirectoryPort {
  list(): Promise<ServiceEndpointDirectoryResult>;
}
export interface ServiceEndpointDirectoryResult {
  readonly entries: readonly ServiceEndpointEntry[];
  /** One outcome per consulted source — a failed read is data, never a silent absence. */
  readonly sources: readonly SourceOutcome[];
}
export type EndpointSource = 'run-manifest' | 'appsettings' | 'override' | 'aspire-cli';
export interface SourceOutcome {
  readonly source: EndpointSource;
  readonly outcome: 'used' | 'absent' | 'failed';
  readonly reason?: string;            // present iff failed: unreadable | invalid | foreign | …
}
export interface ServiceEndpointEntry {
  readonly name: string;
  readonly baseUrl?: string;           // absent → not running / excluded
  readonly source: EndpointSource;
  readonly conflict?: { readonly source: EndpointSource; readonly baseUrl: string };
}
```

- **Precedence is deterministic and per-service:** `override` > `run-manifest` >
  `appsettings` (an explicit override exists precisely to beat discovered state — S-10 inverted
  the rev-1 order). When a lower-precedence source disagrees, the winning entry carries the
  losing value in `conflict` so `list_api_services` can surface it; disagreement is visible,
  never adjudicated silently.
- `aspire-cli` is a first-class source with its own failure states (CLI absent from PATH,
  non-zero exit, unparseable output, multi-AppHost ambiguity) reported as `SourceOutcome.failed`
  reasons — the F1(b) fallback activates *inside* this contract, not by bending it.
- The `sources` block flows into `list_api_services` output verbatim (01), which is what makes
  "manifest unreadable + appsettings fine" distinguishable from "AppHost never started" — the
  absence-of-red-is-not-green requirement.
- Doctrine note (S-21): `EndpointSource` is a **named axis** per doctrine 07 — typed
  identifier, adapters mapped by a factory at the composition edge. All variants are first-party
  adapters of this one core port; the axis is named so the plugin question can be re-asked
  honestly if an external endpoint provider ever appears (06 §1).

## Status mapping (S-12 — one mapping, used by 01 and the examples)

| Probe result | Public status |
| --- | --- |
| No listener (connection refused / no route) | `not_running` (rendered `configured (not running)` with source context) |
| Listener, but timeout / HTTP error / redirect / parse failure on the spec | `spec_unavailable` (with status code or failure class; 401/403 adds the authz-cause hint, [P3]) |
| Spec OK but identity cross-check fails | `identity_mismatch` |
| Excluded by `introspection.excludeServices` (S-25) | `excluded` — spec never fetched, tested |

## Fetch adapter — bounds and loopback (S-4, S-11)

Every read-path fetch has a **bounded timeout and abort**, per-service failure isolation, and a
small concurrency cap: one service accepting the TCP connection and never responding becomes one
`spec_unavailable (timeout)` row while the rest of the directory returns — the tool that exists
to diagnose hangs must itself be un-hangable (S-11 adopted; the v2 flow's bounds now apply to v1
reads too).

The loopback guarantee is narrowed to what a parse-level check can honestly deliver, plus one
strengthening:

- Manifest/appsettings-sourced URLs must carry **literal loopback hosts** (127.0.0.0/8 dotted
  literals or `::1`); the producer writes them that way. `localhost` and other DNS names are
  resolved via `Deno.resolveDns` first; if every resolved address is loopback, the fetch is
  **pinned to the resolved IP** (host header preserved), otherwise refused. Suffix tricks
  (`localhost.evil`) never match a literal check; IPv6-mapped forms are normalized before the
  test.
- Explicit `override` entries may name non-loopback hosts: those are **operator-trusted by
  definition** and labeled as such in output. plan.md's "no network beyond localhost" is
  correspondingly scoped: *no non-loopback traffic without an explicit human-written override*.
- Residual gap, stated: resolve-then-pin closes the rebinding window but is still not a
  socket-level bind; that depth remains the recorded debt item (06 §5) and the claim "SSRF-safe
  loopback resolution" is not made.

No redirects; response size capped before parse; JSON parse failures surface as
`spec_unavailable` with the first bytes summarized. No credentials attached to spec fetches,
ever; 401/403 is a reported condition, not a retry-with-creds.

## What this deliberately does not build

- No file-watch, no daemon, no push channel — tools read at call time.
- No cross-machine discovery, no non-loopback fleets.
- No dependence on `getAllServices()` in the MCP process (it would silently return `[]` there —
  the trap this section exists to design away). Inside service processes it remains the right
  helper; a one-line doc note is queued as debt (06 §5).
