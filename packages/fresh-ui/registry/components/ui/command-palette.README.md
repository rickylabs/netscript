# CommandPalette

Install `netscript ui:add command-palette`. The item copies its Kbd and Spinner dependencies and
uses the existing Fresh UI Dialog, Combobox and Icon runtime. It performs local text filtering;
Pagefind, remote search, navigation and command side effects remain application-owned.

```tsx
<CommandPalette
  open={open}
  onOpenChange={setOpen}
  groups={[{
    id: 'pages',
    label: 'Pages',
    items: [{
      id: 'guide',
      label: 'Getting started',
      type: 'page',
      url: '/docs/getting-started',
      excerpt: 'Install the CLI, then scaffold a project.',
      onSelect: () => location.assign('/docs/getting-started'),
    }],
  }]}
/>
```

The existing `open`, `onOpenChange`, `groups`, `placeholder`, `emptyLabel` and `class` props remain
supported. Existing item `id`, `label`, `icon`, `hash`, `kind` and `onSelect` fields retain their
meaning. New item fields are `type` (`page`, `section`, `action`, default `action`), `disabled`,
`url`, `excerpt` and `shortcut`. Section results are indented; page results receive a file glyph.
`url` and `hash` are display hints: selecting a result invokes its callback rather than inventing
routing behavior. Group IDs must be unique and nonblank; item IDs must be globally unique and
nonblank. URI encoding preserves IDs with spaces, slashes and Unicode in native ARIA references.

`loading` suppresses results and shows Spinner with `loadingLabel`. `searchLabel` names the input
and listbox, and `dialogLabel` names the modal. These labels and the empty/placeholder copy can be
localized. Optional `filters` and `footer` accept Renderable content, including native controls.
They are content slots, not boolean root props. `onQueryChange` reports user edits; a modal reopen
resets the local query without treating it as a user edit. Filtering matches label, URL, excerpt,
hash or kind text case-insensitively, retaining source order. Excerpts remain escaped plain text;
matching words receive strong typography without a colored highlight or HTML injection.

Set `scrim={false}` for an inline surface. It adds no modal focus capture or automatic focus on
mount. Inline mode is visible by default and respects `open={false}`. Escape clears its query;
selection keeps the inline surface open. With a scrim, the application controls `open`; Escape,
backdrop interaction and selection request `onOpenChange(false)`. A controlled owner may refuse:
the dialog, focus and highlighted option remain usable, including repeated activation.

Arrow keys navigate matching enabled options; Home and End select the first and last. Enter and
pointer activation use the same selection port and invoke one callback. Disabled results remain
visible and cannot activate. Options preserve the input's DOM focus and use its active descendant;
they do not create additional tab stops. Typing clears stale highlights, removed results cannot
leave dangling active descendants, and native IME composition keys are left to the editor. Tab
uses native modal containment or ordinary inline control order. Native dialog close observation
does not duplicate the original close request.

`data-content` is derived as `results`, `empty` or `loading`; `data-scrim` records modal/inline mode.
Item `data-type` records its semantic type. Existing headless `data-state` values are preserved:
open/closed on the backdrop/input/list and checked/unchecked on enabled items. `data-highlighted`
is the current keyboard/pointer highlight; disabled items emit `data-state=disabled`. Styles must
preserve these distinctions. The shared O10 contract lists the real root inputs and qualified item
fields; it explicitly corrects the earlier research-only root prop/axis metadata.
