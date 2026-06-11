# L0 Platform Contract

L0 is the platform contract for `@netscript/fresh-ui`. It is imported package surface, not
copy-source registry code.

## Purpose

L0 provides:

- token consumption conventions;
- `data-part`, `data-state`, ARIA, and native-element rules;
- a small set of behavior primitives: `VisuallyHidden`, `SrOnly`, and `Show`.

L0 is not a library of wrapper components for every HTML element. Preact JSX intrinsics already
provide typed platform elements; wrappers are added only when they encode behavior or enforce an
accessibility contract.

## Layer Rules

- L0 primitives may use platform elements and Preact types.
- L1 runtime hooks/components may import L0.
- L2 registry components may import L0 or L1, but L2 must not import another L2 item directly.
  Shared behavior moves down to L0/L1; shared composition moves up to L3.
- L3 blocks compose L2 items and application data seams.
- L4 framework integration lives outside `@netscript/fresh-ui`.

## Attribute Contract

Interactive state is expressed with platform attributes:

- `data-part` names stable component parts.
- `data-state` names visual state.
- ARIA attributes describe accessibility state.
- Event handlers come from runtime prop getters.

L1 runtime code emits data attributes, ARIA attributes, refs, and handlers. L1 does not emit `ns-*`
component classes. L0 and L2 may emit classes only where the class is part of the styling contract.

## Native-First Rule

Prefer Web Platform behavior before adding JavaScript state:

- use semantic elements first;
- use native controls for forms;
- use platform dialog/popover/details behavior where available;
- add runtime code only for behavior the platform does not provide.

## Token Rule

CSS consumes `--ns-*` variables and Tailwind `*-ns-*` utilities generated from the token pipeline.
Component CSS must not introduce off-vocabulary raw color values unless the value is a documented
platform fallback or one-off visual effect that cannot be represented by the token vocabulary.
