# Plan — recognize plugin-sagas-core exports

- Archetype: 3 — Runtime / Behavior (described package); docs-only implementation.
- Scope overlay: docs.
- Doctrine verdict: Keep; preserve the published nineteen-entrypoint surface.
- Axioms: A1/A2/A14 — the published surface and its executable docs audit must agree.
- Locked decision: use `entrypoints-only`, based on the nineteen-module `deno doc --json` audit.
- Slice: rename the heading, add the authoritative mapping, regenerate the three derived corpus
  layers, and run every issue gate.
- Non-scope: package source, existing symbol tables, `fresh`, and architecture debt.
- Risk: derived assets can become stale; mitigate with the ordered generators and all four derived
  checks.
- Debt: none created or deepened.
- `PLAN-EVAL: N/A` — mechanical single-package docs/tooling correction with an evidence-checkable
  coverage choice and explicit gate set supplied by issue #1815.
