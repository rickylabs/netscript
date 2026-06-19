# Context Pack — Docs v2 / W1 code highlighting + tables

## Status

Implementation complete locally. Branch: `fix/docs-visual-w1-code-tables`.

## Changes

- `docs/site/_config.ts`: imports pinned highlight.js language modules and registers shell, JSON,
  and TypeScript aliases with Lume `codeHighlight`.
- `docs/site/styles/docs.css`: adds light/dark highlight.js token colors, stronger code-block
  surfaces, bordered/zebra table styling, and mobile table scroll behavior for Markdown and
  `apiTable` tables.

## Validation

- Build: `deno task --cwd docs/site build` passed.
- Unknown language warnings: zero matches in `build-after.log`.
- Playwright: Chromium sweep passed 24 route/theme/viewport checks with zero console errors.
- Screenshots: before/after images are under `.llm/tmp/run/docs-visual-w1/screenshots/`.

## Residual Risk

- Existing highlight.js unescaped-HTML build warnings remain and were not in scope.
