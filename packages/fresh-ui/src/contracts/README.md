# Shared component contracts

Start here to extend a component or add a style. Import the public `@netscript/fresh-ui/contracts`
subpath; the root runtime stays small.

A contract contains public props, stable `data-part` names, allowed data-attribute values,
visibility booleans, content slots, APG/native semantics, keyboard operations and token-role names.
It contains no token values, rendering code, filesystem calls or service logic.

Category data lives in `catalog/`. Each entry cites its Figma inventory ID. A `planned` part or
`plannedValues` entry is specified but absent in Utility. Native control internals and CSS
pseudo-elements are represented explicitly; consumers must not add layout wrappers merely to imitate
Figma layers. Optional parts state their condition. Transient hover/focus/pressed states remain
CSS/native behavior, so server components need no event listeners.

A style can change elements and inner layout. It preserves public prop behavior, part names,
attribute vocabulary, slots and keyboard behavior. Contract render tests accept a style fixture
provider; fixtures exercise conditional anatomy as well as defaults. Negative controls prove that
removing a required part or attribute fails the same checker.

The owner-approved source is `design/component-contract-spec`,
`.llm/runs/docs-fresh-ui-design-system--design-handoff/components/component-spec.md` (§0, §2,
§4.5–4.6). Contracts cover all 104 identities across the completed Figma categories. Unimplemented
gaps remain explicitly `shipped: false`; their render/keyboard coverage is required when they ship. Compatibility decisions are recorded in the S3 run's
`naming-decisions.md`. Token/focus/shadow redesign is deferred to S6.

Omit optional metadata fields rather than assigning `undefined`; catalog tests require a lossless
JSON round-trip.

`compatibilityValues` records existing headless/Utility hooks separately from the settled Figma
vocabulary. Its `parts` identify their scope. A missing `parts` list means the root. Native inputs
keep live checked/focus behavior in native properties and pseudo-classes; serialized state records
initial or controlled render state. Styles must preserve this distinction.

The reusable checker is `tests/contracts/contract-render.ts`. A `ContractStyleProvider` supplies
real component renders, deliberate conditional parts, and the attributes each scenario requires.
Utility fixtures cover every shipped catalog identity, including the DataGrid selection action bar,
Message's bubble, context-only DesktopOnly, and copy-only Markdown in an installed consumer.
The checker ignores tag names and CSS classes, checks required/conditional parts and declared
attribute values, and has real-render negative controls for missing parts/attributes and invalid
values. Native and pseudo anatomy does not require extra layout nodes.

The completed handoff is PR #2486 (`docs/figma-library-handoff`), under
`.llm/runs/design-system-s4--language-review/figma-library/`. Its category
ledgers take precedence over the earlier research spec. In particular FileTree
is a read-only list, not an ARIA tree; native scrollbar internals and Direction
context require no additional visual wrappers. No token values are copied.

Source-style fixture registration lives in `tests/contracts/styles.ts`.
`registeredContractStyles` declares source-style IDs independently of provider
instances. CSS support registry items and token-only presets are excluded.
Providers declare contracts, real render fixtures with their public input names,
and semantic keyboard scenarios. Keyboard metadata alone is never behavioral
proof: the dedicated browser suite must press the keys and assert outcomes.

Describe inputs the implementation actually accepts. Composed section presence is not an invented
boolean root prop: Card's section content is recorded as qualified slots such as `Header.children`
and `Action.children`. Member-only inputs, such as Pagination Link state, identify their scope in
the description. Keep closed vocabularies complete; the Icon contract has an independent equality
guard against the published glyph names so adding an implementation name cannot leave the catalog
behind.

Audited baseline copies join `AUDITED_BASELINE_COMPONENTS` separately from the exact new-gap list.
The installer gate preserves source-byte equality, proves the real package mapping before adding
local aliases for unreleased APIs, compiles/lints the installed files, and renders audited copies
against these contracts. Overridable scope expressions are checked through actual rendering rather
than requiring a particular JSX spelling. The frozen legacy registry fixture remains unchanged;
necessary metadata repairs have explicit named allowances and negative controls.

Alert's content inputs are Renderable slots, not visibility booleans: `icon=false` hides its
decoration, `description` takes precedence over legacy `children`, and `action` accepts a native
control. `close` enables the native dismiss button. `open` controls visibility; otherwise
`defaultOpen` seeds internal state. A dismissal reports `onOpenChange(false)` and a controlled owner
may refuse it. Closed content remains mounted with native `hidden` and explicit CSS hiding. No focus
is moved on mount or reopen; surrounding application focus restoration remains caller-owned.
Strong emphasis replaces the box edge with a CSS leading rule on the neutral surface. The six tones use existing semantic fill/border/text roles;
shared InlineNotice styling is independent.

The additive style-extension policy is owner-approved at
https://github.com/rickylabs/netscript/issues/2416#issuecomment-6541012019. Base contract items are
immutable across styles. An extension uses an x-prefixed name and a registry:style declaration with
component, name, type, default and maps-to. Presentational extensions map to data-x-* attributes;
structural extensions map to optional named slots or style-scoped blocks, empty by default. Base
tests run for every style, declared-extension tests only for the declaring style. Undeclared
additions and changes still fail. The phase2b harness implements this boundary.

Untitled Alerts render Note, Info, Success, Warning, Error or Important according to tone.
`toneLabel` localizes that default. A custom `title` replaces it; `title={false}` or null keeps
the localized label visually hidden so assistive technology still receives the meaning.
The title uses body size and Medium label weight. After uncontrolled dismissal the browser may
move focus to the document body; native Tab continues after the former dismiss button. Applications
that require a particular restoration target own that policy.


## Native Layout components

`ui:add scroll-area`, `ui:add aspect-ratio` and `ui:add direction` install the
real sources. ScrollArea requires `label` to name its native viewport; the caller
sets frame dimensions. Its viewport is always tabbable for stable SSR/hydration.
Vertical, horizontal and both axes use native overflow. Scrollbar, thumb and
corner are native parts: standard thin-scrollbar geometry is platform-dependent;
exact 6/8px hover growth is available only in older WebKit styling implementations.
No fake scrollbar controls are rendered.

AspectRatio defaults to16:9 and also accepts4:3,1:1,21:9. It clips media to the
existing card radius; the host owns image alternatives and interactive labels.
The frame adds no keyboard stop.

DirectionProvider aliases Direction. The JSX-safe `as` form renders the caller's
native boundary directly; no extra wrapper is added. Supported containers are
`div`, `section`, `main`, `article`, `aside`, `nav`, `header`, `footer`, `form`, `span`.
Native props, class, style and handlers pass through; `boundaryRef` refers to the
native element. Direction owns `dir` and its contract markers. Nested boundaries
remain local and never mutate document direction.

```tsx
import { Direction } from './components/ui/direction.tsx';

<Direction as='section' dir='rtl'><input aria-label='Search' /></Direction>;
```

Without `as`, pass exactly one unscoped native HTML VNode. It is cloned with its
key, ref and existing props preserved; supplied native props override the child's,
and Direction overwrites its `dir`. Fragments, arrays, custom components and
already scoped boundaries fail clearly. Preact precompile represents static JSX
as template fragments, so use `as` for ordinary JSX, or `h` to create an explicitly
cloneable boundary. Both forms render a single native boundary.

From the first phase2b identity, `tests/contracts/strict-render-policy.ts` selects
strict checks explicitly. Rendered data attributes must be scope/part markers,
canonical axes on their declared parts, or independently reviewed private
component/part bindings with a purpose. Unknown attributes, bare/unquoted
attributes, undeclared `data-x-*`, wrong-part axes and invalid values fail. The
all-style slice extends this same policy to existing source fixtures.
