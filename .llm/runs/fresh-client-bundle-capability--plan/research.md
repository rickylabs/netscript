# Research — fresh-client-bundle-capability--plan

## Re-baseline

- Carried-in sources: issues #1601 and #1557 plus the owner brief in `implement.md`.
- Re-derived against `origin/main` at `37452f11f5045f0f5a98e07d802bcc2a2e94333b` on 2026-09-02.
- What changed versus the original #1557 premise:
  - `packages/fresh/tests/form-navigation_browser.ts` now drives real client navigation through
    Playwright and a Vite fixture server.
  - `packages/fresh/deno.json` now has `test:browser`; CI installs the existing Playwright CLI and
    Chromium only when `needs_fresh_browser` is true.
  - Therefore #1557 no longer requires a new browser lane or CLI E2E infrastructure.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The default defer bundle test still executes `deno run --no-lock -A npm:vite@7.2.2`, bypassing the workspace lock and resolving an npm specifier at test runtime. | `packages/fresh/tests/defer-island-client-bundle_test.ts:20-29` |
| 2 | The existing browser tests repeat the same unlocked runtime resolution twice, so new browser coverage must not copy that defect. | `packages/fresh/tests/form-navigation_browser.ts:21-31,114-124` |
| 3 | Vite is already exact-pinned in the Fresh workspace member and resolved in the root lock: `vite -> npm:vite@7.2.2`; no dependency or lockfile edit is needed. | `packages/fresh/deno.json:60`; `deno.lock` key `npm:vite@7.2.2`; `deno task deps:why vite` reports source use and not removable |
| 4 | A locked invocation works without registry resolution at test time: `deno run --frozen --cached-only -A vite build ...` uses exact `npm:vite@7.2.2` from the Deno cache prepared by deterministic `deno install`. `NPM_CONFIG_CACHE` does not make that Deno cache cold; a genuinely cold Deno cache fails loudly by design. | Corrected F1 evidence on 2026-09-02; Vite 7.2.2 built 45 client and 188 SSR modules in 3.9 seconds from the prewarmed Deno cache |
| 5 | A real browser is required to prove a client-side partial request and DOM swap. Static bundle inspection and server-only fetches cannot trigger the hydrated island's `useEffect()`/`requestSubmit()` path. | `DeferIsland.tsx:179-205`; #1557 re-triage comment |
| 6 | The browser driver and image cost are already paid by the impact-gated Fresh browser job: CI installs `@playwright/cli@0.1.17` and Chromium, then runs the `fresh-browser` gate. | `.github/workflows/ci.yml:252-265` |
| 7 | Local `test:browser` cannot currently execute because `playwright-cli` is absent on this host. The existing task failed both tests after 10.8 seconds during driver spawn; this is an environment capability gap, not product evidence. | `deno task --cwd packages/fresh test:browser` on 2026-09-02 |
| 8 | `decideDeferClientAction` has the correct partial-hit/partial-miss implementation but no direct policy assertions; the bundle content test cannot detect inverted branches. | `packages/fresh/src/application/defer/policy.ts:177-182`; issue #1557 comment |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/fresh/deno.json` export map and `deno doc` for the builders entry.
- Planned public-surface change: none. Changes are confined to tests, test fixtures, and a package
  task; `publish.exclude` already excludes `tests/`.
- Slow-type / surface risks: none introduced. No export, entry point, published source, dependency,
  or publish file-list change is planned.
- Existing doctrine state: `@netscript/fresh` is Archetype 4 with a **Keep** verdict. Its historical
  AP-1/F-7 entries are resolved; unrelated compatibility and hosted-example debt remains untouched.

## Open questions

- None that force implementation rework. The local absence of `playwright-cli` is an evidence
  limitation to be closed by the already-provisioned CI browser gate, not by adding a dependency.
