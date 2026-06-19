# Research — Docs v2 / W1 code highlighting + tables

## Scope

- Branch: `fix/docs-visual-w1-code-tables`.
- Target PR base: `docs/user-site`.
- Worktree scope: `docs/site/**` plus harness artifacts under this run directory.

## Findings

- `docs/site/_config.ts` already uses Lume `code_highlight`, but only registered plaintext aliases
  plus `prisma`. The docs source fences in the built docs surface use `bash`, `sh`, `json`, `text`,
  and `ts`; generated/reference pages also emit `language-typescript` aliases.
- Lume's code highlight plugin documentation confirms the current `languages` option shape:
  `codeHighlight({ languages: { javascript: lang_javascript, bash: lang_bash } })`, with language
  modules imported from `npm:highlight.js/lib/languages/*`.
- The site has an existing light/dark token system in `docs/site/styles/tokens.css` keyed by
  `data-theme`, so local `hljs` CSS in `docs.css` is the lowest-risk way to harmonize code colors
  with both themes.
- Markdown tables are raw rendered tables inside `.ns-prose`; `apiTable` already emits
  `.ns-api-table-wrap`. The previous CSS had basic dividers but Markdown tables could still feel
  cramped, and generated reference tables needed a mobile scroll strategy.
- `deno task --cwd docs/site build` prints repeated highlight.js unescaped-HTML warnings from
  existing code-block content, but no `Unknown language` lines after this change.

## Open Questions

- None blocking. The unescaped-HTML highlight.js warning is residual build noise outside this brief's
  acceptance line and is recorded in `worklog.md`.
