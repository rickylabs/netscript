# Research

## Baseline

Re-baselined against `origin/main` `4634afe56`, superseding the prompt's original `f663fe0e4` base and incorporating PR #1038.

## Findings

### #1016

- Current generators exist at `packages/cli/src/kernel/templates/workspace/tsconfig.ts` and `packages/cli/src/kernel/adapters/templates/app/generate-app-tsconfig.ts`.
- An actual current-main scaffold emitted `tsconfig.json` containing `{ "files": [] }` and `apps/dashboard/tsconfig.json` with an app-local Bundler/Vite configuration. The first two acceptance boxes are true.
- Outstanding: a semantic E2E fixture must place `{ "extends": "astro/tsconfigs/strict" }` above the generated project, run database generation and start/probe the Fresh dev server, and demonstrate that removing the generated boundary makes the fixture fail.

### #1021

- Disposable clone: `/home/codex/ns-clean-1021-ycvWCs/repo`, cloned from current `main`; generated consumer clone: `/home/codex/ns-clean-1021-ycvWCs/consumer`.
- The generated README still documents literal `deno task check` in its Commands table.
- Contrary to the issue's 0.0.2 reproduction, current output emits and tracks `apps/dashboard/.generated/manifest.ts` and `apps/dashboard/.generated/routes.ts`; the generated `.gitignore` does not ignore them.
- After committing the generated project and cloning it into a fresh directory, literal `deno task check` completed and checked both generated route files. Thus the original failure is no longer reproducible on current `main`.
- No containers or services were started. The disposable clone will be removed after evidence is recorded.

### #1039

- `plugins/ai/src/adapter/plugin.ts` registers seven starters with no `samples` classification.
- `plugins/workers/src/adapter/plugin.ts` is the reference: sample resources use `{ kind: 'omit' }`; a barrel that imports samples uses an alternate structural scaffolder.
- The transport and `plugin install --no-samples` plumbing are already owned by #1017 and are explicitly out of scope here.
- AI's barrel currently composes generated models/tool/agent, so suppressing tool and agent requires a structural alternate, not merely two omit flags.

## JSR surface scan

The planned changes are internal tests, generated README/scaffold assertions, and plugin adapter starter metadata. No `deno.json` export map, package entrypoint, dependency, or new exported symbol is planned. Slow-type and file-list risk is unchanged. Existing doc-lint/publish debt is not deepened; targeted doc/publish gates remain evaluation evidence where relevant.

## Open questions

- The exact existing E2E gate insertion point for the parent-tsconfig fixture must be selected without creating a bespoke runner.
- For #1021, determine whether a focused semantic generator/E2E assertion already covers tracked route artifacts; if yes, close with evidence only, otherwise add one minimal regression assertion.
