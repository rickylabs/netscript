# WSL Codex Step-6 Brief — docs/content-architecture polish to bar

You are a **daemon-attached, mobile-visible Codex implementation agent**. You implement; you do
NOT self-certify, do NOT merge, do NOT open/close the PR. A separate OpenHands session runs the
final evaluation after you. Work the items below to the bar, keeping the docs build green.

## Pre-flight (do this first, exactly)

1. Confirm cwd and branch: you are in worktree `/home/codex/repos/netscript-docs-content-arch`
   on branch `docs/content-architecture`. Run `git fetch origin docs/content-architecture` and
   `git reset --hard origin/docs/content-architecture` so you are on the latest tip
   (≥ `6ab05475`). Confirm a clean tree.
2. Read context: `AGENTS.md`, `.agents/skills/netscript-harness/SKILL.md`,
   `.agents/skills/netscript-doctrine/SKILL.md`, the docs plan
   `.llm/tmp/run/docs-content-architecture--impl/doc-architecture-v2.md` (§5 component catalog,
   §4 ground-truth markers), `ground-truth.md`, and `ground-truth-project-anatomy.md`.
3. Note the Lume/Vento build landmines (do not reintroduce): (a) the bare keyword `function`
   inside any `{{ comp ... }}` tag arg aborts the build — use arrow/const in code samples that
   sit inside comp args; (b) an orphan `{{ /comp }}` with no matching block opener breaks the
   build — callouts WITH a body use the TAG form `{{ comp callout { type, title } }} …body…
   {{ /comp }}`, never the function form `{{ comp.callout({...}) }}` with a closer.

## The build gate (run after EVERY item; never commit red)

```
deno task --cwd docs/site build
```

Must finish green (`🍾 Site built into _site`, ~148+ files, no `TemplateError`/`TransformError`).
For item 3 specifically, the `Unknown language: "no-highlight"` warning must DISAPPEAR.

## Hard scope constraints

- **Do NOT touch**: `docs/site/reference/**` (22 generated units), `packages/**`, `plugins/**`,
  the dependency catalog, version pins (`scaffold-versions.ts` etc.), or any lock file. Do not run
  `deno cache --reload`.
- Chrome edits to `docs/site/_config.ts`, `docs/site/_includes/layouts/base.vto`, and
  `docs/site/_components/*.vto` ARE authorized for this pass (user-approved scope expansion,
  recorded in `drift.md`). Keep them minimal, idiomatic, and consistent with existing tokens/styles.
- Docs-only: do NOT run the expensive `deno task e2e:cli` scaffold runtime suite. The docs build is
  your gate. For `--no-aspire` (item 2) verification, a scoped `netscript init --help` or a single
  throwaway scaffold in a temp dir is fine — clean it up.

## Tasks (commit one slice per item; push + PR-comment after each)

### Item 1 — Watchers + config intent-surface coverage (docs)
The `watchers` capability and the framework's config-intent model are only present in the generated
`/reference/watchers/` unit; the narrative docs never surface them. Inspect the real surface first
(`deno doc jsr:@netscript/watchers` or the local package; and the config types — `deno doc` the
config module). Then add discoverable narrative coverage: a Watchers subsection in the most fitting
Capabilities page (or a short dedicated capability blurb) and surface the config-intent model where
a reader would look (likely `explanation/architecture.md` or `capabilities/index.md`). Cross-link to
`/reference/watchers/`. Acceptance: a reader can learn what watchers are and how config intent works
from the narrative tree, grounded in the real surface (no invented APIs).

### Item 2 — `--no-aspire` verification + doc grounding (docs)
The landing/why/quickstart copy claims `netscript init --no-aspire` opts out of Aspire. VERIFY the
flag exists and behaves as documented (`netscript init --help`, or a temp-dir scaffold with
`--no-aspire`). If reality differs from the docs, fix the DOCS to match reality (do not change the
CLI) and record the finding in `worklog.md`. Acceptance: every `--no-aspire` mention in the docs is
accurate to the actual CLI behavior.

### Item 3 — Highlighter plaintext registration (chrome / `_config.ts`)
`capabilities/database.md` (and any `text`/no-language fence) triggers
`Error highlighting code block … Unknown language: "no-highlight"`. Fix the code-highlight plugin
config in `docs/site/_config.ts` so plain-text/`text` fences are handled without the warning
(register the `text`/`plaintext` language or set the appropriate fallback for the configured
highlighter). Acceptance: build emits ZERO `Unknown language` warnings; all existing highlighted
code still renders.

### Item 4 — Alpha-status badge (chrome)
NetScript is alpha; the site should say so without being noisy. Add a small, tasteful "Alpha" badge
to the chrome (header/topbar in `base.vto`, or a hero adornment), using existing design tokens.
Acceptance: badge renders site-wide (or on the landing + every doc page header), is unobtrusive,
build green.

### Item 5 — Footer "Edit this page on GitHub" links (chrome)
Add per-page footer edit-links in the `base.vto` layout that deep-link to the page's source on
GitHub (repo `rickylabs/netscript`, branch `main`, path derived from the page's source file under
`docs/site/`). Skip generated `/reference/**` pages if their source path doesn't map cleanly.
Acceptance: content pages show a working "Edit this page" link resolving to the correct GitHub file
URL; build green.

## Per-slice protocol (harness)

After each item: `deno task --cwd docs/site build` green → `git add` the touched files →
commit with a conventional message + the trailers below → `git push origin docs/content-architecture`
→ post a PR #59 comment (item scope, commit hash, build result: file count + "no errors") →
append the commit line to `.llm/tmp/run/docs-content-architecture--impl/commits.md` → add a
`worklog.md` entry (what changed, ground-truth refs, build result).

Commit message trailer (every commit):

```
Co-Authored-By: Codex (gpt-5.x, WSL daemon) <noreply@openai.com>
Run: docs/content-architecture Step-6 polish
```

## Reporting & steering

- If any item is ambiguous or reality contradicts the plan/docs, STOP, write the finding to
  `drift.md`, and wait for supervisor steering (`codex exec resume <this-thread>`). Do NOT guess
  on framework behavior.
- When all 5 items are done, green, committed, and pushed, post a final PR #59 summary comment
  listing the commits + final build result, and write a `worklog.md` completion entry. Do NOT
  merge. The supervisor routes to the OpenHands final eval (qwen3.7-max).
