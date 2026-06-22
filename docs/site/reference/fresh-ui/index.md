---
layout: layouts/base.vto
title: "@netscript/fresh-ui"
---

# `@netscript/fresh-ui`

Fresh UI registry seams and interactive foundations for NetScript. This page is generated
from the package public surface with `deno doc` (US-2). For the full index of packages and
plugins return to the [reference overview](/reference/).

The root entrypoint (`@netscript/fresh-ui`) intentionally stays small: copy-based registry
components and islands remain on workspace-local deep paths so applications can own and evolve
them after copy. The root module exposes only the supported helper utilities that are safe to
consume as package runtime dependencies. Two sub-path exports carry the runtime seams:

- [`@netscript/fresh-ui/interactive`](#sub-path-exports) — package-owned interactive
  namespaces for stateful, accessible primitives.
- [`@netscript/fresh-ui/primitives`](#sub-path-exports) — L0 platform-contract primitives.

## Class-name helper

| Symbol | Signature | Description |
| --- | --- | --- |
| `cn` | `function cn(...inputs: ClassValue[]): string` | Combines clsx and tailwind-merge for optimal class merging. |

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
> `deno doc --lint` reports them as `private-type-ref` errors; making them public is tracked in
> PR #58. The runtime exports themselves are stable.

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

## Sub-path exports

The following entrypoints are published alongside the root export.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/fresh-ui` | `./mod.ts` | Stable runtime helpers (`cn`, redirect-flash toast helpers — documented above). |
| `@netscript/fresh-ui/interactive` | `./interactive.ts` | Package-owned interactive namespaces (documented above). |
| `@netscript/fresh-ui/primitives` | `./primitives.tsx` | L0 platform-contract primitives (documented above). |

---

Back to the [reference overview](/reference/).
