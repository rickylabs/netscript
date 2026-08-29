# [aspire-13-5 S8] Typed resource commands for db-cli-mode resources + `excludeFromMcp()` ownership

> DRAFT TEXT ONLY. Labels: `type:feat`, `epic:aspire-13-5`, `area:cli`, `area:aspire`,
> `area:database`, `priority:p1`, `status:triage`. Milestone: `0.0.7`. Closes #863 (with S6).
> PLAN-EVAL F3 correction (2026-08-29): **S8 is the single owner of `excludeFromMcp()`** emission;
> S9 depends on S8 and proves it.

## Summary

13.5 lets TypeScript AppHosts declare resource commands with typed arguments
(`withCommand(name, displayName, cb, { commandOptions: { arguments: [{ name, inputType, required }] } })`;
`ctx.arguments().value('x')`), exposed as `aspire resource <r> <cmd> --<arg>` and prompted by the
dashboard. Use it to give the generated db-cli-mode resources (`generate-db-cli-mode.ts`,
`withExplicitStart`) typed `migrate`/`seed`/`reset` commands with a bounded wait, so `netscript db`
no longer spawns ad-hoc AppHosts or blocks indefinitely (#863, #1011/#1196 lineage). The same
generator marks those internal helper resources `excludeFromMcp()` so agents do not see NetScript
tooling in the Aspire MCP server's `list_resources`/log/telemetry tools (they stay visible to the
CLI and dashboard) — and S9's MCP smoke proves it.

## Scope

- `generate-db-cli-mode.ts` + `run-tool.ts.template`: emit `withCommand` per operation with
  `arguments` (`--timeout <s>`, `--confirm true` for destructive ops), `Visibility`, `IconName`;
  execution wraps the existing tool runner; results map to `{ success, message }`. Emit
  `.excludeFromMcp()` on every db-cli-mode helper resource (constant
  `RESOURCE_DEFAULTS.DbCliModeMcpHidden = true`, named so S9 can assert the hidden set by name:
  `<db>-cli` resources). The 13.4 `WithProcessCommand` seam behind `PROCESS_COMMANDS_FLAG`
  (`generate-register-tools-1.ts.template:108-123`) is replaced by the typed `withCommand` path or
  deleted; its version-bound comment goes with it.
- `packages/cli/src/kernel/adapters/database/{aspire-command-executor,operation-runner}.ts`: when a
  running AppHost is detected (`aspire ps --format Json` match on the project's `apphost.mts`), call
  `aspire resource <db>-cli <op> --<args> --non-interactive --nologo` instead of starting a second
  AppHost; keep the standalone path when none runs.
- Bounded wait (#863): `aspire wait <db> --status healthy --timeout <n>` before the op; exit 17/18 →
  actionable message (S6 makes "healthy" mean listener-ready).
- E2E: replace `ASPIRE_RESTART_SCRIPT` with a typed command call where the flow allows; keep restart
  as fallback.

## Boundaries

No dashboard interaction prompts (`promptInputs`). No plugin contribution changes. DDX-1 (#411)
vocabulary follows; not implemented here. S9 owns the MCP receipt that _proves_ the hidden set.

## Acceptance

- [ ] `aspire resource <db>-cli --help` lists the typed commands with argument docs (receipt).
- [ ] `aspire resource <db>-cli migrate --timeout 60` succeeds; `reset` without `--confirm true`
      fails before mutation.
- [ ] Generated output for a postgres scaffold contains `.excludeFromMcp()` exactly on the
      `<db>-cli` resources and on no user-facing resource (generator test). `excludeFromMcp()`
      affects **Aspire MCP exposure only**: default `aspire describe --format Json` still lists
      `<db>-cli` (they are not `withHidden()` — that API is deliberately not adopted).
- [ ] `netscript db init` against an Unhealthy-but-Running Postgres exits within the timeout with
      the actionable message (#863) — `Closes #863`.
- [ ] `scaffold.runtime` green on both tiers; no second AppHost is spawned during `db` ops when one
      is running (`aspire ps` count receipt).
- [ ] `PROCESS_COMMANDS_FLAG` seam and its "Aspire 13.4" comment removed (grep test).

## Rollback

Revert + `gen:assets-barrel`; db ops fall back to the standalone AppHost path; helper resources
become MCP-visible again (S9's receipt would then fail — revert S9's hidden-set expectation with
it).

## Tests / gates

Generator tests; CLI adapter tests; `scaffold.runtime`; scoped wrappers; `quality:scan`;
`arch:check`; `check:assets-barrel`.

## Docs / static asset regeneration

`deno task gen:assets-barrel`; `docs/site/orchestration-runtime/cli-scaffold.md` command table
(S11).

## Related

Part of #<epic>. Depends on S6. Blocks S9 (hidden-set proof), S10. Feeds #411 (comment). Related
closed: #1011, #1196.
