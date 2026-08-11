# [devtools W0-a] Probe: can a package ship island specifiers consumable under Deno resolution?

> **DRAFT — not filed. No GitHub mutation has occurred.**

**Title:** `[devtools W0-a] Probe: can a package ship island specifiers consumable under Deno resolution?`

| Field | Value |
| --- | --- |
| Labels | `type:chore`, `area:cli`, `area:fresh`, `priority:p1`, `status:plan`, `epic:dev-dashboard` |
| Milestone | `0.0.15` |

All labels above are verified present in `.github/labels.yml` and on the live repo. There is **no**
`epic:devtools` label; `epic:dev-dashboard` is used because RFC-0002 amends epic #400 rather than
opening a new epic slug. Creating a new label is a board mutation the owner has not authorized.

Part of #<epic>

## Context

RFC-0002 §14 sequences two **disposable probes** before any contract slice, and §15.4 records
`islandSpecifiers` with JSR specifiers as **Unverified** at baseline. RFC-0002 §14's closing note is
explicit: "W0 outcomes are hard dependencies, not information" — if this probe fails, W4-a's
rendering strategy changes from package-shipped islands to copy-mode, which changes W4-a's files.
This issue exists to answer the question, not to ship code.

**This is a disposable probe.** Nothing produced here is intended to merge. The deliverable is a
recorded answer.

## Scope

Files / roots, verbatim from RFC-0002 §14:

- throwaway branch
- `packages/cli/src/kernel/assets/app/vite.config.ts.template` (read)

Introduces: **nothing — a disposable proof.**

## Out of scope

- Any change that merges to `main`.
- Any new package, contract, or export (that is W1-a).
- Changing the scaffold templates to make the probe pass; the probe reports reality.
- The second-route-root question (that is W0-b).

## Acceptance

- [ ] The probe branch is run and the question "can a package ship island specifiers consumable
      under Deno resolution?" is answered **yes** or **no** — proving check per RFC-0002 §14:
      manual — island from a package hydrates in a scaffolded app.
- [ ] The answer, the exact commands run, and the observed output are recorded in the run's
      `drift.md` with a date and the probe branch name.
- [ ] The consequence for W4-a is written down in `drift.md`: package-shipped islands **or**
      copy-mode, naming which files W4-a then touches.
- [ ] The probe branch is deleted or marked disposable; no probe code is proposed for merge.

## Dependencies

- Depends on: — (RFC-0002 §14 lists no dependency; W0-a is a root of the DAG)
- Blocks: W1-a, and transitively W4-a's rendering strategy.
