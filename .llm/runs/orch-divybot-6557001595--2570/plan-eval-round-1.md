**Verdict: FAIL_PLAN**

The plan is well organized. Research, locked decisions, slices, risks, deferred scope and the jsr-audit note are all there. But six load-bearing facts in it don't match the current source, and each one would force rework if left until implementation. The plan-gate checklist items that fail are **Decisions locked**, **Open-decision sweep** (several of these must be resolved now) and **acceptance mapping**. This verdict covers the plan only; nothing has been implemented or validated.

## Blockers

**B1. The "exact add commands" in the empty states are wrong.**
- No `plugin add` verb exists. The plugin command group (`packages/cli/src/public/features/plugins/plugins-group.ts:20-27`, plus `FRAMEWORK_VERBS` in `dispatch/dispatch-plugin-verb.ts:15-25`) offers `install/remove/enable/disable/sync/setup/update/doctor/info`.
- `plugin install` requires `--name` (`install-plugin-command.ts:63`, `requireString`).
- `service add` takes `--name`, not a positional name, and needs `--with-client` to get a typed client (`add-service-input.ts`; the existing prerequisite string is in `kernel/application/resource-slice/selection/client-selector.ts:5`).
- **Fix:** use these commands:
  - `netscript plugin install auth --name auth`
  - `netscript plugin install workers --name workers`
  - `netscript plugin install streams --name streams`
  - `netscript plugin install ai --name ai`
  - `netscript service add --name <service> --with-client`

  Keep them in one constants module. Add a test that checks each command against the real command options. The init default service is `users` (`SCAFFOLD_DEFAULTS.SERVICE_NAME`), so don't hardcode `records` in any command text.

**B2. Capability detection timing is undecided, and the plan's current choice gives false states.**
- `write-app-files.ts` writes the pages once, at init. Auth, workers, streams and AI only ever arrive after init, through `plugin install`.
- After init, `service add --with-client` writes `<app>/lib/<service>.ts` (`kernel/adapters/service/client-scaffolder.ts:31`). That is a different path from init's `routes/examples/<service>/(_lib)/service-query.ts`, and it doesn't touch the scaffold pages.
- The browser-auth reconciler writes only `auth/bff.ts`, `routes/auth/[action].ts` and `routes/examples/<svc>/session.ts` (`browser-auth-reconciler.ts:132-198`). It doesn't regenerate the route manifest.
- Result: the plan's "init's actual service plan selects a typed loader template" and "generated auth route/BFF enables signin" are both decided at init. A user who runs the command shown in an empty state still sees "absent", so the guidance is false. Init-time templates also can't statically import `auth/bff.ts` or `routes.auth` before they exist, because the type check would fail.
- **Fix:** lock one mechanism now. Either:
  - **(a)** A server-only capability module. It reads generated topology at request time (names and presence only, from the appsettings `NetScript` Services/Plugins/Apps entries plus known generated module paths). It imports typed clients only from modules that exist at init. It adds an explicit **installed-but-not-wired-here** state with the real follow-up command. Or:
  - **(b)** The post-init reconcilers (service add, plugin install, browser-auth reconciler) rewrite a scaffold-owned capability module. This needs those paths declared in `supervisor.md`/`drift.md`.

  Fix the projection's state union (absent / installed-unwired / ready / empty / unauthorized / unavailable) in S1, so that researching workers, streams and AI in S2 doesn't reshape S1. Add regressions for: init with no service → `service add` → page state, and init → `plugin install auth` → sign-in state.

**B3. The records detail and create flows assume procedures that `--db none` doesn't have.**
- `service/contract.memory.ts.template:73-98` has only `session`, `health`, `list` and `updateStatus`. There is no `getById` and no `create`. Only the database contract (`contract.ts.template:51-53`) has `list`, `getById` and `create`.
- The plan's "`/records/[id]` contract-derived list and get" and "existing create flow" therefore fail for the required `--db none` + service render.
- **Fix:** add a per-variant procedure matrix to the plan:
  - Memory variant: detail comes from the list item, or shows an honest "no `getById`" state. `updateStatus` is the only mutation.
  - Database variant: detail uses `getById`, and the create flow is available.

  Select by `dbEngine`, and test both variants.

**B4. Routes and markers checked by the required runtime gate aren't protected.**
- `scaffold.runtime` checks that:
  - `/` contains `href="/design"` and `href="/design/composition"` (`e2e/src/application/gates/scaffold/runtime/probe-app-reference.ts:28-45`, at desktop and mobile widths);
  - `/examples/users` contains `Cache-first query`, `Managed form` and `Deferred summary`;
  - `/examples/orders/<nonce>` renders `data-order-id="<nonce>"` and its own link back (`probe-app-dynamic-route.ts:41-51`).
- The plan's "remove fake rows and no-service CRUD cards", "Preserve old `/examples` links where useful" and the production design-link filtering all put this gate at risk. `packages/cli/e2e/` is not in the declared write surface.
- **Fix:** list these as invariants in `plan.md` and keep them. Or explicitly decide to change them (`/examples/orders/[id]` is itself a nonce-echo demo), and add the e2e probe updates to the write surface and to drift, with a rationale.

**B5. CommandPalette isn't installed by init.**
- `DEFAULT_UI_INIT_ITEMS` is `foundation`, `floating-styles` and `control-props` (`kernel/application/ui/registry.ts:77-81`).
- The `foundation` bundle (`packages/fresh-ui/registry.json:4447-4496`) leaves out `command-palette`, which ships in the `ai` bundle. The `components/ui/mod.ts.template` barrel doesn't export it either.
- **Fix:** S1 must name the init item addition (with its dialog/combobox registry dependencies), the barrel export, and a measurement of the CSS it adds. Installing it also changes the installed registry CSS set, so reword "keep registry CSS unchanged" and measure what is actually added.

**B6. The acceptance mapping is missing.**
- The required gate is "CLI scaffold and template tests, including the #2566 cases". Neither `research.md` nor `plan.md` lists the #2566 cases or the #2570 acceptance items.
- **Fix:** list every #2570 acceptance item and every #2566 case in `plan.md`. Map each to its test or render-matrix cell and to its slice.

## Verified as stated
- `appTheme().label` exists (`lib/theme.ts.template:33-37`).
- The current registry components exist on main and are exported from the barrel: SidebarShell, PageHeader, StatsGrid, EmptyState, ResponsiveTable, FormField, Input, Select and Switch.
- The BFF signin is a same-origin POST that redirects to the provider (`auth/bff.ts.template:67-74, 124`), so using no password form is the right call.
- The pattern for request-scoped credentials is `browserSessionContext` plus `createBrowserSessionClient` (`auth/service-session-route.ts.template`).
- `navigation.ts` is the route extension point.
- Not reusing or copying #2488's components and deferring #2571 both match the operator brief.

To get to PASS, resolve B1–B6 in `plan.md`, record the surface changes in `supervisor.md`/`drift.md`, and re-submit to the same evaluator session.
