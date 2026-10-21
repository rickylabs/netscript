# Consumer proof — local-source scaffold (2026-10-21)

Project generated with the branch CLI (`packages/cli/bin/netscript.ts`, published `@netscript/*`
0.0.8 dependencies) under `~/projects/orchid/runs/2026-10-21-issue-751-scaffold-proof/` (outside
the repo; `$TMPDIR` is noexec and breaks Vite's native binaries).

| Step | Command | Result |
| --- | --- | --- |
| 1 | `netscript init proof751 --db none --no-agent --no-aspire --no-git --ci --yes --force` | exit 0; app `proof751-web` has `navigation.ts` + opt-out `routes/_layout.tsx` |
| 2 | `netscript ui:add page notes --app proof751-web` | page + route-registration + **navigation-registration**; two `Next:` lines (`consumer-ui-add.log`) |
| 3 | `netscript ui:add page admin/audit --app proof751-web` | page + route-registration only; `Next: Not linked in the top bar; add appRoutes['admin.audit'] …` |
| 4 | `netscript generate routes --app proof751-web` | 12 routes, updated |
| 5 | `deno install` then `deno task --cwd apps/proof751-web check` (`deno fmt --check . && deno lint . && deno check`) | **exit 0** — CLI-written `navigation.ts` and both pages are fmt/lint/type clean in the generated workspace |
| 6 | `deno task build` (Vite) → `deno serve -A --port 7151 _fresh/server.js` | build exit 0; prod HTML below |
| 7 | Vite dev server (`MODE=development`, port 7152) | `/design/**` exists only in dev (the app's `vite.config.ts` excludes the `(design)` group from production builds) |
| 8 | `netscript ui:remove page notes --dry-run`, then without `--dry-run` | `router reconciled; navigation reconciled`; `navigation.ts` byte-identical to the template; app `check` exit 0 again |

Rendered chrome (`consumer-chrome-evidence.txt`, parsed from the HTML):

- prod `/`, `/dashboard`, `/notes`, `/admin/audit`, `/health`, `/examples`: HTTP 200, `ns-topbar`
  present, primary nav `Home, Dashboard, Examples, Health, Design, Notes`; `aria-current` on the
  matching link (`Notes` on `/notes`; none on the unlinked `/admin/audit`; `Health` on `/health`,
  which had no chrome before).
- dev `/design/tokens`: 200, **no** `ns-topbar`, design `SidebarShell` present; dev `/design`
  302 → tokens.
- Every page, chrome or chromeless, carries exactly one `page` partial marker.

Finding during step 8 (fixed in this slice): the Fresh route generator's page-binding pass
(`writeNetScriptPageModuleBindingsSync`, run by `generate routes` and Vite dev/build) inserts
`import { routes } …/.generated/routes.ts` + `.withRoute(routes.<key>.$route)` into **every**
page, including pages that already bind `.withRoute(appRoutes…)` (all scaffold pages get a
duplicate binding). `ui:remove page` then saw every generated page as "diverged" and refused —
on `main` too. Removal now ignores exactly that generator-owned binding; the root cause is filed
separately.

Unproven here: browser screenshots / 390 px visual pass — the cached Playwright Chromium cannot
start on this host (`libnspr4.so` missing, no root). Full `scaffold.runtime` (Aspire + Docker) —
no Docker daemon on this host; it is CI's merge-readiness gate.
