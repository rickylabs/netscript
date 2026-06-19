# Plan — Docs v2 / W1 code highlighting + tables

## Profile

- Archetype: N/A, docs-site visual CSS/config work only.
- Overlay: `.llm/harness/archetypes/SCOPE-docs.md`.
- Doctrine verdict: package/plugin doctrine does not apply; no `packages/**` or `plugins/**`
  changes.

## Locked Decisions

- Register only the language grammars used by the docs surface: shell via `bash` aliases, JSON, and
  TypeScript via `ts`/`tsx`/`typescript` aliases. Keep `text`, `plaintext`, `no-highlight`, and
  `prisma` as plaintext registrations.
- Pin highlight.js language imports to the version already locked by `docs/site/deno.lock`
  (`11.11.1`) to avoid lockfile churn.
- Keep syntax theme CSS in `docs/site/styles/docs.css` using existing `--ns-*` tokens rather than a
  downloaded highlight.js theme file.
- Preserve wide Markdown and generated reference tables by making `.ns-prose` horizontally scrollable
  and giving tables a readable minimum width; keep `apiTable` scrolling through its existing wrapper.

## Gate Set

- `deno task --cwd docs/site build` passes.
- Build log contains zero `Unknown language` warnings.
- Playwright Chromium sweep covers desktop `1280x900` and mobile `390x844`, light and dark mode, for
  home, quickstart, capabilities/database, tutorials/build-a-service, cli-reference, and
  reference/watchers.
- Playwright records zero console errors, highlighted code blocks with token spans, table borders,
  no page-level horizontal overflow, and readable mobile table widths.

## Commit Slices

1. Docs visual fix: register highlight.js languages, add token-driven highlight styling, and harden
   Markdown/api table readability.
   - Files: `docs/site/_config.ts`, `docs/site/styles/docs.css`.
   - Gates: docs build plus Playwright sweep.

## Deferred Scope

- No generated reference content changes.
- No package/plugin source changes.
- No lockfile dependency changes.
- No fix for existing highlight.js unescaped-HTML warnings unless separately scoped.
