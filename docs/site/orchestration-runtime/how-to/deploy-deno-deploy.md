---
layout: layouts/base.vto
title: Deploy to Deno Deploy
templateEngine: [vento, md]
order: 103
oldUrl: /how-to/deploy-deno-deploy/
---

# Deploy to Deno Deploy

**Goal:** push a NetScript workspace to [Deno Deploy](https://deno.com/deploy) with a single
first-class command — `netscript deploy deno-deploy <op>` — preflighting it for the hosted
platform, pushing a preview, promoting to production, and reading status and logs, without
hand-rolling a `deno deploy` invocation.

This is the one **runnable managed-platform** path in NetScript today. It is a thin router over the
native `deno deploy` CLI: NetScript resolves your `deploy.targets['deno-deploy']` config, layers any
flags on top, runs an unstable-API guard, and shells out to `deno deploy`. Authentication, upload,
and the platform itself are all owned by the `deno deploy` CLI — NetScript adds the preflight and the
config-to-argv wiring, nothing more.

{{ comp callout { type: "important", title: "This is the managed-platform path; the container/VM path is still manual" } }}
<code>netscript deploy deno-deploy</code> is fully wired and runnable. The Docker, Compose, and
Linux/systemd targets are <strong>config schema only</strong> — there is no runnable
<code>netscript deploy docker|compose|linux</code> verb yet. For those targets you assemble the
deployment yourself from the primitives in the <a href="/how-to/deploy/">Deploy</a> recipe.
{{ /comp }}

## Before you start

{{ comp.apiTable({
  caption: "What you need before your first push",
  rows: [
    { name: "A healthy workspace", type: "netscript init", desc: "A workspace that passes <code>deno task check</code>. If you have not built one, start with <a href='/quickstart/'>Quickstart</a>." },
    { name: "The deno deploy CLI on PATH", type: "external CLI", desc: "NetScript shells out to <code>deno deploy …</code>. The <code>deploy</code> subcommand ships with a current Deno; confirm <code>deno deploy --help</code> resolves before you start." },
    { name: "A Deno Deploy account + auth", type: "deno deploy login", desc: "Authentication is delegated entirely to the <code>deno deploy</code> CLI — its own token/login flow. NetScript issues no credentials and stores no token. Log in with the CLI (or supply its auth env vars) first." },
    { name: "An organization + app name", type: "org / app", desc: "The Deno Deploy organization slug and the application/project name to deploy into. Provide them as config or flags (below)." }
  ]
}) }}

{{ comp callout { type: "note", title: "Where the command lives (and where it does not)" } }}
The surface is the CLI subcommand <code>netscript deploy deno-deploy</code>, wired inside
<code>packages/cli</code>. There is <strong>no</strong> <code>@netscript/deploy</code> package and no
rollback, secrets, or health-gating command — those are described in the deployment doctrine as a
future wave, not shipped. Document and rely on only the five operations below.
{{ /comp }}

## Configure the target (`deploy.targets['deno-deploy']`)

Set defaults once in `netscript.config.ts` under `deploy.targets['deno-deploy']`. Every field is
optional — you can pass everything as flags instead — but config keeps a repeatable push to one line.

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
    { name: "envFile", type: "string (path)", desc: "Environment file path. Passed straight through as <code>--env-file &lt;path&gt;</code> to <code>deno deploy</code> (see the callout below)." }
  ]
}) }}

{{ comp callout { type: "note", title: "envFile is `--env-file`, not `deno deploy env load`" } }}
Some older docstrings describe <code>envFile</code> as being "loaded via <code>deno deploy env
load</code>". The shipped adapter does <strong>not</strong> call <code>env load</code>; it appends
<code>--env-file &lt;path&gt;</code> to the <code>deno deploy</code> invocation. Treat the value as a
path to a <code>.env</code>-style file that <code>deno deploy</code> reads directly.
{{ /comp }}

{{ comp callout { type: "tip", title: "Flags win over config" } }}
Config is the default layer; command-line flags override it per run. Nothing in config is required —
a fully flag-driven push (<code>--org … --app … --entrypoint …</code>) works with no
<code>deploy</code> block at all. This is what lets one workspace target several orgs/apps from
different pipelines without editing <code>netscript.config.ts</code>.
{{ /comp }}

## The workflow: plan → preview → production

The command exposes five operations. All five share the same resolution flags; `up` adds two more.

{{ comp.apiTable({
  caption: "netscript deploy deno-deploy <op>",
  rows: [
    { name: "plan", type: "preflight", desc: "Runs the unstable-API guard only. Never touches the platform. Reports whether the project is Deploy-ready or lists violations." },
    { name: "up", type: "push", desc: "Runs the guard, then shells <code>deno deploy [--prod] …</code>. Adds <code>--prod</code> (promote to production) and <code>--dry-run</code> (equivalent to <code>plan</code>; does not push)." },
    { name: "status", type: "read", desc: "Maps to <code>deno deploy show</code> to read deployment state. Live-account behavior is pending verification." },
    { name: "logs", type: "read", desc: "Shows deployment logs (<code>deno deploy logs</code>)." },
    { name: "down", type: "delete", desc: "Maps to <code>deno deploy delete</code> to remove the deployment. Live-account behavior is pending verification." }
  ]
}) }}

{{ comp.apiTable({
  caption: "Shared flags (all subcommands) + up-only flags",
  rows: [
    { name: "--org <slug>", type: "shared", desc: "Organization slug. Overrides <code>org</code> from config." },
    { name: "--app <name>", type: "shared", desc: "Application / project name. Overrides <code>app</code>." },
    { name: "--entrypoint <path>", type: "shared", desc: "Entrypoint module. Overrides <code>entrypoint</code> (default <code>main.ts</code>)." },
    { name: "--env-file <path>", type: "shared", desc: "Env file forwarded as <code>--env-file</code> to <code>deno deploy</code>. Overrides <code>envFile</code>." },
    { name: "--project-root <dir>", type: "shared", desc: "Workspace root to resolve config + the guard against. Defaults to the discovered root or the current directory." },
    { name: "--prod", type: "up only", desc: "Promote this push to production. Without it, <code>up</code> pushes a preview." },
    { name: "--dry-run", type: "up only", desc: "Run the preflight without pushing — the same effect as <code>plan</code>." }
  ]
}) }}

A typical first deployment walks these steps:

{{ comp.tabbedCode({ tabs: [
  {
    label: "1. Preflight",
    lang: "bash",
    code: "# Guard-only. No push, no platform mutation. Safe to run any time.\nnetscript deploy deno-deploy plan --org my-org --app my-app\n\n# Equivalent, via up:\nnetscript deploy deno-deploy up --dry-run --org my-org --app my-app"
  },
  {
    label: "2. Preview push",
    lang: "bash",
    code: "# Push a preview deployment (no --prod). If the guard finds unstable-API\n# usage it warns but still proceeds for a preview.\nnetscript deploy deno-deploy up --org my-org --app my-app"
  },
  {
    label: "3. Promote to prod",
    lang: "bash",
    code: "# Promote to production. If the guard finds unstable-API usage, this\n# REFUSES to push (see the guard callout).\nnetscript deploy deno-deploy up --prod --org my-org --app my-app"
  },
  {
    label: "4. Observe / tear down",
    lang: "bash",
    code: "# Read state and logs, or delete the deployment.\nnetscript deploy deno-deploy status --org my-org --app my-app\nnetscript deploy deno-deploy logs   --org my-org --app my-app\nnetscript deploy deno-deploy down   --org my-org --app my-app"
  }
] }) }}

If your `netscript.config.ts` already carries the `org`/`app`/`entrypoint`, every line above shortens
to just `netscript deploy deno-deploy <op>` — the config supplies the rest, and any flag you add wins
for that run.

## The unstable-API guard

Before any push, NetScript runs a best-effort **unstable-API guard**. Deno Deploy rejects
`--unstable-*` flags, so a project that depends on an unstable API cannot run there — the guard
catches this before you upload rather than after the platform rejects it.

{{ comp.apiTable({
  caption: "Signatures the guard scans for",
  rows: [
    { name: "Deno.openKv", type: "--unstable-kv", desc: "Deno KV usage." },
    { name: "Deno.cron", type: "--unstable-cron", desc: "Deno cron scheduling." },
    { name: "new BroadcastChannel", type: "--unstable-broadcast-channel", desc: "Cross-isolate broadcast channels." },
    { name: "Temporal.", type: "--unstable-temporal", desc: "The Temporal API." }
  ]
}) }}

{{ comp callout { type: "warning", title: "up --prod refuses when the guard finds a violation" } }}
The guard reads <code>deno.json#unstable</code> plus the entrypoint source
(<code>&lt;root&gt;/&lt;entrypoint&gt;</code> and <code>&lt;root&gt;/src/&lt;entrypoint&gt;</code> —
<strong>not</strong> the full module graph). Behavior on a match:
<ul>
<li><strong><code>up --prod</code></strong> — <strong>refuses</strong> and throws. Deno Deploy would
reject the required <code>--unstable-*</code> flag, so a KV/cron/broadcast/Temporal project is blocked
from production until you remove the dependency or move it off the entrypoint path.</li>
<li><strong><code>up</code> (preview)</strong> — <strong>warns but proceeds</strong>.</li>
<li><strong><code>plan</code> / <code>up --dry-run</code></strong> — reports the violations and exits
without pushing.</li>
</ul>
Because the scan is entrypoint-scoped and best-effort, a clean <code>plan</code> is a strong signal,
not a proof: an unstable API reached only through a deep import may not be flagged.
{{ /comp }}

Many NetScript runtime plugins (workers, sagas, triggers) require Deno KV and therefore
`--unstable-kv`. Those background processors are not a fit for a single Deno Deploy isolate — deploy a
KV-free entrypoint (for example a Fresh app or a stateless oRPC service) here, and run the KV-backed
processors on infrastructure that permits `--unstable-kv`, as covered in the
[Deploy](/how-to/deploy/) recipe.

## Troubleshooting

{{ comp.apiTable({
  caption: "Common failures and what they mean",
  rows: [
    { name: "deno deploy: command not found", type: "PATH", desc: "The native <code>deno deploy</code> CLI is not resolvable. NetScript only shells out to it. Confirm <code>deno deploy --help</code> works in the same shell." },
    { name: "Auth / 401 on push", type: "auth", desc: "Authentication is the <code>deno deploy</code> CLI's own flow — NetScript stores no token. Log in with the CLI (or provide its auth env vars) and retry." },
    { name: "up --prod throws about unstable APIs", type: "guard", desc: "The guard found <code>Deno.openKv</code>/<code>Deno.cron</code>/<code>BroadcastChannel</code>/<code>Temporal</code>. Deploy a KV-free entrypoint, or move the unstable usage off the entrypoint path." },
    { name: "Wrong org/app targeted", type: "precedence", desc: "Flags override config. Check for a stale <code>deploy.targets['deno-deploy']</code> default, or pass <code>--org</code>/<code>--app</code> explicitly." },
    { name: "env vars not applied", type: "env-file", desc: "The value is passed as <code>--env-file &lt;path&gt;</code> to <code>deno deploy</code>, not <code>deno deploy env load</code>. Confirm the path exists and is a <code>.env</code>-style file." },
    { name: "down / status behaves unexpectedly", type: "platform", desc: "The <code>deno deploy show</code>/<code>delete</code> subcommands <code>status</code>/<code>down</code> map to are not yet verified against a live Deno Deploy account, so their exact argv and behavior are pending live-account verification. NetScript isolates the argv in one adapter, so any upstream change is a framework-side fix, not a config error." }
  ]
}) }}

## Where to go next

{{ comp.featureGrid({ items: [
  {
    title: "Deploy (containers & bare metal)",
    body: "The manual path: deployable units from appsettings.json, backing services, per-process deno run commands, and the --no-aspire escape hatch.",
    href: "/how-to/deploy/",
    icon: "◆"
  },
  {
    title: "Deploy locally with Aspire",
    body: "Run the whole graph on one machine under the Aspire AppHost before you ship anything remote.",
    href: "/how-to/deploy-local-aspire/",
    icon: "◎"
  },
  {
    title: "Add OpenTelemetry",
    body: "Wire spans and traceparent propagation to your OTLP collector so a deployed process is observable.",
    href: "/how-to/add-opentelemetry/",
    icon: "≋"
  }
] }) }}

For every CLI command grouped by workflow, see the [CLI reference](/cli-reference/).
