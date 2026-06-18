# Research — chore-deps-hygiene--deps

> **SEED** — supervisor-level framing. The generator owns the dep census + catalog-resolution
> confirmation before locking slices.

## Re-baseline

- Carried-in source: handover §3.2 + `.agents/skills/netscript-deno-toolchain`.
- Re-derived against `main` @ `cc3b8731`.

## Findings

| # | Finding | How to verify |
|---|---------|---------------|
| 1 | **Catalog law (LOCKED):** Deno supports npm `catalog:` only; no JSR catalog (PR #32947). JSR-version centralization must be a scanner, not config. | Handover "Catalog verdict"; `deno.json` `catalog`/`workspace`. |
| 2 | Existing dep toolbelt present: `deno task deps:latest|outdated|why|audit|prod-install` (`.llm/tools/deps/`). New scanners should sit alongside and reuse patterns. | `AGENTS.md` "Dependency decisions"; `.llm/tools/deps/`. |
| 3 | `deno outdated --latest` is NOT authority (reports pre-release as latest); `deps:latest` reads the stable channel. Don't hand-roll registry curls. | `netscript-deno-toolchain` skill. |
| 4 | `arch:check` exists as a task and is part of the validation set — scanners must integrate with its contract. | `deno task arch:check`; `.llm/harness` arch gate. |
| 5 | A bespoke version-bump tool exists and is to be replaced by a wrapper over native `deno bump-version` (Conventional-Commit-derived). | locate the bespoke tool under `tools/`/`.llm/tools/`. |
| 6 | Publishability floor: 27 units, 0 slow types — must not regress. | `deno task publish:dry-run`. |

## Dependency-shape reality (confirmed 2026-06-18)

Confirmed by direct inspection (see `drift.md` D-G2-2):

- **Catalog law IS in use.** Members declare npm deps in their **`package.json`** as
  `"<pkg>": "catalog:"` (Deno 2.8 catalog protocol), resolved by the root `deno.json` `catalog`
  block. Confirmed across `plugins/{sagas,triggers,streams,workers}`,
  `packages/{fresh,contracts,kv,telemetry,…}`. (An earlier `deno.json`-only grep missed this.)
- **The npm catalog-compliance scanner enforces a LIVE invariant**: every npm dep a member uses must
  be a `catalog:` ref in its `package.json`. It catches exceptions — inline `npm:` specifiers in
  source (`queue/adapters/amqp.adapter.ts` `npm:amqplib@^0.10.3`) and stale catalog entries (catalog
  `amqplib ^2.0.1` vs `^0.10.3` used; amqplib has no 2.x — a real fix-up to surface).
- **JSR deps stay inline `jsr:` per member** (no JSR catalog) → the JSR-version centralization
  scanner flags cross-member version divergence. Both scanners are workspace-wide.
- **Scanner home confirmed:** `.llm/tools/deps/` (`audit.ts latest.ts outdated.ts prod-install.ts
  why.ts`); none overlap the new scanners → no duplication.
- **`arch:check` contract:** `deno task arch:check` → `.llm/tools/fitness/check-doctrine.ts`, a
  **per-package** doctrine evaluator emitting `Finding[]` `{ref, level: PASS|WARN|FAIL|INFO,
  message, path, line}` keyed by doctrine ref. Dep scanners are **workspace-wide**, so they are a
  **sibling fitness gate** (same Finding[] shape + non-zero exit on FAIL), not code added inside
  `check-doctrine.ts`. NOTE: `arch:check` is **not** in the `ci` task today — durable CI enforcement
  means adding a `deps:check` step to `ci`/`ci:quality`.
- **No bespoke bump tool exists.** Repo-wide search finds no version-bump script (only docs/skill
  mentions of native `deno bump-version`) and no `version`/`bump` task in `deno.json`. Deliverable #5
  is therefore **greenfield** (introduce a thin wrapper), not a replacement.
- **`examples/*` + `apps/*` are workspace globs that match nothing** (no member `deno.json` under
  them). Likely future-wave placeholders — verify intent; do not auto-remove.

## Census / confirmations to build (generator MEASURE-FIRST)

- **catalog-resolution confirm (gate 0):** prove member `catalog:` refs resolve on Deno 2.8.3
  *before any edit*.
- **dep census:** enumerate every workspace member's `npm:`/`jsr:`/`file:`/`link:` specifiers →
  matrix of (spec → members → versions) to drive the three scanners.
- **task census:** all root + member `deno task`s, with a reference graph (who calls whom, CI, e2e)
  to drive the prune safely.
- **bump tool census:** find the bespoke tool + all references (CI/docs) to replace cleanly.

## jsr-audit surface scan

- N/A for the tooling itself (not published). The scanners *protect* the published surface's dep
  shape; verify `publish:dry-run` unaffected after wiring.

## Open questions

- **[ESCALATED to user] Catalog reconciliation:** the catalog law is unimplemented (D-G2-1).
  Tooling-only + report/census now, vs. expand Group 2 to migrate members onto the catalog
  (structural, repo-wide). Plan slices held until resolved.
- Divergent-shared-version policy: report-only first, then FAIL-gate once the tree is clean, with an
  allow-list for intentional pins (proposed default).
- ~~Catalog resolve on 2.8.3~~ — moot for now (no member uses `catalog:`; resolution check applies
  only if migration is chosen).
- ~~Scanner home + `arch:check` contract~~ — RESOLVED (`.llm/tools/deps/`; sibling fitness gate
  emitting `Finding[]` + exit code; wire into `ci`).
- ~~Do `deps:*` wrappers already cover this~~ — RESOLVED (no; centralization/compliance are new).
