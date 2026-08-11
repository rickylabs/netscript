# [devtools W3-b] Dual production exclusion + G-5 e2e

> **DRAFT — not filed. No GitHub mutation has occurred.**

## Filing block

| Field | Value |
| --- | --- |
| Title | `[devtools W3-b] Dual production exclusion + G-5 e2e` |
| Labels | `type:feat`, `area:cli`, `area:fresh`, `priority:p0`, `status:triage`, `epic:dev-dashboard`, `wave:v1`, `gate:e2e` |
| Milestone | `0.0.15` |
| Epic | `Part of #<epic>` |

**Label note.** All labels verified present in `.github/labels.yml`. No `epic:devtools` label exists.
`priority:p0` is used because T-5 ("DevTools reaches production") is the RFC's highest-severity
threat and is **UNPROVEN** until this gate exists.

**Milestone note.** `0.0.15` — see `W3-a-devtools-host-root.md`; same basis.

---

*Issue body begins below.*

Part of #<epic>

## Context

RFC-0002 §5 H-4 / L2 / INV-4: DevTools has **no production tier**, and absence is enforced by **two
independent mechanisms that MUST NOT share a signal**. This is deliberately stricter than upstream —
Vite DevTools ships into production builds with client auth disabled, and TanStack distrusted a
single signal because hosting providers set build command and mode inconsistently. In-repo, the
existing `routes/(design)/design/` group has **no** dev-only check at all, which is the precise
defect class this slice forecloses. Gate **G-5** is what turns the claim into a fact.

## Scope

Verbatim from RFC §14:

- generated `main.ts`
- the app build graph

Introduces: **the two independent exclusion mechanisms** (L2 / INV-4).

- **Mechanism A — structural absence.** No DevTools module specifier reaches the app's production
  build output; the registration seam is never invoked outside dev.
- **Mechanism B — fail-safe runtime refusal.** The runtime refuses when mode `!== 'development'`.
  The test polarity is `!== 'development'`, **not** `=== 'production'`, because the latter fails open
  on an unset, misspelled, or provider-injected third value.

## Out of scope

- The optional third belt (OF-5: the app `build` task force-regenerating in production mode to a
  deterministic empty set). Recommended in RFC §10 as cheap, but it is a **third** mechanism; it does
  not substitute for either of the two below and is not gated here.
- Remote/tunnel exposure (T-6 / DT1 browser-token posture) — separate gate G-6, separate slice.

## Acceptance

Both mechanisms are asserted **independently**. Per INV-4: *a single passing assertion is not a
pass*, and the assertions must not read the same signal.

- [ ] gate: **Mechanism A (structural)** — a production build of a scaffolded app contains **no**
      DevTools module specifier anywhere in build output (asserted over the emitted files), and the
      DevTools mount returns **404** in that build.
- [ ] gate: **Mechanism B (runtime)** — with the DevTools code present, the runtime **refuses** when
      mode is anything other than `development`; parameterized over at least `production`,
      `Development` (wrong case), an unset value, and an arbitrary third value such as `staging`.
      A `=== 'production'` polarity is a review-blocking failure.
- [ ] gate: unit test asserting the **registration seam no-ops** without dev conditions, independent
      of the build-output assertion.
- [ ] gate: a test (or reviewed argument recorded in the PR) asserting the two mechanisms **read
      different signals** — removing either one alone still leaves production DevTools-free, and
      neither assertion passes vacuously when the other mechanism is disabled.
- [ ] gate: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` carries the G-5 e2e;
      raw exit code recorded in the PR.
- [ ] The RFC's `UNPROVEN` marker for **T-5 / INV-4** is retired in the same PR, citing the run IDs
      of the two assertions above.

## Dependencies

- **Hard:** W3-a (there is no host to exclude until it exists).
- **Blocks:** W4-a. No DevTools surface is built before production absence is proven (RFC §9).
- Related decision: owner fork **F-19** (production posture stricter than upstream) — recommended
  Ratify. If F-19 is declined, this slice's contract changes and it must be re-scoped, not silently
  weakened.
