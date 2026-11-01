# Generated workspace pages

This guide is for template maintainers, including the showcase work in #2571.

The generated home and dashboard share `routes/(_components)/dashboard-view.tsx`.
They compose the installed Fresh UI registry components; `assets/workspace.css`
owns only page layout. Do not fork registry components or add demo business data.

To add a capability, extend the safe projection in `lib/scaffold-contract.ts` and
its server loader in `lib/scaffold-capabilities.ts`, then compose a view using the
existing components. Distinguish missing configuration, an unavailable service,
and a successful empty response. Only pass safe presentation values to islands.
Never pass configuration, credentials, paths, or raw server exceptions.

Add pages to `navigation.ts`; typed aliases live in `router.ts` and are generated
against the actual route manifest. The development design links remain available
for the scaffold runtime probe. The canonical generated service examples remain
the service mutation surface.

Template registration has three steps: add the manifest key, load it through
`scaffold-template-assets.ts`, and emit it from `write-app-files.ts`. Regenerate the
embedded assets with `deno task gen:assets-barrel` before testing or scaffolding:
the CLI consumes embedded strings, not these source files directly.

For browser proof, stop a generated Vite process before regenerating its project.
Restart it afterward and read its actual Local URL. Replacing a live generated
project can leave Fresh island module URLs stale even though server rendering works.

Database-backed pages require the generated Prisma client, migrations and seed/data.
Init's temporary client reports database health as unavailable until `netscript db
generate` replaces it. When that command uses a resident Aspire AppHost, the database
operation runner refreshes only running services whose declared `@database` import
points to the selected database facade, then waits for health. Memory services and
other AppHosts are unaffected. See
`kernel/adapters/database/operations/refresh-generated-client-consumers.ts` under
the CLI source for that contract. Services still Starting, custom services without
that import and no-Aspire processes need an explicit restart after generation;
`HealthCheckPath: false` provides process readiness only.

The scaffold runtime app-reference probe requires the seeded row in rendered data
cells on Overview, Records and the canonical service example. Shell headings or
hydration scripts alone do not prove the app reaches its database.
