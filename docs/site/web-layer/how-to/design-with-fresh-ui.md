---
layout: layouts/base.vto
title: Design with Fresh UI
templateEngine: [vento, md]
order: 104
---

# Design with Fresh UI

**Goal:** build pages that look deliberate and consistent across every route and in both themes,
using the theme, layout objects, and blocks the scaffold already ships. This guide is written for
people and coding agents. Read the rules first, then copy the recipe that matches your page.

It assumes a scaffolded `apps/dashboard/` app. To install more components or edit routes and
islands, see [Customize Fresh UI](/web-layer/how-to/customize-fresh-ui/).

## The rules

1. **One theme, app-wide.** `assets/tokens.css` defines every `--ns-*` token: `:root` holds the
   light theme and `[data-theme='dark']` the dark overrides. Every route loads it, and
   `routes/_app.tsx` sets `data-theme` on `<html>`. Restyle the app by editing that file, never by
   theming one page.
2. **Rebrand with the brand knobs.** Set `--ns-primary` and `--ns-primary-fg` in `:root`. Tints,
   borders, hover states, the accent, and the focus ring all derive from them.
3. **The chrome is not your page's job.** `routes/_layout.tsx` renders the top bar, navigation, and
   theme toggle around every page, and the top-bar links are `appNavigation` in `navigation.ts`.
   `netscript ui:add page` links a new one-segment page for you; pass `--nav` for a nested page,
   `--nav <label>` to set the label, or `--no-nav` to skip the link. Never add a second header or
   theme toggle inside a page. A page that needs its own frame opts out through
   `chromelessRoutePrefixes` in `navigation.ts`.
4. **Compose blocks; don't hand-roll them.** Import `PageHeader`, `StatsGrid`, `Card`, `Panel`,
   `ResponsiveTable`, `FilterForm`, `DetailLayout`, `EmptyState`, and the form controls from
   `@app/components/ui/mod.ts`. Never write a lookalike `div`.
5. **Lay out with layout objects.** Use `ns-shell`, `ns-section`, `ns-stack`, `ns-cluster`, and
   `ns-grid` for page rhythm, and Tailwind `ns-*` utilities for one-off spacing. Don't set margins
   on every child.
6. **Tokens, not literals.** Use no hex colors, raw pixel spacing, or `style` attributes with
   colors. A literal does not follow the theme and breaks dark mode.
7. **Check both themes and every state.** Look at `/design/components` and your page in light and
   dark, including empty, loading, and error states.

## How the theme reaches every page

```text
assets/tokens.css         :root = light theme; [data-theme='dark'] = dark overrides
  -> assets/theme-bridge.css  Tailwind v4 @theme inline: bg-ns-*, text-ns-*, border-ns-*,
                              p-ns-*, gap-ns-*, rounded-ns-*, shadow-ns-* utilities
  -> assets/styles.css        aggregator: tailwindcss + tokens + bridge + layouts.css + assets/ui/*.css
  -> client.ts                imports styles.css once, so the CSS is on every route
routes/_app.tsx           sets data-theme on <html> from localStorage 'ns-theme' or the OS preference
islands/ui/ThemeToggle    flips data-theme at runtime
```

Each registry component has its own stylesheet under `assets/ui/`, and those stylesheets read only
the semantic tokens (`--ns-surface`, `--ns-primary-subtle`, `--ns-border`, …). That is why one
token edit changes every page at once.

{{ comp callout { type: "warning", title: "These do not exist" } }}
There is no data-ns-theme attribute, no assets/themes/ folder, no per-page theme selector such as
html:has(...), and no per-route stylesheet. The registry ships one theme item, theme-seed (“NS
One”). If you are about to create any of these, stop and edit assets/tokens.css instead. Tokens
set on a page wrapper also leave the derived tokens (tints, hover, ring) on their old values,
because those are computed on the html element.
{{ /comp }}

## Rebrand the whole app

The brand lives in a few **knobs**, above all `--ns-primary` and `--ns-primary-fg` in the `:root`
block of `assets/tokens.css`. Everything else derives from them:

{{ comp.apiTable({
  caption: "Brand knobs in assets/tokens.css",
  rows: [
    { name: "--ns-primary", type: "color", desc: "Brand color: primary buttons, links, active states, progress, and (derived) the accent and focus ring." },
    { name: "--ns-primary-fg", type: "color", desc: "Text on a primary surface. Pick for at least 4.5:1 contrast against --ns-primary." },
    { name: "--ns-accent", type: "color (optional)", desc: "Defaults to var(--ns-primary). Set it only for a second brand color." },
    { name: "--ns-font-sans / --ns-font-mono", type: "font stack", desc: "Typefaces. Load the font in routes/_app.tsx (the scaffold loads DM Sans and DM Mono from Google Fonts)." },
    { name: "--ns-radius-sm … --ns-radius-2xl", type: "length", desc: "Corner radius scale: smaller values look sharper, larger values softer." }
  ]
}) }}

{{ comp.apiTable({
  caption: "Derived tokens: never edit these to rebrand",
  rows: [
    { name: "--ns-*-subtle", type: "color-mix()", desc: "Tinted backgrounds for badges, alerts, and selected rows: the intent color at 7-10% alpha." },
    { name: "--ns-*-border", type: "color-mix()", desc: "Matching borders at 14-25% alpha." },
    { name: "--ns-primary-hover / --ns-secondary-hover", type: "color-mix()", desc: "The base color mixed 14% toward black." },
    { name: "--ns-accent, --ns-accent-fg, --ns-ring", type: "var()", desc: "Follow --ns-primary and --ns-primary-fg." }
  ]
}) }}

Edit the `:root` block of `assets/tokens.css` in place. The file is app-owned: `ui:add` copies it
once and overwrites it only with `--force`. Because the dark block does not redeclare the brand
knobs, one `:root` edit rebrands both themes:

```css
/* assets/tokens.css, inside the existing :root { ... } block */
--ns-primary: oklch(55% 0.2 275);
--ns-primary-fg: #ffffff;
```

Repeat a knob inside `[data-theme='dark']` only when dark mode needs a different shade. Keep that
block after `:root`: both selectors have the same specificity, so the later one wins.

Apps scaffolded with NetScript 0.0.8 or earlier have a `tokens.css` whose tints are fixed `rgba()`
copper values. You can tell by its header, which starts with "Initial token seed". In that file,
rebranding `--ns-primary` leaves copper tints, hovers, and focus rings behind. Re-copy the theme
with `netscript ui:add theme-seed --force`, which overwrites your local token edits, or replace
each `--ns-*-subtle`, `--ns-*-border`, `-hover`, `--ns-accent`, and `--ns-ring` line with its
current derived form.

### Presets

Copy one preset into `:root`. Each pair meets 4.5:1 text contrast, and each brand color keeps the
focus ring at 3:1 or better on both theme backgrounds.

{{ comp.apiTable({
  caption: "Brand presets (oklch)",
  rows: [
    { name: "NS One (default)", type: "copper", desc: "--ns-primary: var(--ns-copper-6); --ns-primary-fg: var(--ns-gray-12);" },
    { name: "Indigo", type: "cool, product", desc: "--ns-primary: oklch(55% 0.2 275); --ns-primary-fg: #ffffff;" },
    { name: "Emerald", type: "calm, finance/health", desc: "--ns-primary: oklch(52% 0.11 160); --ns-primary-fg: #ffffff;" },
    { name: "Rose", type: "warm, consumer", desc: "--ns-primary: oklch(55% 0.2 15); --ns-primary-fg: #ffffff;" },
    { name: "Graphite", type: "monochrome", desc: "In :root use --ns-primary: var(--ns-gray-12); --ns-primary-fg: var(--ns-gray-1); --ns-primary-hover: var(--ns-gray-9). In [data-theme='dark'] use --ns-primary: var(--ns-gray-1); --ns-primary-fg: var(--ns-gray-12)." }
  ]
}) }}

Near-black or near-white brand colors (like Graphite) need an explicit `--ns-primary-hover`, because
mixing toward black barely changes them.

### Type and shape

To change the typeface, edit two things: the Google Fonts `<link>` in `routes/_app.tsx`, and
`--ns-font-sans` (and `--ns-font-mono` if it changes) in `:root`. For a softer or sharper look,
scale all `--ns-radius-*` steps together. For example, use `6px 10px 12px 16px 24px` for
`sm`…`2xl` instead of the default `4px 6px 8px 12px 16px`.

## Page anatomy

Every content page renders one `<main>` inside the chrome. A `PageHeader` comes first with exactly
one `<h1>`, followed by stacked sections. The scaffolded
`routes/(_components)/dashboard-view.tsx` is the canonical example to copy.

```tsx no-check:imports resolve against the app-owned @app/components/ui barrel of a scaffolded app
import { Badge, Button, PageHeader } from '@app/components/ui/mod.ts';

export default function OrdersView() {
  return (
    <main class='ns-shell ns-section ns-stack ns-stack--lg'>
      <PageHeader>
        <PageHeader.Layout>
          <PageHeader.Main>
            <PageHeader.Badges>
              <Badge variant='primary'>Orders</Badge>
            </PageHeader.Badges>
            <PageHeader.Intro>
              <h1>Orders</h1>
              <p class='ns-lede'>Track fulfilment across every region.</p>
            </PageHeader.Intro>
            <PageHeader.Actions>
              <Button type='link' href='/orders/new'>New order</Button>
              <Button type='link' href='/orders/export' variant='outline'>Export</Button>
            </PageHeader.Actions>
          </PageHeader.Main>
        </PageHeader.Layout>
      </PageHeader>
      {/* Sections go here: StatsGrid, a Card grid, a table, ... */}
    </main>
  );
}
```

{{ comp.apiTable({
  caption: "Layout objects (assets/layouts.css)",
  rows: [
    { name: "ns-shell", type: "page width", desc: "Centered content column, 1060px max. Use ns-shell--wide (1280px) for tables and ns-shell--narrow (720px) for forms and reading." },
    { name: "ns-section", type: "vertical rhythm", desc: "Block padding plus a gap between children. Variants: ns-section--sm, ns-section--lg." },
    { name: "ns-stack", type: "vertical list", desc: "Column with a token gap: ns-stack--xs, --sm, --md, --lg, --xl, --2xl." },
    { name: "ns-cluster", type: "inline group", desc: "Wrapping row for buttons, badges, and filters: ns-cluster--sm, --md, --lg, --between, --end." },
    { name: "ns-grid", type: "card grid", desc: "Auto-fit grid (280px minimum columns). Use ns-grid--2, --3, or --4 for fixed columns; they collapse on phones." },
    { name: "ns-split / ns-sidebar / ns-switcher", type: "two-region layouts", desc: "Content plus aside, a sidebar that wraps under a threshold, and rows that switch to columns." },
    { name: "ns-toolbar", type: "action bar", desc: "Space-between row for a table's filters and actions." }
  ]
}) }}

## Pick the block by its job

{{ comp.apiTable({
  caption: "Blocks in @app/components/ui/mod.ts",
  rows: [
    { name: "PageHeader", type: "title + actions", desc: "Compound: Layout, Main, Aside, Badges, Intro (h1 + p.ns-lede), Actions, Status." },
    { name: "StatsGrid", type: "KPIs", desc: "StatsGrid.Card with label, value, optional detail and badge. Put 3-4 cards in one row." },
    { name: "Card / Panel", type: "grouped content", desc: "Card: Header, Title, Description, Body, Footer. Panel takes the same parts plus tone='default' | 'muted' | 'raised' for secondary rails." },
    { name: "ResponsiveTable", type: "record lists", desc: "columns (key, label, cell, align, priority), rows, getRowKey, caption, emptyState, summary. Rows become cards on phones." },
    { name: "DataTable + Pagination", type: "custom tables", desc: "Compound tables for custom row markup, with Pagination.Meta and Pagination.Actions." },
    { name: "FilterForm", type: "filters", desc: "A GET form with FilterForm.Body and FilterForm.Actions. Put FormField + Input or Select inside." },
    { name: "DetailLayout + SectionDivider", type: "record detail", desc: "DetailLayout.Main and DetailLayout.Aside, with labeled dividers between groups." },
    { name: "FormField, Input, Select, Textarea, Checkbox, Switch", type: "forms", desc: "FormField takes label, name, required, error, and helpText. For server validation, bind the form on the page with definePage().withForm()." },
    { name: "Badge, Alert, InlineNotice, Progress", type: "status", desc: "Variants: primary, secondary, success, warning, destructive (Badge adds muted; Alert and InlineNotice use info)." },
    { name: "Skeleton, EmptyState, Spinner", type: "loading + empty", desc: "Skeleton takes variant 'table' | 'stats' | 'detail' | 'form'. EmptyState takes a heading; put the next step or a Button in its children." }
  ]
}) }}

The scaffold doesn't copy overlays, charts, or AI surfaces. Overlays (`Dialog`, `Drawer`, `Popover`,
`Tabs`, `Tooltip`) ship from `@netscript/fresh-ui/interactive`. Install charts with
`netscript ui:add chart-block` or `netscript ui:add donut`, and AI surfaces with
`netscript ui:add ai`.

## Recipe: a list page

A header, KPIs, filters, the table, and its empty and loading states:

```tsx no-check:imports resolve against the app-owned @app/components/ui barrel of a scaffolded app
import {
  Badge,
  Button,
  EmptyState,
  FilterForm,
  FormField,
  Input,
  PageHeader,
  ResponsiveTable,
  type ResponsiveTableColumn,
  Select,
  StatsGrid,
} from '@app/components/ui/mod.ts';

interface Order {
  readonly id: string;
  readonly customer: string;
  readonly status: 'paid' | 'pending' | 'failed';
  readonly total: string;
}

const columns: readonly ResponsiveTableColumn<Order>[] = [
  { key: 'id', label: 'Order', priority: 'primary', cell: (order) => order.id },
  { key: 'customer', label: 'Customer', cell: (order) => order.customer },
  {
    key: 'status',
    label: 'Status',
    cell: (order) => (
      <Badge
        variant={order.status === 'paid'
          ? 'success'
          : order.status === 'pending'
          ? 'warning'
          : 'destructive'}
      >
        {order.status}
      </Badge>
    ),
  },
  { key: 'total', label: 'Total', align: 'end', cell: (order) => order.total },
];

export default function OrdersListView({ orders }: { readonly orders: readonly Order[] }) {
  return (
    <main class='ns-shell ns-shell--wide ns-section ns-stack ns-stack--lg'>
      <PageHeader>
        <PageHeader.Layout>
          <PageHeader.Main>
            <PageHeader.Intro>
              <h1>Orders</h1>
              <p class='ns-lede'>Every order from the last 30 days.</p>
            </PageHeader.Intro>
          </PageHeader.Main>
        </PageHeader.Layout>
      </PageHeader>

      <StatsGrid>
        <StatsGrid.Card label='Orders' value={orders.length} detail='Last 30 days' />
        <StatsGrid.Card label='Failed' value='3' badge={<Badge variant='destructive'>act</Badge>} />
      </StatsGrid>

      <FilterForm method='get' f-client-nav>
        <FilterForm.Body class='ns-grid--2'>
          <FormField label='Search' name='q'>
            <Input id='q' name='q' placeholder='Order or customer' />
          </FormField>
          <FormField label='Status' name='status'>
            <Select
              id='status'
              name='status'
              options={[
                { value: '', label: 'Any' },
                { value: 'paid', label: 'Paid' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
          </FormField>
        </FilterForm.Body>
        <FilterForm.Actions>
          <Button type='submit' size='sm'>Apply</Button>
        </FilterForm.Actions>
      </FilterForm>

      <ResponsiveTable
        caption='Orders'
        columns={columns}
        rows={orders}
        getRowKey={(order) => order.id}
        emptyState={
          <EmptyState heading='No orders yet'>
            Orders appear here as soon as the first checkout completes.
          </EmptyState>
        }
      />
    </main>
  );
}
```

While data loads, render `<Skeleton variant='table' rows={5} />` in place of the table, or
`variant='stats'` in place of the KPIs. Show failures with
`<Alert variant='destructive' title='Could not load orders'>`, not with an empty table.

## Recipe: a detail page

```tsx no-check:imports resolve against the app-owned @app/components/ui barrel of a scaffolded app
import { Badge, Breadcrumb, Card, DetailLayout, Panel, SectionDivider } from '@app/components/ui/mod.ts';

export default function OrderDetailView({ id }: { readonly id: string }) {
  return (
    <main class='ns-shell ns-section ns-stack ns-stack--lg'>
      <Breadcrumb items={[{ label: 'Orders', href: '/orders' }, { label: id }]} />
      <DetailLayout>
        <DetailLayout.Main>
          <Card>
            <Card.Header>
              <Card.Title>Order {id}</Card.Title>
              <Card.Description>Placed today, paid by card.</Card.Description>
            </Card.Header>
            <Card.Body>
              <SectionDivider label='Items' />
              <p class='text-ns-muted-fg'>2 × Starter plan</p>
            </Card.Body>
          </Card>
        </DetailLayout.Main>
        <DetailLayout.Aside>
          <Panel tone='muted'>
            <Panel.Header>
              <Panel.Title>Status</Panel.Title>
            </Panel.Header>
            <Panel.Body>
              <Badge variant='success'>paid</Badge>
            </Panel.Body>
          </Panel>
        </DetailLayout.Aside>
      </DetailLayout>
    </main>
  );
}
```

## Do and don't

{{ comp.apiTable({
  caption: "Common mistakes and their fixes",
  rows: [
    { name: "Theme only the dashboard", type: "don't", desc: "Agents add data-ns-theme or a wrapper class to one page, and every other page keeps the old look. Fix: edit :root in assets/tokens.css." },
    { name: "Hard-coded brand hex", type: "don't", desc: "A literal like bg-[#4f46e5] or style='color:#…' ignores dark mode and the brand knobs. Fix: bg-ns-primary or text-ns-primary." },
    { name: "Hand-written cards and buttons", type: "don't", desc: "A div with a border and padding drifts from Card. Fix: Card, Panel, Button from the barrel; edit the copy in components/ui/ if it needs a variant." },
    { name: "Page-level header or theme toggle", type: "don't", desc: "That duplicates the chrome from routes/_layout.tsx. Fix: let the layout render it." },
    { name: "One giant island", type: "don't", desc: "Hydrating a whole page for one button ships needless JS. Fix: server-render the page and hydrate only the interactive leaf." },
    { name: "Hierarchy from size alone", type: "do", desc: "Use one h1 per page, Card.Title for sections, ns-lede for the summary, and text-ns-muted-fg for secondary text." },
    { name: "Color with intent", type: "do", desc: "Keep primary for the main action. Reserve success, warning, and destructive for status. Badges and alerts already carry the matching tints." },
    { name: "Consistent rhythm", type: "do", desc: "Use ns-stack--lg between page sections and ns-stack--md inside cards. Pick one shell width per page." }
  ]
}) }}

## Verify

1. Open `/design/tokens` and `/design/components` in the running app. Both render the app-owned
   copies against your tokens.
2. Visit every top-level page, including pages you added. Each one should show the same chrome and
   the same brand.
3. Toggle the theme in the top bar and repeat. Look for unreadable text, invisible borders, and
   hard-coded colors.
4. Check the empty, loading, and error states, and a phone-width viewport. `ns-grid--*` and
   `ResponsiveTable` collapse on their own; your custom markup must too.
5. Run `deno task --cwd apps/dashboard check`.

## Next steps

- [Customize Fresh UI](/web-layer/how-to/customize-fresh-ui/): install more registry
  components, edit routes and islands, and see what each app folder owns.
- [Fresh UI & design](/web-layer/fresh-ui/): the copy-source model and the component layers.
- [Build a server-validated form](/web-layer/how-to/build-a-server-validated-form/):
  `FormField` and the controls bound through `definePage().withForm()`.
- Reference: [`@netscript/fresh-ui`](/reference/fresh-ui/).
