# Discovery Across Dynamic Ports (canonical design, rev 1)

> Draft — design document only. The mechanism seam is Wave-0 proof [P1].

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
| (a) **AppHost-published endpoint manifest** — the generated Aspire helpers, which already hold every service resource and wire `getEndpoint('http')` references (`generate-register-services.ts:40-144`), additionally write `{service → resolved URL}` to a run-state file the MCP reads | **Chosen.** Offline, zero new processes/transports, no version coupling; the AppHost is the only party that authoritatively knows resolved ports |
| (b) MCP shells out to the `aspire` CLI to query running resources | Fallback if [P1] fails. Works today (the aspire MCP proves the data is reachable) but couples to CLI output format and requires the CLI on PATH in the MCP's spawn context |
| (c) Host the MCP inside the AppHost as an Aspire resource (per #1117's original sketch) | Rejected: requires an HTTP MCP transport that does not exist (`stdio only`, research §2.2), reintroduces the port problem for the MCP itself, and forces `.mcp.json` churn from static command to per-run URL |
| (d) Fixed ports for all services | Rejected: regresses #952-era ephemeral-port behavior and collides on shared machines |

## The endpoint manifest (option a)

**Producer.** The generated `.helpers/register-services.mts` (or a sibling helper the generator
pipeline emits, `helpers-generator-pipeline.ts:68,92`) writes, once endpoints are allocated:

```jsonc
// <project-root>/.netscript/run/endpoints.json   (location: owner fork F1; gitignored)
{
  "schemaVersion": 1,
  "apphostPid": 41230,
  "writtenAt": "2026-08-03T14:02:11Z",
  "services": {
    "publisher": { "http": "http://localhost:61432" },
    "workers-api": { "http": "http://localhost:61433" }
  }
}
```

Write is atomic (temp + rename), byte-idempotent per the codegen precedent
(`generate-runtime-schemas.ts:107-176` skip-identical rule). **[P1] must prove** the exact seam:
whether the TS helper layer can observe *resolved* URLs (an endpoint-allocated lifecycle point,
e.g. Aspire's after-endpoints-allocated event surfaced to the helpers) or whether the C# AppHost
side must emit it. This is stated as unproven; if neither seam exists cleanly, F1(b) — the
`aspire` CLI query adapter behind the same port — is the fallback and **the port contract below
does not change**.

**Consumer.** A new `packages/mcp` domain port, adapter-injected like every other port
(`run-agent-mcp.ts:22` composition):

```ts
// packages/mcp/src/domain/service-endpoint-directory-port.ts
export interface ServiceEndpointDirectoryPort {
  /** All services the app declares, merged with live endpoints when available. */
  list(): Promise<readonly ServiceEndpointEntry[]>;
}
export interface ServiceEndpointEntry {
  readonly name: string;
  readonly baseUrl?: string;                       // absent → not running
  readonly source: 'run-manifest' | 'appsettings' | 'override';
}
```

Resolution order inside the default adapter: run manifest (fresh, see staleness) → 
`appsettings.json` static list (entries surface as `configured (not running)`) → explicit
`serviceEndpoints` override on `McpCliOptions` (parity with the existing `--docs-root`/env
override pattern, `cli.ts:70-79`) for non-Aspire or CI use.

## Staleness and trust

- The manifest is advisory, never authoritative: **liveness is the spec fetch itself.** Tools
  fetch `<baseUrl>/api/openapi.json` at use time (the spec is per-request-generated,
  `openapi.ts:74-93`, so success ⇒ current truth). Connection refused ⇒ the entry degrades to
  `configured (not running)` with the stale manifest noted.
- `apphostPid` + `writtenAt` let the adapter flag a manifest older than the running AppHost or
  orphaned by a dead one; it never guesses — it reports.
- The manifest is machine-local run state: gitignored, never committed, torn down by the same
  hygiene that owns `.netscript/` run artifacts. It contains only localhost URLs — no secrets.

## Security posture of the fetch adapter

`ServiceSpecPort`'s default adapter fetches **loopback only** (hosts resolving to
127.0.0.0/8/::1 — Aspire-assigned service URLs are localhost by construction); anything else
requires the explicit override config. This is the awslabs `--allow-private-networks` idea
inverted for a local-first tool: we allow *only* private-loopback and gate everything else. No
redirects followed; response size capped before parse; JSON parse failures surface as
`spec_unavailable` with the first bytes summarized. No credentials are attached to spec fetches,
ever; a 401/403 is a *reported condition* (01 failure envelopes, [P3]), not a retry-with-creds.

## What this deliberately does not build

- No file-watch, no daemon, no push channel — tools read at call time; the agent's cadence is
  the refresh cadence.
- No cross-machine discovery, no non-loopback fleets — out of scope for the local dev loop this
  serves.
- No dependence on `getAllServices()` in the MCP process (it would silently return `[]` there —
  the trap this section exists to design away). Inside service processes it remains the right
  helper, and nothing here changes it.
