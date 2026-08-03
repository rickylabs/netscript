# Research — feat-openapi-mcp-endpoint-directory--s5

## Re-baseline

- Carried-in sources: issue #1131, ratified RFC #1123, canonical discovery design, and Wave-0 P1/P3
  verdict artifacts.
- Re-derived against `origin/main` at
  `2c8865e8c4ec60ef080276d327fc75ab32c0cb85` on 2026-08-04. Local `main` was stale; the requested
  branch already matched the fetched remote baseline and was clean.
- Current GitHub state: #1131 is open, milestone `0.0.5`, with exactly two acceptance boxes; no PR
  exists for `feat/openapi-mcp-endpoint-directory`.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | P1 is an explicit `FAIL` selecting qualified F1(b): `aspire-cli` is the current primary live source, while the correct post-allocation manifest seam remains additive. | `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/P1-verdict.md` |
| 2 | P3 ratifies the exact `spec_unavailable` guidance for 401/403 without adding credential support. | `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/P3-verdict.md` |
| 3 | The source axis is named and finite: `override`, `aspire-cli`, `run-manifest`, `appsettings`; every consulted source must report `used`, `absent`, or `failed(reason)`. | #1131; `design/canonical/02-discovery.md` |
| 4 | The ratified precedence remains explicit override first; applying P1 makes the effective current order `override > aspire-cli > run-manifest > appsettings`. | RFC §2 D3; P1 verdict; issue prompt arbitration |
| 5 | `aspire describe --apphost <path> --format Json --non-interactive --nologo` is the machine-readable live query. Aspire 13.4.6 emits top-level `resources[]` rows with `displayName`, DCP-suffixed `name`, and declared `urls[]`. | `aspire describe --help`; `packages/cli/e2e/src/application/gates/scaffold/generated-app-endpoint.ts` |
| 6 | The generated service self-identifies at `/` as JSON containing `service`; the live spec is `/api/openapi.json`. | `packages/service/src/builder/service-builder-impl.ts` (`withServiceInfo`) |
| 7 | `aspire/appsettings.json` names configured services under `NetScript.Services`; `HostPort` is current and `Port` is legacy. Unpinned services have identity but no static URL. | `packages/cli/src/kernel/templates/aspire/generate-appsettings.ts`; workspace resolver |
| 8 | The P1 manifest actually proven in Wave 0 uses an array of `{ service, endpoint, url, ... }` rows and a UUID `runId`; no independent S5-owned mechanism exposes the current run id to MCP. | P1 experiment and `proofs/evidence/P1-runtime.json` |
| 9 | `.netscript/agent-mcp.json` is the ratified carrier; S5 owns `introspection.serviceEndpoints` and `introspection.excludeServices`, while endpoint execution policy remains deferred. | discovery example; canonical security design; S-25 triage |
| 10 | `@netscript/mcp` currently exports `.` and `./cli`; both full entrypoints are doc-lint clean and package dry-run is clean with no slow types. | `deno task doc:lint --root packages/mcp --pretty` exit 0; package `deno publish --dry-run --allow-dirty` exit 0 |
| 11 | The old doctrine verdict table predates `@netscript/mcp`. The package carries accepted `MCP-A6-V2-SHAPE` debt, while the user explicitly classifies this port/adapter slice as Archetype 2. | doctrine 10; `.llm/harness/debt/arch-debt.md`; task brief |
| 12 | The branch must not depend on S4 projection internals; the directory may carry parsed JSON as `unknown`/JSON data for S6 to project later. | task coordinate-surface rule |

## jsr-audit surface scan

- Surface scanned: `packages/mcp/deno.json`, `mod.ts`, `cli.ts`, README, full export map.
- Baseline: metadata, package name, description, exports, ESM shape, module docs, symbol docs, file
  list, doc lint, and slow-type dry-run all pass.
- Planned risks: new public discriminated unions, ports, adapters, and factory must have explicit
  annotations and JSDoc; both `.` and `./cli` must remain clean; tests/fixtures must stay excluded;
  no `--allow-slow-types` exception applies.
- Planned evidence: structured full-export doc lint, package dry-run, package JSR fitness audit,
  and `deno doc` inspection of the new symbols.

## Open questions resolved before lock

- **Manifest current-run proof:** S5 cannot infer a current token from a stale file. The manifest
  adapter therefore requires an expected `runId` supplied at composition; a present manifest with
  no expected token or a mismatch is a visible failed source outcome. S7 may wire the producer token
  later without changing the port.
- **Live precedence:** explicit human override remains highest; `aspire-cli` is next as the P1-selected
  primary live source; manifest and appsettings remain lower additive fallbacks.
- **Projection coupling:** no S4 imports. A successful probe may retain parsed JSON as opaque data;
  S6 owns projection and operation counting.
