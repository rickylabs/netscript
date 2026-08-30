# Plan: document CLI and plugin subpath surfaces

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-cli-plugin-subpath-surface--1788` |
| Branch | `docs/cli-plugin-subpath-surface` |
| Phase | `plan` |
| Target | `docs/site/reference/cli/index.md`, `docs/site/reference/plugin/index.md` |
| Archetype | 6 — CLI/tooling for the described CLI surface; plugin surface described under its existing package contract |
| Scope overlays | docs |

## Archetype

This is docs-only work describing existing package contracts. `@netscript/cli` is Archetype 6; the
plugin package's existing public surface is inspected without changing its architecture. The docs
overlay supplies source-alignment, link, terminology, and drift requirements.

## Current Doctrine Verdict

The current CLI and plugin source layouts are not modified. Relevant historical CLI/plugin debt is
either closed or unrelated to these page omissions; no debt entry is created or changed.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The published types and subpath boundaries are the contract the reference pages must expose. |
| A2 | Re-export notes keep the surface exact without duplicating descriptions. |
| A14 | `deno doc`, docs accuracy checks, export drift checks, and generated-asset checks prove the repair. |

## Goal

Make both existing reference pages accurately account for their published subpath symbols without
claiming nonexistent separately generated pages.

## Scope

- Correct both false generated-page claims.
- Add CLI's one missing symbol and explicitly account for its testing re-exports.
- Preserve plugin coverage that is already accurate; add only the 126 genuinely absent unique
  symbols and explicit re-export notes per affected entrypoint.
- Regenerate the four derived docs assets after each page's prose commit.

## Non-Scope

- Any hand-written `packages/cli` or `packages/plugin` source.
- New reference pages, `AUTHORITATIVE_MAPPING`, database docs, or package export changes.
- Aspire, Docker, scaffold runtime, release publication, issue closure, or merge actions.

## Hidden Scope

- The site-derived corpus and downstream CLI/MCP generated assets must be refreshed with provenance
  pointing to the immediately preceding prose commit.
- `docs:readme:check` must be reproduced against the branch and a clean baseline because its known
  `packages/bench/README.md` failure is outside this slice.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Keep one PR for both pages. | The correction is cohesive, docs-only, shares one derived chain and one gate set, and remains reviewable as symbol tables; splitting would duplicate generation and validation. |
| D2 | Treat a symbol as covered once per page, then enumerate repeat appearances in re-export notes. | This satisfies the entrypoint inventory without duplicating descriptions. |
| D3 | Use `deno doc --json` entrypoint nodes and declaration locations as the symbol authority. | It handles multiline and transitive re-exports correctly. |
| D4 | Do not alter `AUTHORITATIVE_MAPPING` or package/plugin source. | Explicit issue boundary. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| PR split | safe to defer — resolved as one PR | Counts and review shape are known; D1 is locked. |
| Plugin pre-existing coverage | must resolve now — resolved | Five sections are covered, two partial, five absent; D2 governs re-exports. |
| PLAN-EVAL | safe to defer — N/A | Contract, scope, gates, and source authority are explicit; no architecture or rework-sensitive decision remains. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Missing a re-export | Compare every entrypoint JSON symbol set against page-wide tables plus explicit section re-export lists. |
| Duplicating existing plugin coverage | Add owned/unique symbols to the relevant section and use re-export notes for already described symbols. |
| False completeness wording | State measured counts in run/PR evidence; keep public prose limited to verifiable entrypoint accounting. |
| Generated drift or wrong provenance | Commit each page's prose/run artifacts, regenerate from that commit, then commit only the four derived assets. |
| Lock churn | Use existing `--no-lock` generators and verify `deno.lock` against baseline. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| Public-surface omission | existing docs defect | Resolve through source-derived symbol tables and re-export notes. |
| Duplicate contract prose | risk | Avoid by documenting repeated symbols once and naming re-exports. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-5 public surface audit | yes | Per-entrypoint `deno doc --json` comparison and `docs:exports-drift` |
| F-7 doc-score/source accuracy | yes | Requested docs build/link/caveat/accuracy/snippet/prose gates |
| Generated asset integrity | yes | `check:assets-barrel`, `check:publish-assets`, `check:mcp-export-corpus`, targeted `deno check` |
| Runtime/Aspire | no | Docs-only/static; explicitly prohibited by owner |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | No source architecture defect or deferred docs violation discovered. |

## Validation Plan

Run every command listed in the slice brief with its real exit code, plus `docs:readme:check` on the
branch and clean `origin/main`, a diff-based diagrams applicability check, raw generated/status
verification, provenance equality, and `deno.lock` comparison.

## Dependencies

- Existing Deno 2.9 toolchain and checked-in docs generators only.

## Drift Watch

- Any mismatch between export maps, `deno doc --json`, and the brief is a stop condition.
- Any generated output beyond the expected four files requires investigation before commit.
