# chat-render — generative-UI block parser

`parse-blocks.ts` turns assistant chat markdown into a typed, renderable tree. Assistant responses
embed data-visualisation blocks as fenced code with a **curated info-string** (`chart`, `donut`,
`table`, `stats`, `line`); everything else is prose. `parseBlocks` projects that markdown into a
`RenderPart[]` tree whose typed members carry the exact prop shapes of the Fresh UI design-system
primitives, so an app can mount the result with **zero app-side parsing glue**.

The curated vocabulary lives here in `@netscript/fresh-ui` — apps never hand-roll block parsing
(doctrine fitness F-5).

## Public surface

| Export                                                                                                         | Purpose                                                                                   |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `parseBlocks(input: string): RenderPart[]`                                                                     | Parse markdown → typed parts. Never throws.                                               |
| `blockToText(part: RenderPart): string`                                                                        | Inverse projection → canonical markdown (also a plain-text export / non-visual fallback). |
| `RenderPart`                                                                                                   | Discriminated union: `chart \| donut \| table \| stats \| line \| text`.                  |
| `ChartRenderPart`, `DonutRenderPart`, `TableRenderPart`, `StatsRenderPart`, `LineRenderPart`, `TextRenderPart` | Per-kind interfaces.                                                                      |
| `ChartDatum`, `DonutDatum`, `LinePoint`, `TableColumn`, `TableRow`, `StatsEntry`                               | Payload element shapes.                                                                   |
| `RenderTone`, `TableAlign`                                                                                     | Supporting unions.                                                                        |

Every block member mirrors a primitive prop shape:

- `chart` → chart-block `ChartDatum[]` (`{ label, value, tone? }`) + `title/sub/unit/variant`.
- `donut` → donut `DonutDatum[]` + `total`.
- `table` → responsive-table `columns` (`{ key, label, align? }`) + `rows` (cells keyed by column
  key).
- `stats` → stats-grid entries (`{ label, value, detail? }`).
- `line` → a self-contained metric series `LinePoint[]` (`{ x, y }`) + `title/sub/unit`.
- `text` → verbatim prose, and the fallback for any malformed fence.

## Fenced-block grammar

A block is a standard fenced code block whose info-string is one of the five curated kinds:

````text
```chart
{"data":[{"label":"VIF","value":80,"tone":"success"}],"title":"Throughput"}
```
````

Each kind accepts **JSON** (the canonical form) or a **minimal DSL**:

- `chart` / `donut` / `line`: one `label: value` per line, optional `@tone` (e.g.
  `VIF: 80 @success`).
- `stats`: one `label: value` per line; the value keeps its formatting (e.g. `Revenue: $48,200`).
- `table`: a markdown pipe table; the `:---` / `:---:` / `---:` separator row sets column alignment.

An **unrecognised info-string** (e.g. `` ```python ``) or a body that parses as neither JSON nor the
DSL falls back to a `text` part holding the block verbatim — `parseBlocks` never throws.

## Reload-fidelity guarantee (the core property)

`blockToText` is the exact inverse of `parseBlocks`, so a parsed chat survives a serialise → reload
cycle **without drift**. For every input:

```ts
const first = parseBlocks(input);
const reloaded = parseBlocks(first.map(blockToText).join(''));
// reloaded is deep-equal to first
```

`blockToText` emits blocks as canonical single-line-JSON fences and text parts verbatim; the parse
is a boundary-stable fixed point after one normalisation (DSL and loosely-formatted JSON are
normalised on the first parse; the canonical projection re-parses identically). This is what lets a
durable chat session reload a message and re-render byte-identical blocks. It is proven by fixtures
covering all five kinds, mixed prose + blocks, adjacent blocks, and the malformed-fence fallback in
`tests/chat/parse-blocks.test.ts`.

## Relationship to `@netscript/fresh/ai` (FA1)

`@netscript/fresh/ai` exposes its **own** minimal, local `RenderPart` (kinds `text` / `tool`) for
the durable-chat snapshot wire shape. This module owns the **rich** `RenderPart` (chart / donut /
table / stats / line / text) for rendering. The two are intentionally separate and this module is
**self-contained** — it does **not** import from `@netscript/fresh/ai`. A downstream slice
reconciles the two seams (the wire snapshot references rendered blocks); until then, treat
fresh-ui's `RenderPart` as the presentation vocabulary and FA1's as the transport vocabulary.
