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
§4.5–4.6). Contracts cover shipped components and the six built Figma categories; other gaps stay
outside the public catalog. Compatibility decisions are recorded in the S3 run's
`naming-decisions.md`. Token/focus/shadow redesign is deferred to S6.

Omit optional metadata fields rather than assigning `undefined`; catalog tests require a lossless
JSON round-trip.
