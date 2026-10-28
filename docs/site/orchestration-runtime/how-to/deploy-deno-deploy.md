---
layout: layouts/base.vto
title: Deploy to Deno Deploy
description: Push a stateless entrypoint to Deno Deploy, promote it, and read its status and logs.
templateEngine: [vento, md]
order: 103
oldUrl: /how-to/deploy-deno-deploy/
---

# Deploy to Deno Deploy

This recipe pushes a NetScript workspace to [Deno Deploy](https://deno.com/deploy) with
`netscript deploy deno-deploy <op>`: preflight it for the hosted platform, push a preview, promote
to production, and read status and logs.

The command is a thin router over the native `deno deploy` CLI. NetScript resolves your
`deploy.targets['deno-deploy']` config, layers any flags on top, runs an unstable-API guard and
shells out to `deno deploy`. Authentication, upload and the platform itself belong to the
`deno deploy` CLI. For containers, Kubernetes, Azure, Cloud Run and bare metal, use
[Deploy](/orchestration-runtime/how-to/deploy/).

## Before you start

You need:

- **A healthy workspace** that passes `deno task check`. If you haven't built one, start with the
  [Quickstart](/quickstart/).
- **The `deno deploy` CLI on your path.** The `deploy` subcommand ships with a current Deno;
  confirm that `deno deploy --help` resolves.
- **A Deno Deploy account, logged in.** Authentication is entirely the `deno deploy` CLI's own
  token and login flow; NetScript issues no credentials and stores no token. Log in with the CLI,
  or supply its auth environment variables, first.
- **An organization and app name**: the Deno Deploy organization slug and the application to deploy
  into, as config or flags.

The command has five operations: `plan`, `up`, `status`, `logs` and `down`. It has no rollback,
secrets or health-gating operation, and there is no `@netscript/deploy` package.

## Configure the target (`deploy.targets['deno-deploy']`)

Set defaults once in `netscript.config.ts` under `deploy.targets['deno-deploy']`. Every field is
optional and every one has a flag, but config keeps a repeatable push to one line.

```ts
// netscript.config.ts
export default {
  deploy: {
    targets: {
      "deno-deploy": {
        org: "my-org",          // Deno Deploy organization slug  → deno deploy --org
        app: "my-app",          // application / project name      → deno deploy --app
        entrypoint: "main.ts",  // default "main.ts"               → positional arg to deno deploy
        prod: false,            // default false; true adds --prod
        envFile: ".env.production", // passed as `--env-file <path>` to deno deploy
      },
    },
  },
};
```

{{ comp.apiTable({
  caption: "deploy.targets['deno-deploy'] fields (all optional)",
  rows: [
    { name: "org", type: "string", desc: "Deno Deploy organization slug. Forwarded as <code>--org</code>." },
    { name: "app", type: "string", desc: "Application / project name. Forwarded as <code>--app</code>." },
    { name: "entrypoint", type: "string", desc: "Module the platform runs. Defaults to <code>main.ts</code>. Passed as the positional argument to <code>deno deploy</code>." },
    { name: "prod", type: "boolean", desc: "Defaults to <code>false</code> (preview). When <code>true</code>, the push adds <code>--prod</code>." },
    { name: "envFile", type: "string (path)", desc: "Path to a <code>.env</code>-style file, appended as <code>--env-file &lt;path&gt;</code> to the <code>deno deploy</code> invocation, which reads it directly. NetScript doesn't call <code>deno deploy env load</code>." }
  ]
}) }}

Flags override config for each run. Because nothing in config is required, a fully flag-driven push
(`--org … --app … --entrypoint …`) works with no `deploy` block, so one workspace can target several
organizations and apps from different pipelines.

## The workflow: plan → preview → production

All five operations share the same resolution flags; `up` adds two more.

| Operation | Effect |
| --- | --- |
| `plan` | Runs the unstable-API guard only and never touches the platform. Reports whether the project is ready for Deploy or lists violations. |
| `up` | Runs the guard, then `deno deploy [--prod] …`. |
| `status` | Reads deployment state through `deno deploy show`. |
| `logs` | Shows deployment logs (`deno deploy logs`). |
| `down` | Removes the deployment through `deno deploy delete`. |

| Flag | Applies to | Effect |
| --- | --- | --- |
| `--org <slug>` | all | Organization slug. Overrides `org` from config. |
| `--app <name>` | all | Application / project name. Overrides `app`. |
| `--entrypoint <path>` | all | Entrypoint module. Overrides `entrypoint` (default `main.ts`). |
| `--env-file <path>` | all | Env file forwarded as `--env-file` to `deno deploy`. Overrides `envFile`. |
| `--project-root <dir>` | all | Workspace root to resolve config and the guard against. Defaults to the discovered root or the current directory. |
| `--prod` | `up` | Promote this push to production. Without it, `up` pushes a preview. |
| `--dry-run` | `up` | Run the preflight without pushing, the same as `plan`. |

A first deployment:

1. Preflight the workspace:

   ```bash
   # Guard-only. No push, no platform mutation. Safe to run any time.
   netscript deploy deno-deploy plan --org my-org --app my-app

   # Equivalent, via up:
   netscript deploy deno-deploy up --dry-run --org my-org --app my-app
   ```

2. Push a preview:

   ```bash
   # Push a preview deployment (no --prod). If the guard finds unstable-API
   # usage it warns but still proceeds for a preview.
   netscript deploy deno-deploy up --org my-org --app my-app
   ```

3. Promote to production:

   ```bash
   # Promote to production. If the guard finds unstable-API usage, this
   # REFUSES to push (see the guard callout).
   netscript deploy deno-deploy up --prod --org my-org --app my-app
   ```

4. Observe the deployment, or tear it down:

   ```bash
   # Read state and logs, or delete the deployment.
   netscript deploy deno-deploy status --org my-org --app my-app
   netscript deploy deno-deploy logs   --org my-org --app my-app
   netscript deploy deno-deploy down   --org my-org --app my-app
   ```

If `netscript.config.ts` carries `org`, `app` and `entrypoint`, each command shortens to
`netscript deploy deno-deploy <op>`; any flag you add wins for that run.

## The unstable-API guard

Deno Deploy rejects `--unstable-*` flags, so a project that depends on an unstable API can't run
there. Before any push, NetScript runs a best-effort guard that catches this before you upload. It
scans for these signatures:

| Signature | Flag it needs | API |
| --- | --- | --- |
| `Deno.openKv` | `--unstable-kv` | Deno KV. |
| `Deno.cron` | `--unstable-cron` | Deno cron scheduling. |
| `new BroadcastChannel` | `--unstable-broadcast-channel` | Cross-isolate broadcast channels. |
| `Temporal.` | `--unstable-temporal` | The Temporal API. |

{{ comp callout { type: "warning", title: "up --prod refuses when the guard finds a violation" } }}
The guard reads <code>deno.json#unstable</code> plus the entrypoint source (<code>&lt;root&gt;/&lt;entrypoint&gt;</code> and <code>&lt;root&gt;/src/&lt;entrypoint&gt;</code>), <strong>not</strong> the full module graph. On a match, <code>up --prod</code> refuses and throws, <code>up</code> (preview) warns but proceeds, and <code>plan</code> / <code>up --dry-run</code> report the violations and exit without pushing. Because the scan covers only the entrypoint, a clean <code>plan</code> is a strong signal, not a proof: an unstable API reached only through a deep import may not be flagged.
{{ /comp }}

Many NetScript runtime plugins (workers, sagas, triggers) require Deno KV and therefore
`--unstable-kv`, so their background processors don't fit a single Deno Deploy isolate. Deploy a
KV-free entrypoint here, such as a Fresh app or a stateless oRPC service, and run the KV-backed
processors on infrastructure that permits `--unstable-kv`, as covered in
[Deploy](/orchestration-runtime/how-to/deploy/).

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `deno deploy: command not found` | The native `deno deploy` CLI isn't resolvable; NetScript only shells out to it. | Confirm `deno deploy --help` works in the same shell. |
| Auth error or 401 on push | Authentication is the `deno deploy` CLI's own flow; NetScript stores no token. | Log in with the CLI, or provide its auth environment variables, and retry. |
| `up --prod` throws about unstable APIs | The guard found `Deno.openKv`, `Deno.cron`, `BroadcastChannel` or `Temporal`. | Deploy a KV-free entrypoint, or move the unstable usage off the entrypoint path. |
| The wrong org or app is targeted | Flags override config, and a config default may be stale. | Check `deploy.targets['deno-deploy']`, or pass `--org` and `--app` explicitly. |
| Environment variables aren't applied | The value is passed as `--env-file <path>` to `deno deploy`. | Confirm the path exists and is a `.env`-style file. |
| `down` or `status` behaves unexpectedly | The `deno deploy show` and `delete` subcommands they map to aren't yet verified against a live Deno Deploy account. | NetScript keeps the argv in one adapter, so an upstream change is a framework fix, not a config error. |

## Next step

Make the deployed process observable with
[Add OpenTelemetry](/observability/how-to/add-opentelemetry/). For every command grouped by
workflow, see the [CLI reference](/cli-reference/).
