# Concepts

`@netscript/fresh-ui` has three cooperating surfaces: themes, a copy-source registry, and an
imported runtime.

## Themes

A theme assigns the semantic `--ns-*` vocabulary. Components consume semantic tokens only; they do
not read a brand palette, primitive ramp, or one-off color literal. NS One is the reference theme,
not a special case. Any complete theme can replace it without editing component files.

The theme bridge maps those semantic variables into Tailwind v4 `*-ns-*` utilities such as
`bg-ns-surface`, `text-ns-fg`, and `border-ns-border`.

## Registry

The registry is copy-source. `ui:add` installs source files into the application, and the
application owns them after copy. This keeps the consuming app inspectable and editable while the
package remains the source of truth for updates.

The registry layers are:

| Layer | Surface                               | Ownership       |
| ----- | ------------------------------------- | --------------- |
| L0    | platform contract, primitives, tokens | package         |
| L1    | package-owned runtime behavior        | package         |
| L2    | primitive registry components         | copied into app |
| L3    | composed registry blocks              | copied into app |
| L4    | application-specific product UI       | app             |

Layer boundaries keep copied components small. Shared behavior moves down to L0/L1. Shared
composition moves up to L3.

## Runtime

The runtime exports package-owned behavior for components that need coordinated state and
accessibility attributes: Accordion, Dialog, Drawer, Popover, Sheet, Tabs, and Tooltip.

Runtime components emit prop getters, ARIA attributes, `data-part`, and `data-state`. They do not
emit theme-specific class names. Registry CSS and app composition decide the visual treatment.

## Validation

The package quality bar is not just type-checking. A change is expected to keep these green:

- package check, tests, and token generation;
- DS gates for raw colors and off-vocabulary Tailwind color utilities;
- architecture gate for package doctrine and design-system fitness;
- doctests that execute README/getting-started examples;
- browser validation on real design routes for visual slices.

For layer details, see [`l0-conventions.md`](l0-conventions.md). For theme implementation, see
[`theme-authoring.md`](theme-authoring.md). For runtime policy, see
[`architecture.md`](architecture.md).
