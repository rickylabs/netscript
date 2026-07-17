# Drift Log: `@netscript/mcp` S6

This file is append-only.

## 2026-07-12 — S7 real CLI wiring boundary

- **What:** S6 ships MCP-owned ports, a static informational catalog, and an injectable subprocess adapter; live `CliCommandRegistry` enumeration and CLI-side default wiring arrive in S7.
- **Expected:** Dynamic production enumeration without an MCP dependency on `@netscript/cli`.
- **Actual:** Direct MCP→CLI wiring is forbidden because S7 introduces CLI→MCP composition.
- **Severity:** architectural, planned dependency inversion.
- **Action:** Keep S6 adapters injectable and the default catalog explicitly unwired; S7 implements/injects the live catalog and project-specific executor configuration.
