# [aspire-13-5 S13] Stale version-bound surface cleanup (internal skills, templates, examples, comments)

> DRAFT TEXT ONLY. Labels: `type:chore`, `epic:aspire-13-5`, `area:cli`, `area:agentic`,
> `area:tooling`, `priority:p2`, `status:triage`. Milestone: `0.0.7`.

## Summary

Close every row of `stale-surface-inventory.md` whose disposition is **S13** — the version-bound
assumptions that no other slice owns — and make the parity gate's archival exemption list the
recorded truth.

## Scope (from the inventory)

- `.agents/skills/codex-wsl-remote/SKILL.md:149` (+ `.claude` mirror via `agentic:sync-claude`):
  replace the `Aspire CLI 13.3.0` toolchain snapshot with a reference to `.github/toolchain.env`.
- `packages/cli/src/kernel/application/scaffold/render-ts-apphost.ts:81`: "Aspire 13.4 validates…" →
  "Aspire ≥ 13.4 validates…" (or drop the version).
- Telemetry example + Windows env:
  `assets/app/routes/examples/telemetry/(_shared)/telemetry-trace.ts.template:70`,
  `adapters/windows/environment/env-file-{values,content}.ts:213,293` — decide once: either resolve
  the dashboard through the same `aspire ps --format Json` fallback `.netscript/aspire-cli.ts` uses,
  or document `ASPIRE_DASHBOARD_PORT` as the only supported override (ephemeral-port model in
  `docs/site/explanation/aspire.md`). Apply the decision to `packages/mcp` precedence docs if it
  changes (`README.md:318`, `docs/site/reference/mcp/index.md:194`).
- `scaffold-aspire.ts:9-12` `SCAFFOLD_COMMUNITY_TOOLKIT` (`13.2.1-beta.532`, unused by default):
  delete or re-pin to 13.5.0 with a consumer.
- Scaffolded consumer CI template
  `assets/workspace/github/workflows/deploy-compose-ghcr.yml.template:51`: emit
  `dotnet tool install Aspire.Cli --version {{ASPIRE_SDK}}` (from `SCAFFOLD_VERSIONS`) before
  `aspire restore`, so consumer CI cannot drift from the scaffold's SDK.
- `.llm/tools/agentic/teardown/ownership.ts:48`: `MCP_COMMAND` regex covers `aspire agent mcp` (if
  S7 has not already done it).
- Parity gate: encode the archival exemption list from `stale-surface-inventory.md` as the exclusion
  set of `check:aspire-version-parity` (S1 creates the gate; S13 finalises the list and flips
  `skills/`/`docs/` from warn to fail once S9/S11 land).

## Boundaries

No prose in `docs/site` (S11), no skill behaviour text (S9), no generator emission for resources
(S4–S8). Never edit archival-exempt paths.

## Acceptance

- [ ] `rtk grep -rnE '13\.[0-4]\.[0-9]|Aspire 13\.[0-4]' --exclude-dir=.git --exclude-dir=node_modules .`
      outside the archival exemption list returns nothing.
- [ ] `check:aspire-version-parity` in **fail** mode for all enforce rows; exempt hits reported as
      `info`.
- [ ] Template tests updated (`deploy-compose-ghcr` emits the pinned install; telemetry example
      resolves the dashboard per the decision).
- [ ] `check:assets-barrel`, `agentic:sync-claude:check` green.

## Tests / gates

Scoped wrappers on `packages/cli`; `quality:scan`; `arch:check`; `check:assets-barrel`; parity gate.

## Docs / static asset regeneration

`deno task gen:assets-barrel`; `deno task agentic:sync-claude`.

## Related

Part of #<epic>. Depends on S1 (gate), S9, S11 (flip to fail). Inventory:
`stale-surface-inventory.md`.
