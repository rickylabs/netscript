# Quickstart #1274 implementation report

## Scope and commits

- Branch: `docs/quickstart-1274-work`
- `a6d7f27` — `docs(quickstart): orient and verify first run`
- `4ab0107` — `docs(storefront): align scaffold verification gate`
- Product source was not changed. The only repository files changed are `docs/site/quickstart.vto`
  and `docs/site/tutorials/storefront/01-scaffold.md`.
- No PR was opened; the orchestrator retains PR authority.

## What the Quickstart now does

### Install and scaffold

- Uses the release-day-safe, overwrite-safe Deno install form with
  `--minimum-dependency-age=0` and `-f`.
- Runs `netscript --help` as the first CLI proof.
- Documents `--editor none|zed|vscode` and directs readers to live `init --help` rather than
  freezing the option surface in prose.
- Removes the stale fixed scaffold totals. The CLI's totals are option-dependent and are now the
  authority.
- Gives Bash and PowerShell path guidance without claiming that PowerShell was executed in this
  Linux lane.

### Orientation after scaffolding

- Adds an annotated project tree for the app, contracts, service, database, plugins, AppHost, and
  root configuration.
- Marks product-owned, generated, guidance, generated-history, and CLI-managed surfaces so a reader
  knows where edits belong.
- Explains why the CLI generators are the placement authority and introduces `agent init` at the
  point where agent guidance and MCP wiring become relevant.

### Aspire and the mandatory database path

- Presents Aspire as the resource graph for Postgres, Redis, services, runtime port allocation,
  health, logs, traces, and service discovery.
- Makes the printed dashboard URL and its resource links authoritative; no dashboard or app port is
  hard-coded.
- Places `db init --name init`, `db generate`, and `db seed` in the happy path after Aspire starts.
- Explains what each command proves or generates, including the Prisma client and Zod model schemas.

### Verify gate

- Adds a seven-box gate: CLI surface, expected workspace shape, healthy Aspire resources, successful
  DB initialization, reachable Fresh app, rendered `/design`, and a green `deno task check`.
- States the rule verbatim in both pages: **Do not begin customising until every box is ticked.**
- Adds first-run triage through Aspire resource logs, Docker health, AppHost location, and the
  generated Windows/npm-materialization diagnostic.
- Synchronizes the same database and verification sequence into storefront chapter 1 rather than
  leaving initialization until custom feature work begins.

### First-run destinations

- Routes readers to the generated `/design` reference before composing a screen.
- Routes readers to the service's generated Scalar `/api/docs` reference and explains that both
  base URLs come from the Aspire dashboard.

### Feature-authoring loop

- Shows a source- and runtime-verified loop using:
  `contract add`, `contract add-route`, `service add`, `service add-handler`, `db migrate`,
  `db generate`, and `ui:add`.
- Corrects the issue's illustrative syntax to the CLI's current contract:
  `contract add-route orders recent --method GET --path /orders/recent`,
  `service add --name orders`, and
  `ui:add page orders --island --project-root apps/dashboard`.
- States the generator boundary honestly: the handler stub compiles but throws until implemented;
  the page/island/query-loader triad supplies composition seams but not feature behavior.

### Contract derivation

- Demonstrates deriving a public `OrderSchemaV1` from the generated `@database/zod` model schema
  with `pick` and API-specific `extend` rules.
- Connects the example to the contracts register bar: generated database schemas own column types
  and nullability; the contract owns exposure and stricter public validation.
- Records current truth rather than the issue's superseded #1254 boundary: new scaffolds map
  `@database/zod` to the complete generated model barrel. Older projects still mapped to
  `.generated/zod/crud.ts` expose only the primary CRUD model until their alias is updated.

### MCP and next steps

- Presents the current 21-tool MCP surface in seven families and names the first three tools to
  reach for: `doctor`, `find_export`, and `get_operation_schema`.
- Clarifies that `netscript agent mcp` is a stdio server launched by the configured client, not a
  foreground process to run by hand.
- Routes by intent to the merged manuals/deep-dives for adding a service, background job, screen,
  route security, or production deployment.
- Ends with the exact AppHost-scoped stop command.

## Six correctness bugs and evidence

1. **Release-day install and replacement:** fixed with
   `deno install -g -A -f -n netscript --minimum-dependency-age=0 ...` on both pages. `deno install
   --help` was executed and confirms `-g`, `-A`, `-f`, `-n`, and `--minimum-dependency-age`.
   The unsafe `deno x` alternative was removed from storefront chapter 1 because its child
   invocation does not inherit the age-policy override.
2. **Wrong fixed scaffold count:** removed. The scaffold implementation accumulates phase output
   and prints the computed totals at
   `packages/cli/src/kernel/application/scaffold/init-orchestrator.ts:64-77`. A real local scaffold
   for this audit printed `218 files, 45 directories`, confirming totals vary with selected options
   and current templates.
3. **Missing editor choice:** fixed. `--editor <editor:string>` and the allowed choices are owned by
   `packages/cli/src/public/features/init/init-command.ts:42-46,86`; live `netscript init --help`
   was also checked.
4. **No Windows path:** fixed in the page with PowerShell `Set-Location .\\aspire`, shell-neutral
   CLI commands, and the generated npm-materialization recovery path. The emitted PowerShell
   diagnostic is source-backed by
   `packages/cli/src/kernel/templates/workspace/node-modules-verifier.ts:64-75`. This lane executed
   the flow on Linux; `pwsh` was unavailable, so Windows was source/command-reviewed but not falsely
   reported as an executed platform run.
5. **Database absent from the happy path:** fixed on Quickstart and storefront chapter 1 with
   init/generate/seed after Aspire. The public commands are owned by the `db` feature command files,
   and the scaffold's expected tailored next steps are asserted at
   `packages/cli/src/kernel/application/scaffold/orchestrate-init_test.ts:45-47`.
6. **MCP lifecycle unclear:** fixed with an explicit client-launched stdio explanation. Evidence:
   `packages/cli/src/public/features/agent/mcp/agent-mcp-command.ts:11` and the transport wiring at
   `packages/mcp/cli.ts:2,14,104`.

## CLI-side findings recorded, not implemented

### Requested “Next steps” acceptance item is already satisfied on current main

The issue requested a CLI change so database scaffolds print `db init`, `db generate`, and `db
seed`. Current main already does this: the behavior is asserted in
`packages/cli/src/kernel/application/scaffold/orchestrate-init_test.ts:30-49`, including the three
commands at lines 45-47, and the local proof scaffold printed them. No CLI edit was warranted.

### Generated workspace check failure outside docs scope

The real proof workspace completed scaffold, Aspire startup, DB init/generate/seed, a new Order
migration, the contract/service/handler/UI generation loop, `/design`, Scalar, and targeted type
checks. Its full `deno task check` then exposed a baseline generated-catalog error:

```text
TS2345: QueryClientPort is not assignable to QueryClient
apps/dashboard/routes/examples/catalog/(_shared)/service-showcase.ts:74
dehydrateQueryClient(queryClient)
```

Targeted `deno check --unstable-kv` over the derived contract, generated handler, page, island, and
query loader passed. The catalog showcase mismatch is a CLI/generated-template finding and was not
changed in this docs-only slice. The Quickstart deliberately retains `deno task check` as a required
box: this is exactly the unverified-base failure the gate must expose before customization.

## Baseline drift resolved during audit

- The issue calls the MCP surface “24 tools” but enumerates 21; current source
  `packages/mcp/src/domain/tool-types.ts:3-24` contains 21 names. The page uses 21.
- The issue's #1254 limitation is no longer the new-scaffold behavior. Current mapping is the full
  model barrel at `packages/cli/src/kernel/templates/workspace/deno-json.ts:46-47`, with regression
  coverage at `packages/cli/src/kernel/templates/workspace/generators_test.ts:203-214`.
- `service add` currently requires `--name`; `contract add-route` requires method/path flags and a
  TypeScript-identifier procedure; `ui:add table orders` is not a valid runnable triad. The page uses
  the command forms verified through live `--help` and an executed local feature loop.

## Validation evidence

- Real Linux scaffold and feature walk: passed through scaffold, Aspire restore/start, resource
  health, DB init/generate/seed, migration, contract/service/handler/UI generators, `/design`, and
  Scalar `/api/docs`.
- Targeted generated-feature `deno check --unstable-kv`: passed.
- `cd docs/site && deno task build`: exit 0; 617 files generated.
- `cd docs/site && deno task check:links`: exit 0; 32,775 internal links across 220 pages resolve.
- `git diff --check`: passed.
- Internal-process-vocabulary and stale-literal scan on both changed pages: passed.
- `deno.lock`: restored to `HEAD` and clean before commits.
- Resource cleanup: the slice AppHost was stopped. Leak inspection found only foreign resources in
  other worktrees; none were touched.

## Handoff

Implementation is committed and ready for the orchestrator's independent documentation evaluator.
The orchestrator should open the PR after its review; this slice intentionally did not.
