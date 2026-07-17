# `markdown` — sanitized streaming markdown renderer

A copy-based `@netscript/fresh-ui` registry item (kind `component`, layer 3) for rendering chat /
assistant markdown output — including mid-stream (streaming) chunks — with GFM, math, syntax
highlighting, grounded-agent citations, and a **mandatory, non-optional sanitize pass**.

Install it into an app with:

```sh
netscript ui:add markdown
# or, to pull the whole AI surface:
netscript ui:add ai
```

## Files copied into the app

| Registry source                                | App target                           |
| ---------------------------------------------- | ------------------------------------ |
| `registry/components/ui/markdown.tsx.template` | `components/ui/markdown.tsx`         |
| `registry/components/ui/markdown-pipeline.ts`  | `components/ui/markdown-pipeline.ts` |
| `registry/components/ui/markdown.css`          | `assets/ui/markdown.css`             |

`registryDependencies`: `theme-seed`, `citation-chip`.

## npm dependencies added to the consuming app

`ui:add` merges these into the app's `deno.json` `imports` — they are **never** added to
`@netscript/fresh-ui` itself:

- `npm:unified@^11`
- `npm:remark-parse@^11`
- `npm:remark-rehype@^11`
- `npm:remark-gfm@^4`
- `npm:remark-math@^6`
- `npm:rehype-react@^8`
- `npm:rehype-katex@^7`
- `npm:rehype-highlight@^7`
- `npm:rehype-sanitize@^6`
- `npm:katex@^0.16`
- `npm:highlight.js@^11`

The item also contributes two `@import` lines to the app's styles aggregator: its own
`markdown.css` and `katex/dist/katex.min.css`. The registry-owned token palette in `markdown.css`
styles highlight.js output in both themes.

### App wiring

The unified processor compiles its sanitized hast tree directly through `rehype-react` configured
with `preact/jsx-runtime`. No React, React DOM, or `preact/compat` alias is required.

## Public surface

### `<Markdown>` (`markdown.tsx`)

```tsx
import { Markdown } from '../components/ui/markdown.tsx';

<Markdown streaming onCite={(n) => select(n)} activeCite={active}>
  {chunk}
</Markdown>;
```

| Prop         | Type                      | Notes                                               |
| ------------ | ------------------------- | --------------------------------------------------- |
| `children`   | `string`                  | Raw model / assistant markdown source.              |
| `streaming`  | `boolean`                 | Pre-process a possibly-truncated chunk (see below). |
| `onCite`     | `(index: number) => void` | Invoked when a rendered citation chip is activated. |
| `activeCite` | `number`                  | Highlights the matching citation chip.              |
| `class`      | `string`                  | Extra class names for the `.ns-markdown` wrapper.   |

### Pipeline order (sanitize is unconditional)

- **remark** (source -> mdast): `remark-parse`, `remark-gfm`, `remark-math`, `remarkCitations`.
- **bridge** (mdast -> hast): `remark-rehype`.
- **rehype** (hast -> Preact): `rehype-katex`, `rehype-highlight`, then **`rehype-sanitize` as the
  final content transform**, `rehypeInlineStyles`, and `rehype-react` with the Preact JSX runtime.

The sanitize pass is hard-wired as the last stage and is **never** exposed as a caller-toggled
option. `script` is force-removed from the allow-list and no event-handler attribute is ever
permitted, so model-authored `<script>` / `on*=` HTML can never reach the DOM. The schema is widened
only enough to keep citation chips, KaTeX MathML, and highlight.js class output rendering.

### `markdown-pipeline.ts` (pure, dependency-free helpers)

- `remarkCitations(): MdastTransformer` — rewrites `[n]` citation tokens (1–3 digits, the same
  convention `message` uses) into `<citation-chip index="n">` render calls. The component map passed
  to `rehype-react` renders the sibling `citation-chip` item.
- `stripIncompleteSyntax(chunk: string): string` — repairs a truncated mid-stream chunk so partial
  syntax renders cleanly instead of leaking raw markers: it closes an unterminated fenced code
  block, inline code span, bold run, and inline/block math, and drops a dangling incomplete link at
  the tail. Complete input is returned unchanged. Called automatically when `streaming` is set.
- `extendSanitizeSchema(base): SanitizeSchema` — builds the final sanitize allow-list from the
  plugin's `defaultSchema`; force-removes `script` and adds only `citation-chip` + the KaTeX tag
  set + `className` / `style` passthrough.

## Tutorial ergonomics

Designed to drop straight into a streaming assistant message: feed each mid-stream chunk to
`<Markdown streaming>{chunk}</Markdown>` and citations wire to the `citation-chip` item with no
app-side glue beyond the `ui:add` copy.
