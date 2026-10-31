---
name: netscript-build
description: 'Scaffold and build NetScript applications with the `netscript` CLI. USE FOR: init a project, contract-first flow, database lifecycle (init/generate/migrate/seed/status), add and sync plugins, add services, add UI pages and components, app chrome/navigation and theming, route renaming/moving/removal and router.ts reconciliation, generate registries. DO NOT USE FOR: monitoring, debugging, or performance analysis (use netscript-operate); Aspire orchestration (use the aspire skill).'
---

# NetScript Build

Change the project with real `netscript` CLI verbs. Prefer the CLI for every mutation; discover the
current verb surface with the `list_commands` MCP tool if unsure.

## Verb map

| Task                       | Command                                           |
| -------------------------- | ------------------------------------------------- |
| Create a new project       | `netscript init`                                  |
| Add a contract             | `netscript contract add`                          |
| List contracts             | `netscript contract list`                         |
| Generate from contracts    | `netscript generate runtime-schemas`              |
| Generate plugin registries | `netscript generate plugins`                      |
| Add a service              | `netscript service add`                           |
| List services              | `netscript service list`                          |
| Generate service wiring    | `netscript service generate`                      |
| Add a plugin               | `netscript plugin install`                        |
| Sync installed plugins     | `netscript plugin sync`                           |
| Plugin diagnostics         | `netscript plugin doctor`                         |
| List / inspect plugins     | `netscript plugin list` / `netscript plugin info` |
| Initialize UI              | `netscript ui:init`                               |
| Add a UI page/component    | `netscript ui:add`                                |
| Remove a generated page    | `netscript ui:remove page <path>`                 |
| Regenerate route modules   | `netscript generate routes`                       |

## Database lifecycle

| Step                          | Command                 |
| ----------------------------- | ----------------------- |
| Initialize database wiring    | `netscript db init`     |
| Generate migrations/artifacts | `netscript db generate` |
| Apply migrations              | `netscript db migrate`  |
| Seed data                     | `netscript db seed`     |
| Check status                  | `netscript db status`   |

Run in order: `init → generate → migrate → seed`, then `status` to confirm.

## Workflows

Before implementing an unfamiliar NetScript API or architecture, call MCP `find_guidance` with the
task. Follow its ordered section citations before choosing an API or architecture. Use `search_docs`
for literal lookup and `get_doc` for exact retrieval.

## Installed diagnostic tools by symptom

Run these from the initialized project root. The paths are installed by `netscript agent init`.

| Symptom                                                            | First tool                                                                                                                    |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Type errors, or `deno check` may have silently excluded the target | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root <path> --pretty`                                       |
| Broad lint output hides the actionable files                       | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root <path> --pretty`                                        |
| A published API may have missing JSDoc or slow types               | `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root <package> --pretty`                                 |
| A generated Aspire scaffold may pin collision-prone host ports     | `deno run --allow-read .llm/tools/validation/check-aspire-host-ports.ts <project-root> --pretty`                              |
| A change may violate focused code-quality rules                    | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root <path> --pretty`                                        |
| Dependencies may be behind stable registry releases                | `deno run --allow-read --allow-env --allow-net .llm/tools/deps/outdated.ts --pretty`                                          |
| You do not know why a dependency is present                        | `deno run --allow-read --allow-run .llm/tools/deps/why.ts <package>`                                                          |
| A generated project needs the complete CLI/plugin/DB/Aspire proof  | `deno run --allow-read --allow-write --allow-run --allow-net --allow-env .llm/tools/e2e/scaffold-e2e-test.ts --format pretty` |

For type-checking, prefer the installed `run-deno-check.ts`: bare `deno check` can print
`No matching files found` and still exit 0 when configuration excludes the target. The runner
reports its selected file count and fails when that count is zero.

**You are offline or unfamiliar with a framework package/API.** Run
`netscript agent init --with-docs`. The opt-in installs the release prose plus API documentation for
every export subpath of each exact NetScript package found in the project; the command reports the
local starting point and fails instead of installing docs for a mismatched version.

**Contract-first.** `netscript contract add` (define the schema/type contract) →
`netscript generate runtime-schemas` (emit generated types) → implement against the generated
surface. Re-run `generate` after every contract change; do not hand-edit generated output.

**Plugin lifecycle.** `netscript plugin install` → `netscript generate plugins` →
`netscript plugin doctor`. `netscript generate plugins` is authoritative; the compatibility
`plugin sync` command delegates to it.

**A plugin install seemed to work, but its boundary never runs or the generated registry looks
wrong.** Run `netscript plugin doctor` before reading source or hand-probing endpoints, then
regenerate with `netscript generate plugins` only if the diagnostic identifies stale wiring.

**Add a service.** `netscript service add` → `netscript service generate` to produce wiring.

## Pages, chrome, navigation, and theme

Every page renders inside the app chrome in `routes/_layout.tsx`: the top bar, whose links are the
`appNavigation` list in the app's `navigation.ts`. Do not build a per-page header or nav.

- `netscript ui:add page <path>` links one-segment pages in the top bar automatically. Pass
  `--nav <label>` to link a nested page or set the label, and `--no-nav` for pages that should not
  be linked. Its `Next:` lines name the files that own the frame.
- A page that needs its own full-screen frame (a sign-in screen) opts out by adding its prefix to
  `chromelessRoutePrefixes` in `navigation.ts`; `/design` is the scaffold's example.
- Start each page from `<main class='ns-shell ns-section ns-stack ns-stack--lg'>` plus `PageHeader`,
  which `ui:add page` writes, and compose the app-owned primitives from `@app/components/ui/mod.ts`.
  Browse the running app's `/design` routes for the component gallery and tokens.
- There is one app-wide theme. `assets/theme-preset.json` names the preset (Studio Utility for new
  apps), and `routes/_app.tsx` stamps it on `<html>` as `data-theme`, `data-flavor`, `data-density`,
  and `data-scheme` (light or dark, flipped by `ThemeToggle`). `assets/tokens.css` holds the
  preset's generated `--ns-*` tokens, which `client.ts` loads on every route, and
  `assets/theme-bridge.css` exposes them as Tailwind `*-ns-*` utilities.
- Switch the preset with `netscript ui:apply --preset <id>`. Fine-tune it by aliasing semantic roles
  in `tokens/semantic.tokens.json` (create it with `netscript tokens init --preset <current id>`),
  then run `netscript tokens build`. Never hand-edit the generated `tokens.css`, `theme-bridge.css`,
  `tokens.json`, `fonts.json`, or `theme-preset.json`. Never scope theme variables to one page's
  wrapper; there is no per-page theme.

Read `web-layer/how-to/theme-your-app` through MCP `get_doc` before changing the theme or the frame,
and `web-layer/how-to/customize-fresh-ui` before editing routes, islands, or registry components. An
app without `navigation.ts` was scaffolded before shared navigation: its `routes/_layout.tsx` shows
the top bar only for an allowlist of routes, so add new pages there.

## Route lifecycle: rename, move, or remove a page

For route renaming or moving, read `web-layer/route` ("Renaming or Moving a Route") and
`web-layer/generated-surface` through MCP `get_doc` before editing. `ui:add page` writes an editable
page, a string-literal registration in `router.ts`, and (for linked pages) an `appNavigation` entry;
it does not bind through the filesystem-generated `routes` tree. Moving a directory can leave a
stale URL while type checking passes.

Follow the checklist: move the page with its owned loader/island and sidecar, repair imports,
reconcile the `appRoutes` pattern/key/id, the page binding and its `navigation.ts` entry, update
consumers, run `netscript generate routes` to refresh `.generated/manifest.ts` and
`.generated/routes.ts` without a Vite build, then type-check and verify navigation, new/old URLs,
and loader/island behavior.

To remove a page that `ui:add page` generated and you have not edited, run
`netscript ui:remove page <path>` (preview with `--dry-run`). It deletes the page triad, its
`router.ts` registration and its `navigation.ts` link, then refreshes the derived route modules; it
refuses edited files, so prune an edited page, its registration, link, and consumers by hand,
preserving shared modules still in use. `netscript ui:remove <name>` handles copied Fresh UI
registry items. There is no route rename verb: do not guess one, and never hand-edit
`.generated/manifest.ts` or `.generated/routes.ts`.

## Safety rules

- Never hand-edit generated registries or generated types — re-run the generator instead.
- Do not delete lock files or caches.
- Run generators after any contract, plugin, or service change so the generated surface stays in
  sync.

## Boundaries

- Observing the app (health, failing runs, performance) lives in `netscript-operate`.
- Aspire start/stop and the resource graph live in the `aspire` skill.
