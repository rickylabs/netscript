**S1 slice review: FAIL_FIX** (one blocker)

S1 is close. The shell, the empty states, the component reuse and the runtime invariants are all right. One defect in S1's own server-side capability read can turn every workspace page into a 500, and S1 is the slice that owns that code, so it needs fixing before sign-off. This is a slice review, not the final IMPL-EVAL. Nothing here certifies the implementation, and S2 scope (live clients, plugin discovery from metadata, record detail) is not assessed.

## Blocker

**F1. A failed configuration read crashes every workspace page instead of showing an `unavailable` state.**
- **Where:** `lib/scaffold-capabilities.ts.template:14-17`. `readScaffoldCapabilities()` calls `findWorkspaceRoot(Deno.cwd())`, reads `appsettings.json` as raw text and runs a strict `zod` parse, with no error handling.
- **What happens:** `findWorkspaceRoot` throws when no workspace `deno.json` is found (`packages/config/workspace.ts:92-94`). Its error message contains the absolute start directory, which the dev overlay then shows. A missing or malformed `appsettings.json` throws too.
- **Why it blocks:** `/`, `/dashboard`, `/records`, `/records/[id]`, `/settings` and `/sign-in` all await this function in their loaders. One unreadable or invalid config therefore takes down the whole app, home page included, which is the page `behavior.app-home` probes. The S1 state contract has an `unavailable` state that should cover exactly this case.
- **Fix:**
  1. Wrap the root lookup, the file read and the parse.
  2. On failure, return every capability as `state: 'unavailable'`, with a fixed safe message (no path and no raw error text) and no command. Log the real error on the server only.
  3. Keep the existing `Deno.errors.NotFound` handling for the auth route file.
  4. Add a focused test: an unreadable or invalid config gives `unavailable` for service, auth, workers, streams and ai, and the error message reaches no view prop.

## Verified as correct for S1
- **Commands:** they match the real CLI grammar (`scaffold-contract.ts.template:33-39`). The parser test covers `service add --name/--with-client`.
- **No-service loader:** it imports no contract and has no static rows. The S1 records page and dashboard render honest empty states. Showing `installed-unwired` for an existing service, with a `generate resource … --procedure list` command, matches the decision from plan round 2.
- **Sign-in:** the form posts with no body to `/auth/signin`. The BFF ignores the body for signin and checks Origin, method and protocol before its 303 redirect to the provider (`auth/bff.ts.template:67-79, 90, 124-132`). There is no password field. The form only renders once the generated auth route file exists, and no-auth builds import no BFF.
- **Security boundary:** islands receive only names, labels, states and command strings. Settings gets one `ScaffoldCapability` and WorkspaceCommands gets the navigation items, all plain data. Text derived from appsettings is rendered as escaped JSX text. No secrets, paths or headers cross into islands.
- **Runtime invariants:** in dev, `/` still links to `/design` (sidebar and footer) and `/design/composition` (footer, `dashboard-view.tsx.template:43`). `examples/orders/[id]` keeps `data-order-id` and its self-link. The `/examples/<service>` leaves are untouched. The test file asserts these.
- **Component reuse:** the pages use the registry's SidebarShell, Breadcrumb, PageHeader, StatsGrid, ResponsiveTable, EmptyState, FormField, Input, Select, Alert and the app-owned CommandPalette module. `command-palette` is added only at the init install call (`write-app-files.ts:217`). `workspace.css` is imported from `client.ts`, separate from the registry stylesheet.
- **Theme persistence:** SettingsForm uses the `ns-theme` key and the `data-scheme` attribute, the same ones `ThemeToggle.tsx:14,47` uses. Discard restores the saved value, and storage failure shows a visible alert.
- **Command palette:** Cmd/Ctrl+K toggles it, closing returns focus to the trigger, and the items come from the actual visible navigation. No fictional commands.
- **Evidence:** the 10 tests pass across `workspace-pages_test.ts` and `write-app-files_test.ts`. The generated-app type check selected 47 files with 0 diagnostics. `quality:gate` shows no FAIL; the new-looking `lib` folder warning predates S1 because `app/lib/theme.ts` already existed.

## Non-blocking notes (fix in S2 or S3)
1. The auth route check hardcodes `apps/{{appName}}` (`scaffold-capabilities.ts.template:30`), but the reconciler resolves `entry.Workdir ?? apps/<name>`. Resolve the path relative to the running app root, so an app with a custom working directory isn't reported absent.
2. Plugin detection keys on literal `Plugins['auth' | 'workers' | …]`. That works for the `--name <kind>` commands, but S2 must move to `canonicalName`/`resourceConfigKey` as planned.
3. Accessibility:
   - The settings section rail hardcodes `aria-current='page'` on the in-page "General" anchor. Drop it, or move `aria-current='location'` as sections change.
   - The dashboard tab nav marks the `/dashboard` link current even when rendered at `/`.
   - The `⌘K` hint is shown on non-Mac platforms.
4. Settings links to a literal `href='/sign-in'`; use `appRoutes.signIn.href()`.
5. The template tests are string checks. In S2, add behavioral tests of `readScaffoldCapabilities` against fixture appsettings (absent, installed-unwired, auth ready), alongside the planned lifecycle tests.

Fix F1 and its test, re-run the slice gates (tests, app check, lint, fmt), and S1 is ready for supervisor sign-off.
