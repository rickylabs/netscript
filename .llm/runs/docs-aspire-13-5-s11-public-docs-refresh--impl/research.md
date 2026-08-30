# Research — S11 Public docs + README refresh for Aspire 13.5

## Context and Baseline
- Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s11`
- Base: `c61b1626` (stacked on S10 → S8 → S6 → S5)
- Epic: #1712 (Aspire 13.5 adoption), sub-issue #1723 (S11)
- Closes: #1642 (detached/non-TTY start how-to), #1000 (".NET Aspire" → "Aspire" normalisation)
- Truth Boundary: main is on 13.4.6; this stack introduces 13.5.3-compatible contracts (health checks S6, typed db-cli commands + excludeFromMcp S8, MCP skills S9, E2E gates S10).
- Snippets target Aspire 13.5.3 (Browsers preview `13.5.3-preview.1.26425.3`).

## Key Facts & Observed Receipts
1. **Aspire CLI 13.5.3 Commands & JSON Format**:
   - `aspire start --format Json` output: JSON structure including PID, log path, endpoints.
   - `aspire ps --format Json`: returns array of objects with `appHostPath`, `dashboardUrl` (with `?t=...` authentication token), `logFilePath`, etc.
   - `aspire wait --timeout <seconds>` and `ASPIRE_CLI_START_TIMEOUT` (defaults to 300s).
   - `--isolated` starts: randomized host ports, session-scoped container lifetimes.
   - `aspire resources` alias for `aspire describe`.
   - `aspire stop --force`: forceful AppHost and container cleanup.
   - `aspire docs api search <query> --language typescript`.
2. **Aspire MCP Server & Skills**:
   - `aspire agent mcp` / `--dashboard-url` form.
   - Ratified 14-tool baseline (including `refresh_tools`, `select_apphost`; `get_integration_docs` is documented in aspire.dev but unobserved in static 13.5.3 CLI).
   - `excludeFromMcp()` on `<db>-cli` resources prevents MCP tool pollution while remaining visible in `aspire describe` / dashboard.
3. **Health Checks & Backing Services**:
   - Listener readiness: TCP connect for Postgres/MySQL/MSSQL, RESP PING for Redis/Garnet.
   - Registered via `addHealthCheck` / `withHealthCheck` in AppHost.
4. **Typed Database Operations**:
   - `CommandOptions.Arguments` for typed CLI inputs: `migrate --timeout <n>`, `reset --confirm true`, `seed`.
5. **Dashboard & Telemetry Precedence (D-17)**:
   - `resolveTelemetryEndpoint`: explicit option → `NETSCRIPT_TELEMETRY_ENDPOINT` → `ASPIRE_DASHBOARD_PORT` → `aspire ps` dashboardUrl → `http://localhost:18888`.
   - Standalone exit 12 behavior when dashboard is unreachable for bare `aspire otel`.
