---
layout: layouts/base.vto
title: '@netscript/fresh-ui'
---

# `@netscript/fresh-ui`

Runtime helpers, interactive primitives, the generative-UI renderer and design-token tooling for
NetScript Fresh apps. Copy-source registry components and islands are not package exports: they are
copied into your app with `netscript ui:add` and stay yours to evolve. The package exports only the
helpers that are safe as runtime dependencies, plus build tooling.

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/fresh-ui` | `./mod.ts` | Stable runtime helpers: [`cn`](#class-name-helper), [redirect-flash toast helpers](#redirect-flash-toast-helpers), the [`Icon` primitive](#icon-primitive) and [`DataGrid`](#datagrid). |
| `@netscript/fresh-ui/ai/render-ui` | `./src/ai/render-ui.tsx` | [Safe, bounded generative-UI renderer](#generative-ui-renderer-netscriptfresh-uiairender-ui) (`renderUiPayload`, `RenderUiSurface`, block vocabulary). |
| `@netscript/fresh-ui/desktop` | `./desktop.ts` | [Browser-safe native desktop chrome helpers](#desktop-chrome) and IPC bridge definitions (`createDesktopChrome`). |
| `@netscript/fresh-ui/interactive` | `./interactive.ts` | [Package-owned interactive compound namespaces](#interactive-namespaces-and-contracts) (`Accordion`, `Dialog`, `Drawer`, `Popover`, `Sheet`, `Tabs`, `Tooltip`). |
| `@netscript/fresh-ui/primitives` | `./primitives.tsx` | [L0 platform-contract primitives](#l0-primitives) (`Show`, `VisuallyHidden`, `SrOnly`). |
| `@netscript/fresh-ui/registry` | `./registry.ts` | [Embedded copy-registry manifest and file content](#embedded-registry) (`freshUiRegistryManifest`, `FRESH_UI_REGISTRY_CONTENT`). |
| `@netscript/fresh-ui/token-config` | `./token-config.ts` | Lightweight `APP_TOKEN_FILES`, `PREVIEW_TOKEN_FILES` and `TOKEN_PRESETS` metadata, with no Style Dictionary or source corpus. |
| `@netscript/fresh-ui/tokens` | `./tokens.ts` | [DTCG sources, language presets and the IO-free Style Dictionary token builder](#token-build-tooling) for CLI and build tooling. |

For visual design, see the [Design system](/design-system/):
[guidelines](/design-system/guidelines/), [theme gallery](/design-system/#design-catalogue),
[token contract](/design-system/token-contract/) and
[theme authoring](/design-system/create-your-own-theme/).

## Class-name helper

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `cn` | function | `function cn(...inputs: ClassValue[]): string` | Combines clsx and tailwind-merge for optimal class merging. |

## Icon primitive

`Icon` is a stroke-SVG icon primitive, re-exported at the package root with its supporting types
from `@netscript/fresh-ui/primitives`.

| Symbol                                                                                | Kind                     | Description                                                                                             |
| ------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| `Icon`                                                                                | component                | Renders a named stroke-SVG icon (`IconName`) at a given `IconSize`, forwarding standard SVG attributes. |
| `ICON_PATHS`                                                                          | const                    | The stroke-path lookup table backing every `IconName`.                                                  |
| `IconName` / `IconSize` / `IconProps` / `IconSvgAttributes` / `IconSvgAttributeValue` | type aliases / interface | Supporting types for the `Icon` primitive.                                                              |

## DataGrid

`DataGrid` is a generic, templated data-grid component exported from the package root. Unlike the
copy-source registry items, it is a runtime export you import directly; you don't
`netscript ui:add` it. It renders a token-styled `role="grid"` region from a `columns` contract and
a `rows` contract, and supports plain, button, and Fresh client-navigation rows.

### DataGrid props

| Prop                  | Type                           | Description                                                   |
| --------------------- | ------------------------------ | ------------------------------------------------------------- |
| `columns`             | `readonly DataGridColumn<T>[]` | Ordered column definitions (required).                        |
| `rows`                | `readonly DataGridRow<T>[]`    | Ordered row definitions (required).                           |
| `label`               | `string`                       | Accessible label applied as `aria-label` on the grid region.  |
| `class`               | `string`                       | Additional class names appended to the `ns-data-grid` root.   |
| `[attribute: string]` | `unknown`                      | Any further native attributes are forwarded to the grid root. |

### `DataGridColumn<T>`

| Field    | Type                             | Description                                                                                |
| -------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `key`    | `string`                         | Property key used for fallback cell content and stable cell identity.                      |
| `header` | `string`                         | Visible column header text.                                                                |
| `width`  | `string`                         | CSS grid track width, e.g. `2fr` or `minmax(0, 12rem)`. Defaults to `minmax(0, 1fr)`.      |
| `cell`   | `DataGridCellVariant`            | Optional built-in cell treatment: `"strong"` (bold) or `"num"` (monospace, right-aligned). |
| `render` | `(row: T) => DataGridRenderable` | Optional per-column template receiving the row payload.                                    |

### `DataGridRow<T>`

Every row carries a stable `id`, a caller-owned `data: T` payload, and an optional `selected` flag.
A row renders according to its navigation field. The three shapes are mutually exclusive: supply at
most one of `onSelect` or `href`.

| Shape  | Distinguishing field          | Renders as                                                     |
| ------ | ----------------------------- | -------------------------------------------------------------- |
| Plain  | neither `onSelect` nor `href` | a `role="row"` `<div>`.                                        |
| Button | `onSelect: () => void`        | a `role="row"` `<button>` that calls `onSelect` on click.      |
| Link   | `href: string`                | a `role="row"` `<a f-client-nav>` for Fresh client navigation. |

### DataGrid symbols

| Symbol                                                        | Kind               | Description                                                                                |
| ------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------ |
| `DataGrid`                                                    | component          | Generic templated data grid; renders `DataGridColumn` definitions over `DataGridRow` data. |
| `DATA_GRID_CELL_VARIANTS`                                     | const              | The supported cell-treatment names: `["strong", "num"]`.                                   |
| `DataGridColumn<T>` / `DataGridProps<T>` / `DataGridRow<T>`   | interfaces / types | Column, props, and row contracts.                                                          |
| `DataGridNode` / `DataGridRenderable` / `DataGridCellVariant` | types              | Structural node, renderable cell content, and the cell-variant union.                      |
| `DataGridRowActionContext` / `DataGridSelectionContext`       | interfaces         | Context passed to row actions and selection observers.                                     |

### DataGrid example

```tsx
import { DataGrid, type DataGridColumn, type DataGridRow } from '@netscript/fresh-ui';

interface Invoice {
  id: string;
  customer: string;
  total: number;
}

const columns: DataGridColumn<Invoice>[] = [
  { key: 'customer', header: 'Customer', width: '2fr', cell: 'strong' },
  { key: 'total', header: 'Total', cell: 'num', render: (row) => `$${row.total.toFixed(2)}` },
];

const rows: DataGridRow<Invoice>[] = [
  { id: 'inv-1', data: { id: 'inv-1', customer: 'Acme', total: 420 }, href: '/invoices/inv-1' },
  {
    id: 'inv-2',
    data: { id: 'inv-2', customer: 'Globex', total: 130 },
    selected: true,
    href: '/invoices/inv-2',
  },
];

export function InvoiceGrid() {
  return <DataGrid label='Invoices' columns={columns} rows={rows} />;
}
```

A column with `cell: "num"` renders monospace and right-aligned; `cell: "strong"` renders bold. A
column without `render` falls back to `row.data[column.key]` when that key holds a string, number,
bigint, boolean, `null`, or `undefined`.

> [!IMPORTANT]
> Rows are keyed by `id`. Supply a stable `id` per row so Preact can reconcile rows across
> re-renders. A link row navigates through Fresh (`f-client-nav`) rather than a full page load.

## Dropzone (registry component)

`Dropzone` is a copy-source registry component, not a package export. Install it with
`netscript ui:add dropzone`; it then lives at `components/ui/dropzone.tsx` in your app and is yours
to edit. It renders a dashed file-drop target (`<label class="ns-dropzone">`) that ingests files from
drag-and-drop, focused clipboard paste and the native file picker, and filters each ingest through
a shared `accept` / `multiple` policy before calling back.

### Dropzone props

| Prop                                | Type                                                                               | Description                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `label`                             | `string`                                                                           | Primary call-to-action text. Defaults to `"Drop files or click to upload"`.  |
| `hint`                              | `string`                                                                           | Secondary hint line (accepted types, size limits).                           |
| `icon`                              | `Renderable`                                                                       | Leading glyph or icon node. Defaults to `↑`.                                 |
| `active`                            | `boolean`                                                                          | Forces the drag-over (`data-active`) visual state.                           |
| `accept`                            | `string`                                                                           | Native `accept` string applied to drop, paste, **and** picker ingest.        |
| `multiple`                          | `boolean`                                                                          | Whether one ingest event may accept more than one file. Defaults to `false`. |
| `onFile`                            | `(file: File, details: DropzoneIngestDetails) => void`                             | Called with the first accepted file — the simple single-file path.           |
| `onFiles`                           | `(files: readonly File[], details: DropzoneIngestDetails) => void`                 | Called with every accepted file.                                             |
| `onReject`                          | `(files: readonly DropzoneRejectedFile[], details: DropzoneIngestDetails) => void` | Called with every rejected file.                                             |
| `onDrop` / `onDragOver` / `onPaste` | event handlers                                                                     | Optional passthrough handlers invoked after the built-in ingest runs.        |
| `children`                          | `Renderable`                                                                       | Additional content rendered inside the label.                                |
| `class`                             | `string`                                                                           | Additional class names appended to the `ns-dropzone` root.                   |

`DropzoneProps` also extends `JSX.HTMLAttributes<HTMLLabelElement>` (minus `class`, `onDrop`,
`onDragOver`, and `onPaste`, which the component owns), so standard label attributes pass through.

### Dropzone ingest types

| Symbol | Kind | Description |
| --- | --- | --- |
| `DROPZONE_INGEST_SOURCES` | const | The ingest source names: `["drop", "paste", "picker"]`. |
| `DROPZONE_REJECTED_REASONS` | const | The rejection reason names: `["type", "too-many"]`. |
| `DropzoneIngestSource` | type alias | `"drop" \| "paste" \| "picker"`. |
| `DropzoneRejectedReason` | type alias | `"type" \| "too-many"`. |
| `DropzoneRejectedFile` | interface | A rejected `file`, its `reason`, and the ingest `source` that supplied it. |
| `DropzoneIngestDetails` | interface | `acceptedFiles`, `rejectedFiles`, the ingest `source`, and the original `event`. |
| `DropzoneProps` | interface | The full prop contract documented above. |

### Dropzone example

```tsx
import { Dropzone, type DropzoneIngestDetails } from '@app/components/ui/dropzone.tsx';

export function AvatarUpload() {
  function handleFiles(files: readonly File[], details: DropzoneIngestDetails) {
    console.log(`Accepted ${files.length} file(s) via ${details.source}`);
    for (const rejected of details.rejectedFiles) {
      console.warn(`Rejected ${rejected.file.name}: ${rejected.reason}`);
    }
  }

  return (
    <Dropzone
      label='Drop images or click to upload'
      hint='PNG or JPG, up to 5 MB'
      accept='image/png,image/jpeg'
      multiple
      onFiles={handleFiles}
    />
  );
}
```

Rejections are reported, not silent: a file whose type falls outside `accept` is rejected with
reason `"type"`, and when `multiple` is `false`, every file after the first is rejected with reason
`"too-many"`. Each ingest also updates a visually-rendered `aria-live` status node so
assistive technology hears how many files were accepted or rejected.

> [!NOTE]
> Clipboard paste only fires while the dropzone (or a child) holds focus, so pair it with a focusable
> affordance. The picker `<input>` clears its value after each selection, so re-selecting the same
> file still triggers `onFile` / `onFiles`.

## Redirect-flash (toast) helpers

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `getToast` | function | `function getToast(url: URL): RegistryToast \| undefined` | Reads a toast payload from a URL when redirect-flash query parameters are present. |
| `withToast` | function | `function withToast(path: string, toast: RegistryToast): string` | Appends a toast payload to a relative application path. |
| `stripToastFromUrl` | function | `function stripToastFromUrl(url: URL): string` | Removes all toast query parameters from a URL while preserving path and hash. |
| `REGISTRY_TOAST_QUERY_KEYS` | const | `const REGISTRY_TOAST_QUERY_KEYS: { message: string; title: string; type: string }` | Query-string keys reserved by the redirect-flash helpers. |

### Toast types

| Symbol              | Kind       | Description                                                                                     |
| ------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `RegistryToast`     | interface  | Redirect-flash payload persisted in URL query parameters (`message`, optional `title`, `type`). |
| `RegistryToastType` | type alias | Toast semantic variants: `"success" \| "error" \| "warning" \| "info"`.                         |

## Interactive namespaces and contracts

Exported from `@netscript/fresh-ui/interactive`. Each is a compound namespace bundling a root
component with its structural subcomponents. The namespace, props, event, and shared structural
contracts in this section are also public exports.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `Accordion` | const | `const Accordion: AccordionNamespace` | Compound accordion namespace with root and item subcomponents. |
| `ActionMenu` | const | `const ActionMenu: ActionMenuNamespace` | Keyboard-accessible action menu with intent-aware items and separators. |
| `Combobox` | const | `const Combobox: ComboboxNamespace` | Filterable listbox combobox with input, content, item, and empty-state parts. |
| `Dialog` | const | `const Dialog: DialogNamespace` | Compound dialog namespace with root and structural subcomponents. |
| `Drawer` | const | `const Drawer: DrawerNamespace` | Compound drawer namespace with root and structural subcomponents. |
| `Popover` | const | `const Popover: PopoverNamespace` | Compound popover namespace with root and positioning subcomponents. |
| `Sheet` | const | `const Sheet: SheetNamespace` | Compound sheet namespace — side-docked inspection panel. |
| `Tabs` | const | `const Tabs: TabsNamespace` | Compound tabs namespace with root, list, trigger, and content subcomponents. |
| `Tooltip` | const | `const Tooltip: TooltipNamespace` | Compound tooltip namespace with root and positioning subcomponents. |

### Action menu and combobox behavior

`ActionMenu` exposes item intents through `ACTION_MENU_ITEM_INTENTS` and reports why its open state
changed with `ActionMenuOpenChangeReason`. `Combobox` exposes its controlled filtering seam through
`UseComboboxOptions` and `UseComboboxReturn`; its compound namespace includes input, content, item,
and empty-state parts.

### Interactive public contract inventory

| Symbol | Kind | Family | Description |
| --- | --- | --- | --- |
| `AccordionNamespace` / `AccordionRootProps` / `AccordionItemProps` / `AccordionItemTriggerProps` / `AccordionItemContentProps` / `AccordionItemIndicatorProps` | type alias | Accordion | Public compound namespace and root/item contracts. |
| `ACTION_MENU_ITEM_INTENTS` / `ActionMenuNamespace` / `ActionMenuRootProps` / `ActionMenuTriggerProps` / `ActionMenuContentProps` / `ActionMenuItemProps` / `ActionMenuSeparatorProps` / `ActionMenuItemIntent` / `ActionMenuOpenChangeReason` | const / interface / type alias | Action menu | Public namespace, part props, supported intents, and open-state reason. |
| `ComboboxNamespace` / `ComboboxRootProps` / `ComboboxInputProps` / `ComboboxContentProps` / `ComboboxItemProps` / `ComboboxEmptyProps` / `UseComboboxOptions` / `UseComboboxReturn` | type alias / interface | Combobox | Public namespace, part props, and controlled filtering contracts. |
| `DialogNamespace` / `DialogRootProps` / `DialogTriggerProps` / `DialogContentProps` / `DialogTitleProps` / `DialogDescriptionProps` / `DialogCloseProps` | type alias | Dialog | Public namespace and structural-part props. |
| `DrawerNamespace` / `DrawerRootProps` / `DrawerTriggerProps` / `DrawerContentProps` / `DrawerTitleProps` / `DrawerDescriptionProps` / `DrawerCloseProps` | type alias / reference | Drawer | Public namespace and structural-part props. |
| `PopoverNamespace` / `PopoverRootProps` / `PopoverTriggerProps` / `PopoverAnchorProps` / `PopoverPositionerProps` / `PopoverContentProps` / `PopoverTitleProps` / `PopoverDescriptionProps` / `PopoverCloseProps` / `PopoverArrowProps` / `PopoverArrowTipProps` | type alias | Popover | Public namespace, positioning, content, and arrow contracts. |
| `SheetNamespace` / `SheetRootProps` / `SheetTriggerProps` / `SheetContentProps` / `SheetTitleProps` / `SheetDescriptionProps` / `SheetCloseProps` | type alias | Sheet | Public namespace and structural-part props. |
| `TabsNamespace` / `TabsRootProps` / `TabsListProps` / `TabsTriggerProps` / `TabsContentProps` | type alias | Tabs | Public namespace and tab/list/content props. |
| `TooltipNamespace` / `TooltipRootProps` / `TooltipTriggerProps` / `TooltipPositionerProps` / `TooltipContentProps` / `TooltipArrowProps` / `TooltipArrowTipProps` | type alias | Tooltip | Public namespace, positioning, content, and arrow contracts. |
| `FreshUiAttributeValue` / `FreshUiChild` / `FreshUiChildren` / `FreshUiElementProps` / `FreshUiEventHandler` / `FreshUiStyle` | type alias | Shared | Framework-neutral child, attribute, event, element-prop, and style contracts shared by the interactive primitives. |

## Desktop chrome

Exported from `@netscript/fresh-ui/desktop`. `createDesktopChrome` detects the
available browser/native bridge and returns an active or disabled capability surface instead of
assuming a desktop host. Window, menu, tray, notification, dialog, and event-target seams remain
explicitly capability-checked.

| Symbol | Kind | Family | Description |
| --- | --- | --- | --- |
| `createDesktopChrome` / `CreateDesktopChromeOptions` | function / interface | Factory | Creates the capability-aware desktop chrome facade and configures bridge discovery. |
| `DESKTOP_CHROME_DISABLED_REASONS` / `DESKTOP_CHROME_STATUSES` / `DESKTOP_MENU_SOURCES` / `DESKTOP_OPERATION_REASONS` / `DESKTOP_OPERATION_STATUSES` / `DESKTOP_WINDOW_ACTIONS` | const | Vocabularies | Runtime constants for capability state, menu provenance, operation results, and window actions. |
| `DesktopChromeActive` / `DesktopChromeCapability` / `DesktopChromeDisabled` / `DesktopChromeDisabledReason` / `DesktopChromeLifecycle` / `DesktopChromeStatus` | interface / type alias | Lifecycle | Active/disabled discriminants and lifecycle contracts returned by the factory. |
| `DesktopDialogCapability` / `DesktopEventTargetCapability` / `DesktopNotificationCapability` / `DesktopNotificationHandle` / `DesktopNotificationOptions` / `DesktopTrayCapability` / `DesktopTrayConfig` / `DesktopTrayConstructor` / `DesktopWindowCapability` | interface | Capabilities | Optional native feature contracts exposed only when the host provides them. |
| `DesktopMenuActionEvent` / `DesktopMenuActionItem` / `DesktopMenuItem` / `DesktopMenuRoleItem` / `DesktopMenuSeparator` / `DesktopMenuSource` / `DesktopMenuSubmenu` / `DesktopNativeMenuItem` | interface / type alias | Menus | Discriminated native menu definitions and action-event payloads. |
| `DesktopOperationReason` / `DesktopOperationResult` / `DesktopOperationStatus` / `DesktopWindowAction` | type alias | Operations | Result and reason contracts for requested native window operations. |

## L0 primitives

Exported from `@netscript/fresh-ui/primitives`. L0 stays small:
prefer Preact intrinsic elements and platform attributes, using these helpers only where they
encapsulate real behavior.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `Show` | function | `function Show<T>({ when, fallback, children }: ShowProps<T>): PrimitiveChildren` | Conditionally renders children without introducing an extra DOM wrapper. |
| `VisuallyHidden` | function | `function VisuallyHidden({ children, style, ...props }: VisuallyHiddenProps): PrimitiveNode` | Renders content for assistive technology while keeping it visually hidden. |
| `SrOnly` | function | `function SrOnly(props: VisuallyHiddenProps): PrimitiveNode` | Alias for `VisuallyHidden` using the common screen-reader naming. |

### Primitive types

| Symbol                | Kind       | Description                                                                                  |
| --------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `PrimitiveNode`       | interface  | Structural node returned by element-producing L0 primitives (`type`, `props`, `key`).        |
| `ShowProps<T>`        | interface  | Props accepted by `Show` (`when`, optional `fallback`, `children`).                          |
| `VisuallyHiddenProps` | interface  | Props accepted by `VisuallyHidden` and `SrOnly` (`children`, `style`, arbitrary attributes). |
| `PrimitiveChild`      | type alias | Primitive value that can be rendered by an L0 helper.                                        |
| `PrimitiveChildren`   | type alias | Renderable content accepted by L0 primitives (a child or readonly array of children).        |
| `VisuallyHiddenStyle` | type alias | Inline style accepted by visually-hidden primitives.                                         |

## Generative UI renderer (@netscript/fresh-ui/ai/render-ui)

A safe, bounded generative-UI renderer that converts structured `render_ui` tool payloads into
standard Preact DOM nodes.

> [!CAUTION]
> The renderer consumes input already validated by `@netscript/ai/tools` (`RenderUiToolInput`). It
> does not validate arbitrary model output: parse and validate raw model payloads with
> `@netscript/ai/tools` before passing them to the renderer.

### Allowed block categories

The renderer restricts markup generation to a curated 8-block allowlist across three categories
(`RENDER_UI_BLOCK_CATEGORIES`):

| Category | Allowed block types        | Description                                          |
| -------- | -------------------------- | ---------------------------------------------------- |
| `layout` | `stack`, `grid`, `section` | Container elements that layout child blocks.         |
| `viz`    | `chart`, `metric`          | Visual presentation blocks for stats and trend data. |
| `data`   | `table`, `list`, `card`    | Data presentation blocks for tabular and item lists. |

### Depth bounds and fallback reasons

To protect against deeply nested or malformed model payloads, rendering is bounded by `maxDepth`
(defaults to `RENDER_UI_MAX_DEPTH` = `6`). When a payload cannot be rendered safely, a styled
fallback element is emitted with a specific `RenderUiFallbackReason`:

- `'max-depth'`: Payload nesting exceeded the configured maximum depth limit.
- `'unknown-type'`: Block type is outside the accepted 8-block allowlist.
- `'invalid-node'`: Node payload is malformed or unrenderable.

### Renderer symbols

| Symbol                                                         | Kind       | Description                                                                                                                                         |
| -------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderUiPayload`                                              | function   | `function renderUiPayload(payload: RenderUiToolInput, options?: RenderUiOptions): RenderUiNode` — Renders a validated payload into safe Preact DOM. |
| `RenderUiSurface`                                              | component  | `function RenderUiSurface(props: RenderUiSurfaceProps): RenderUiNode` — JSX component wrapper around `renderUiPayload`.                             |
| `RENDER_UI_MAX_DEPTH`                                          | const `6`  | Default maximum recursive block depth.                                                                                                              |
| `RENDER_UI_BLOCK_CATEGORIES`                                   | const      | Map of accepted categories to block type names (`layout`, `viz`, `data`).                                                                           |
| `RenderUiToolInput`                                            | type alias | Re-exported validated payload type from `@netscript/ai/tools`.                                                                                      |
| `RenderUiOptions` / `RenderUiSurfaceProps`                     | interfaces | Renderer configuration and component prop contracts (`maxDepth`, `payload`).                                                                        |
| `RenderUiFallbackReason`                                       | type alias | Union of fallback reasons: `'max-depth' \| 'unknown-type' \| 'invalid-node'`.                                                                       |
| `RenderUiBlockCategory` / `RenderUiBlockType` / `RenderUiNode` | types      | Category and block vocabularies plus the renderer's structural output node.                                                                         |

### Renderer example

```tsx
import { renderUiPayload, RenderUiSurface } from '@netscript/fresh-ui/ai/render-ui';

const payload = {
  component: 'section',
  title: 'System Performance',
  props: {
    children: [
      {
        type: 'grid',
        props: {
          children: [
            {
              type: 'metric',
              props: { label: 'P99 Latency', value: '24 ms', detail: 'healthy' },
            },
            {
              type: 'metric',
              props: { label: 'Error Rate', value: '0.01%', detail: 'normal' },
            },
          ],
        },
      },
      {
        type: 'table',
        title: 'Active Services',
        props: {
          columns: [
            { key: 'name', header: 'Service' },
            { key: 'status', header: 'Status' },
          ],
          rows: [
            { name: 'auth-service', status: 'healthy' },
            { name: 'payment-gateway', status: 'healthy' },
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

## Embedded registry

Exported from `@netscript/fresh-ui/registry`. It embeds the copy-source manifest and file contents
used by the Fresh UI installer, so consumers can inspect the manifest without reading package files
at runtime.

| Symbol                                                                                                         | Kind              | Description                                                                              |
| -------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `freshUiRegistryManifest` / `FreshUiRegistryManifest`                                                          | value / interface | Embedded registry manifest and its public contract.                                      |
| `FRESH_UI_REGISTRY_CONTENT`                                                                                    | const             | Embedded file-content lookup referenced by manifest entries.                             |
| `FreshUiRegistryCollection` / `FreshUiRegistryCssContribution` / `FreshUiRegistryFile` / `FreshUiRegistryItem` | interfaces        | Collection, stylesheet contribution, file, and item contracts that make up the manifest. |

## Token build tooling

`@netscript/fresh-ui/tokens` builds the DTCG 2025.10 three-tier contract through Style Dictionary
5.7.1. It returns output content and resolved contexts; the caller chooses where to write files.
Import this entrypoint in CLI or build code. The runtime UI entrypoints stay independent of the
build engine.

The builder covers all 18 presets, both schemes and both requested densities. Each preset fixes its
effective geometry. NS One remains the default; Studio Utility is available as an additional preset.
An app override applies last and can only reassign semantic roles to typed aliases. Unknown roles,
type mismatches, raw semantic values and reference cycles fail before output is returned.

| Symbol | Kind | Description |
| --- | --- | --- |
| `buildTokens` | async function | Builds all contexts and returns deterministic CSS, bridge, JSON, fonts, registry and Figma output bytes. Accepts optional preset, semantic override and caller-owned sources; target app skips Figma output, and previews explicitly includes optional design styles. |
| `defaultTokenSources` | function | Returns the bundled resolver and DTCG source documents. Clone before editing caller-owned inputs. |
| `PREVIEW_TOKEN_FILES` | readonly string[] | The 18 optional design preview stylesheets. Install with ui:add theme-previews or tokens build --previews. Also exported from token-config without the compiler. |
| `APP_TOKEN_FILES` | readonly string[] | The five core app files: tokens.css, theme-bridge.css, tokens.json, fonts.json and theme-preset.json. Also available from the lightweight token-config entrypoint. |
| `TOKEN_PRESETS` | const array | The registered language presets and their fixed Figma modes, density and optional Studio flavor. |
| `TOKEN_SCHEMES` | const tuple | Supported scheme contexts: light and dark. |
| `TOKEN_DENSITIES` | const tuple | Supported density contexts: comfortable and compact. |
| `TokenBuildOptions` | interface | Initial preset, optional semantic override and optional caller-owned sources. |
| `TokenBuildResult` | interface | Output filenames/content, every requested resolved context and the selected initial preset. |
| `TokenContextOutput` | interface | Effective preset, scheme, requested density and exported tokens for one resolver input. |
| `ExportedToken` | interface | A token's DTCG type, CSS value/name, display category path and optional computed hex/fallback. |
| `BuiltToken` | interface | Exported token metadata plus the resolved DTCG value used by Figma and contrast tooling. |
| `TokenSources` | interface | The single resolver and source documents keyed by their relative reference names. |
| `TokenResolver` | interface | DTCG version, named source sets, modifier contexts and ordered resolution references. |
| `ResolverSource` | type alias | An inline token document or a resolver reference to a document, set or modifier. |
| `TokenDocument` | interface | Nested token groups, typed tokens and document metadata. |
| `DesignToken` | interface | Explicit DTCG type/value with optional description and NetScript extensions. |
| `TokenValue` | recursive type | JSON scalar, array or object used by aliases and typed DTCG composites. |
| `TokenMetadata` | interface | Registered CSS name, exact legacy spelling, category, derivation and optional Figma provenance. |
| `TokenDerivation` | union type | The supported color-mix or shadow composite recipe. |
| `TokenMixDerivation` | interface | Two color paths, first-color weight and interpolation space; CSS retains native color-mix. |
| `TokenShadowDerivation` | interface | Themeable shadow color/vertical-offset/blur paths and pixel horizontal-offset/spread values. |
| `TokenPreset` | interface | Preset identity, language/flavor, selected Figma modes and fixed source/public density. |
| `TokenScheme` | type alias | A supported scheme name derived from TOKEN_SCHEMES. |
| `TokenDensity` | type alias | A supported density name derived from TOKEN_DENSITIES. |

```typescript
import { buildTokens } from '@netscript/fresh-ui/tokens';

const build = await buildTokens({
  preset: 'studio-utility',
  override: {
    semantic: {
      'radius-md': { $type: 'dimension', $value: '{semantic.radius-lg}' },
    },
  },
});
console.log(build.files['tokens.css']);
```

The generated Figma collections keep the original index/collection structure and explicit name
migrations. Dimensions are pixel floats, durations are milliseconds, and composite shadow/transition
values use lossless strings. CSS keeps live semantic references and native mixes with hex fallbacks
guarded by feature support. Existing NS One declarations and the legacy dark selector remain valid.
