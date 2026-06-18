---
layout: layouts/base.vto
title: Add a first-party plugin
---

# Add a first-party plugin

**Goal:** add one of NetScript's first-party plugins — workers, sagas, triggers, or
streams — to an existing workspace, register it, and confirm it is wired up.

This is a task-oriented recipe. It assumes you already have a NetScript workspace
(created with `netscript init`) and that the `netscript` command is on your path. For the
exact APIs each plugin exposes, follow the reference links at the end. For the design
behind the plugin model, see the [explanation](/explanation/) section.

## Before you start

You need:

- An existing NetScript workspace. If you do not have one yet, create it first
  (`netscript init`) — see the [tutorials](/tutorials/).
- The `netscript` command available. Run `netscript --help` to confirm, and
  `netscript plugin --help` for the option spelling in your installed version.

Throughout this guide, run commands from your workspace root. Where a command needs to
target a specific project, pass `--project-root <path>` (it defaults to the current
directory).

## Step 1 — Choose the plugin kind

Each first-party plugin has a *kind* you pass to the command and a conventional installed
*name*:

| Kind      | Conventional name | JSR package                  |
| --------- | ----------------- | ---------------------------- |
| `worker`  | `workers`         | `@netscript/plugin-workers`  |
| `saga`    | `sagas`           | `@netscript/plugin-sagas`    |
| `trigger` | `triggers`        | `@netscript/plugin-triggers` |
| `stream`  | `streams`         | `@netscript/plugin-streams`  |

Pick the kind for the capability you need:

- **workers** — background job scheduling, task execution, and worker API endpoints.
- **sagas** — durable saga orchestration and workflow APIs.
- **triggers** — trigger ingress, scheduling, and file watching.
- **streams** — durable, change-data stream services.

## Step 2 — Add the plugin

Run `netscript plugin add` with the kind. This scaffolds the plugin package and updates
your workspace plugin registration:

```bash
netscript plugin add worker --name workers
```

Useful options (run `netscript plugin add --help` for the full, version-accurate list):

- `--name <name>` — the installed plugin name (use the conventional name above unless you
  have a reason to differ).
- `--samples` / `--no-samples` — include or omit sample/example code.
- `--project-root <path>` — target a workspace other than the current directory.
- `--port <port>` — set the plugin service port where applicable.
- `--service-refs <refs>` / `--plugin-refs <refs>` — wire references to existing services
  or plugins.
- `--db <engine-or-key>` / `--no-db` — configure or skip database wiring.
- `--force` — overwrite existing files when re-running.

To add the other plugins, repeat with the matching kind, for example:

```bash
netscript plugin add saga --name sagas
netscript plugin add trigger --name triggers
netscript plugin add stream --name streams
```

## Step 3 — Generate the plugin registry

After adding plugins, regenerate the plugin registries so the runtime can discover them:

```bash
netscript generate plugins
```

If a plugin contributes runtime configuration schemas, also run:

```bash
netscript generate runtime-schemas
```

## Step 4 — Verify the plugin is registered

List the registered plugins to confirm your new plugin appears:

```bash
netscript plugin list
```

Then run the health check:

```bash
netscript plugin doctor
```

`plugin doctor` checks installed NetScript plugin health and reports wiring problems. A
clean run means the plugin is registered and ready to use.

## Next steps

- Use the plugin's APIs — see its reference page:
  [`@netscript/plugin-workers`](/reference/workers/),
  [`@netscript/plugin-sagas`](/reference/sagas/),
  [`@netscript/plugin-triggers`](/reference/triggers/), and
  [`@netscript/plugin-streams`](/reference/streams/).
- Manage plugins later with `netscript plugin info`, `netscript plugin update`, and
  `netscript plugin remove` (run `netscript plugin --help` for details).
- Browse the full package and plugin index in the [reference](/reference/), or read the
  [explanation](/explanation/) for the concepts behind the plugin model.
