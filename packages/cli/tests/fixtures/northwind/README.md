# Default scaffold regression snapshot

`default-scaffold.json` records the complete ordinary public-init file set and SHA256
of each file for db none and SQLite orders, before the Northwind preset implementation.
Captured from baseline `4cb0298d7b7020930f1e6b05ca827c8330802d4e` (plan-only parent
`68d3c762513c3d1ec035e8cccea49f9b05467dd2` has the same product source), with real
`createPublicCommandDependencies` / `createInitCommand` and:

```text
init baseline-app --path <temporary-parent> --ci --no-git --no-agent --json --db none
init baseline-app --path <temporary-parent> --ci --no-git --no-agent --json --db sqlite --service --service-name orders --model-name Order
```

Only the temporary root and parent strings are normalized to `<ROOT>` / `<PARENT>`.
No generated file is omitted. The `ordinary init matches` test performs the same capture.

After an intentional default-template change, regenerate with the opt-in environment
variable and review the snapshot diff alongside the source change:

```sh
UPDATE_NORTHWIND_BASELINE=1 deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --filter 'ordinary init matches' packages/cli/src/public/features/init/northwind-preset_test.ts
```

Normal tests never update this fixture. Do not update it to hide an unintended change.

After generating and seeding a local-source Northwind project, the focused runtime
probe discovers the app through Aspire and asserts visible order fields in Overview,
Records and the selected detail page:

```sh
deno run -A packages/cli/e2e/src/application/gates/scaffold/runtime/probe-northwind.ts <project-root> <app-name> <apphost-path>
```

Stop the owned `orders` resource through Aspire, then run the same command with a final
`unavailable` argument. The normal ready probe must fail while the service is down;
the unavailable control must pass. Restart the resource afterward. This focused native
proof does not replace the full `scaffold.runtime` suite or public release E2E.
