# Runtime command provenance

The focused proof used product baseline fb759d37e412a986b84eaaf2b41483e5d54c804c
plus the reviewed S2 working-tree changes listed in s2-files.txt. The source hashes
in runtime-source-hashes.json bind the probe and Northwind assets to that evidence.
The S1 schema and seed were unchanged by S2.

Generated local-source project:

```sh
deno run -A packages/cli/bin/netscript-dev.ts init northwind --from northwind --app-name shop-web --ci --no-git --json --path .llm/tmp/showcase-2571
# Subsequent S2 template refresh used the same command with --force.
# Inside the generated project: deno install --allow-scripts.
# Inside its aspire directory: aspire restore --non-interactive --nologo
# Then: aspire start --isolated --non-interactive --nologo
deno run -A packages/cli/bin/netscript-dev.ts db init --project-root .llm/tmp/showcase-2571/northwind --db sqlite --name init
deno run -A packages/cli/bin/netscript-dev.ts db generate --project-root .llm/tmp/showcase-2571/northwind --db sqlite
deno run -A packages/cli/bin/netscript-dev.ts db seed --project-root .llm/tmp/showcase-2571/northwind --db sqlite
```

Seed verification used the generated Prisma client against the SQLite URI supplied by
Aspire: findMany ordered by name, assert six references, repeat db seed, update
NW-10248 to status held, repeat db seed, assert six references and held still present,
then restore pending. No provider or synthetic display rows were involved.

The runtime-control sequence uses exact logical resource orders and AppHost path
`.llm/tmp/showcase-2571/northwind/aspire/apphost.mts`:

```sh
aspire resource orders stop --apphost <above-path> --non-interactive --nologo
deno run -A packages/cli/e2e/src/application/gates/scaffold/runtime/probe-northwind.ts .llm/tmp/showcase-2571/northwind shop-web <above-path> unavailable
# Same probe without unavailable: expected exit1.
aspire resource orders start --apphost <above-path> --non-interactive --nologo
aspire wait orders --status healthy --timeout 60 --apphost <above-path> --non-interactive --nologo
# Same probe without unavailable: expected exit0.
```

Final cleanup: `aspire stop --apphost <above-path> --non-interactive --nologo`, exit0.
A subsequent read-only `aspire ps --format Json --non-interactive --nologo` no longer
listed this AppHost. Other AppHosts were not modified. Raw logs/topology remain private
because they contain host paths/environment; public evidence is scoped to this run.
