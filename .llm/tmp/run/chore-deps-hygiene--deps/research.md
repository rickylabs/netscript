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

- Catalog resolve on 2.8.3? (gate 0 — must confirm first.)
- Divergent-JSR-version policy: hard-FAIL vs allow-list (see `plan.md`).
- Scanner home + `arch:check` integration contract.
- Do any `deps:*` wrappers already cover part of this (avoid duplication)?
