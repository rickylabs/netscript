# [aspire-13-5 S12] 0.0.8 spikes: `addDenoApp` via CommunityToolkit TS projection, `withPostgresMcp` opt-in, NetScript MCP as a resource MCP server

> DRAFT TEXT ONLY. Labels: `type:feat`, `epic:aspire-13-5`, `area:aspire`, `area:cli`,
> `priority:p2`, `status:research`. Milestone: `0.0.8` (OF-5). Re-anchors #320; does not close it.

## Summary

Three follow-ups the research proved feasible on paper but that change generated output too broadly
for 0.0.7:

1. **`addDenoApp` projection.** `CommunityToolkit.Aspire.Hosting.Deno` (13.5.0) is listed in the
   aspire.dev TypeScript API reference with `addDenoApp`, `addDenoTask`,
   `withDenoPackageInstallation`, `DenoAppResource` — contradicting the scaffold's standing
   assumption that `[AspireExport]` from external NuGets is not projected. If S2 V9 proves
   `aspire restore` emits them, prototype replacing `builder.addExecutable('deno', …)` in one
   generator (services) and measure: env/endpoint parity, `withOtlpExporter`, `withBrowserLogs`,
   watch mode, permissions flags. First-party Deno hosting (aspire#18628) is 13.6 — do not wait for
   it.
2. **`withPostgresMcp()` opt-in** on the generated Postgres resource (`netscript init --db-mcp` or
   appsettings flag) so agents get SQL/schema tools through `aspire agent mcp` and
   `aspire mcp call <db> query`. Experimental diagnostics (`ASPIREPOSTGRES001`) apply only to C#.
3. **NetScript MCP as a resource MCP server**: emit `withMcpServer('/mcp')` on the `netscript` MCP
   resource so its tools are proxied by the Aspire MCP server and callable via
   `aspire mcp tools|call` — one MCP endpoint for agents instead of two.

## Acceptance (spike)

- [ ] Restore proof for (1) committed (module grep + a one-service prototype AppHost that starts).
- [ ] Decision memo per item: adopt in 0.0.8 / defer, with the generated-output diff.
- [ ] #320 and #319 commented with the 13.6 upstream milestones and this spike's outcome.

## Boundaries

No default scaffold changes; prototypes live under `.llm/tmp` or a fixture, not `packages/cli`.

## Related

Part of #<epic>. Depends on S2 (V9), canary B. Related: #319, #320, #295, existing arch-debt
"CommunityToolkit Deno/SQLite TypeScript AppHost re-enable deferred".
