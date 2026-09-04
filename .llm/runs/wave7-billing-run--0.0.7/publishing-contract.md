# devocracy-website publishing contract — follow literally

Audited read-only at `main`. A wrong prop name or import path costs a failed build.

## Frontmatter (schema: `src/content.config.ts`, collection `blog`)

Files are `src/content/blog/<locale>/<slug>.mdx` — exactly two levels.

| Field | Required | Constraint |
| --- | --- | --- |
| `title` | yes | 8–90 chars |
| `summary` | yes | 40–260 |
| `description` | yes | 80–320, must stand alone as meta/OG |
| `published` | yes | date, e.g. `2026-09-03` |
| `updated` | no | date |
| `tags` | yes | 1–3, **only** from: `architecture`, `migration`, `commerce`, `deployment`, `content`, `open-source` |
| `cover` | yes | `'../../../assets/blog/<file>'` |
| `coverDark` | no | dark twin |
| `coverAlt` | yes | min 20 chars |
| `client` | yes | 2–28 chars |
| `author` | no | 2–40; the builder's own model name |

There is **no** `draft`, `hero`, `image`, `date`, `lang` or `slug` field. A missing required key fails
the build.

## The five traps that break a first attempt

1. **Never import components in MDX.** They are injected by `[slug].astro` via the `components`
   prop. A post imports **only its images**. Available names: `Code`, `Figure`, `Gallery`,
   `Devices`, `Pull`, `Citation`, `Sources`, `SourceEmbed`. Nothing else in `src/components/` works.
2. **Never use triple-backtick fences.** `astro.config.mjs` sets `syntaxHighlight: false`, so a
   fence degrades to an unstyled `<pre>`. Zero fenced blocks exist in any post. Use
   `<Code path="main.ts" code={`...`} lang="ts|bash|json" />` with a template literal.
3. **`Devices` uses `light`, not `src`**: `mobile={{ light: a, dark: b, alt: '…' }}`. Its doc comment
   demands three *different pages* at 390 / 834 / 1440 px, not one page scaled.
4. **`[object Object]`**: an imported image is an `ImageMetadata` object. `Figure`/`Gallery`/
   `Devices` take the binding directly; a raw `<img>` must take `binding.src`.
5. **Never use `<picture>` + `prefers-color-scheme`** — the site has a `data-theme` toggle a media
   query cannot see. Pass `dark` and let the component emit `.shot-light`/`.shot-dark`.

`Citation index={n}` is 1-based into the `Sources` `items` array; `Sources` renders its own heading.
The ToC only appears with **more than one** `##` heading.

## The bilingual gate is weaker than the bar

`src/lib/blog.ts` throws when a slug exists in one language only — but it checks **existence, not
quality**. A stub passes the build. Prior run PR #23 shipped exactly that. The French article must be
a real translation of comparable length; this is enforced by the evaluator, not the compiler.

## Reference post

`src/content/blog/en/how-the-web-stack-grew-up.mdx` — ~4,970 words, 10 `Figure`, 8 `Citation`,
5 `Pull`, 3 `SourceEmbed`, 3 `Code`, 19 image imports, eleven `##` headings that are full
declarative sentences. Its French twin is a full translation, not a stub.

## Isolation

There are **no GitHub Actions**; preview is Vercel, which comments a preview URL on the PR. Commit
authorship has blocked previews on prior agent PRs — check the bot comment rather than assuming.

17 prior agent posts live on open draft PRs. Branch from current `origin/main`, pick a slug used by
none of them, and **namespace every image `src/assets/blog/<product>-*`** — prior branches used
generic names like `board-light.webp` that would collide.
