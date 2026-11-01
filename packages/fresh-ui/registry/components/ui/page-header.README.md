# PageHeader

Copy with `ui:add page-header`. The component stylesheet includes its own rhythm;
`layout-objects` preserves the existing composition helpers.

```tsx
<PageHeader
  title='Overview'
  eyebrow='Commerce'
  description='Orders, revenue and customer activity for the last 30 days.'
  breadcrumb={<Breadcrumb items={trail} />}
  actions={<Button>Create order</Button>}
  variant='with-tabs'
  tabs={<Tabs.Root>{/* caller-owned tabs */}</Tabs.Root>}
/>
```

`title` owns the page’s native `h1`; omit it and use composed Intro content if the host already owns the heading. It is heading content, replacing the native root
HTML `title` tooltip attribute; use `aria-label`/`aria-describedby` for root
annotation. All content inputs are optional Renderable slots. Preact escapes text.
The root never acquires a tab stop or role from its presentation variant.

`variant` is `default` (default), `with-tabs`, or `with-status`, emitted as
`data-variant`. The host supplies the actual tabs/status controls: no synthetic
interaction, hidden state or network adapter is created. Supplied slots render in
all variants in this order: breadcrumb, heading/actions row, tabs, status,
children. Null, undefined, booleans, empty strings and recursively empty arrays omit their slot wrapper; numeric zero remains visible. VNodes own their rendered content. Desktop puts actions beside the intro; narrow
viewports stack them. RTL uses native direction and logical CSS.

The existing `PageHeader.Layout`, `.Main`, `.Aside`, `.Badges`, `.Intro`,
`.Actions` and `.Status` sections still accept children, class and native div
attributes. They can compose a completely custom header; omit declarative inputs
to use that API alone. Children are preserved without cloning or reordering.
Use a native heading inside a custom Intro. Each section emits its named
`data-part` in `data-scope='page-header'`; `.Status` uses `status-bar`.

Phase-one metadata described Figma boolean content switches and a breakpoint
axis as root props. They had no implementation. The contract now describes the
actual slots and CSS responsiveness. Status indicators/separators belong to the
caller-provided status content; their descendants keep their own contracts.
Native child links/buttons and Tabs own keyboard interaction. PageHeader never
captures focus or changes their keys.
