# PLAN-EVAL — PASS

Independent native Fable5.1, requested and observed; low effort requested. Same reviewer session
for two iterations. Primary route availability failed preflight; declared matrix fallback used.

Iteration1 FAIL_PLAN: a static SDK namespace pin shadows local-source workspace members.
Iteration2 PASS: mode-aware CLI plugin import map plus both-mode completeness/no-pin guards.

**Verdict: PASS.**

The sole blocker is resolved. Step 3 now uses the existing mode-aware seam at `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts:148`, and `netscriptJsrSpecifier('sdk')` already exists at `packages/cli/src/kernel/constants/jsr-specifiers.ts:75`. A root alias is workspace-wide in Deno, so the `plugins/ai` member resolves `@netscript/sdk/discovery` in JSR mode, and local-source consumers fall through to the copied `packages/sdk` member as the guard already expects for the other four AI aliases. Extending the completeness guard with a service-arm `emitMcpServer` sample and extending the no-pin negative with `@netscript/sdk` closes the coverage gap I raised. Leaving `ai/deno.json` and its golden unchanged is correct. Path validation now names dot segments and encoded separators, which covers the negatives I listed. This seam is CLI plugin import wiring, not init or scaffold assets, so it stays within the issue scope.

No remaining blockers.

**Nonblocking, bounded**

- Upgrade path: `ensureRootImportsForPluginKind` runs at plugin install. A JSR consumer that installed the AI plugin before this release and then runs `mcp add --service` will lack the alias. Either rerun the kind wiring from `addMcpServer` for the service arm, or state in the README that such projects must re-run install or add the alias by hand. Pick one and record it.
- The earlier nonblocking items still apply: raw-flag presence check for `--path`/`--protocol` on URL/stdio, fixture handling of `initialize` and `notifications/initialized`, keeping the legacy `McpServerInput` object shape as one union arm, and the `runMcp` usage string update.

Implementation choice: document the older-install SDK-alias migration, avoiding broad CLI
mutation for an app-owned generated resource. No CLI init/scaffold assets are changed.
