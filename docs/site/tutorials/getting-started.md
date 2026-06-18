---
layout: layouts/base.vto
title: Getting started
---

# Getting started

This tutorial takes you from an empty directory to a running NetScript workspace. Follow
each step in order and you will end with a scaffolded project you can type-check and explore.
It is a guided happy path — not an exhaustive option list. When you want the precise spelling
of a command or flag, the [`@netscript/cli` reference](/reference/cli/) is the source of truth;
to understand *why* the workspace is laid out the way it is, read the
[explanation](/explanation/).

## Before you begin

You will need:

- **[Deno](https://deno.com/) 2.x** on your `PATH`. Check with `deno --version`.
- A terminal and an empty working directory.

NetScript ships its tooling as the `@netscript/cli` package on JSR. Everything in this
tutorial runs through the public `netscript` command, which operates on ordinary generated
workspaces backed by published `@netscript/*` packages — you do not need a checkout of the
NetScript repository.

## Step 1 — Install the CLI

Install the `netscript` command from JSR:

```sh
deno install --global --allow-all --name netscript jsr:@netscript/cli/bin
```

Confirm it is available and inspect the command groups:

```sh
netscript --help
```

You should see the public command groups: `init`, `contract`, `db`, `deploy`, `generate`,
`plugin`, and `service`.

> If you prefer not to install globally, you can run the same command tree ad-hoc with
> `deno run -A jsr:@netscript/cli/bin <command>`. The rest of this tutorial assumes the
> installed `netscript` form.

## Step 2 — Preview the scaffold with a dry run

Before writing any files, ask the CLI what it _would_ create. The `--dry-run` flag plans the
scaffold and prints the result without touching disk:

```sh
netscript init my-app --dry-run
```

`netscript init` validates your options, then runs an ordered pipeline that lays down the
project root, Aspire orchestration, contracts, the Fresh app workspace, an empty plugin
registry, and (optionally) a database workspace and an example service. The dry run reports
the file and directory totals for each phase, so you can see the shape of the project before
committing to it.

## Step 3 — Create the workspace

When the plan looks right, create the project for real:

```sh
netscript init my-app
```

This scaffolds a `my-app/` workspace, formats the generated output with `deno fmt`, and
initializes a git repository. On completion the CLI prints a **next steps** summary — the
sequence of commands tailored to the options you chose. Keep that summary handy; the steps
below mirror the common path.

A few options you will reach for early (run `netscript init --help` for the full list):

- `--service --service-name <name> --service-port <port>` — include an example service.
- `--db <engine>` — scaffold a database workspace for the given engine (omit, or use
  `--db none`, to skip database tooling).
- `--no-aspire` — skip the Aspire orchestration files.
- `--editor <none|zed|vscode>` — generate editor settings.

Then enter the workspace:

```sh
cd my-app
```

## Step 4 — Add a plugin

NetScript background-processing capabilities are delivered as plugins. Add a worker plugin to
the workspace:

```sh
netscript plugin add worker --name workers --samples
```

The supported first-party plugin kinds and their conventional installed names are:

| Kind      | Conventional name |
| --------- | ----------------- |
| `worker`  | `workers`         |
| `saga`    | `sagas`           |
| `trigger` | `triggers`        |
| `stream`  | `streams`         |

`--samples` includes example code so you have something to read and run. List what is
registered at any time:

```sh
netscript plugin list
```

## Step 5 — Generate the plugin registry

After adding or changing plugins, regenerate the registry the runtime reads:

```sh
netscript generate plugins
```

If your workspace declares runtime configuration schemas, you can also regenerate those:

```sh
netscript generate runtime-schemas
```

## Step 6 — Verify the workspace type-checks

A freshly scaffolded NetScript workspace is meant to type-check cleanly. From the project
root, run the Deno checker over the generated workspace members:

```sh
deno check --unstable-kv ./packages ./plugins ./services
```

(Adjust the member list to match the directories your chosen options created — for example
add `./workers` after Step 4, or `./database` if you scaffolded with `--db`.) A clean check
confirms the scaffold, the plugin you added, and the regenerated registry all line up.

## Step 7 — Check plugin health

Finally, run the plugin doctor to confirm the installed plugins are wired correctly:

```sh
netscript plugin doctor
```

## What you built

You now have a working NetScript workspace: a scaffolded project with contracts and a Fresh
app, a worker plugin with sample code, a generated plugin registry, and a clean type-check.

## Where to go next

- **Solve a specific task** — see the [how-to guides](/how-to/) for focused recipes such as
  adding services, databases, and deployments.
- **Look up an exact API** — every public package and plugin has generated API docs in the
  [reference](/reference/); start with the [`@netscript/cli` reference](/reference/cli/).
- **Understand the design** — the [explanation](/explanation/) covers the NetScript plugin
  model, contracts, and orchestration choices.
