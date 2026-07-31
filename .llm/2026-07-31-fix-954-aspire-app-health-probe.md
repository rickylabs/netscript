# 2026-07-31 — #954: generated apps report Healthy while SSR returns 500

Run dir: `.llm/runs/fix-aspire-app-health-probe--954/` · Branch `fix/aspire-app-health-probe` · PR
[#963](https://github.com/rickylabs/netscript/pull/963)

## What it turned out to be

Not a probe aimed at the wrong thing — **no probe at all**. The Aspire helper generator registered
no health check for any generated resource. Aspire's documented fallback then decides readiness:
a resource with no registered health check is ready once it reaches `Running`, which for an
`addExecutable` resource means "the process was spawned". So `aspire wait <app>` returned healthy
for an app that could not render a page.

Fix: `generateRegisterApps` now emits
`withHttpHealthCheck({ path, endpointName: 'http' })` for `app`-type entries with a port, targeting
the app's own server-rendered `/health` route (already scaffolded, and Aspire's probe sends no
`Accept` header so it takes the SSR branch). Path is overridable per app via
`AppEntry.HealthCheckPath`, with `false` as the opt-out.

## Two things worth remembering

1. **Aspire's docs disagree with the generated TypeScript SDK.** The docs show
   `withHttpHealthCheck('/health')`; SDK 13.4.6 generates
   `withHttpHealthCheck(options?: { path?, statusCode?, endpointName? })`. The cheapest way to settle
   this class of question is to run `aspire restore` against a throwaway `apphost.mts` pinned to the
   scaffold's SDK version and grep the generated `.aspire/modules/aspire.mts`. `aspire` and `dotnet`
   are on PATH in WSL, and the restore takes ~2 minutes.

2. **`scaffold.runtime` never asked the generated app for a page.** It brought up the whole AppHost,
   waited on every database, cache, and plugin resource and probed their `/health`, but issued zero
   HTTP requests to any app route. `behavior.ui-render` — the only app-shaped gate — renders AI
   payload components in-process and never touches the running server. That is how "Healthy and
   500" cleared the merge-readiness suite. Now guarded by `runtime.wait.dashboard` +
   `behavior.app-home` (2xx **and** actually HTML — a 500 error page is `text/html` too).

## Deliberately not done

- #953 (the SSR failure itself) — the reproduction, not the defect.
- Probes for services / plugins / background processors. Same root cause, but first-party plugin
  health paths differ (`/health`, `/health/live`, `/health/ready`), so this needs declared
  per-resource paths rather than a default. Worth its own issue.
