# fix(cli): every ui:* command writes to the workspace root instead of apps/<app>, and the E2E gate asserts the wrong root — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T2-03 · **Proposed milestone:** 0.0.7 (new "Typed seams + generation" cut per the
Stage-E rename-shift; if the train is not shifted, `0.0.6`) · **Labels:** `type:fix` `area:cli`
`area:fresh-ui` `area:docs` `priority:p1` `status:triage` · **Depends on:** none — this is the
blocker T2-01 and T2-04 sit on top of

## Summary

`init` writes the Fresh app to `apps/<appName>/` and installs the UI registry **there**, but every
`ui:*` command resolves its write root through `resolveProjectRoot`, which walks up to the
**workspace** root. So `netscript ui:add data-table` in a scaffolded project copies components into
`<workspaceRoot>/components/ui/` — outside any Fresh app, invisible to the app's barrel and to the
Vite route generator. There is no `--app` flag to correct it, yet the docs already document one.
The repo's own E2E gate passes the workspace root and then asserts the copied paths relative to it,
so CI is green **because it encodes the defect**.

## Evidence

- `research/repo-audit/mcp-cli.md` §4.4 (titled "App-targeting seam — BROKEN TODAY") and §3
  preamble; `research/repo-audit/web-layer.md` §8 secondary notes.
- Repo, verified at `fac9e339042c`:
  - `packages/cli/src/public/features/root/public-command-dependencies.ts:195-197` —
    `resolveProjectRoot` = `findDeployProjectRoot(host.cwd())`.
  - `packages/cli/src/kernel/adapters/config/deploy-config.ts:59-84` — `findProjectRoot` returns the
    first ancestor containing `netscript.config.ts`, `dotnet/AppHost/appsettings.json`, **or a
    `deno.json` with a `workspace` array**, i.e. always the workspace root.
  - `packages/cli/src/public/features/ui/add/add-ui-command.ts:54-57` — every `ui:add` path
    (`page`, `island`, registry item) uses `requireProjectRoot(dependencies.resolveProjectRoot, …)`;
    `:38-52` is the full option list and contains **no `--app`**.
  - `packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts:182-185` — `init`
    installs the registry with `projectRoot: appDir`, i.e. `apps/<appName>/`.
  - `packages/cli/src/kernel/application/ui/web-scaffold.ts:15-42` — `ui:add page` writes
    `<root>/routes/<segment>/…`, so a scaffolded project gets `<workspaceRoot>/routes/…`.
  - Gate encoding the wrong root:
    `packages/cli/e2e/src/application/gates/scaffold/ui-ai-gates.ts:23-24` passes
    `--project-root context.project.projectRoot`, and `:95-102` asserts
    `islands/ui/McpUiWidget.tsx`, `lib/ai/render-ui.tsx`, `assets/styles.css` relative to that same
    root.
  - Docs that document a flag which does not exist / a path the command does not write:
    `docs/site/web-layer/how-to/build-a-desktop-frontend.md:31`
    (`netscript ui:add desktop --app dashboard`);
    `docs/site/web-layer/how-to/customize-fresh-ui.md:26` and `:256` ("component files go to
    `apps/dashboard/components/ui/`").

## Current surface

Two resolution rules for one artifact: `init` installs into the app, `ui:*` installs into the
workspace. Nothing warns. A user who follows the published how-to gets files in a directory the
Fresh app never reads, and re-running `ui:update` compares drift against that same wrong tree.
`ui:add page` compounds it: the emitted route lands outside the app so the Vite route generator
never sees it and `appRoutes` never gains the entry.

## Target contract

1. **`ui:*` commands resolve an app root, not the workspace root.** Resolution order: explicit
   `--app <name>` (or `--project-root` pointing at an app) → single Fresh app workspace member →
   error listing the candidates when more than one exists. The error names the flag to use.
2. **`--app <name>` exists on every `ui:*` command** (`ui:init`, `ui:add`, `ui:list`, `ui:update`,
   `ui:remove`) with one shared implementation, and is documented in `--help`.
3. **Running inside `apps/<name>/` works with no flag.**
4. **The E2E gate is corrected, not preserved**: `ui-ai-gates.ts` targets the app and asserts the
   app-relative paths. The corrected assertions must fail against today's behavior.
5. **The docs stop describing a flag that does not exist**: the two how-to pages are updated to the
   shipped surface in the same change, and their commands are copy-runnable.
6. **The public input type describes the public CLI**: `UiAddCommandInput`
   (`packages/cli/src/public/features/ui/add/add-ui-input.ts`) gains the fields the action already
   accepts (`route`, `island`, `query`, and the new `app`).

## Acceptance

- [ ] `ui:*` commands write into the resolved Fresh app, never the workspace root.
- [ ] `--app <name>` is accepted by every `ui:*` command and documented in `--help`.
- [ ] Running a `ui:*` command from inside `apps/<name>/` needs no flag.
- [ ] A multi-app workspace with no `--app` fails non-zero and lists the candidate apps.
- [ ] `UiAddCommandInput` declares every option the command accepts.
- [ ] The two how-to pages match the shipped flags and paths.
- [ ] Negative test: a regression test asserts that no `ui:*` command writes to the workspace root
      when an app member exists — this test must fail on the pre-fix build.
- [ ] `ui-ai-gates.ts` asserts app-relative paths and its assertions fail against the pre-fix
      behavior.
- [ ] gate: `deno task e2e:cli run scaffold.runtime --cleanup` proves a `ui:add` item lands in
      `apps/<app>/components/ui/` and is reachable from the app's barrel.

## Boundaries

- **#1333** owns the default app's content and dynamic app naming; this issue owns *where the CLI
  writes*. Do not fold the app-name derivation into this fix.
- **#1335** owns the conformance inventory that will record the corrected paths.
- **T2-01/T2-04** consume this seam; they must not each invent their own app resolution.
- **#1328 (CLOSED)** owned generated quality-gate coverage — do not reopen it.
- Not in scope: `ui:add page`'s emitted *content* (T2-04), the missing `--force`/`--dry-run` on
  `ui:add page` (T2-01/T2-04), or `netscript-dev`'s stale `version('1.0.0')`
  (`mcp-cli.md` §4.5 C3).

## Docs/consumer proof

A scaffolded project is the proof: run every documented `ui:*` command from the published how-tos
verbatim and show the files landing where the how-to says they land, with the app barrel and the
generated route manifest picking them up. The corrected `ui-ai-gates.ts` is the standing regression
proof that the wrong root cannot come back green.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Drafted from
`research/repo-audit/mcp-cli.md` §4.4 and `research/repo-audit/web-layer.md` §8; every path and line
re-verified against worktree `fac9e339042c`. No GitHub mutation performed.
