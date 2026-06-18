# Plan: release/jsr-readiness (umbrella supervisor program)

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `release-jsr-readiness--supervisor` |
| Branch | `release/jsr-readiness` (off `main` @ `cc3b8731`) |
| Phase | `plan` (program-level; each sub-run runs its own 8-phase loop) |
| Target | JSR-readiness of the 27 publishable units |
| Archetype | N/A (supervisor program; sub-runs select their own) |
| Scope overlays | `SCOPE-docs.md` (Groups 3/4); partial for Group 1 |

## Goal

Make the repo objectively publishable to JSR and pass the **JSR-readiness scorecard**
(`scorecard.md`, evaluator-owned). Passing the scorecard is the precondition that unblocks
publish program steps **E** (publish 26 non-CLI via OIDC at `0.0.1-alpha.0`) and **F**
(publish `@netscript/cli` last, LD-7). No real publish happens inside this umbrella.

## Roles (Agent Delegation Contract — do not violate)

- **Claude = supervisor/coordinator only.** Writes docs/plans/run-bookkeeping/CI-infra YAML;
  launches/steers agents; merges PRs. Does **not** write framework code in `packages/`/`plugins/`.
- **OpenHands = evaluator**, in a **separate session** from the generator: PLAN-EVAL (minimax M3),
  IMPL-EVAL (qwen 3.7 max), unless a blocked launch is recorded.
- **Codex WSL = implementer** (daemon-attached, mobile-visible). One active turn per worktree;
  steer via `codex exec resume <thread-id>` — never a second `send-message-v2` at the same worktree.

## Scope (the four sub-runs / phase groups)

See `phase-registry.md` for full per-group detail.

1. **chore/prod-readiness** — repo-wide cleanup (dead code, ALL compat shims, temp/build cruft,
   stray root files; deletes dead doc files, no content rewrites).
2. **chore/deps-hygiene** — dependency-shape **tooling** (JSR-centralization scanner, npm
   catalog-compliance scanner, `file:`/`link:` audit), `deno task` prune, `deno bump-version`
   wrapper. Ships tooling; does **NOT** restructure the catalog.
3. **docs/user-site** — external docs (Diátaxis; per-package `deno doc` reference + standardized
   README; conceptual onboarding) built with Lume → GitHub Pages.
4. **docs/internal-overhaul** — internal/contributor docs consolidated + de-duplicated; document
   `deno doc` in the harness + `jsr-audit` skills.

## Non-Scope

- Real JSR publish (program steps E/F) — gated behind scorecard PASS + explicit user dispatch.
- Catalog restructuring / de-cataloging (Option-A law — never).
- Editing `scaffold-versions.ts` / any version pin (LD-8) or `packages/aspire/src/public/mod.ts`.
- Adopting `file:`/`link:` specifiers (Deno resolves siblings natively; `deno publish` rewrites them).
- Heavy implementation by the supervisor (Codex WSL implements).

## Hidden Scope

- Removing a compat shim can break a consumer (cli/examples) — requires a consumer/import scan.
- Pages subpath base URL (`rickylabs.github.io/netscript`) likely needs Lume `location` config.
- `deno task` prune must not drop a task referenced by another task / CI / e2e.
- `.claude/skills/` is generated from `.agents/skills/` — never hand-edit mirrors.

## Locked Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| LD-A | **Catalog law:** npm deps via root `catalog:` + member refs; JSR deps inline `jsr:` per member; **never de-catalog**. | Only shape Deno supports (no JSR catalog; `catalog:` is npm-only — PR #32947). Handover "Catalog verdict — do not re-open". |
| LD-B | **JSR-version centralization = scanner only**, not Deno config. | Deno has no JSR catalog and no publish-time import-map tree-shaking. Centralization must be a CI/`arch:check` gate. |
| LD-C | **`@netscript/cli` published last** (batch F), not in the 26-batch (E). | LD-7. |
| LD-D | **No real publish until scorecard PASS + explicit user dispatch.** | Publishing is permanent/outward. |
| LD-E | **Durability gates:** doc-maintenance + doc-freshness fitness gates; dep scanners wired into quality job + `arch:check`. | Docs + dep shape must not rot/drift after this lands. |
| LD-F | **docs IMPL waits for cleanup + hygiene to merge.** | Docs must document the clean, hygienic surface. |

## Open-Decision Sweep

| Decision | Status | Notes |
|----------|--------|-------|
| GitHub access mechanism for this session | **must resolve now** | No `gh`, no GitHub MCP wired to Claude Code (only Zed). Blocks sub-PRs, PR comments, OpenHands triggers, merges. See `drift.md` D-1. |
| Exact reference-doc denominator (which of the 27 get full reference vs lighter) | safe to defer | Pinned in `docs/user-site` research. |
| Pages domain/subpath + Lume `location` | safe to defer | Resolved in `docs/user-site` Plan & Design. |
| Scanner home (`.llm/tools/deps/` vs `tools/`) + `arch:check` integration shape | safe to defer | Resolved in `chore/deps-hygiene` Plan & Design. |

## Fitness Gates (program-level)

| Gate | Required | Expected evidence |
|------|----------|-------------------|
| Per-sub-run PLAN-EVAL | yes | each `plan-eval.md = PASS` (separate OpenHands session) |
| Per-sub-run IMPL-EVAL | yes | each `evaluate.md = PASS` (separate OpenHands session) |
| Scorecard (umbrella exit) | yes | `scorecard.md` all boxes, evaluator-verified |
| CI quality lane (already on `main`) | yes | lint, fmt:check, check:scaffold-versions, publish:dry-run, audit:critical green |

## Validation Plan

| Order | Gate | Command / check | Expected |
|-------|------|-----------------|----------|
| 1 | publishability | `deno task publish:dry-run` (= `.llm/tools/run-publish-dry-run.ts`) | 27 units, 0 slow types |
| 2 | check | `.llm/tools/run-deno-check.ts --ext ts,tsx` (scoped) | 0 errors |
| 3 | lint/fmt | `.llm/tools/run-deno-lint.ts` / `run-deno-fmt.ts` (source TS only) | 0 |
| 4 | arch | `deno task arch:check` | not regressed vs baseline |
| 5 | merge-readiness | `deno task e2e:cli` (`scaffold.runtime`) | at evaluator/merge pass only (expensive) |

## Dependencies

- Sub-runs branch off the umbrella and PR into it; docs IMPL depends on Groups 1+2 merged.
- GitHub access (PR/comment/trigger/merge) — currently blocked (D-1).
- OpenHands evaluator availability (PR-comment trigger path) — depends on GitHub access.
- Codex WSL daemon connected + mobile-visible for implementation slices.

## Drift Watch

- Any change to the catalog law, the off-limits list, or the publish ordering.
- `main` advancing under the umbrella (base-sync per `supervisor.md` §5).
- GitHub access status (resolution unblocks the whole PR/eval machinery).
