# KV-only consumer acceptance

Run from the repository root:

```sh
deno run --no-lock -A packages/cli/e2e/fixtures/kv-only/run-adoption.ts .llm/tmp/kv-only-proof
```

Choose a fresh destination beneath the checkout. Maintainer init creates a local-source consumer;
this command does not attest a published JSR installation. It requires Deno, the pinned Aspire
CLI and .NET SDK, and a reachable Garnet backend. On hosts without a local container runtime,
the supported `NETSCRIPT_CACHE_MODE=Executable` setting runs Garnet as a .NET tool. Ensure the
installed .NET executable is on PATH in subprocess working directories as well.

The command creates a clean consumer with `init --db none --cache false`. It installs streams
(the workers/sagas composition dependency), workers, sagas, triggers and auth with
`--no-db --no-samples`, selecting `kv-oauth`. Plugins provision their declared KV dependency.
The initial empty registries must generate and pass doctor. It then uses the installed plugin
CLIs to add actual job, saga and webhook definitions, regenerates, and repeats doctor.

The consumer must have no database resources, SQL schema contributions, database URL/provider
bindings or database-dependent plugin processes. The ordinary plugin service context still
carries settings and KV through the supported lazy context seam; the detached runner has no
host context or DB environment at all.

The proof checks userland and generated registries, lints all Aspire helpers, restores Aspire,
and checks the helpers against the real restored SDK. Deno needs Node's `.mjs` to `.mts`
resolution for that SDK; the check also reads the AppHost's declared JSON-RPC dependency into
a private import map. No replacement SDK or generated SDK edits are used.

It starts an isolated AppHost and requires every application process and infrastructure resource
to be Running/Healthy. Aspire's `BrowserLogs` entries describe on-demand browser sessions and
are excluded from this application-process assertion. The three background children must also
serve their real `/health` payload with `state: ready`, `registryReady: true` and
`dependencyReady: true`; streams must pass `/health/ready`.

Acceptance requires persisted effects:

- Trigger the exact proof job through the workers API and read its completed execution.
- Accept the exact proof webhook, wait for its event ID to become completed, and require another
  completed proof job from its enqueue action.
- Publish a saga message and read its persisted state. Stop only Aspire's saga child, start the
  same installed runner directly in a separate Deno process, and require its readiness receipt.
  Send a duplicate followed by a fresh barrier message, then another duplicate and completion.
  The final count and version must both be three. This proves persistence, replay protection,
  and work continuing independently of the web app and Aspire's background supervisor.

The script stops and reaps its detached runner, restores Aspire's saga child, checks readiness
again, and stops only its exact AppHost. It writes `kv-only-receipt.json` under the destination
parent. The receipt contains logical resource states and workflow evidence without connection
details. A failed step exits nonzero and leaves acceptance unproven; raw command diagnostics
remain local. The generated project remains available for inspection.

`kv-only-plugins_test.ts` runs installation, empty-registry doctor, definition generation,
userland checks, and helper lint without starting Aspire. Its controls inject a DB requirement
and an unused helper variable and require both checks to fail. Extend `definitions.ts` and the
persisted-effect assertions in `runtime.ts` together when adding another workflow.

This is an opt-in acceptance fixture, not a new CI tier. The existing `scaffold.runtime` suites
cover PostgreSQL and SQLite. This proof supplements the coordinator-owned full runtime CI
verdict; it does not replace it.
