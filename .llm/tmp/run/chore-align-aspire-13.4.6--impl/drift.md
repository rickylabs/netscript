# Drift - Aspire-core 13.4.6 alignment

## 2026-06-27 - Goal B deferred

- Severity: accepted deferral.
- Expected: if Aspire 13.4 fixed the prior TypeScript AppHost export issue, swap the workaround for
  CommunityToolkit Deno hosting and prove it with `scaffold.runtime`.
- Actual: current Aspire Deno integration docs state TypeScript AppHost support for the
  CommunityToolkit Deno package is not yet available and the package does not expose
  `addDenoApp`/`addDenoTask` in the TypeScript SDK. SQLite docs likewise state the SQLite hosting
  integration is C#-only for AppHost APIs and TypeScript should use `addConnectionString` with a
  parameter.
- Decision: keep `_aspire-compat.mjs` and generated `addExecutable(...)` registrations unchanged.
  Goal A ships independently.
- Follow-up: dedicated CommunityToolkit Deno/SQLite TypeScript AppHost integration slice after
  Aspire/CommunityToolkit exposes the needed SDK APIs or after a new scaffold design replaces them
  with explicit TypeScript connection-string modeling.

## 2026-06-27 - Final scaffold.runtime blocked by fixed-port bind

- Severity: gate-blocking environment/runtime collision.
- Expected: running the expensive `scaffold.runtime` E2E last would avoid the known fixed-port
  collision.
- Actual: two final E2E attempts failed at `database.init` with Aspire unable to bind
  `https://127.0.0.1:18891`. Cleanup ran after each attempt. `ss` showed no WSL listener on 18891 and
  `aspire ps --format Json` returned `[]` after cleanup. WSL cannot execute Windows `cmd.exe`, so the
  suspected Windows-side listener could not be inspected from this session.
- Impact: Goal A code changes are complete, and the generated `aspire.config.json` in the failed E2E
  project restored Aspire SDK/package `13.4.6`, but the final runtime smoke is not green.
- Decision: do not broaden this version-pin slice into port allocation changes. Preserve the failed
  gate evidence in the PR.
