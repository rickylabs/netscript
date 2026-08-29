# [aspire-13-5 S8] Typed resource commands for db-cli-mode resources

> DRAFT TEXT ONLY. Labels: `type:feat`, `epic:aspire-13-5`, `area:cli`, `area:aspire`,
> `area:database`, `priority:p1`, `status:triage`. Milestone: `0.0.7`. Closes #863 (with S6).

## Summary

13.5 lets TypeScript AppHosts declare resource commands with typed arguments
(`withCommand(name, displayName, cb, { commandOptions: { arguments: [{ name, inputType, required }] } })`;
`ctx.arguments().value('x')`), which the CLI exposes as `aspire resource <r> <cmd> --<arg>` and the
dashboard prompts for. Use it to give the generated db-cli-mode resources
(`generate-db-cli-mode.ts`, `withExplicitStart`) typed `migrate`/`seed`/`reset` commands with a
bounded wait, so `netscript db` no longer spawns ad-hoc AppHosts or blocks indefinitely (#863,
#1011/#1196 lineage).

## Scope

- `generate-db-cli-mode.ts` + `run-tool.ts.template`: emit `withCommand` per operation with
  `arguments` (`--timeout <s>`, `--confirm true` for destructive ops), `Visibility`, `IconName`;
  execution wraps the existing tool runner; results map to `{ success, message }`.
- `packages/cli/src/kernel/adapters/database/{aspire-command-executor,operation-runner}.ts`: when a
  running AppHost is detected (`aspire ps --format Json` match), call
  `aspire resource <db-tool> <op> --<args> --non-interactive --nologo` instead of starting a second
  AppHost; keep the standalone path when none runs.
- Bounded wait (#863): `aspire wait <db> --status healthy --timeout <n>` before the op; exit 17/18 →
  actionable message (S6 makes "healthy" truthful).
- E2E: replace the "restart after DB prep" script (`ASPIRE_RESTART_SCRIPT`) with a typed command
  call where the flow allows; keep restart as fallback.

## Boundaries

No dashboard interaction prompts (`promptInputs`) — commands must be non-interactive from the CLI.
No changes to plugin contributions. DDX-1 (#411) vocabulary follows; this PR does not implement it.

## Acceptance

- [ ] `aspire resource <db-tool> --help` lists the typed commands with argument docs (receipt).
- [ ] `aspire resource <db-tool> migrate --timeout 60` succeeds; `reset` without `--confirm true`
      fails before mutation.
- [ ] `netscript db init` against an Unhealthy-but-Running Postgres exits within the timeout with
      the actionable message (#863 acceptance) — `Closes #863`.
- [ ] `scaffold.runtime` green on both tiers; no second AppHost is spawned during `db` ops when one
      is running (`aspire ps` count receipt).

## Tests / gates

Generator tests; CLI adapter tests; `scaffold.runtime`; scoped wrappers; `quality:scan`;
`arch:check`; `check:assets-barrel`.

## Docs / static asset regeneration

`deno task gen:assets-barrel`; `docs/site/orchestration-runtime/cli-scaffold.md` command table (S11
prose).

## Related

Part of #<epic>. Depends on S6. Feeds S10, #411 (comment). Related closed: #1011, #1196.
