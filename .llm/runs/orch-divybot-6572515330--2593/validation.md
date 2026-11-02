# Validation and reproduction

## Published graph

```sh
# In a disposable $TMPDIR directory, without the repository import map:
deno run --no-config --no-lock --minimum-dependency-age=0 -A jsr:@netscript/cli@0.0.9-canary.2 init published-repro --path "$TMPDIR/repro" --db none --no-aspire --no-git --no-agent --editor none --ci --yes
# From the generated project:
deno run --no-config --no-lock --minimum-dependency-age=0 -A jsr:@netscript/cli@0.0.9-canary.2 plugin install ai --name ai --project-root . --force
deno run --no-config --no-lock --minimum-dependency-age=0 -A jsr:@netscript/cli@0.0.9-canary.2 ui:add ai --app published-repro-web --registry-root <repository>/packages/fresh-ui --force
# From apps/published-repro-web, before and after copying the two corrected templates:
deno run --minimum-dependency-age=0 -A npm:vite@7.2.2 build
```

The no-Aspire plugin install writes its files, then stops at Aspire-helper regeneration. The focused fixture supplies two empty generated tool/agent registry Maps and pins first-party imports to canary2. It starts no resources. The temporary filesystem is noexec, so node_modules is symlinked to an executable project-owned dependency directory. This is the closest focused reproduction, not full scaffold.runtime.

Plain no-AI build: exit 0. AI warm baseline: exit 0, 1076 SSR modules and an 844.59 kB ai.mjs chunk. The downloaded production artifact confirms the original cold build failed at the same provider edge (client build complete, SSR failing): [run 41411401619](https://github.com/rickylabs/netscript/actions/runs/41411401619). After the two corrected templates: exit 0, 776 SSR modules, no ai runtime/model chunks. Commands and output are preserved with private execution paths normalized in evidence/.

## Cache-independent pre-publish control

`deno task check:scaffold-provider-boundary` builds the shipped embedded template with a provider importing the exact JSR-style `npm:@tanstack/ai@0.68.0` specifier. The clean loader must not traverse that provider. It then executes the built loader from another output directory against six native module scenarios. Finally it restores the old runtime glob and requires Vite to fail resolving that exact inline specifier. This tests the source boundary before publication without relying on a local workspace alias or the npm cache hiding resolution errors.

`deno task check:scaffold-provider-boundary --negative-control` exits 1; default positive + negative gate exits 0. The real published dependency graph can vary with loader/npm initialization; this deliberate emitted-specifier control is the closest reproducible pre-publish check. Full e2e-cli CI and next-canary production pair remain required.

## Local source checks

- Structured check runner: provider guard, gate catalog, capability tests; 0 diagnostics.
- Structured lint/fmt runners: same 3 files with an explicit temporary config (root excludes CLI/tools); all 3 processed, 0 findings. Temp config: `{ "fmt": { "lineWidth": 100, "indentWidth": 2, "semiColons": true, "singleQuote": true } }`.
- Structured check runner with `--cwd` set to the published app: both rendered capability modules, 0 diagnostics.
- Structured test runner: workspace-capabilities_test.ts, workspace-pages_test.ts, run-gate_test.ts, generate-cli-assets-barrel_test.ts; 21 passed, 0 failed/ignored.
- `deno task quality:gate`: exit 0, existing warnings only.
- `deno task check:assets-barrel`: pending committed-output freshness check; pre-commit diff is expected.

All TS gates use repository wrappers. The full local scaffold.runtime E2E was not run, per owner instruction.
