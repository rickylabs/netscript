# @netscript/fresh-ui

[![JSR](https://jsr.io/badges/@netscript/fresh-ui)](https://jsr.io/@netscript/fresh-ui)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The design-system layer for NetScript's Fresh web surface: a copy-source component registry, a
semantic `--ns-*` token vocabulary, and a small package-owned runtime of accessible interactive
primitives and helpers.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/fresh-ui

# Node.js / Bun
npx jsr add @netscript/fresh-ui
bunx jsr add @netscript/fresh-ui
```

### Usage

```typescript
import { cn, getToast, Icon, stripToastFromUrl, withToast } from '@netscript/fresh-ui';

// Merge class names safely (clsx + tailwind-merge).
const buttonClass = cn('ns-button', 'ns-button--primary');

// Carry a redirect-flash toast across a server redirect.
const redirectTo = withToast('/dashboard/deployments', {
  type: 'success',
  title: 'Deployment queued',
  message: 'api-gateway will roll out to three regions.',
});

// Read the toast back on the destination route, then clean the URL.
const url = new URL(`https://app.example${redirectTo}`);
const toast = getToast(url); // RegistryToast | undefined
const cleanPath = stripToastFromUrl(url);

// Render a package-owned stroke SVG icon.
const checkIcon = <Icon name='check' size={18} title='Complete' />;
```

Typed package components are available from the root entrypoint. `DataGrid` emits semantic
`ns-data-grid*` classes for the package token CSS.

```tsx
import { DataGrid } from '@netscript/fresh-ui';

type Session = { name: string; tokens: number; status: string };

<DataGrid<Session>
  label='Recent sessions'
  columns={[
    { key: 'name', header: 'Session', cell: 'strong' },
    { key: 'tokens', header: 'Tokens', width: '8rem', cell: 'num' },
    { key: 'status', header: 'Status', render: (row) => <span>{row.status}</span> },
  ]}
  rows={[
    { id: 'vs3', data: { name: 'VS3', tokens: 18420, status: 'active' }, href: '/sessions/vs3' },
  ]}
/>;
```

Stateful interactive components live on the `./interactive` sub-path, and headless layout primitives
on `./primitives`:

```typescript
import { Dialog } from '@netscript/fresh-ui/interactive';
import { Icon, Show, VisuallyHidden } from '@netscript/fresh-ui/primitives';
```

---

## 📦 Key Capabilities

- **Copy-source registry**: install themed components and design tokens with the NetScript CLI
  (`netscript ui:init`, `netscript ui:add <item>`); once copied, the code is yours to own and
  evolve.
- **Runtime helpers**: `cn` for class merging and the redirect-flash `withToast` / `getToast` /
  `stripToastFromUrl` cycle for carrying notifications across server redirects.
- **Interactive primitives**: `Accordion`, `Dialog`, `Drawer`, `Popover`, `Sheet`, `Tabs`, and
  `Tooltip` compound namespaces emit `data-part`, `data-state`, and ARIA attributes for accessible,
  styleable behavior.
- **L0 platform primitives**: `Icon`, `Show`, `VisuallyHidden`, and `SrOnly` cover token-driven
  stroke icons, conditional rendering, and assistive-technology output without extra DOM wrappers.
- **Semantic token vocabulary**: a theme-driven `--ns-*` custom-property surface that registry CSS
  targets, so themes and components stay decoupled.
- **Generative-UI renderer**: `@netscript/fresh-ui/ai/render-ui` safely renders `render_ui` tool
  payloads (`RenderUiToolInput` from `@netscript/ai/tools`) — a curated block whitelist (`stack`,
  `grid`, `section`, `chart`, `metric`, `table`, `list`, `card`), a recursion depth guard
  (`RENDER_UI_MAX_DEPTH = 6`), and named fallbacks for unknown or invalid nodes instead of throwing.
- **AI registry collection**: `netscript ui:add ai` installs the AI/chat surface seams — message
  thread, composer, model picker, tool-call disclosure, `render-ui`, and the `McpUiWidget` island
  that renders MCP `ui://` resources surfaced by the `@netscript/ai/mcp` client transport pool.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/fresh-ui/](https://rickylabs.github.io/netscript/reference/fresh-ui/)
- **Web Layer**:
  [rickylabs.github.io/netscript/web-layer/](https://rickylabs.github.io/netscript/web-layer/)
- **How-to — Customize Fresh UI**:
  [rickylabs.github.io/netscript/how-to/customize-fresh-ui/](https://rickylabs.github.io/netscript/how-to/customize-fresh-ui/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
