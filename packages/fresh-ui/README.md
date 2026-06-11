# `@netscript/fresh-ui`

[![JSR](https://jsr.io/badges/@netscript/fresh-ui)](https://jsr.io/@netscript/fresh-ui)
[![Deno](https://img.shields.io/badge/runtime-Deno-000000?logo=deno&logoColor=white)](https://deno.com/)
[![Fresh](https://img.shields.io/badge/framework-Fresh-ffdb1e?logo=deno&logoColor=111111)](https://fresh.deno.dev/)
[![License](https://img.shields.io/badge/license-MIT-0f172a)](https://opensource.org/licenses/MIT)

Interactive UI primitives and a copy-source component registry for Fresh applications in the
NetScript ecosystem.

## Features

- **Interactive primitives** — Accessible Accordion, Dialog, Drawer, Popover, Tabs, and Tooltip with
  full keyboard navigation
- **L0 platform primitives** — `VisuallyHidden`, `SrOnly`, and `Show` for package-owned
  accessibility and rendering behavior
- **Copy-source registry** — UI components you copy into your app and own: buttons, inputs, cards,
  tables, layouts, and more
- **Utility helpers** — `cn()` for class merging and URL-based toast state management
- **Headless architecture** — Accessibility and interaction behavior are built in; styling is yours
- **Focus management** — Focus trapping and restoration handled automatically in Dialog and Drawer
- **Fresh-native** — Built on Preact and `@preact/signals`, designed for Fresh island boundaries

## Install

```ts
// deno.json
{
  "imports": {
    "@netscript/fresh-ui": "jsr:@netscript/fresh-ui@^0.1.0"
  }
}
```

## Quick Start

Render a modal dialog with accessible trigger and close controls:

```tsx
import { Dialog } from '@netscript/fresh-ui/interactive';

export function ConfirmDeleteDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>Delete item</Dialog.Trigger>
      <Dialog.Content aria-label='Confirm deletion'>
        <Dialog.Title>Are you sure?</Dialog.Title>
        <Dialog.Description>This action cannot be undone.</Dialog.Description>
        <Dialog.Close>Cancel</Dialog.Close>
        <button type='submit'>Delete</button>
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

## Entry Points

| Import                            | Purpose                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| `@netscript/fresh-ui`             | Stable utility helpers — `cn()`, toast state management                                  |
| `@netscript/fresh-ui/interactive` | Package-owned interactive primitives — Accordion, Dialog, Drawer, Popover, Tabs, Tooltip |
| `@netscript/fresh-ui/primitives`  | L0 platform-contract primitives — `VisuallyHidden`, `SrOnly`, `Show`                     |

## Usage

### Toast state management

Store toast notifications in the URL so they survive redirects:

```ts
import { getToast, stripToastFromUrl, withToast } from '@netscript/fresh-ui';

// Attach a toast to a redirect URL
const redirectTo = withToast('/dashboard/users', {
  type: 'success',
  title: 'User saved',
  message: 'Your changes were persisted.',
});

// Read the toast back on the destination page
const toast = getToast(new URL(request.url));

// Clean the toast params before rendering the canonical URL
const cleanUrl = stripToastFromUrl(new URL(request.url));
```

### Class name merging

```ts
import { cn } from '@netscript/fresh-ui';

const buttonClass = cn(
  'px-4 py-2 rounded font-medium',
  isDestructive && 'bg-red-600 text-white',
  isDisabled && 'opacity-50 cursor-not-allowed',
);
```

### L0 primitives

```tsx
import { Show, VisuallyHidden } from '@netscript/fresh-ui/primitives';

export function SaveState({ savedAt }: { savedAt?: string }) {
  return (
    <p>
      <VisuallyHidden>Save status:</VisuallyHidden>
      <Show when={savedAt} fallback='Not saved yet'>
        {(value) => `Saved at ${value}`}
      </Show>
    </p>
  );
}
```

### Accordion

Collapsible content panels — single or multiple open at a time:

```tsx
import { Accordion } from '@netscript/fresh-ui/interactive';

export function FaqSection() {
  return (
    <Accordion.Root>
      <Accordion.Item value='shipping'>
        <Accordion.ItemTrigger>
          Shipping policy
          <Accordion.ItemIndicator>▾</Accordion.ItemIndicator>
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          <p>Orders ship within 2 business days.</p>
        </Accordion.ItemContent>
      </Accordion.Item>

      <Accordion.Item value='returns'>
        <Accordion.ItemTrigger>
          Return policy
          <Accordion.ItemIndicator>▾</Accordion.ItemIndicator>
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          <p>Returns accepted within 30 days.</p>
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  );
}
```

### Tabs

Tabbed content navigation with keyboard support:

```tsx
import { Tabs } from '@netscript/fresh-ui/interactive';

export function OrderDetailTabs() {
  return (
    <Tabs.Root defaultValue='summary'>
      <Tabs.List>
        <Tabs.Trigger value='summary'>Summary</Tabs.Trigger>
        <Tabs.Trigger value='items'>Items</Tabs.Trigger>
        <Tabs.Trigger value='history'>History</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value='summary'>
        <OrderSummary />
      </Tabs.Content>
      <Tabs.Content value='items'>
        <OrderItems />
      </Tabs.Content>
      <Tabs.Content value='history'>
        <OrderHistory />
      </Tabs.Content>
    </Tabs.Root>
  );
}
```

### Drawer

Slide-out panel — same compound API as Dialog:

```tsx
import { Drawer } from '@netscript/fresh-ui/interactive';

export function FilterDrawer() {
  return (
    <Drawer.Root>
      <Drawer.Trigger>Filters</Drawer.Trigger>
      <Drawer.Content aria-label='Filter options'>
        <Drawer.Title>Filter orders</Drawer.Title>
        <Drawer.Description>Narrow results by date, status, or customer.</Drawer.Description>
        {/* filter form */}
        <Drawer.Close>Apply</Drawer.Close>
      </Drawer.Content>
    </Drawer.Root>
  );
}
```

### Tooltip

```tsx
import { Tooltip } from '@netscript/fresh-ui/interactive';

export function HelpIcon() {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger aria-label='Help'>?</Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>
          Hover or focus to see this tooltip.
          <Tooltip.Arrow>
            <Tooltip.ArrowTip />
          </Tooltip.Arrow>
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
}
```

### Using registry components

Registry components are copy-source files. Copy them into your app, then own and customize them
freely.

From the JSR-published package, the registry source lives under `registry/`. Copy the files you need
into your project:

```
registry/components/ui/button.tsx       → your-app/components/ui/button.tsx
registry/components/ui/input.tsx        → your-app/components/ui/input.tsx
registry/islands/Toast.tsx              → your-app/islands/Toast.tsx
```

After copying, the files are yours — update styles, add props, or wire up your own state. The
package update cycle does not affect code you have already copied.

## Available Components

### Interactive Primitives

Import from `@netscript/fresh-ui/interactive`. These stay up to date with package releases.

| Component   | Subcomponents                                                                                              | Description                            |
| ----------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `Accordion` | `Root`, `Item`, `ItemTrigger`, `ItemIndicator`, `ItemContent`                                              | Collapsible content panels             |
| `Dialog`    | `Root`, `Trigger`, `Content`, `Title`, `Description`, `Close`                                              | Modal dialog with focus trap           |
| `Drawer`    | `Root`, `Trigger`, `Content`, `Title`, `Description`, `Close`                                              | Slide-out panel                        |
| `Popover`   | `Root`, `Trigger`, `Anchor`, `Positioner`, `Content`, `Title`, `Description`, `Close`, `Arrow`, `ArrowTip` | Floating content anchored to a trigger |
| `Tabs`      | `Root`, `List`, `Trigger`, `Content`                                                                       | Tabbed content navigation              |
| `Tooltip`   | `Root`, `Trigger`, `Positioner`, `Content`, `Arrow`, `ArrowTip`                                            | Hover/focus information overlay        |

### Registry Components

Copy from `registry/components/ui/`. After copying, you own the source.

| Component                         | Description                                        |
| --------------------------------- | -------------------------------------------------- |
| `Button`, `IconButton`            | Action triggers with variant and size props        |
| `Input`, `Textarea`, `Select`     | Text and choice form controls                      |
| `Checkbox`, `Switch`, `Label`     | Boolean and toggle controls                        |
| `FormField`                       | Field wrapper with label, hint, and error display  |
| `Card`, `Panel`                   | Content containers with optional header and footer |
| `Badge`                           | Inline status and category labels                  |
| `Breadcrumb`                      | Navigation breadcrumb trail                        |
| `DataTable`                       | Sortable, paginated data grid                      |
| `DetailLayout`                    | Two-column detail/sidebar page layout              |
| `EmptyState`                      | Placeholder for empty data sets                    |
| `FilterForm`                      | Collapsible filter panel for list pages            |
| `PageHeader`                      | Page title, description, and action row            |
| `Pagination`                      | Page navigation controls                           |
| `SectionDivider`                  | Labelled horizontal rule                           |
| `Separator`                       | Plain horizontal or vertical divider               |
| `SidebarShell`                    | Full-page sidebar + content shell                  |
| `Alert`, `InlineNotice`           | Contextual feedback messages                       |
| `Spinner`, `Progress`, `Skeleton` | Loading and progress indicators                    |
| `StatsGrid`                       | Grid of metric/stat cards                          |

### Registry Islands

Copy from `registry/islands/`. Fresh islands for client-side interactivity.

| Island          | Description                             |
| --------------- | --------------------------------------- |
| `SidebarToggle` | Toggle sidebar open/closed state        |
| `ThemeToggle`   | Switch between light and dark themes    |
| `Toast`         | Display URL-encoded toast notifications |

## Architecture

This package uses two delivery models side by side.

**L0 primitives** (from `@netscript/fresh-ui/primitives`) are imported directly and stay
package-owned. They cover small behavior/accessibility seams such as visually hidden text and
wrapper-free conditional rendering; platform elements remain the default.

**Interactive primitives** (under `runtime/`) are imported directly from
`@netscript/fresh-ui/interactive` and used as regular package dependencies. They centralize
accessibility behavior — keyboard interaction, focus management, ARIA attributes — while leaving
layout and styling to your application. These components update with the package.

**Registry components** (under `registry/`) are published as copy-source files. You copy the ones
you want into your project and they become your code. This model is intentional: UI components often
need project-specific customization that conflicts with a stable package API. Once copied, a
component is fully under your control and is not affected by package updates.

The root entrypoint (`@netscript/fresh-ui`) exports only the small set of stable utility helpers
that are safe to use as package runtime dependencies: `cn()` and the toast helpers.

## Resources

- [`@netscript/fresh`](https://jsr.io/@netscript/fresh) — Page builders, route contracts, and form
  helpers
- [Preact documentation](https://preactjs.com/guide/v10/getting-started)
- [Fresh documentation](https://fresh.deno.dev/docs/)
- [tailwind-merge](https://github.com/dcastil/tailwind-merge) — Used by `cn()` for conflict
  resolution
- [clsx](https://github.com/lukeed/clsx) — Used by `cn()` for conditional class joining

## License

MIT
