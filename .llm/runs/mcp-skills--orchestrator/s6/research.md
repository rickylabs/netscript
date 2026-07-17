# Research — `@netscript/mcp` S6 CLI trigger tools

Re-baselined 2026-07-12 at `0b8ed075`; required ancestor `454be64d` and `doctor-flow.ts` are present. The worktree was clean before artifact provisioning.

## Findings

- `packages/mcp` remains Archetype 6 under accepted debt `MCP-A6-V2-SHAPE`; S6 adds process/catalog ports and adapters inside its locked horizontal package shape.
- `CliCommandRegistry.commandNames()` dynamically enumerates top-level public commands, while leaf paths and flags live in the materialized Cliffy tree. MCP cannot import `@netscript/cli`: S7 makes CLI depend on MCP, so S6 must expose injection ports.
- Current top-level public commands include `deploy`, `init`, `contract`, `db`, `generate`, `marketplace`, `plugin`, `service`, and `ui:*`; #701 grows this surface, so a hard-coded production catalog would stale.
- The current MCP registry already reserves `list_commands` and `execute_command`; contracts are placeholders and no flows are wired.
- Generated app task configuration does not emit a `netscript` task. The public CLI is invoked as `deno run -A jsr:@netscript/cli`; the executor default should use that command prefix, while tests and S7 can inject a different prefix.
- Subprocess execution is a real process boundary. `Deno.Command` belongs in infrastructure, with timeout/kill, combined bounded output tail, explicit duration, and no external dependency.
- Existing flow failures use structured `ToolFailure` values. Policy denial should use `command_denied` with the matching deny/default rule in its details.

## Planned JSR Surface Scan

- No entrypoint is added. New port, policy, flow, and adapter exports remain reachable through existing `mod.ts` and require explicit annotations plus JSDoc.
- No dependency or lockfile change is needed. In particular, `@netscript/cli` is forbidden.
- Public defaults are immutable data. Result strings and descriptor summaries are bounded at their producing boundary; full-export doc lint and package publish dry-run cover slow types, docs, and file-list risks.
- `Deno.Command` runtime permission is already consistent with the executable adapter but must remain at the infrastructure edge.

## Open Questions

None that force implementation rework. Exact service read/list prefixes are locked conservatively in the plan; consumers may override the exported policy data.
