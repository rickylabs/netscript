# Worklog: chore/deps-hygiene

| Field | Value |
|-------|-------|
| Run ID | `chore-deps-hygiene--deps` |
| Branch | `chore/deps-hygiene` (off `release/jsr-readiness`) |
| Status | `active` (group branch launched; Plan-Gate pending) |

## Progress Log

| Time | Phase | Step | Notes |
|------|-------|------|-------|
| 2026-06-18 | bootstrap | skeleton scaffolded | Supervisor created run dir + draft `plan.md`/`research.md` (5 deliverables: 3 scanners, task prune, bump wrapper). No branch/worktree/generator yet. |
| 2026-06-18 | plan-gate | group branch launched | Branched off umbrella @ `1f4cafa3` for the Plan-Gate. Plan/research/Design ready (inherited; catalog premise corrected via D-G2-2). Draft sub-PR → `release/jsr-readiness` + PLAN-EVAL dispatch (OpenHands/minimax M3, separate session) follow. Worktree deferred to implementation launch (WSL Codex, ext4). |

## Design

> Plan & Design checkpoint (supervisor-authored; implementation lane is WSL Codex). `plan.md` holds
> locked decisions + gates; this section fixes component design + contracts. Catalog premise
> corrected (D-G2-2): the catalog IS live via member `package.json` `catalog:` — the scanners
> enforce that live invariant.

### Component design (3 scanners + prune + wrapper, under `.llm/tools/deps/`)

Shared scanner contract (sibling to `check-doctrine.ts`):

- **Input:** parse every workspace member (`packages/* packages/cli/e2e plugins/*`): `deno.json`
  imports, `package.json` deps (incl. `catalog:` refs), inline `npm:`/`jsr:` in source; resolve
  `catalog:` against the root `deno.json` `catalog` block.
- **Output:** `Finding[]` `{ ref, level, message, path, line }` + `--json` + non-zero exit on FAIL.
  Pure analysis core (testable) behind a thin CLI shell.
- **Wiring:** a new `deps:check` aggregator added to `ci`/`ci:quality` (durable enforcement, since
  `arch:check` is per-package and not in `ci` today).

| Scanner | Invariant | FAIL condition |
|---------|-----------|----------------|
| `scan-jsr-centralization` | a `jsr:` spec used by >1 member agrees on version | version divergence (minus allow-list) |
| `scan-npm-catalog-compliance` | every npm dep a member uses is a `catalog:` ref | inline npm pin where a catalog ref is required (e.g. `queue` `npm:amqplib@^0.10.3`); also flags stale catalog (`amqplib ^2.0.1`) |
| `audit-file-link` | no publishable unit ships `file:`/`link:` | any `file:`/`link:` in a publishable unit |

### Roll-out design (avoids CI false-positive lockout)

Each scanner lands **report-only** (exit 0) → tree cleaned to zero findings (or explicit allow-list +
arch-debt entry per intentional divergence) → a follow-up slice flips it to **FAIL-on-violation** and
wires it into `ci` + `arch:check`. This is the mitigation for the "scanner blocks CI on a legitimate
case" risk.

### Task prune + bump wrapper

- **Prune:** task-reference graph (root + member tasks, CI workflow, `e2e:cli`, `.llm/tools/*`
  callers) → remove only tasks with zero inbound refs; diff-reviewed.
- **Bump wrapper:** greenfield (no bespoke tool exists — research-confirmed) thin wrapper over native
  `deno bump-version`, preserving structured output; parity test.

### Slice plan (design-fixed; mirrors plan.md)

gate-0 catalog-resolve smoke → dep/task census → `scan-jsr-centralization` (report-only) →
`scan-npm-catalog-compliance` (report-only) → `audit-file-link` (report-only) → clean tree/allow-list
→ flip all three to FAIL + wire `ci`+`arch:check` → task prune → bump wrapper + parity test.

### Design guardrail

Never de-catalog, edit a version pin / `scaffold-versions.ts`, or add a release-time `deno.json`
transform. A divergence is fixed by *converging versions* or an *explicit allow-list + arch-debt
entry*, never by relaxing the catalog law.

## Gate Results

(none yet — see `plan.md` Validation Plan; gate 0 = confirm `catalog:` resolves on Deno 2.8.3)

## Handoff Notes

- Next: confirm catalog resolution (gate 0), deepen dep/task census, then PLAN-EVAL (separate
  OpenHands session). No implementation slice before PLAN-EVAL `PASS`.
- HARD LINE: never de-catalog / edit version pins / `scaffold-versions.ts` to satisfy a scanner.
