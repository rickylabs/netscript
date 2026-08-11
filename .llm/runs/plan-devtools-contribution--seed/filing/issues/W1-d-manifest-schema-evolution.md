# [devtools W1-d] Manifest schema-evolution precondition (drift D-6) — BLOCKED on owner fork F-3

> **DRAFT — not filed. No GitHub mutation has occurred.**

**Title:** `[devtools W1-d] Manifest schema-evolution precondition (drift D-6)`

| Field | Value |
| --- | --- |
| Labels | `type:fix`, `area:plugins`, `area:cli`, `priority:p1`, **`status:triage`**, `epic:dev-dashboard` |
| Milestone | `0.0.15` |

All labels verified present in `.github/labels.yml` and live. This issue carries `status:triage`
rather than `status:plan` because **its contract is not yet chosen** — see Dependencies.

Part of #<epic>

## Context

RFC-0002 §15.1 fork **F-3** and `plan.md` risk **R5** record drift **D-6**: #890's claim that "older
CLIs ignore an unknown block" is **false** — the manifest schema is `.strict()`, so an unknown key
hard-rejects and the plugin fails to parse. `plan.md`'s rework audit classifies F-3 as
**MUST RESOLVE — would force rework**, because the `.passthrough()`-vs-`schemaVersion: 2` choice has
different old-CLI behavior *and different tests*, and it blocks the pointer and emitter slices.
The decision brief also notes this is a live defect in **#890/#922's own plan** (slice #929 is built
on it), surfaced by this run and escalated — it is not ours to fix unilaterally.

## Scope

Files / roots, verbatim from RFC-0002 §14:

- `packages/plugin/src/protocol/manifest.ts`

Introduces (verbatim): the chosen compatibility contract (`.passthrough()`/catchall **or**
`schemaVersion: 2`).

## Out of scope

- Adding the DevTools contribution pointer to the manifest — this slice only makes an unknown block
  survivable; the pointer rides a later slice.
- Reopening the pointer-axis decision (**L4**, RFC-0002 §4/§6) or inventing a second SDK extension
  mechanism alongside PR #1390 (`plan.md` Non-Scope).
- Any change to #922's children, which are explicitly **untouched** (supersession map, fork F-10).

## Acceptance

- [ ] Fork **F-3** is ratified by the owner and the chosen option (`.passthrough()`/catchall **or**
      `schemaVersion: 2`) is recorded in the issue before implementation starts.
- [ ] `packages/plugin/src/protocol/manifest.ts` implements exactly the ratified option.
- [ ] The RFC-0002 §14 proving gate passes: a contract test in which **an older-CLI parse of a
      manifest carrying an unknown block does not hard-reject** — exit code 0, test name linked in
      the PR.
- [ ] A test asserts the *pre-change* behavior is the one described in drift D-6 (unknown key
      hard-rejects), so the fix is proven against a reproduced defect rather than asserted.
- [ ] `deno task check`, `deno task test`, `deno task quality:scan`, and `deno task arch:check`
      scoped to `packages/plugin` exit 0.
- [ ] The finding is cross-referenced to #890/#922 so their slice #929 is not built on the false
      assumption (comment only; no re-scoping of another epic's children).

## Dependencies

- **BLOCKED on owner fork F-3** (RFC-0002 §15.1). The unblocking decision is:
  *"Manifest schema-evolution precondition — land it before any manifest-visible pointer"*, and
  specifically **which** compatibility contract is chosen. Until the owner selects
  `.passthrough()`/catchall **or** `schemaVersion: 2`, this slice has no implementable contract and
  stays at `status:triage`.
- Depends on: fork F-3 ratification (RFC-0002 §14 lists **fork F-3** as this slice's dependency, not
  another slice).
- Blocks: **W2-a**, and every manifest-visible pointer slice.
