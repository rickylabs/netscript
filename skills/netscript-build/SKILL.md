---
name: netscript-build
description: "Scaffold and build NetScript applications with the `netscript` CLI. USE FOR: init a project, contract-first flow, database lifecycle (init/generate/migrate/seed/status), add and sync plugins, add services, add UI, generate registries. DO NOT USE FOR: monitoring, debugging, or performance analysis (use netscript-operate); Aspire orchestration (use the aspire skill)."
---

# NetScript Build

Change the project with real `netscript` CLI verbs. Prefer the CLI for every mutation; discover the
current verb surface with the `list_commands` MCP tool if unsure.

## Verb map

| Task | Command |
|---|---|
| Create a new project | `netscript init` |
| Add a contract | `netscript contract add` |
| List contracts | `netscript contract list` |
| Generate from contracts | `netscript generate runtime-schemas` |
| Generate plugin registries | `netscript generate plugins` |
| Add a service | `netscript service add` |
| List services | `netscript service list` |
| Generate service wiring | `netscript service generate` |
| Add a plugin | `netscript plugin install` |
| Sync installed plugins | `netscript plugin sync` |
| Plugin diagnostics | `netscript plugin doctor` |
| List / inspect plugins | `netscript plugin list` / `netscript plugin info` |
| Initialize UI | `netscript ui:init` |
| Add a UI page/component | `netscript ui:add` |

## Database lifecycle

| Step | Command |
|---|---|
| Initialize database wiring | `netscript db init` |
| Generate migrations/artifacts | `netscript db generate` |
| Apply migrations | `netscript db migrate` |
| Seed data | `netscript db seed` |
| Check status | `netscript db status` |

Run in order: `init → generate → migrate → seed`, then `status` to confirm.

## Workflows

**Contract-first.**
`netscript contract add` (define the schema/type contract) → `netscript generate runtime-schemas`
(emit generated types) → implement against the generated surface. Re-run `generate` after every
contract change; do not hand-edit generated output.

**Plugin lifecycle.**
`netscript plugin install` → `netscript plugin sync` → `netscript plugin doctor`. Regenerate the
registry with `netscript generate plugins` when the plugin set changes.

**Add a service.**
`netscript service add` → `netscript service generate` to produce wiring.

## Safety rules

- Never hand-edit generated registries or generated types — re-run the generator instead.
- Do not delete lock files or caches.
- Run generators after any contract, plugin, or service change so the generated surface stays in
  sync.

## Boundaries

- Observing the app (health, failing runs, performance) lives in `netscript-operate`.
- Aspire start/stop and the resource graph live in the `aspire` skill.
