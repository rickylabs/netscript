# NetScript Plugin Author Guide

> Status: implementation guide for the post-rewrite plugin platform. Audience: authors of
> first-party and third-party NetScript plugins. Scope: manifest authoring, CLI verbs, scaffold
> behavior, generated registries, local validation, and temporary marketplace discovery.

This guide describes the supported authoring path after the plugin platform rewrite. The framework
now treats plugins as manifest-driven packages. Users should not hand-edit plugin registries or
runtime registry files.

The current official plugins are:

- `@netscript/plugin-workers` in `plugins/workers/`
- `@netscript/plugin-sagas` in `plugins/sagas/`
- `@netscript/plugin-triggers` in `plugins/triggers/`
- `@netscript/plugin-streams` in `plugins/streams/`

There is no `hello-world` or `test` official plugin.

## 1. Five Minute Path

1. Create or copy a plugin package.
2. Author a manifest with `definePlugin(name, version).with*().build()`.
3. Add any plugin CLI entrypoint under a `./cli` export.
4. Validate with `plugin list`, `plugin doctor`, and `generate plugins`.
5. Publish to JSR when the package is ready.

Example user flow:

```bash
netscript plugin add @acme/plugin-analytics --name analytics
netscript plugin list
netscript plugin doctor
netscript generate plugins
```

Temporary discovery flow:

```bash
netscript marketplace search analytics
netscript marketplace publish
```

The marketplace commands are stubs for now. They print JSR-oriented guidance until the hosted
marketplace exists.

## 2. Package Shape

A plugin package should have one clear reason to exist. Keep domain logic, runtime logic, CLI
commands, scaffolding, and generated-output support in separate folders.

Recommended shape:

```text
plugins/plugin-analytics/
  deno.json
  mod.ts
  scaffold.plugin.json
  src/
    public/
    cli/
      composition/
    scaffolding/
    e2e/
    aspire/
    runtime/
  tests/
  README.md
```

Use role-based folder names. Avoid generic `utils`, `helpers`, `common`, `lib`, and `interfaces`
folders unless there is documented architecture debt.

## 3. Core Package Decision

Only create a `*-core` package when another package or user project must import stable
authoring/runtime primitives from it.

Use a core package when the plugin provides:

- a public DSL such as `defineJob`, `defineSaga`, or `defineWebhook`;
- reusable domain types;
- runtime ports or adapters that users compose directly;
- testing helpers that are useful outside the plugin package.

Do not create a core package only to split files. A service-only plugin can stay as one plugin
package.

The current official split is:

- `packages/plugin-workers-core/` plus `plugins/workers/`
- `packages/plugin-sagas-core/` plus `plugins/sagas/`
- `packages/plugin-triggers-core/` plus `plugins/triggers/`
- `packages/plugin-streams-core/` plus `plugins/streams/`

## 4. Manifest Authoring

Use the typestate builder. The old flat object form is not the supported public shape.

```ts
import { definePlugin } from '@netscript/plugin';

export default definePlugin('@acme/plugin-analytics', '0.0.1-alpha.0')
  .withDisplayName('Analytics')
  .withDescription('Analytics ingestion for NetScript projects.')
  .withLicense('MIT')
  .withService({
    name: 'analytics-api',
    entrypoint: './services/src/main.ts',
    port: 9001,
  })
  .withRuntimeConfigTopics([{
    name: 'analytics',
    schemaPath: './runtime/schema.json',
  }])
  .build();
```

The builder names extension axes explicitly. This keeps marketplace discovery, host diagnostics,
scaffold installation, and future compatibility checks using the same metadata.

## 5. Contribution Axes

A plugin can contribute one or more axes:

- service process
- background processor
- runtime config topic
- contracts
- database schema or migration
- stream topic
- telemetry metadata
- Aspire resources
- E2E gates
- item scaffolding

Do not hide new axes behind arbitrary metadata. If a contribution changes host behavior, name the
axis and add a typed manifest field.

## 6. CLI Entry Points

Plugins may expose a CLI entrypoint through a JSR subpath such as `./cli`. Framework-owned lifecycle
commands can dispatch to that CLI.

Supported lifecycle verbs include:

- `plugin info <name>`
- `plugin update <name>`
- `plugin remove <name>`
- `plugin doctor`

Plugin-owned verbs should use the shared plugin CLI composition helpers instead of depending
directly on root CLI internals.

The framework owns root command routing. A plugin owns its package-local commands and any item
scaffolding it exposes.

## 7. Installation Metadata

`scaffold.plugin.json` describes how the public CLI can install an official plugin into a generated
project.

Required metadata includes:

- canonical kind, such as `worker`, `saga`, `trigger`, or `stream`;
- display name;
- service or background processor entrypoints;
- permission flags;
- database and KV requirements;
- default telemetry behavior;
- concurrency support when applicable.

Permission flags must be explicit. Workers and sagas that require Deno KV need `--unstable-kv` in
the scaffold provider metadata and generated Aspire wiring.

## 8. Generated Registries

Users should not manually edit these old surfaces:

- `plugins/registry.ts`
- `workers/jobs/_registry.ts`
- `sagas/_registry.ts`
- `triggers/_registry.ts`

The walker generates registry output under `.netscript/generated/`.

Use:

```bash
netscript generate plugins
```

The command discovers configured plugin manifests from `netscript.config.ts`, walks project source,
extracts supported call sites, and writes generated per-axis registries.

Generated output is runtime material. Keep authored source in normal project folders such as
`workers/jobs/`, `sagas/`, and `triggers/`.

## 9. Authoring Jobs, Sagas, And Triggers

Use the domain core package for the axis you are authoring.

Worker jobs:

```ts
import { defineJob } from '@netscript/plugin-workers-core';

export const syncCatalog = defineJob('sync-catalog')
  .entrypoint('./workers/jobs/sync-catalog.ts')
  .name('Sync Catalog')
  .build();
```

Sagas:

```ts
import { defineSaga } from '@netscript/plugin-sagas-core';

export const onboarding = defineSaga('user-onboarding')
  .name('User Onboarding')
  .build();
```

Webhook triggers:

```ts
import { defineWebhook } from '@netscript/plugin-triggers-core';

export default defineWebhook('customer-created')
  .path('/customers/created')
  .build();
```

The current extractor recognizes exported `defineJob`, `defineSaga`, and `defineWebhook` call sites.
A regex-based implementation is tracked as architecture debt under `PLG-WALKER-AST`.

## 10. Host Configuration

Generated projects activate plugins in `netscript.config.ts` with a `plugins` array.

```ts
export default defineConfig({
  name: 'my-app',
  version: '1.0.0',
  plugins: [
    './plugins/workers/mod.ts',
    './plugins/sagas/mod.ts',
  ],
});
```

The old root config keys `workers`, `sagas`, `triggers`, and `runtimeConfig` are not the userland
plugin authoring surface. Plugin packages should expose manifest contributions and generated runtime
material instead.

## 11. Local Validation

Run focused checks while authoring:

```bash
deno task check:packages
deno task check:plugins
deno run -A packages/cli/bin/netscript.ts plugin list --project-root .
deno run -A packages/cli/bin/netscript.ts plugin doctor --project-root .
deno run -A packages/cli/bin/netscript.ts generate plugins --project-root .
```

For scaffold parity:

```bash
deno run -A packages/cli/e2e/cli.ts run scaffold.plugins
```

For a generated project, run plugin checks before broad project checks. A full project may need
Aspire restore, database generation, and Fresh route generation before `deno check --unstable-kv .`
can pass.

## 12. E2E Gates

Plugins can expose E2E contributions so scaffold suites can validate behavior.

Good gates are:

- deterministic;
- isolated to the generated project;
- clear about required services;
- explicit about command output and failure messages.

The official scaffold plugin suite currently verifies:

- plugin installation for workers, sagas, triggers, and streams;
- `plugin list`;
- `netscript generate plugins`;
- `plugin doctor`.

Third-party plugins should follow the same pattern before marketplace listing.

## 13. Marketplace Readiness

The hosted marketplace is not implemented yet. Current commands are stubs:

```bash
netscript marketplace search queues
netscript marketplace publish
```

Until the marketplace backend exists, publish packages to JSR and use searchable names and
descriptions. Prefer package names that include `plugin` and describe the domain directly, such as
`@acme/plugin-analytics`.

Marketplace-ready plugins should provide:

- a stable manifest;
- a README with installation and usage;
- explicit permissions;
- clear compatibility notes;
- E2E evidence;
- JSR publish readiness.

## 14. Quality Bar

Before publishing, verify:

- `deno.json` has package name, version, license, exports, tasks, and publish configuration;
- public `mod.ts` is a small barrel plus manifest export;
- no public `as any`;
- no dependency on another non-core plugin package;
- no manual registry instructions;
- no stale `plugins/hello-world` or `test` plugin references;
- examples use `definePlugin(name, version).with*().build()`;
- lifecycle commands behave under `plugin info`, `plugin update`, `plugin remove`, and
  `plugin doctor`;
- `netscript generate plugins` emits all expected generated files.

## 15. What Plugin Authors Do Not Own

Plugin authors should not:

- edit root CLI source for every plugin;
- maintain `plugins/registry.ts`;
- maintain `_registry.ts` files in runtime folders;
- hardcode official plugin paths in core packages;
- make the framework know about a fixed set of marketplace packages;
- depend on another plugin package when a `*-core` package is the intended public surface.

The framework owns discovery, command routing, host diagnostics, generated registry emission, and
marketplace plumbing. Plugin authors own manifest metadata, package-local commands, runtime
behavior, and contribution semantics.

## 16. Manual Full Scaffold Review

Maintainers can create a full local scaffold for review:

```bash
deno run -A packages/cli/bin/netscript-dev.ts init full-test \
  --path scaffold \
  --db postgres \
  --service --service-name users --service-port 3001 \
  --ci --yes --no-git --force

cd scaffold/full-test
deno run -A ../../packages/cli/bin/netscript-dev.ts plugin add worker --name workers --project-root . --force
deno run -A ../../packages/cli/bin/netscript-dev.ts plugin add saga --name sagas --project-root . --force
deno run -A ../../packages/cli/bin/netscript-dev.ts plugin add trigger --name triggers --project-root . --force
deno run -A ../../packages/cli/bin/netscript-dev.ts plugin add stream --name streams --project-root . --force
deno run -A ../../packages/cli/bin/netscript-dev.ts plugin list
deno run -A ../../packages/cli/bin/netscript-dev.ts plugin doctor --project-root .
```

The `scaffold/` directory is gitignored. Keep this project available for manual inspection when
validating platform polish work.
