# .llm/tools entry

Reusable MCP-friendly Deno tools live here. This directory is for agent utilities that are useful
across sessions; temporary investigation scripts belong under `.llm/tmp/`.

## Rules

- Prefer these tools over brittle PowerShell `Select-String`, `findstr`, or ad hoc quoting-heavy
  pipelines when scanning this repo from a Windows MCP session.
- Keep tool permissions explicit. Most scanners only need `--allow-read`.
- Do not duplicate doctrine/package fitness gates here. The current repo keeps those under
  `.llm/tools/fitness/`.
- The maintained full CLI E2E gate is `deno task e2e:cli`; the legacy scaffold tool is diagnostic
  only.
- For any "is this the latest version" decision use `deps:latest` (registry **stable** channel),
  **never** `deno outdated --latest` — the native `--latest` view ignores semver and reports
  pre-release tags as latest (it once reported `@fedify/fedify 2.3.0-dev.*` while stable was `2.2.5`).

## Dependency toolbelt (`deps/`)

Thin, structured wrappers over the Deno 2.8 dependency commands. They emit JSON by default
(`--pretty` for human output) so agents read versions/advisories without scraping human tables and
without re-querying registries by hand. See the `netscript-deno-toolchain` skill for the full
command map.

### `deps/latest.ts` — latest STABLE per registry (`deno task deps:latest`)

- Purpose: report every workspace dependency (root catalog + member `imports`) against its
  registry's **stable** channel (jsr `meta.json.latest` / npm `dist-tags.latest`), pre-release
  filtered. This is the authority for "latest stable", fixing the `deno outdated --latest`
  pre-release trap.
- Flags: `--pretty`, `--behind-only`, `--filter "@fedify/*"`, `--allow-prerelease`,
  `--fail-behind` (exit 1 when any dep is behind — for CI report lanes).
- Example: `deno run --allow-read --allow-net .llm/tools/deps/latest.ts --behind-only --pretty`
- Scope note: reads **declared** specifiers (what we bump). Use `deps/outdated.ts` for the
  lock-aware / transitive view.

### `deps/outdated.ts` — lock-aware inventory (`deno task deps:outdated`)

- Purpose: wrap `deno outdated --recursive [--latest]`, parse the box-drawing table into JSON, and
  flag rows whose "Latest" is a pre-release. Surfaces transitive/locked entries `latest.ts` omits.
- Example: `deno run --allow-read --allow-run .llm/tools/deps/outdated.ts --latest --pretty`

### `deps/why.ts` — dead-import detection (`deno task deps:why <pkg>`)

- Purpose: combine **source usage** (greps `.ts/.tsx` imports) with **graph provenance**
  (`deno why <pkg>`). `likelyDeadImport` = no direct source usage; `fullyRemovable` = also absent
  from the graph (safe to prune). Drives the unused-import sweep.
- Example: `deno run --allow-read --allow-run .llm/tools/deps/why.ts @hono/hono --pretty`

### `deps/audit.ts` — advisory check (`deno task deps:audit`)

- Purpose: wrap `deno audit --level <floor>`, normalize to JSON (exit code + advisory lines).
- Flags: `--level critical|high|moderate|low`, `--pretty`, `--fail-on-find`.
- Example: `deno run --allow-read --allow-net --allow-run .llm/tools/deps/audit.ts --level critical --pretty`

### `deps/prod-install.ts` — published-surface install (`deno task deps:prod-install`)

- Purpose: wrap `deno ci --prod` — proves the production (non-dev) surface installs against the
  lockfile enforced by `deno ci`. **Additive** to the quality lane (`check`/`lint` still need dev deps).
- Flags: `--skip-types`, `--pretty`.

## Full CLI E2E

### `deno task e2e:cli`

- Purpose: run the full merge-readiness CLI E2E suite.
- Coverage: scaffolds a project, adds the official plugins, initializes/generates/seeds the DB,
  type-checks generated workspaces, starts Aspire, waits runtime resources, exercises HTTP behavior,
  validates OTEL behavior, and cleans up.
- Example command:
  - `deno task e2e:cli`

### `packages/cli/e2e`

- Purpose: product-grade CLI E2E validation package with suite/gate listing and targeted execution.
- Example commands:
  - `deno task e2e:cli suites`
  - `deno task e2e:cli gates scaffold.runtime`
  - `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
  - `deno task e2e:cli gate scaffold.runtime generated.deno-check --cleanup --format pretty`
- Notes: `scaffold.plugins` is not the full suite. It is a narrower plugin scaffold and diagnostic
  smoke. Use `scaffold.runtime` for merge readiness.

### `scaffold-e2e-test.ts`

- Purpose: legacy generated-project scaffold smoke kept as a comparison harness while the maintained
  `packages/cli/e2e` runner covers the merge gate.
- Why MCP-friendly: emits step-level output and a streaming log under `.llm/tmp/scaffold-e2e-test/`.
- Example commands:
  - `deno run --allow-read --allow-write --allow-run --allow-net --allow-env .llm/tools/scaffold-e2e-test.ts --format pretty --cleanup`
  - `deno run --allow-read --allow-write --allow-run --allow-net --allow-env .llm/tools/scaffold-e2e-test.ts --dry-run --format pretty`
- Notes: use this only for parity debugging with the previous repo checkout. For PR readiness, use
  `deno task e2e:cli`.

## Diagnostics

### `run-deno-check.ts`

- Purpose: run scoped `deno check` selections and parse `deno check` / `deno task check*` output
  into structured JSON grouped by error code and affected paths.
- Example commands:
  - `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/logger --ext ts,tsx --pretty`
  - `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --input .llm/tmp/check.log --pretty`
  - `deno run --allow-run --allow-read .llm/tools/run-deno-check.ts --pretty --cwd . -- deno task check`

### `run-deno-fmt.ts`

- Purpose: run scoped `deno fmt --check` or mutating `deno fmt` over explicit roots, extensions, and
  excludes without shell glob expansion.
- Example commands:
  - `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/logger --ext ts,tsx --pretty`
  - `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages --root plugins --ext ts,tsx --ignore-line-endings`
- Notes: `--ignore-line-endings` counts known baseline line-ending drift without listing every
  ignored file. Add `--show-ignored` only when the ignored file list is needed.

### `find-lines.ts`

- Purpose: scan roots for substring or regex matches and print `path:line: text`.
- Example command:
  - `deno run --allow-read .llm/tools/find-lines.ts --root packages/cli --regex "scaffold\\.(runtime|plugins)"`

### `find-import-patterns.ts`

- Purpose: scan imports and CSS `@import` lines for legacy aliases and relative-path debt.
- Example command:
  - `deno run --allow-read .llm/tools/find-import-patterns.ts --root packages/cli`

### `find-symbol-usages.ts`

- Purpose: scan for symbol usages with symbol-boundary matching for refactor prep.
- Example command:
  - `deno run --allow-read .llm/tools/find-symbol-usages.ts --root packages/cli --symbol copyOfficialPlugin`

### `list-exports.ts`

- Purpose: inventory exported symbols and re-exports across a package or app surface.
- Example command:
  - `deno run --allow-read .llm/tools/list-exports.ts --root packages/contracts`

### `compare-export-surface.ts`

- Purpose: compare actual exported symbols against an expected contract list.
- Example command:
  - `deno run --allow-read .llm/tools/compare-export-surface.ts --root packages/contracts --expect contract`

### `git-commit-paths.ts`

- Purpose: run `git commit` with explicit message/path inputs without Windows shell quoting issues.
- Example commands:
  - `deno run --allow-run .llm/tools/git-commit-paths.ts --message chore-sync --all-staged --dry-run`
  - `deno run --allow-read --allow-run .llm/tools/git-commit-paths.ts --message-file .llm/tmp/commit-message.txt --path-file .llm/tmp/commit-paths.txt --push`

## Non-ported Old Tools

The previous checkout also had playground dashboard, benchmark comparison, and helper-generation
scripts. They were not ported because they target older app surfaces or one-off investigations. Add
new versions only when a current task needs them.
