# [devtools W3-a] CLI-generated DevTools host root

> **DRAFT — not filed. No GitHub mutation has occurred.**

## Filing block

| Field | Value |
| --- | --- |
| Title | `[devtools W3-a] CLI-generated DevTools host root` |
| Labels | `type:feat`, `area:cli`, `area:fresh`, `priority:p1`, `status:triage`, `epic:dev-dashboard`, `wave:v1`, `gate:e2e` |
| Milestone | `0.0.15` |
| Epic | `Part of #<epic>` |

**Label note.** Every label above exists in `.github/labels.yml`. There is **no** `epic:devtools`
label; `epic:dev-dashboard` is the only existing epic slug covering this program. If the owner wants
a distinct slug, creating it is a board mutation this run is not authorized to make.

**Milestone note.** `0.0.15` per `design/T9-supersession/supersession-map.md` §Recommended milestone
home #1 — the owner-ratified 2026-07-19 train, which "GitHub wins on conflict" protects against
`0.0.14`'s stale description. If the owner files a **new** epic rather than amending #400, the
milestone follows the epic and this becomes `MILESTONE: OWNER-DECISION`.

---

*Issue body begins below.*

Part of #<epic>

## Context

RFC-0002 §5 / L1 decides that DevTools is a **separate first-party host process** — a CLI-generated
root with its own Vite process, its own port, bound to loopback — not an app-mounted route group and
not a `@netscript/fresh` subpath. The app-mounted shape was rejected on committed evidence: the
existing `routes/(design)/design/` group ships to production with zero dev-only gating. This slice
stands the host up; it is the root every later rendering, contract, and console slice hangs off.

## Scope

Verbatim from RFC §14:

- `packages/cli/src/kernel/assets/devtools/` (new templates)
- the `devtools` command group

Introduces: **the generated host app**.

## Out of scope

- Production exclusion mechanisms and their gate — that is **W3-b** (`G-5`/INV-4).
- Any contribution rendering (`panel`, `link`) — W4-a / W4-b.
- The read contract, MCP composition, or SSE — W5-a / W5-b.
- Publishing the host as a package. RFC §13.1: the generated host is **userland, not a package**;
  making it one requires a fresh archetype decision.

## Acceptance

- [ ] `netscript devtools <generate|start>` emits the host root from
      `packages/cli/src/kernel/assets/devtools/`, and re-running with no input change is a no-op.
- [ ] The host serves on **its own port**, distinct from the scaffolded app's, and the bind address
      is **loopback** — asserted from the listener, not from a config default.
- [ ] The scaffolded app's `routes/` gains **zero** DevTools entries (assert by listing the generated
      app `routes/` tree).
- [ ] gate: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` passes with the host
      start + loopback-bind assertions included; exit code recorded in the PR.
- [ ] gate: `deno task arch:check` and `deno task quality:scan` pass for the touched CLI roots.
- [ ] gate: F-2 / F-3 / F-4 pass via `check-doctrine.ts --root packages/cli` (required for the A6 CLI
      surface per RFC §13.3).
- [ ] gate: F-9 — the host template's README carries the **Required permissions** block; no bare
      `--allow-read` / `--allow-write` appears in any spawn argv this slice adds.

## Dependencies

- **Hard:** W2-a (transactional replace-set generator) — the host reads what that generator emits.
- **Hard:** W0-a and W0-b probe outcomes recorded in `drift.md`. If W0-a failed, the rendering
  strategy for W4-a changes and the host's asset templates change with it.
- **Blocks:** W3-b, W4-a, W4-b, W5-a.
- Doctrine: Archetype 6 (existing `packages/cli`, additive) — must not deepen its standing
  **Restructure** verdict.
