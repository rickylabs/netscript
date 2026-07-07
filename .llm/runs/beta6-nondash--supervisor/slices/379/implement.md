use harness

# Slice FA4 — `@netscript/fresh/ai`: `createMcpAppCallHandler` (issue #379, epic #238)

You are a Tier-D (WSL Codex) implementation agent for one slice of the `beta6-nondash--supervisor`
harness run. Implement ONE slice, land it clean, open a draft PR. Do NOT self-certify — the Tier-A
supervisor reviews before sign-off, and a separate OpenHands session runs IMPL-EVAL.

## SKILL
- `netscript-harness` — per-slice trackability, slice-review gate, Concept of Done, verdict flow.
- `netscript-doctrine` — `@netscript/fresh` archetype + layering (route/domain logic must not reach
  into adapters); AI-plugin flagship-quality mandate.
- `netscript-deno-toolchain` — `deno doc --lint` (`gate:jsr` bar), `deno publish --dry-run` WITHOUT
  `--allow-slow-types`, `deno doc` for surface inspection (use it to read the #463 pool + FA3 handler
  surfaces before writing).
- `netscript-tools` — the scoped `run-deno-check.ts` / `run-deno-lint.ts` / `run-deno-fmt.ts`
  wrappers are the ONLY gate-evidence source; never raw root CLI.
- `netscript-pr` — draft-PR process, closing keyword rules, taxonomy labels + milestone.
- `netscript-cli` / `rtk` — as needed.
- `codex-wsl-remote` — you ARE the WSL Codex agent; native ext4 worktree only.

## Pre-flight (run FIRST, in the worktree)
```
cd /home/codex/repos/netscript-379-callroute
git fetch origin
git reset --hard origin/main    # base = current main (b5d09693 or newer); #463 + #257 + #494 are merged
git rev-parse --short HEAD
```
Confirm your base contains the #463 pool: `deno doc jsr-or-local @netscript/ai/mcp` (or read
`packages/ai/mcp.ts`) shows `createMcpTransportPool` / `McpTransportPool`. If not, STOP and report.

## Task — the missing "act" half of interactive MCP Apps
FA3 (`createMcpSandboxHandler`, already merged in `@netscript/fresh/ai`) ships the sandbox DISPLAY
half; FB4 (#257) ships the client widget iframe. Neither ships the CALL handler — the server route
that lets a rendered `ui://` widget turn a `tool` action back into a real MCP `tools/call`.

Add **`createMcpAppCallHandler`** as a SIBLING route factory in the SAME `@netscript/fresh/ai` module
that exports `createMcpSandboxHandler`. Mirror FA3's structure, export style, and JSDoc conventions.

Contract:
- `createMcpAppCallHandler({ clients })` → a Fresh route handler. `clients` is the keep-alive MCP
  pool — consume the **#463 primitive** (`McpTransportPool` from `@netscript/ai/mcp`,
  `createMcpTransportPool`), NOT a re-hand-rolled pool. Inspect its surface with `deno doc` first;
  use its `callTool` / server-keyed routing.
- **Same-server allowlist (security-critical):** a widget may only call tools on the *same* MCP
  server that produced its `ui://` resource. Re-enforce this SERVER-SIDE from the request — never
  trust a client-supplied server id. Reject cross-server calls with a 4xx, no side effects.
- **stdio fallback:** when the resolved transport is a non-reconnectable stdio child, route through
  the already-live pool client instead of opening a new transport (stdio transports are deliberately
  non-reconnectable). The #463 pool keeps transports warm — use the warm client.
- **OTel:** emit an `mcp.tool.call` span that CONTINUES the browser trace via `parentFromRequest`
  (or the repo's existing trace-continuation helper — find how FA3 / telemetry does it; do not invent
  a new tracing seam).
- **Pool-sharing:** JSDoc documents the pattern — ONE keep-alive MCP pool serves both chat turns and
  widget action calls (the FA3/E5 pattern).

Reference (READ, do not copy blindly — adapt to NetScript's contracts): eis-chat @ HEAD b65094a
`apps/dashboard/routes/api/mcp-apps/call.ts` (native handler + stdio fallback + allowlist + OTel) and
`apps/dashboard/lib/mcp.ts` (the shared keep-alive pool). If eis-chat is not checked out in your
worktree, work from the #463 pool surface + FA3 handler as the anchor — do not block on eis-chat.

Add tests (`packages/fresh/tests/` or the module's existing test location): (a) same-server call
succeeds and hits the pool's `callTool`; (b) cross-server call is REJECTED server-side (does not
reach any transport); (c) stdio-transport path routes through the warm pool client, not a fresh
connect; (d) the handler emits an `mcp.tool.call` span (assert via the test tracer). Use test doubles
for the pool/transport as FA3's tests do.

## Gates (run via the scoped wrappers; record raw evidence)
- `run-deno-check.ts --root packages/fresh --ext ts,tsx` (include `--unstable-kv` if it touches
  workspace KV) — green.
- `run-deno-lint.ts` + `run-deno-fmt.ts` on the touched source — green.
- `deno test --allow-all packages/fresh/tests/` (or the module's test dir) — green, new cases included.
- `gate:jsr`: `run-deno-doc-lint.ts --root packages/fresh` totalErrors=0 for the touched export;
  `deno publish --dry-run` from `packages/fresh` exit 0 **WITHOUT** `--allow-slow-types`.
- `deno task arch:check` — green (layering).

## Constraints (hard)
- NEVER mutate `deno.lock` — `git checkout -- deno.lock` before any commit if it drifts.
- No new `as` casts beyond the repo's 2 accepted (contract `as-unknown-as`, top router `any`).
- All new public exports carry JSDoc + `@module`; respect the `mod.ts` ≤20 export ceiling.
- Push EXPLICIT refspec: `git push origin HEAD:refs/heads/feat/379-mcp-app-call-handler`
  (worktree may inherit origin/main upstream — never bare-push).
- Open a **draft** PR. Body carries `Closes #379`. Reference the epic as `Part of #238` — NO closing
  keyword on the epic. Apply taxonomy labels (`type:feat`, `area:fresh`, `epic:ai-stack`, `wave:v1`,
  `priority:*`, exactly one `status:`) + milestone `0.0.1-beta.6`.

## Reporting (do NOT self-certify)
Commit by slice; push; comment on the draft PR with scope + commit hash + raw gate evidence. End your
turn with a `READY_FOR_A1_REVIEW` marker and the commit hash + PR number. Do NOT check any acceptance
or `gate:` boxes on #379 that are not actually built+green (the #260 antipattern is forbidden). If a
gate is genuinely unbuildable in this slice, say so explicitly and leave the box unchecked.
