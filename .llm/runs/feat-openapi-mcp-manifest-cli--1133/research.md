# Research — feat-openapi-mcp-manifest-cli--1133

## Re-baseline

- Carried-in source: `/home/codex/ns005s7-brief.md`, issue #1133, RFC #1123 §F1, and P1 verdict.
- Re-derived against `main` @ `f7558aa1c` on 2026-08-04.
- S5 landed on main in #1194 and already supplies the Aspire CLI adapter, endpoint-source port,
  precedence, probe isolation, and explicit source outcomes. This run extends that adapter.
- P1 is `FAIL`; qualified F1(b) is authoritative. No template manifest emission is in scope.
- S6/#1132 remains open with no PR, so the expensive evidence must fixture the directory call unless
  S6 merges before the gate is run.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | Current adapter invokes `aspire describe` directly and trusts any parseable `resources[]`. | `packages/mcp/src/infrastructure/service-endpoints/aspire-cli-endpoint-source.ts` |
| 2 | Aspire 13.4.6 `ps --format Json` identifies a run by exact `appHostPath` and `appHostPid`. | Read-only `aspire ps --format Json` captured 2026-08-04. |
| 3 | Real describe resources expose `properties.executable.workDir`; executable service candidates can be bound to `projectRoot`. | Read-only describe of the baseline verification AppHost. |
| 4 | The live AppHost slot is occupied by baseline verification; no runtime gate may start yet. | `aspire ps --format Json` showed three AppHosts under `ns005-baseline`. |
| 5 | Banner noise and field-name drift are plausible across CLI versions; torn/trailing output must never be silently accepted. | Existing 13.4.6 fixture plus F1(b) brief. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/mcp/deno.json`, root `mod.ts`, and exported Aspire adapter types.
- The existing public types are documented. This slice should avoid adding a new export; any added
  option stays on the already-exported options interface and receives JSDoc.
- Full `deno doc --lint` and package dry-run are required after implementation.

## Open questions

- S6 may merge before the serialized runtime gate. Re-check immediately before running it; otherwise
  exercise `createServiceEndpointDirectory().list()` directly in the scaffold fixture.

