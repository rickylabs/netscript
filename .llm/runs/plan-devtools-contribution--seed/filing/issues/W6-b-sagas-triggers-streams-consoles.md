# [devtools W6-b] Sagas / triggers / streams consoles — breadth + the streams degraded state

> **DRAFT — not filed. No GitHub mutation has occurred.**

## Filing block

| Field | Value |
| --- | --- |
| Title | `[devtools W6-b] Sagas / triggers / streams consoles — breadth + the streams degraded state` |
| Labels | `type:feat`, `area:plugins`, `area:fresh`, `priority:p2`, `status:triage`, `epic:dev-dashboard`, `wave:v1`, `gate:e2e` |
| Milestone | `0.0.15` |
| Epic | `Part of #<epic>` |

**Label note.** All labels verified in `.github/labels.yml`.

**Milestone note.** `0.0.15` — see `W3-a-devtools-host-root.md`; same basis.

---

*Issue body begins below.*

Part of #<epic>

## Context

With the family proven by W6-a, this slice adds breadth across the remaining first-party plugins.
The load-bearing part is not the extra panels — it is **streams**. `plugins/streams` has **no oRPC
contract surface**; its connector is a transparent proxy, and that is recorded architecture debt, not
a bug to fix here. RFC §11.7 therefore requires the contract-provenance column for streams to render
the **labelled `degraded` state** — with data, a human label, and a citation — rather than an empty
cell, a spinner, or a silent omission. A quiet failure here would be the exact departure §11 chose
against every surveyed system to avoid.

## Scope

Verbatim from RFC §14:

- respective `plugins/*` — `plugins/sagas`, `plugins/triggers`, `plugins/streams`

Introduces: **breadth**, plus the streams degraded contract-provenance state.

Per §11.5, what only NetScript can show:

- **Sagas** — instance table including `compensating`; from→to transition/compensation timeline as a
  **state machine, not spans** (#429).
- **Triggers** — firing history across the 8 trigger kinds; cron preview (#430).
- **Streams** — fan-out/delivery state per subscriber as framework run-state (#431).

## Out of scope

- **Closing the streams oRPC-contract debt.** The degraded state is the deliverable; fixing the
  connector is a separate arch-debt item and must not be pulled in to make the panel look better.
- Enable/disable for triggers, or any other mutation (RFC L8 read-only v1). The CLI-equivalent line
  is rendered; the action is not wired.
- Span bars, time-proportional gantts, and log tails anywhere — **AC-3** forbids them in the flow
  surface "ever", and AC-1 forbids them as owned surfaces generally.

## Acceptance

- [ ] gate: e2e per plugin — the sagas, triggers, and streams consoles each render from **that
      plugin's own contribution**, with no host-side special case and resolution by `mountId`.
- [ ] gate: `SCOPE-frontend` state matrix walked in Playwright **per plugin** — every reachable arm
      of the §11.7 `PanelState` union asserted: `loading`, `empty` (with its CLI-equivalent line),
      `ready`, `degraded`, `incompatible`, `unauthorized`, `failure`.
- [ ] gate: **streams contract-provenance renders `degraded`** — a `{ kind: 'degraded' }` state
      carrying `data`, `label: 'no contract surface — connector is a transparent proxy'`, and
      `citation: 'arch-debt.md#streams-connector-sound-deferred'`. The test asserts the label and the
      citation are **rendered visibly to the user**, not merely present in the payload.
- [ ] **This degraded state is a required state, not a defect.** A test asserts it is **not** rendered
      as `empty`, `failure`, or a silent omission; a PR that "fixes" it into `ready` fails this box.
- [ ] Sagas: the transition/compensation timeline is asserted to be a **state-machine** rendering —
      no span bars, no time-proportional axis (AC-3).
- [ ] Triggers: firing history covers all **8** trigger kinds; cron preview renders; enable/disable
      renders its CLI-equivalent line without a write path (AC-2 + L8).
- [ ] Out-links come from the §11.6 helper: per transition/firing/delivery → trace-span detail;
      saga journey → `<base>/flows/:correlationId`; subscriber resource →
      `/consolelogs/resource/{name}`.
- [ ] **AC-1 answer recorded in the issue for each of the three consoles** — the NetScript-only
      reason each is an owned surface rather than a deep-link.
- [ ] gate: `deno task arch:check` and `deno task quality:scan` pass for all three plugins; each stays
      **thin** (Archetype 5).
- [ ] gate: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — raw exit code
      recorded in the PR.

## Dependencies

- **Hard:** W6-a. This slice is breadth over a proven family; it must not be the slice that discovers
  the family is wrong.
- **Hard (streams only):** the arch-debt entry `arch-debt.md#streams-connector-sound-deferred` must
  exist and be citable. If the anchor does not resolve at implementation time, record the drift and
  escalate rather than inventing a citation — the citation is what makes the degraded state honest.
- Related boards: #429 (sagas), #430 (triggers), #431 (streams) are existing `epic:dev-dashboard`
  children on `0.0.15`. Their dispositions live in
  `design/T9-supersession/supersession-map.md`; reconcile at filing time per that map. **Do not
  duplicate them** — if the map keeps them, this issue references them instead of restating scope.
