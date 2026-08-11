# [devtools W1-a] Contracts unit + gate wiring (`packages/devtools-core`)

> **DRAFT — not filed. No GitHub mutation has occurred.**

**Title:** `[devtools W1-a] Contracts unit + gate wiring`

| Field | Value |
| --- | --- |
| Labels | `type:feat`, `area:plugins`, `area:tooling`, `priority:p1`, `status:plan`, `epic:dev-dashboard` |
| Milestone | `0.0.15` |

All labels verified present in `.github/labels.yml` and live. No `epic:devtools` or
`area:devtools` label exists; `area:plugins` + `area:tooling` are the closest verified pair
(new package surface + `arch:check` task wiring).

Part of #<epic>

## Context

RFC-0002 §13.1 locks `packages/devtools-core` as **Archetype 1 — Small Contract**: it publishes
types and small invariants and almost no runtime, holds no ports, adapters, DI, or IO, and must not
depend on `@netscript/fresh` or `@netscript/fresh-ui`. RFC-0002 §13.3 and locked decision **L13**
make the `arch:check` root wiring part of *this* slice, because `deno task arch:check` iterates 16
hand-listed roots out of 36 live units — without the added roots, every gate claim in §13 is
decorative.

## Scope

Files / roots, verbatim from RFC-0002 §14:

- **new** `packages/devtools-core/` (`mod.ts`, `contracts/v1/`, `deno.json`)
- **edit** root `deno.json` `arch:check` (+2 `--root`)

Introduces (verbatim): `ContributionEnvelope`, `DevToolsContributionBase`, `DevToolsZone`,
`DevToolsUiNode`, `orderContributions()`.

Design constraints that bind this slice:

- **L3** — the envelope is family-neutral and validates **no** payload; only the registered family
  schema does (RFC-0002 §6).
- **L5** — `DevToolsZone` is a **host-owned closed vocabulary** (RFC-0002 §6, §7).
- **L6** — `orderContributions()` is a pure total function: host-curated anchors first, then clamped
  `(order, mountId, id)`; out-of-range `order` is a **generate-time error** (RFC-0002 §6).

## Out of scope

- `resolveDevToolsLink()` and the link grammar types — W1-b.
- Any registry emission or generator code — emission is a CLI (A6) concern, W2-a.
- Any port, adapter, base class, DI container, or IO in this package (doctrine A1 prohibition,
  RFC-0002 §13.1).
- Any `plugins/devtools` scaffolding (A5 thin plugin, later slice).
- Publishing the package.

## Acceptance

- [ ] `packages/devtools-core/` exists with `mod.ts`, `contracts/v1/`, and `deno.json`, and exports
      `ContributionEnvelope`, `DevToolsContributionBase`, `DevToolsZone`, `DevToolsUiNode`, and
      `orderContributions()`.
- [ ] Root `deno.json`'s `arch:check` task gains the two new `--root` entries covering the new
      package root and `plugins/devtools` (locked decision **L13**, RFC-0002 §13.3).
- [ ] The RFC-0002 §14 proving gate passes:
      `deno task arch:check && deno doc --lint packages/devtools-core/mod.ts && deno task quality:scan`
      — exit code 0, output linked in the PR.
- [ ] `deno doc --lint` reports **zero** slow types: every exported function has an explicit return
      type and the closed unions are `const`-derived, never widened to `string` (RFC-0002 §13.2).
- [ ] The package declares no dependency on `@netscript/fresh` or `@netscript/fresh-ui`, verified
      from its `deno.json` imports (RFC-0002 §13.1 "Must not" column).
- [ ] `orderContributions()` has unit tests covering host-anchor precedence, the clamped
      `(order, mountId, id)` tiebreak, and an out-of-range `order` producing a generate-time error
      (**L6**).

## Dependencies

- Depends on: **W0-a**, **W0-b** (RFC-0002 §14 DAG — both probes gate this slice).
- Blocks: W1-b, W1-c, and transitively W2-a.
- Related fork: **F-1** (RFC-0002 §15.1) selects whether `devtools-core` re-exports from a shared
  #890 spine. Per `plan.md`'s rework audit, F-1 is **MUST RESOLVE — would force rework** and blocks
  this slice's public import specifiers. Do not start W1-a before F-1 is ratified.
