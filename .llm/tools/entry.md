# .llm/tools entry

Reusable MCP-friendly Deno tools live here. This directory is for agent utilities that are useful
across sessions; temporary investigation scripts belong under `.llm/tmp/`.

## Rules

- Prefer these tools over brittle PowerShell `Select-String`, `findstr`, or ad hoc quoting-heavy
  pipelines when scanning this repo from a Windows MCP session.
- Keep tool permissions explicit. Most scanners only need `--allow-read`.
- Do not duplicate doctrine/package fitness gates here. The current repo keeps those under
  `tools/fitness/`.
- The maintained full CLI E2E gate is `deno task e2e:cli`; the legacy scaffold tool is diagnostic
  only.

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
