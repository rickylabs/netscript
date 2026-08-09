# Research — #1356 UI app-root resolution

## Re-baseline

- Carried-in source: live issue #1356, originally audited at `fac9e339042c`.
- Re-derived against `origin/main@1395f3989d715679d018ab5c1346c1b382cb064d` on 2026-08-09.
- The named defect remains present. The run directory did not exist on `main`, so no stale run
  artifacts were inherited.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| F1 | All five `ui:*` commands call `requireProjectRoot` with the generic project resolver and expose no `--app`. | `packages/cli/src/public/features/ui/{init,add,list,update,remove}/*-ui-command.ts` |
| F2 | The public composition resolver returns an explicit path unchanged, otherwise calls deploy `findProjectRoot(host.cwd())`. | `packages/cli/src/public/features/root/public-command-dependencies.ts:190-202` |
| F3 | Deploy root discovery walks upward and stops at the workspace `deno.json`, so invocation inside `apps/<name>` still resolves the workspace. | `packages/cli/src/kernel/adapters/config/deploy-config.ts:52-84` |
| F4 | Generated workspaces declare Fresh apps as direct `apps/<name>` workspace members; `SCAFFOLD_DEFAULTS.APP_NAME` and the E2E `ASPIRE_RESOURCE.APP` are both `dashboard`. | `packages/cli/src/kernel/domain/scaffold/scaffold-plan.ts`; `packages/cli/src/kernel/constants/scaffold/scaffold-defaults.ts`; `packages/cli/e2e/src/domain/cli-surface.ts` |
| F5 | `UiAddCommandInput` omits existing `route`, `island`, and `query` options as well as the new `app` option. | `packages/cli/src/public/features/ui/add/add-ui-input.ts` |
| F6 | The current UI E2E install command passes the workspace root, and every follow-on assertion runs relative to that same workspace root. | `packages/cli/e2e/src/application/gates/scaffold/ui-ai-gates.ts:14-90` |
| F7 | The two issue-named how-to pages already describe `--app dashboard` and app-owned paths; source changes are unnecessary if the implemented help/path contract matches them. | `docs/site/web-layer/how-to/{build-a-desktop-frontend,customize-fresh-ui}.md` |
| F8 | The live issue has nine acceptance boxes, not only the four behavioral shorthand rows. The full runtime row remains owner/CI evidence because this slice has no serialized token. | `gh issue view 1356 --repo rickylabs/netscript` |

## Pre-fix failure matrix

| Acceptance behavior | Concrete pre-fix RED to execute before source changes | Failure class |
| --- | --- | --- |
| App-root writes | A temp single-app workspace expects `ui:add page` under `apps/dashboard/routes`; current command writes `<workspace>/routes`. | behavioral |
| `--app` on every command/help | Help inspection for all five commands lacks `--app`; parsing `ui:add ... --app dashboard` rejects the unknown option. | behavioral |
| Inside-app inference | Invoke from `apps/dashboard` without flags; current root discovery walks to the workspace and writes outside the app. | behavioral |
| Multi-app ambiguity | A workspace with `apps/admin` and `apps/dashboard` currently succeeds and writes to the workspace; expected behavior is rejection naming both candidates. | behavioral |
| Corrected E2E discriminator | Execute the E2E gate's own required-path command against a scratch old-layout workspace. Today its cwd is the workspace, so the old layout passes; the corrected expectation requires non-zero there and zero only at the app root. | behavioral |

## jsr-audit surface scan

- N/A: no `deno.json`, export map, `mod.ts`, published type export, dependency, or JSDoc surface is
  planned. This changes internal command routing and Cliffy help only. Package publishability remains
  covered by the existing CLI surface and is not broadened.

## Relevant debt

- `packages/cli — AP-1 / doctrine verdict Restructure` and the Archetype-6 pending-script entries
  remain pre-existing. This narrow vertical UI feature change must not deepen them.

## Open questions

- None. Candidate vocabulary is locked to direct `apps/<name>` workspace members; dynamic default
  naming remains #1333. The full AppHost runtime proof is deferred to owner CI, not locally waived.

