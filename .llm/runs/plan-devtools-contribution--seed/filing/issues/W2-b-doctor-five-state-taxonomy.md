# [devtools W2-b] Doctor wiring + five-state taxonomy

> **DRAFT — not filed. No GitHub mutation has occurred.**

**Title:** `[devtools W2-b] Doctor wiring + five-state taxonomy`

| Field | Value |
| --- | --- |
| Labels | `type:feat`, `area:cli`, `area:plugins`, `priority:p2`, `status:plan`, `epic:dev-dashboard` |
| Milestone | `0.0.15` |

All labels verified present in `.github/labels.yml` and live.

Part of #<epic>

## Context

Locked decision **L7** (RFC-0002 §7) admits `diagnostic` as a v1 kind precisely because it is a
**pure reuse of the shipped `plugin doctor` `extraChecks` seam** — each retained kind must name a
real first-party consumer. This slice wires DevTools contribution health into that existing seam so
a contribution that fails window negotiation is **quarantined with a diagnosis**, not silently
dropped (RFC-0002 §6 lifecycle/quarantine).

## Scope

Files / roots, verbatim from RFC-0002 §14:

- `packages/cli/src/public/features/plugins/doctor/`

Introduces (verbatim): quarantine diagnosis over the existing `extraChecks` seam.

## Out of scope

- Inventing a new diagnostics framework or a parallel check runner — the `extraChecks` seam is
  reused, per **L7**.
- Any mutating/repair action; **L8** keeps v1 **read-only** (RFC-0002 §7, §8).
- `console.*` in published code (AP-13, gate F-14, RFC-0002 §13.4) — a diagnostics surface is the
  most tempting violator.
- The DevTools host UI rendering of diagnostics — later slices.

## Acceptance

- [ ] `netscript plugin doctor` prints **all five** contribution states (RFC-0002 §14 proving gate,
      verbatim), driven through the existing `extraChecks` seam rather than a new mechanism.
- [ ] An e2e assertion proves a **window-mismatch contribution is quarantined, not silently
      dropped** (RFC-0002 §14, verbatim).
- [ ] The doctor output resolves contributions by `mountId`, never by plugin name (RFC-0002 §13.2
      host-side plugin-name-coupling row), asserted by `deno task quality:scan`.
- [ ] No `console.*` is added to published code; gate **F-14** evidence linked (RFC-0002 §13.4).
- [ ] `deno task check`, `deno task test`, `deno task quality:scan`, and `deno task arch:check`
      exit 0 for `packages/cli`, with `check-doctrine.ts --root packages/cli` covering F-2/F-3/F-4
      (RFC-0002 §13.3).
- [ ] `deno task e2e:cli run scaffold.runtime --cleanup` is run **at the merge-readiness pass**, not
      per intermediate commit (RFC-0002 §13.3 A6 row), and its exit code is recorded in the PR.

## Dependencies

- Depends on: **W2-a** (RFC-0002 §14).
- Blocks: **W3-a** (CLI-generated DevTools host root).
