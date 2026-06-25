# Worklog — chore/release-prep-alpha3

## Slice 2 — CLI scaffold version zero-drift (test-only + 1 doc comment)

### Edits

Replaced every hardcoded `jsr:@netscript/...@0.0.1-alpha.2` literal in the listed test files with a
value derived from the manifest via `netscriptJsrSpecifier(packageName, subpath?)` (which composes
`jsr:@netscript/${packageName}@${NETSCRIPT_RELEASE_VERSION}${subpath}`). Each assertion still checks
the exact full specifier (including subpaths), just computed instead of pinned.

Files:

- `packages/cli/src/public/adapters/jsr-import-resolver_test.ts`
- `packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-copy_test.ts`
- `packages/cli/src/kernel/templates/service/generators_test.ts`
- `packages/cli/src/kernel/adapters/plugin/scaffolder_test.ts`
- `packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts`
- `packages/cli/src/kernel/adapters/scaffold/import-resolver.ts` (doc comment only:
  `@0.0.1-alpha.2` example → version-neutral `@<release>`)
- NEW `packages/cli/src/kernel/constants/version-drift_test.ts` (guard)

### Guard test

Walks `packages/cli/src/**` (`@std/fs` `walk`, exts ts/tsx), skips the guard file itself, and fails
if any file matches `/jsr:@netscript\/[^@'"\s]+@0\.0\.1-alpha\.\d+/`. The version-neutral
`@<release>` doc form does not match.

### Gate evidence

- **check** (`run-deno-check.ts --cwd <release-prep> --root packages/cli --ext ts,tsx`,
  `--unstable-kv` passed by default): clean — 518 files selected, 0 failed batches, 0 occurrences.
- **lint**: `packages/cli/` is config-excluded from the repo lint (root `deno.json`
  `lint.exclude` + `deno task lint` exclude), so the wrapper returns "No target files found" (exit
  1) with 0 occurrences. Ran `deno lint --no-config --rules-tags=recommended` on the 7 touched files
  directly → "Checked 7 files", exit 0, clean.
- **tests @ alpha.2**: `deno test -A` on the 6 files →
  `ok | 12 passed (16 steps) | 0 failed`.
- **guard failure proof**: temporarily added
  `packages/cli/src/kernel/constants/__drift_probe_scratch.ts` containing
  `'jsr:@netscript/fresh@0.0.1-alpha.2'`; re-ran the guard → FAILED, AssertionError listing the
  probe file. Removed the probe (NOT committed); guard green again.

### Bump-safety proof (alpha.2 → alpha.3 → revert)

- After committing Slice 2 (`a4e65f99`), ran `deno bump-version prerelease` from the worktree root —
  "Bumped 32 package(s)" alpha.2 → alpha.3.
- Verified `packages/cli/deno.json` `"version": "0.0.1-alpha.3"`.
- Re-ran the same 6 test files with `deno test -A` at alpha.3 →
  `ok | 12 passed (16 steps) | 0 failed`. Derivation holds across the bump.
- Reverted bump with `git checkout -- .`; confirmed `packages/cli/deno.json` back to
  `0.0.1-alpha.2`, `deno.lock` unchanged from HEAD (no entry in `git status`), working tree clean
  except the two untracked run artifacts.
- Re-ran the guard test at reverted alpha.2 → `ok | 1 passed | 0 failed`.

Commit: `a4e65f99`.

## Slice 1 — add `.github/workflows/pages.yml`

Ported the build + deploy jobs verbatim from `origin/docs/user-site:.github/workflows/pages.yml`.
`git diff --no-index` vs the reference shows EXACTLY the 3 specified deltas and nothing else:

1. `push.branches: [docs/user-site]` → `[main]`.
2. Added `release: { types: [published] }` trigger.
3. `denoland/setup-deno@v2` `deno-version: v2.x` → `'2.9.0'`.

Everything else identical: `permissions {contents: read, pages: write, id-token: write}`,
`concurrency {group: pages, cancel-in-progress: false}`, the `docs/site` build steps
(`deno task build` → `check:links` → `check:caveats`), `configure-pages@v5`,
`upload-pages-artifact@v3` (path `docs/site/_site`), and the `deploy` job
(`deploy-pages@v4` → `github-pages` environment).

### Gate evidence

- `actionlint` not installed on this host. Validated via `@std/yaml` parse:
  top-level keys `["name","on","permissions","concurrency","jobs"]`; `jobs` =
  `["build","deploy"]`; `on` = `["push","release","workflow_dispatch"]`. Well-formed.

Commit: `edcb6ac1`.
