---
layout: layouts/base.vto
title: "@netscript/fresh-ui"
---

# `@netscript/fresh-ui`

Fresh UI registry seams and interactive foundations for NetScript. This page is written against
the package public surface reported by `deno doc`. For the full index of packages and
plugins return to the [reference overview](/reference/).

The root entrypoint (`@netscript/fresh-ui`) intentionally stays small: copy-based registry
components and islands remain on workspace-local deep paths so applications can own and evolve
them after copy. The root module exposes only the supported helper utilities that are safe to
consume as package runtime dependencies. Five sub-path exports carry the package runtime seams:

- [`@netscript/fresh-ui/ai/render-ui`](#sub-path-exports) — safe, bounded generative-UI renderer for validated tool payloads.
- [`@netscript/fresh-ui/desktop`](#sub-path-exports) — browser-safe native desktop chrome helpers.
- [`@netscript/fresh-ui/interactive`](#sub-path-exports) — package-owned interactive namespaces for stateful, accessible primitives.
- [`@netscript/fresh-ui/primitives`](#sub-path-exports) — L0 platform-contract primitives.
- [`@netscript/fresh-ui/registry`](#sub-path-exports) — embedded copy-registry manifest and file content.

## Class-name helper

| Symbol | Signature | Description |
| --- | --- | --- |
| `cn` | `function cn(...inputs: ClassValue[]): string` | Combines clsx and tailwind-merge for optimal class merging. |

## Icon primitive

`Icon` is a first-class stroke-SVG icon primitive, re-exported at the package root alongside its
supporting types from `@netscript/fresh-ui/primitives`.

| Symbol | Kind | Description |
| --- | --- | --- |
| `Icon` | component | Renders a named stroke-SVG icon (`IconName`) at a given `IconSize`, forwarding standard SVG attributes. |
| `ICON_PATHS` | const | The stroke-path lookup table backing every `IconName`. |
| `IconName` / `IconSize` / `IconProps` / `IconSvgAttributes` / `IconSvgAttributeValue` | type aliases / interface | Supporting types for the `Icon` primitive. |

## DataGrid

`DataGrid` is a generic, templated data-grid component exported from the package root
(`@netscript/fresh-ui`) — the successor to the earlier `DataTable` registry block. Unlike the
copy-source registry items, `DataGrid` is a runtime export you import directly; you do **not**
`netscript ui:add` it. It renders a token-styled `role="grid"` region from a `columns` contract and
a `rows` contract, and supports plain, button, and Fresh client-navigation rows.

### DataGrid props

| Prop | Type | Description |
| --- | --- | --- |
| `columns` | `readonly DataGridColumn<T>[]` | Ordered column definitions (required). |
| `rows` | `readonly DataGridRow<T>[]` | Ordered row definitions (required). |
| `label` | `string` | Accessible label applied as `aria-label` on the grid region. |
| `class` | `string` | Additional class names appended to the `ns-data-grid` root. |
| `[attribute: string]` | `unknown` | Any further native attributes are forwarded to the grid root. |

### `DataGridColumn<T>`

| Field | Type | Description |
| --- | --- | --- |
| `key` | `string` | Property key used for fallback cell content and stable cell identity. |
| `header` | `string` | Visible column header text. |
| `width` | `string` | CSS grid track width, e.g. `2fr` or `minmax(0, 12rem)`. Defaults to `minmax(0, 1fr)`. |
| `cell` | `DataGridCellVariant` | Optional built-in cell treatment: `"strong"` (bold) or `"num"` (monospace, right-aligned). |
| `render` | `(row: T) => DataGridRenderable` | Optional per-column template receiving the row payload. |

### `DataGridRow<T>`

Every row carries a stable `id`, a caller-owned `data: T` payload, and an optional `selected` flag.
A row renders differently based on which navigation field is present — the three shapes are mutually
exclusive (supply at most one of `onSelect` or `href`):

| Shape | Distinguishing field | Renders as |
| --- | --- | --- |
| Plain | neither `onSelect` nor `href` | a `role="row"` `<div>`. |
| Button | `onSelect: () => void` | a `role="row"` `<button>` that calls `onSelect` on click. |
| Link | `href: string` | a `role="row"` `<a f-client-nav>` for Fresh client navigation. |

### DataGrid symbols

| Symbol | Kind | Description |
| --- | --- | --- |
| `DataGrid` | component | Generic templated data grid; renders `DataGridColumn` definitions over `DataGridRow` data. |
| `DATA_GRID_CELL_VARIANTS` | const | The supported cell-treatment names: `["strong", "num"]`. |
| `DataGridColumn<T>` / `DataGridProps<T>` / `DataGridRow<T>` | interfaces / types | Column, props, and row contracts. |
| `DataGridNode` / `DataGridRenderable` / `DataGridCellVariant` | types | Structural node, renderable cell content, and the cell-variant union. |

### DataGrid example

```tsx
import { DataGrid, type DataGridColumn, type DataGridRow } from "@netscript/fresh-ui";

interface Invoice {
  id: string;
  customer: string;
  total: number;
}

const columns: DataGridColumn<Invoice>[] = [
  { key: "customer", header: "Customer", width: "2fr", cell: "strong" },
  { key: "total", header: "Total", cell: "num", render: (row) => `$${row.total.toFixed(2)}` },
];

const rows: DataGridRow<Invoice>[] = [
  { id: "inv-1", data: { id: "inv-1", customer: "Acme", total: 420 }, href: "/invoices/inv-1" },
  { id: "inv-2", data: { id: "inv-2", customer: "Globex", total: 130 }, selected: true, href: "/invoices/inv-2" },
];

export function InvoiceGrid() {
  return <DataGrid label="Invoices" columns={columns} rows={rows} />;
}
```

A column with `cell: "num"` renders monospace and right-aligned; `cell: "strong"` renders bold. A
column without `render` falls back to `row.data[column.key]` when that key holds a string, number,
bigint, boolean, `null`, or `undefined`.

> **Rows are keyed by `id`.** Supply a stable `id` per row so Preact can reconcile rows across
> re-renders, and provide at most one of `onSelect` or `href` — the row shapes are mutually
> exclusive, and a link row navigates through Fresh (`f-client-nav`) rather than a full page load.

## Dropzone (registry component)

`Dropzone` is a copy-source registry component, not a package export — install it with
`netscript ui:add dropzone`, after which it lives at `components/ui/dropzone.tsx` in your app and is
yours to edit. It renders a dashed file-drop target (`<label class="ns-dropzone">`) that ingests
files from three sources — drag-and-drop, focused clipboard paste, and the native file picker — and
filters each ingest through a shared `accept` / `multiple` policy before calling back.

### Dropzone props

| Prop | Type | Description |
| --- | --- | --- |
| `label` | `string` | Primary call-to-action text. Defaults to `"Drop files or click to upload"`. |
| `hint` | `string` | Secondary hint line (accepted types, size limits). |
| `icon` | `Renderable` | Leading glyph or icon node. Defaults to `↑`. |
| `active` | `boolean` | Forces the drag-over (`data-active`) visual state. |
| `accept` | `string` | Native `accept` string applied to drop, paste, **and** picker ingest. |
| `multiple` | `boolean` | Whether one ingest event may accept more than one file. Defaults to `false`. |
| `onFile` | `(file: File, details: DropzoneIngestDetails) => void` | Called with the first accepted file — the simple single-file path. |
| `onFiles` | `(files: readonly File[], details: DropzoneIngestDetails) => void` | Called with every accepted file. |
| `onReject` | `(files: readonly DropzoneRejectedFile[], details: DropzoneIngestDetails) => void` | Called with every rejected file. |
| `onDrop` / `onDragOver` / `onPaste` | event handlers | Optional passthrough handlers invoked after the built-in ingest runs. |
| `children` | `Renderable` | Additional content rendered inside the label. |
| `class` | `string` | Additional class names appended to the `ns-dropzone` root. |

`DropzoneProps` also extends `JSX.HTMLAttributes<HTMLLabelElement>` (minus `class`, `onDrop`,
`onDragOver`, and `onPaste`, which the component owns), so standard label attributes pass through.

### Dropzone ingest types

| Symbol | Kind | Description |
| --- | --- | --- |
| `DROPZONE_INGEST_SOURCES` | const | The ingest source names: `["drop", "paste", "picker"]`. |
| `DROPZONE_REJECTED_REASONS` | const | The rejection reason names: `["type", "too-many"]`. |
| `DropzoneIngestSource` | type | `"drop" \| "paste" \| "picker"`. |
| `DropzoneRejectedReason` | type | `"type" \| "too-many"`. |
| `DropzoneRejectedFile` | interface | A rejected `file`, its `reason`, and the ingest `source` that supplied it. |
| `DropzoneIngestDetails` | interface | `acceptedFiles`, `rejectedFiles`, the ingest `source`, and the original `event`. |
| `DropzoneProps` | interface | The full prop contract documented above. |

### Dropzone example

```tsx
import { Dropzone, type DropzoneIngestDetails } from "@app/components/ui/dropzone.tsx";

export function AvatarUpload() {
  function handleFiles(files: readonly File[], details: DropzoneIngestDetails) {
    console.log(`Accepted ${files.length} file(s) via ${details.source}`);
    for (const rejected of details.rejectedFiles) {
      console.warn(`Rejected ${rejected.file.name}: ${rejected.reason}`);
    }
  }

  return (
    <Dropzone
      label="Drop images or click to upload"
      hint="PNG or JPG, up to 5 MB"
      accept="image/png,image/jpeg"
      multiple
      onFiles={handleFiles}
    />
  );
}
```

Rejections are reported, not silent: a file whose type falls outside `accept` is rejected with
reason `"type"`, and — when `multiple` is `false` — every file after the first is rejected with
reason `"too-many"`. Each ingest also updates a visually-rendered `aria-live` status node so
assistive technology hears how many files were accepted or rejected.

> **Paste ingest requires focus.** Clipboard paste only fires while the dropzone (or a child) holds
> focus, so pair it with a focusable affordance. The picker `<input>` clears its value after each
> selection, so re-selecting the same file still triggers `onFile` / `onFiles`.

## Redirect-flash (toast) helpers

| Symbol | Signature | Description |
| --- | --- | --- |
| `getToast` | `function getToast(url: URL): RegistryToast \| undefined` | Reads a toast payload from a URL when redirect-flash query parameters are present. |
| `withToast` | `function withToast(path: string, toast: RegistryToast): string` | Appends a toast payload to a relative application path. |
| `stripToastFromUrl` | `function stripToastFromUrl(url: URL): string` | Removes all toast query parameters from a URL while preserving path and hash. |
| `REGISTRY_TOAST_QUERY_KEYS` | `const REGISTRY_TOAST_QUERY_KEYS: { message: string; title: string; type: string }` | Query-string keys reserved by the redirect-flash helpers. |

### Toast types

| Symbol | Kind | Description |
| --- | --- | --- |
| `RegistryToast` | interface | Redirect-flash payload persisted in URL query parameters (`message`, optional `title`, `type`). |
| `RegistryToastType` | type alias | Toast semantic variants: `"success" \| "error" \| "warning" \| "info"`. |

## Interactive namespaces

Exported from the [`@netscript/fresh-ui/interactive`](#sub-path-exports) sub-path. Each is a
compound namespace bundling a root component with its structural subcomponents. The namespace
types are package-internal (see note below).

| Symbol | Signature | Description |
| --- | --- | --- |
| `Accordion` | `const Accordion: AccordionNamespace` | Compound accordion namespace with root and item subcomponents. |
| `Dialog` | `const Dialog: DialogNamespace` | Compound dialog namespace with root and structural subcomponents. |
| `Drawer` | `const Drawer: DrawerNamespace` | Compound drawer namespace with root and structural subcomponents. |
| `Popover` | `const Popover: PopoverNamespace` | Compound popover namespace with root and positioning subcomponents. |
| `Sheet` | `const Sheet: SheetNamespace` | Compound sheet namespace — side-docked inspection panel. |
| `Tabs` | `const Tabs: TabsNamespace` | Compound tabs namespace with root, list, trigger, and content subcomponents. |
| `Tooltip` | `const Tooltip: TooltipNamespace` | Compound tooltip namespace with root and positioning subcomponents. |

> **Surface note:** the `*Namespace` types backing these exports are currently package-internal.
> `deno doc --lint` reports them as `private-type-ref` errors; making them public is planned for
> a future release. The runtime exports themselves are stable.

## L0 primitives

Exported from the [`@netscript/fresh-ui/primitives`](#sub-path-exports) sub-path. L0 stays small:
prefer Preact intrinsic elements and platform attributes, using these helpers only where they
encapsulate real behavior.

| Symbol | Signature | Description |
| --- | --- | --- |
| `Show` | `function Show<T>({ when, fallback, children }: ShowProps<T>): PrimitiveChildren` | Conditionally renders children without introducing an extra DOM wrapper. |
| `VisuallyHidden` | `function VisuallyHidden({ children, style, ...props }: VisuallyHiddenProps): PrimitiveNode` | Renders content for assistive technology while keeping it visually hidden. |
| `SrOnly` | `function SrOnly(props: VisuallyHiddenProps): PrimitiveNode` | Alias for `VisuallyHidden` using the common screen-reader naming. |

### Primitive types

| Symbol | Kind | Description |
| --- | --- | --- |
| `PrimitiveNode` | interface | Structural node returned by element-producing L0 primitives (`type`, `props`, `key`). |
| `ShowProps<T>` | interface | Props accepted by `Show` (`when`, optional `fallback`, `children`). |
| `VisuallyHiddenProps` | interface | Props accepted by `VisuallyHidden` and `SrOnly` (`children`, `style`, arbitrary attributes). |
| `PrimitiveChild` | type alias | Primitive value that can be rendered by an L0 helper. |
| `PrimitiveChildren` | type alias | Renderable content accepted by L0 primitives (a child or readonly array of children). |
| `VisuallyHiddenStyle` | type alias | Inline style accepted by visually-hidden primitives. |

## Generative UI renderer (@netscript/fresh-ui/ai/render-ui)

Exported from `@netscript/fresh-ui/ai/render-ui`. This module provides a safe, bounded generative-UI renderer that converts structured `render_ui` tool payloads into standard Preact DOM nodes.

> **Input contract:** The renderer consumes input already validated by `@netscript/ai/tools` (`RenderUiToolInput`). It does not validate arbitrary model output; callers must parse and validate raw model payloads with `@netscript/ai/tools` before passing them to the renderer.

### Allowed block categories

The renderer restricts markup generation to a curated 8-block allowlist across three categories (`RENDER_UI_BLOCK_CATEGORIES`):

| Category | Allowed block types | Description |
| --- | --- | --- |
| `layout` | `stack`, `grid`, `section` | Container elements that layout child blocks. |
| `viz` | `chart`, `metric` | Visual presentation blocks for stats and trend data. |
| `data` | `table`, `list`, `card` | Data presentation blocks for tabular and item lists. |

### Depth bounds and fallback reasons

To protect against deeply nested or malformed model payloads, rendering is bounded by `maxDepth` (defaults to `RENDER_UI_MAX_DEPTH` = `6`). When a payload cannot be rendered safely, a styled fallback element is emitted with a specific `RenderUiFallbackReason`:

- `'max-depth'`: Payload nesting exceeded the configured maximum depth limit.
- `'unknown-type'`: Block type is outside the accepted 8-block allowlist.
- `'invalid-node'`: Node payload is malformed or unrenderable.

### Renderer symbols

| Symbol | Kind | Description |
| --- | --- | --- |
| `renderUiPayload` | function | `function renderUiPayload(payload: RenderUiToolInput, options?: RenderUiOptions): RenderUiNode` — Renders a validated payload into safe Preact DOM. |
| `RenderUiSurface` | component | `function RenderUiSurface(props: RenderUiSurfaceProps): RenderUiNode` — JSX component wrapper around `renderUiPayload`. |
| `RENDER_UI_MAX_DEPTH` | const `6` | Default maximum recursive block depth. |
| `RENDER_UI_BLOCK_CATEGORIES` | const | Map of accepted categories to block type names (`layout`, `viz`, `data`). |
| `RenderUiToolInput` | type alias | Re-exported validated payload type from `@netscript/ai/tools`. |
| `RenderUiOptions` / `RenderUiSurfaceProps` | interfaces | Renderer configuration and component prop contracts (`maxDepth`, `payload`). |
| `RenderUiFallbackReason` | type alias | Union of fallback reasons: `'max-depth' \| 'unknown-type' \| 'invalid-node'`. |

### Renderer example

```tsx
import { RenderUiSurface, renderUiPayload } from "@netscript/fresh-ui/ai/render-ui";

const payload = {
  component: "section",
  title: "System Performance",
  props: {
    children: [
      {
        type: "grid",
        props: {
          children: [
            {
              type: "metric",
              props: { label: "P99 Latency", value: "24 ms", detail: "healthy" },
            },
            {
              type: "metric",
              props: { label: "Error Rate", value: "0.01%", detail: "normal" },
            },
          ],
        },
      },
      {
        type: "table",
        title: "Active Services",
        props: {
          columns: [
            { key: "name", header: "Service" },
            { key: "status", header: "Status" },
          ],
          rows: [
            { name: "auth-service", status: "healthy" },
            { name: "payment-gateway", status: "healthy" },
          ],
        },
      },
    ],
  },
};

export function PerformanceWidget() {
  return <RenderUiSurface payload={payload} maxDepth={6} />;
}
```

## Sub-path exports

The following 6 entrypoints are published as declared in the package export map:

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/fresh-ui` | `./mod.ts` | Stable runtime helpers (`cn`, redirect-flash toast helpers, the `Icon` primitive, and `DataGrid` — documented above). |
| `@netscript/fresh-ui/ai/render-ui` | `./src/ai/render-ui.tsx` | Safe, bounded generative-UI renderer (`renderUiPayload`, `RenderUiSurface`, block vocabulary — documented above). |
| `@netscript/fresh-ui/desktop` | `./desktop.ts` | Browser-safe native desktop chrome helpers and IPC bridge definitions (`createDesktopChrome`). |
| `@netscript/fresh-ui/interactive` | `./interactive.ts` | Package-owned interactive compound namespaces (`Accordion`, `Dialog`, `Drawer`, `Popover`, `Sheet`, `Tabs`, `Tooltip` — documented above). |
| `@netscript/fresh-ui/primitives` | `./primitives.tsx` | L0 platform-contract primitives (`Show`, `VisuallyHidden`, `SrOnly` — documented above). |
| `@netscript/fresh-ui/registry` | `./registry.ts` | Embedded Fresh UI copy-registry manifest and file content (`freshUiRegistryManifest`, `FRESH_UI_REGISTRY_CONTENT`). |

---

Back to the [reference overview](/reference/).
