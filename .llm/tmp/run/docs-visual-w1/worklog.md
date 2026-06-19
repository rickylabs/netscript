# Worklog — Docs v2 / W1 code highlighting + tables

## Design

- Public surface: static docs site rendering under `docs/site`; no exported package APIs.
- Domain vocabulary: Lume `codeHighlight` language registration, highlight.js `.hljs-*` tokens,
  Markdown prose tables, `apiTable` component tables.
- Ports: Lume code_highlight plugin, highlight.js language modules, Playwright Chromium.
- Constants: route sweep = home, quickstart, capabilities/database, tutorials/build-a-service,
  cli-reference, reference/watchers; viewports = `1280x900`, `390x844`; themes = light, dark.
- Commit slices: one scoped docs visual slice touching `_config.ts` and `styles/docs.css`.
- Deferred scope: no generated reference content, no lockfile churn, no package/plugin changes.
- Contributor path: future docs visual fixes should start in `docs/site/styles/docs.css`; language
  registrations live in `docs/site/_config.ts`.

## Evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Before screenshots | PASS | 24 screenshots captured under `screenshots/before/`. |
| Build | PASS | `deno task --cwd docs/site build`, exit 0; log saved to `build-after.log`. |
| Unknown-language warnings | PASS | `rg "Unknown language" build-after.log` returned no matches. |
| Playwright sweep | PASS | `PASS 24 page/theme/viewport checks`; JSON saved to `playwright-after.json`. |
| After screenshots | PASS | 24 screenshots captured under `screenshots/after/`. |
| Lock hygiene | PASS | `git status --short` shows no `docs/site/deno.lock` modification after pinned imports. |

## Notes

- The build still prints repeated highlight.js unescaped-HTML warnings. This was present before the
  fix and is distinct from the requested unknown-language acceptance line.
- Representative visual spot checks: desktop dark quickstart shows multi-token code highlighting;
  mobile dark cli-reference and mobile light reference/watchers show bordered, readable tables with
  horizontal scroll where needed.
