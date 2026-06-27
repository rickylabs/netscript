# Worklog

## Design

- Public surface: `netscript --version` and `netscript init --dry-run`.
- Command surface: public root command tree and public init command.
- Domain vocabulary: package metadata version, init dry-run mode, scaffold filesystem port.
- Ports: existing `FileSystemPort`, `ScaffolderPort`, `TemplatePort`, and `ProcessPort`.
- Constants: package version comes from `packages/cli/deno.json`; no new command names.
- Commit slices:
  1. Fix F-3 root version from package metadata and test via `getVersion()`.
  2. Fix F-4 dry-run filesystem injection and write-free dry-run regression.
  3. Record harness artifacts and gate evidence.
- Deferred scope: full runtime e2e and broader CLI doctrine restructuring.
- Contributor path: public command dependencies own command wiring; public init command selects the
  init context based on parsed flags; the kernel pipeline remains responsible for ordered scaffold
  phases.

## Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `deno test --allow-all packages/cli/src/public/features/root/public-command-tree_test.ts` | PASS | 2 tests passed: package version and write-free dry-run init. |
| `deno run --allow-all packages/cli/bin/netscript.ts --version` | PASS | Printed `netscript 0.0.1-alpha.10`. |
| `tmp=$(mktemp -d); deno run --allow-all packages/cli/bin/netscript.ts init dry-run-cli --path "$tmp" --dry-run --ci --yes --no-aspire --no-git --db none ...` | PASS | Exit 0; target absent; temp parent had 0 entries. |
| `deno check --unstable-kv packages/cli/src/public/features/root/public-command-tree.ts packages/cli/src/public/features/root/public-command-dependencies.ts packages/cli/src/public/features/init/init-command.ts packages/cli/src/public/features/root/public-command-tree_test.ts` | PASS | Focused changed-file check. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts --pretty` | PASS | Wrapper selected 525 files, 5 batches, 0 failed batches; wrapper passes `--unstable-kv` by default. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts --unstable-kv` | FAIL | Exact requested command fails because the wrapper does not accept `--unstable-kv`; supported syntax is default-on or `--deno-arg`. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts --pretty` | FAIL | Exit 1 with 0 parsed lint occurrences; Deno selection/config produced no actionable findings. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts --pretty` | FAIL | Exit 1 with 0 parsed findings; root Deno fmt config excludes `packages/cli/`, so batches fail before file findings. |
| `deno fmt --no-config --check --line-width 100 --indent-width 2 --single-quote --ext ts <changed files>` | PASS | Checked the 4 changed TS files. |
| `deno lint --no-config <changed files>` | FAIL | Reports only the pre-existing accepted `Command<any, ...>` return type in `init-command.ts`; no new `any` or casts were introduced. |
| `git diff --check -- <changed paths>` | PASS | No whitespace errors. |

## Merge Reconciliation

| Item | Result | Notes |
| --- | --- | --- |
| Merge commit | `0d9760dd18b06d65597436163bdcc34ac7f96483` | Reconciled `fix/cli-core-alpha11-a` with `origin/main`. |
| Harness conflicts | Resolved | Kept branch content for `.llm/tmp/run/alpha11-fixtrain--a/drift.md`, `plan.md`, and `research.md`. |
| `init-command.ts` | Resolved | Kept main's interactive init/cache option flow and Slice A's dry-run context selection before `executeInit`. |
| `public-command-dependencies.ts` | Resolved | Kept main's `CliffyPrompt` dependency and Slice A's `createInitContext({ dryRun })` `DryRunFileSystemAdapter` swap. |
| Check gate | PASS | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` selected 527 files in 5 batches, 0 failed batches. |
| Regression test | PASS | `deno test --unstable-kv --allow-all packages/cli/src/public/features/root/public-command-tree_test.ts`: 2 passed, 0 failed. |
| Cast scan | PASS | Staged TypeScript diff added no `as unknown` or `as any` lines before commit. |
