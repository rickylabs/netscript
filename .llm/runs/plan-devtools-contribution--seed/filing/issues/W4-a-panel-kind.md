# [devtools W4-a] `panel` contribution kind — `UiNode` render + error boundary

> **DRAFT — not filed. No GitHub mutation has occurred.**

## Filing block

| Field | Value |
| --- | --- |
| Title | `[devtools W4-a] \`panel\` contribution kind — \`UiNode\` render + error boundary` |
| Labels | `type:feat`, `area:fresh`, `area:cli`, `priority:p1`, `status:triage`, `epic:dev-dashboard`, `wave:v1`, `gate:e2e`, `gate:jsr` |
| Milestone | `0.0.15` |
| Epic | `Part of #<epic>` |

**Label note.** All labels verified in `.github/labels.yml`. `gate:jsr` is applied because this slice
changes `packages/devtools-core`'s exports and therefore trips the RFC §13.3 **consumer gate**.

**Milestone note.** `0.0.15` — see `W3-a-devtools-host-root.md`; same basis.

---

*Issue body begins below.*

Part of #<epic>

## Context

RFC-0002 §7 / L7 fixes the v1 kind set at `panel` + `link` + `diagnostic`, with **no**
`DevToolsContribution` union — a union over nine candidates is doctrine AP-3. `panel` is the kind
that renders. Rendering goes through the **closed `DevToolsUiNode` element vocabulary** so a plugin
contributes a described surface rather than executable client code, and each contribution renders
inside its own error boundary so one bad panel cannot take down the shell.

## Scope

Verbatim from RFC §14:

- `packages/devtools-core/contracts/v1/panel.ts`
- the host renderer

Introduces: `DevToolsPanelContribution`, `UiNode` render, **per-contribution error boundary**.

## Out of scope

- The `link` kind (W4-b) and the `diagnostic` kind (a pure reuse of the shipped `plugin doctor`
  `extraChecks` seam, wired in W2-b).
- Mutating actions. RFC L8: **read-only by default** in v1; INV-3's declared-actions machinery is
  staged, not shipped here.
- Live data. A panel renders from what the read contract provides — W5-a / W5-b.

## Acceptance

- [ ] gate: e2e — a plugin-supplied panel renders in the host with **zero client code shipped by the
      plugin**; the plugin contributes only a `DevToolsUiNode` tree plus its envelope.
- [ ] gate: e2e — a **throwing** panel renders an error card in its own slot and the shell plus every
      sibling panel stay interactive (assert the sibling still renders, not merely that the page
      responds).
- [ ] `DevToolsUiNode` is a **closed** vocabulary derived from a `const`, never widened to `string`;
      an unknown element is a structured error, not a silent drop.
- [ ] gate: AP-24 guard — no `switch (contribution.kind)` in the host renderer; dispatch goes through
      the typed kind registry populated at the composition root (RFC §6 / §13.4).
- [ ] gate: **consumer gate** (RFC §13.3, exports changed) — `deno task publish:dry-run` and
      `deno doc --lint` over **every** `packages/devtools-core` entrypoint pass; every new exported
      symbol has an explicit return type, a JSDoc one-liner, and the kind carries a worked
      `@example`.
- [ ] gate: `deno task arch:check` and `deno task quality:scan` pass; no new `any`, `as unknown as`,
      or `// deno-lint-ignore` in the public surface.
- [ ] gate: the host resolves the panel by **`mountId`**, never by plugin name (RFC §13.2 —
      the coupling class that reached `main` in #745); asserted by `quality:scan` plus a unit test.

## Dependencies

- **Hard:** W3-a (host root), and **W3-b** — RFC §9 forbids building a DevTools surface before
  production absence is proven.
- **Hard:** W1-a (`packages/devtools-core` and its contracts/v1 unit).
- **Hard:** the **W0-a** probe outcome. If package-shipped island specifiers do not resolve under
  Deno, the rendering strategy changes from package-shipped islands to copy-mode and this slice's
  files change with it. That is why W0-a is a probe, not information.
- **Blocks:** W5-a, W6-a.
- Doctrine: `packages/devtools-core` is **Archetype 1 — small contract**. No ports, adapters, DI,
  base classes, or IO may enter it in this slice; F-2/F-3/F-4/F-9 do not apply to A1 and must not be
  claimed as passing there.
