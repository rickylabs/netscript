# Research — bump-before-publish scaffold behaviour

## Re-baseline

The worktree began clean at `e85d8d28c`, the merge commit that introduced
`behavior.package-backed-plugin-doctor`. The gate is critical in both scaffold suites and its local
command unconditionally receives `NETSCRIPT_RELEASE_VERSION`.

The E2E runner already has a mechanically reported exclusion vocabulary: a command definition may
map one reserved exit code to `verdict: skipped` plus a required message. The pretty reporter prints
that message and the result evidence retains the command, exit code, and captured output.

## Findings

1. The fixture consumes exact versions of `@netscript/config`, `@netscript/plugin-workers`, and
   `@netscript/plugin-streams`; all three must exist for the full assertion path.
2. JSR exposes exact-version metadata at `https://jsr.io/<package>/<version>_meta.json`; 404 is the
   narrow unpublished signal. Other status codes and fetch failures must remain critical failures.
3. The same gate should derive an exact version from a published CLI entrypoint when present, as
   `plugin-install-gates.ts` already does, and fall back to the tree release version for local source.
4. `packages/cli/e2e` is a nested, non-published CLI harness workspace. This change does not alter a
   public export, package manifest, or JSR file surface; the JSR public-surface audit is N/A.
5. Issue #1597 contains three acceptance checkboxes, so the PR requires a structured
   `acceptance-evidence` mapping.

## Doctrine

- Archetype 6 — CLI/tooling.
- In scope: A6/A7/A14 and F-19; use a Web Platform `fetch` probe, keep the exclusion explicit, and
  use wrapper-sourced gates.
- Current doctrine verdict: the nested CLI E2E workspace is intentionally excluded from top-level
  published doctrine roots.
- No new or deepened architecture debt.

