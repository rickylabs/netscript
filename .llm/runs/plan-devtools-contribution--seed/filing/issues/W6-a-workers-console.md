# [devtools W6-a] Workers console — the first real consumer

> **DRAFT — not filed. No GitHub mutation has occurred.**

## Filing block

| Field | Value |
| --- | --- |
| Title | `[devtools W6-a] Workers console — the first real consumer` |
| Labels | `type:feat`, `area:plugins`, `area:fresh`, `priority:p1`, `status:triage`, `epic:dev-dashboard`, `wave:v1`, `gate:e2e` |
| Milestone | `0.0.15` |
| Epic | `Part of #<epic>` |

**Label note.** All labels verified in `.github/labels.yml`.

**Milestone note.** `0.0.15` — see `W3-a-devtools-host-root.md`; same basis.

---

*Issue body begins below.*

Part of #<epic>

## Context

RFC-0002 §14 names this the **first real consumer**: the slice that proves the contribution family
works end to end from a plugin's own contribution rather than from host-authored fixtures. §11.5
fixes what only NetScript can show for workers — job/task registry with schedule intent versus
observed drift, and an execution feed with attempts/retries as `RunRecord` semantics (#428) — and
what it must link out to instead of owning. §11.7's state matrix is the merge checklist, not a
suggestion: happy-path screenshots do not satisfy it.

## Scope

Verbatim from RFC §14:

- `plugins/workers/` devtools contribution

Introduces: **proof the family works end to end**.

## Out of scope

- Sagas, triggers, and streams consoles — **W6-b**.
- Any owned trace waterfall, log tail, or metrics chart. These are killed surfaces (AC-1 / §11.1);
  the workers console **links out** to Aspire for all three.
- Enable/disable or any other mutation. RFC L8 keeps v1 read-only.
- Framework changes to `packages/devtools-core` or the host renderer. If this slice needs one, that
  is a defect in W4-a/W5-a and belongs in a follow-up, not smuggled in here.

## Acceptance

- [ ] gate: e2e — the workers console renders **from the plugin's own contribution** in
      `plugins/workers/`, with no host-side special case for the workers plugin and no resolution by
      plugin name (resolution is by `mountId`).
- [ ] gate: **`SCOPE-frontend` state matrix walked in Playwright** — every arm of the exhaustive
      `PanelState` union (§11.7) that this surface can reach is rendered and asserted: `loading`,
      `empty` (rendering the `netscript scaffold job …` CLI-equivalent line), `ready`, `degraded`,
      `incompatible`, `unauthorized`, `failure`. Each arm needs its own assertion.
- [ ] gate: `SCOPE-frontend` route check, browser validation, responsive check, and contract check —
      subpages asserted, not only the index route (`SCOPE-frontend.md`'s named false-done mode is
      "main route works but subpages broken").
- [ ] **AC-1 answer recorded in the issue**: the NetScript-only answer to *"why can't this just
      deep-link to Aspire/Scalar?"* is written down and points at §11.5's workers row. A panel whose
      capability appears in §11.2 owned by Aspire/Scalar with `DL? = yes` cannot merge as an owned
      surface.
- [ ] Out-links come from the §11.6 helper: per execution → `/traces/detail/{traceId}?spanId=`;
      per resource → `/structuredlogs/resource/{n}?traceId=&logLevel=error`. No hand-concatenated
      hrefs.
- [ ] The queue-depth metric link renders **only if** `queryMetrics` returns the instrument. Whether
      NetScript emits OTel metrics at all is `unverified` (`r5` OQ7) — if it does not, the absence is
      rendered as a stated `degraded`/absent case and the finding is recorded in `drift.md`.
- [ ] Empty state renders its CLI-equivalent line, satisfying **AC-2** (one generator, two callers).
- [ ] gate: `deno task arch:check` and `deno task quality:scan` pass for `plugins/workers`; the
      plugin stays **thin** (Archetype 5 thinness law — it composes, it does not redefine a contract).
- [ ] gate: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — raw exit code
      recorded in the PR.

## Dependencies

- **Hard:** W4-a (`panel` kind + renderer) and W5-a (read contract). Live updates additionally need
  W5-b.
- **Hard:** W4-b if any rendered link is a `link`-kind contribution rather than an in-panel href.
- **Blocks:** W6-b — breadth follows proof, not the reverse.
- **Live-board overlap:** #428 `[dashboard DDX-18a] workers per-capability dashboard section` is OPEN
  on `0.0.15` and covers the same surface (verified live 2026-08-11). Reconcile per
  `design/T9-supersession/supersession-map.md` at filing time — either amend #428 to this scope or
  file this as its successor. **Do not file both.**
