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

1. **One theme, app-wide.** The app has one preset, NS One by default, named in
   `assets/theme-preset.json`. `routes/_app.tsx` stamps it once on `<html>`: `data-theme` is the
   design language and `data-scheme` is light or dark. `assets/tokens.css` holds the preset's
   generated `--ns-*` tokens, and every route loads it. Restyle the whole app, never one page.
2. **Restyle through the token layer.** Pick a preset with `netscript tokens init --preset <id>`,
   or reassign semantic roles in the override file, then run `netscript tokens build`. Never
   hand-edit the generated `tokens.css`, `tokens.json`, or `theme-bridge.css`: the next build
   replaces them.
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
token sources (bundled, or tokens/source/ after tokens init)
  + tokens/semantic.tokens.json   your alias overrides, applied last
  -> netscript tokens build       validates everything, then writes five files:
       assets/tokens.css          --ns-* tokens for the preset, in both schemes
       assets/theme-bridge.css    Tailwind v4 @theme inline: bg-ns-*, text-ns-*, border-ns-*,
                                  p-ns-*, gap-ns-*, rounded-ns-*, shadow-ns-* utilities
       assets/tokens.json         token data for the /design/tokens page
       assets/theme-preset.json   the preset's language, density, and Studio flavor
       assets/fonts.json          the preset's font stylesheets
assets/styles.css         aggregator: tailwindcss + tokens + bridge + layouts.css + assets/ui/*.css
  -> client.ts            imports styles.css once, so the CSS is on every route
routes/_app.tsx           stamps data-theme, data-density, and data-flavor on <html>, links the
                          fonts, and sets data-scheme from localStorage 'ns-theme' or the OS
islands/ui/ThemeToggle    flips data-scheme at runtime and keeps the language
```

Each registry component has its own stylesheet under `assets/ui/`, and those stylesheets read only
the semantic tokens (`--ns-surface`, `--ns-primary-subtle`, `--ns-border`, …). That is why one
build changes every page at once. Older apps that still use `[data-theme='dark']` keep working:
those selectors resolve NS One. [Customize Fresh UI](/web-layer/how-to/customize-fresh-ui/) has
the migration steps.

{{ comp callout { type: "warning", title: "These do not exist" } }}
There is no data-ns-theme attribute, no assets/themes/ folder, no per-page theme selector such as
html:has(...), and no per-route stylesheet. data-theme names the app's design language and is set
once on the html element. Tokens or data-theme on a page wrapper restyle that one subtree at best,
and a language the app was not built with has no CSS at all: the app stylesheet contains only the
configured preset plus NS One compatibility. If you are about to create any of these, stop and use
netscript tokens instead.
{{ /comp }}

## Rebrand the whole app

There are two levers, and both rebuild the whole app at once: pick a preset, or keep the preset and
reassign its semantic roles. Each change ends with `netscript tokens build`.

### Pick a preset

A preset fixes the design language, density, fonts, radius scale, and colors. NetScript ships 18:
NS One (the default), Studio in seven flavors (`studio-utility`, `studio-cloud`,
`studio-workshop`, `studio-playful`, `studio-ledger`, `studio-atelier`, `studio-signal`), and
`tonal`, `bloom`, `cupertino`, `liquid`, `fluent`, `brutal`, `filigrane`, `terminal`, `pixel`, and
`tactile`. The [Design system](/design-system/) section shows each theme and its rules.

```sh
netscript tokens init --app dashboard --preset studio-utility
netscript tokens build --app dashboard
```

To compare presets before you choose, run `netscript tokens build --app dashboard --previews` and
open `/design/tokens?preset=<id>` in development. The preview never changes the app default.

`tokens init` creates the override file `tokens/semantic.tokens.json`. Re-running it with `--force`
replaces the token sources and resets that file, so copy your overrides out first.

### Brand colors on a preset

Overrides go in `tokens/semantic.tokens.json`. An override may only point an existing role at
another token of the same type (`{semantic.<role>}`). Raw values such as a hex or `oklch()` color,
and `$extensions`, fail before any asset is replaced. Seven roles carry the brand:

{{ comp.apiTable({
  caption: "Brand roles in tokens/semantic.tokens.json",
  rows: [
    { name: "primary", type: "color", desc: "Primary buttons, links, active states, progress. Alias a ramp step 9, such as {semantic.blue-9}." },
    { name: "primary-fg", type: "color", desc: "Text on primary. Needs 4.5:1 against primary and primary-hover in both schemes." },
    { name: "primary-hover", type: "color", desc: "Hovered primary. Use the same ramp's step 10." },
    { name: "primary-subtle / primary-border", type: "color", desc: "Tinted backgrounds and their borders: steps 3 and 6 of the ramp." },
    { name: "accent / ring", type: "color", desc: "The accent and the focus ring. Alias {semantic.primary} so they follow it." }
  ]
}) }}

In NS One, `primary-hover`, the tints, `accent`, and `ring` are fixed copper values. If you
override only `primary`, they stay copper, so set all seven together:

```json
{
  "semantic": {
    "primary": { "$type": "color", "$value": "{semantic.blue-9}" },
    "primary-fg": { "$type": "color", "$value": "{semantic.gray-12}" },
    "primary-hover": { "$type": "color", "$value": "{semantic.blue-10}" },
    "primary-subtle": { "$type": "color", "$value": "{semantic.blue-3}" },
    "primary-border": { "$type": "color", "$value": "{semantic.blue-6}" },
    "accent": { "$type": "color", "$value": "{semantic.primary}" },
    "ring": { "$type": "color", "$value": "{semantic.primary}" }
  }
}
```

The ramp steps resolve per scheme: `blue-3` is a light tint in light mode and a dark tint in dark
mode, so one override covers both. Swap `blue` for another ramp:

{{ comp.apiTable({
  caption: "Ramps with measured text contrast on steps 9 and 10 (light / dark hover)",
  rows: [
    { name: "blue", type: "primary-fg: gray-12", desc: "6.1:1 on step 9; hover 5.5:1 light, 7.2:1 dark." },
    { name: "grass", type: "primary-fg: gray-12", desc: "6.6:1 on step 9; hover 5.7:1 light, 7.6:1 dark." },
    { name: "tomato", type: "primary-fg: gray-12", desc: "5.2:1 on step 9; hover 4.7:1 light, 6.1:1 dark." },
    { name: "orange", type: "primary-fg: gray-12", desc: "6.7:1 on step 9; hover 6.0:1 light, 8.0:1 dark." },
    { name: "indigo / violet", type: "primary-fg: gray-1", desc: "5.0:1 and 5.2:1 on step 9, but only 4.1-4.2:1 on the dark-scheme step 10. Alias primary-hover to {semantic.primary} to keep light text readable." }
  ]
}) }}

Avoid `teal` and `copper` for a new brand. NS One defines those ramps itself: teal's tints do not
change between schemes, and copper has no step 9 or 10. `tokens build` checks names, types, and
aliases, but not the contrast of your overrides, so check text on `primary` in both schemes
yourself.

### Type and shape

Type comes with the preset: it fixes `--ns-font-sans` and `--ns-font-mono`, and
`assets/fonts.json` lists the stylesheets that `routes/_app.tsx` links. For a different typeface,
pick a preset whose type you want rather than editing those files. For softer or sharper corners,
alias the radius roles. This moves medium corners up one step:

```json
{
  "semantic": {
    "radius-md": { "$type": "dimension", "$value": "{semantic.radius-lg}" }
  }
}
```

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
    { name: "Theme only the dashboard", type: "don't", desc: "Agents add data-ns-theme or a wrapper class to one page, and every other page keeps the old look. Fix: change the preset or the override file, then run netscript tokens build." },
    { name: "Hand-edit generated tokens", type: "don't", desc: "An edit to assets/tokens.css or theme-bridge.css disappears on the next netscript tokens build. Fix: alias the role in tokens/semantic.tokens.json and rebuild." },
    { name: "Hard-coded brand hex", type: "don't", desc: "A literal like bg-[#4f46e5] or style='color:#…' ignores dark mode and the preset. Fix: bg-ns-primary or text-ns-primary." },
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
3. Toggle light and dark in the top bar and repeat. Look for unreadable text, invisible borders,
   and hard-coded colors. After a brand override, check the text on primary buttons in both
   schemes.
4. Check the empty, loading, and error states, and a phone-width viewport. `ns-grid--*` and
   `ResponsiveTable` collapse on their own; your custom markup must too.
5. Run `deno task --cwd apps/dashboard check`.

## Next steps

- [Customize Fresh UI](/web-layer/how-to/customize-fresh-ui/): install more registry
  components, edit routes and islands, and see what each app folder owns.
- [Fresh UI & design](/web-layer/fresh-ui/): the copy-source model and the component layers.
- [Design system](/design-system/): each preset's look, rules, and token contract.
- [`tokens` commands](/reference/cli/commands/#tokens-fresh-application-design-tokens): override
  precedence, validation, previews, and `tokens clean`.
- [Build a server-validated form](/web-layer/how-to/build-a-server-validated-form/):
  `FormField` and the controls bound through `definePage().withForm()`.
- Reference: [`@netscript/fresh-ui`](/reference/fresh-ui/).
