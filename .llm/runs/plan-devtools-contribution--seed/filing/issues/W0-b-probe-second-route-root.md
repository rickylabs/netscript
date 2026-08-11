# [devtools W0-b] Probe: second route/island root in one Vite process

> **DRAFT — not filed. No GitHub mutation has occurred.**

**Title:** `[devtools W0-b] Probe: second route/island root in one Vite process`

| Field | Value |
| --- | --- |
| Labels | `type:chore`, `area:cli`, `area:fresh`, `priority:p1`, `status:plan`, `epic:dev-dashboard` |
| Milestone | `0.0.15` |

All labels verified present in `.github/labels.yml` and live. No `epic:devtools` label exists —
see W0-a for the rationale for `epic:dev-dashboard`.

Part of #<epic>

## Context

RFC-0002 §15.4 carries "a second route/island root" as **Unverified** at baseline, and §14 sequences
it as the second of two deliberately cheap probes ahead of every contract slice. L1 (RFC-0002 §5,
§13.1) makes DevTools a separate host process precisely because an app-mounted tree inherits the
full-reload watcher and page-module rewriting; this probe tests whether two route roots can coexist
in one Vite process without `.generated/` contention.

**This is a disposable probe.** The deliverable is a recorded answer, not shipped code.

## Scope

Files / roots, verbatim from RFC-0002 §14:

- throwaway branch

Introduces: **nothing — disposable.**

## Out of scope

- Standing up the actual DevTools host root (that is W3-a).
- Any edit to `packages/**`, `plugins/**`, or `apps/**` intended for merge.
- Re-litigating L1's separate-host decision; this probe informs mechanics, not the decision.

## Acceptance

- [ ] The probe branch is run and the question "do two route/island roots resolve in one Vite
      process without `.generated/` contention?" is answered **yes** or **no** — proving check per
      RFC-0002 §14: manual — two route roots resolve without `.generated/` contention.
- [ ] The answer, the commands run, and the observed contention (or its absence) are recorded in
      the run's `drift.md` with a date and the probe branch name.
- [ ] If contention is observed, the specific colliding path(s) are named in `drift.md` so W3-a can
      size the fix.
- [ ] The probe branch is deleted or marked disposable; no probe code is proposed for merge.

## Dependencies

- Depends on: — (root of the DAG in RFC-0002 §14)
- Blocks: W1-a; informs W3-a's host-root layout.
