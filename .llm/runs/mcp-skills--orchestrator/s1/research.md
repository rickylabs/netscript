# Research — `@netscript/mcp` S1

Re-baselined 2026-07-12 against `7c800e74`. The carried-in design and research remain current: the branch is clean, `packages/mcp` does not exist, sibling packages are `0.0.1-beta.8`, and root workspace membership already uses `packages/*`.

## Findings

- The authoritative design selects Archetype 6 and the exact 13-tool v1 surface.
- `@netscript/telemetry/query` exports Standard-Schema validators for trace, metric, and resource filters. S1 may reuse the trace filter contract for compatible inputs without activating telemetry queries.
- The current MCP stdio transport uses UTF-8 JSON-RPC messages delimited by newlines; messages must not contain embedded newlines. The required subset is `initialize`, `tools/list`, and `tools/call`.
- A zero-dependency protocol subset avoids an npm catalog entry and keeps the publish graph lean.
- The only S1 external effect is a short-timeout telemetry reachability probe. A domain-owned port keeps `fetch` and `Deno.env` in infrastructure.
- Root `packages/*` already includes the package; no explicit workspace-array edit is necessary.
- The owner brief explicitly locks the earlier horizontal Archetype-6 folder law, while the current
  v2 harness profile prefers `src/kernel` plus vertical surfaces. S1 must therefore disclose and
  debt-register that deliberate compatibility deviation rather than silently claiming v2 conformance.

## Planned JSR Surface Scan

- `deno.json` will carry name, sibling version, description, exports for `.` and `./cli`, explicit publish include/exclude, and declared permissions in README.
- Public declarations will have explicit types and JSDoc; both entrypoints will have `@module` docs.
- The package will be ESM-only, contain no self-referential bare imports, and publish no tests.
- Gates: full-export doc lint, package dry-run, clean file list, and slow-type check.

## Open Questions

None that force rework. The folder-shape conflict is resolved in favor of the owner brief, with a
README deviation section and debt entry. Later telemetry, docs, command execution, CLI registration,
and skill emission are explicitly deferred to S2-S9.
