# PR #84 Compatibility Guide

> How PR #83 (this run) and PR #84 (plugin platform rewrite Phase 0) co-exist.

## Overview

| Aspect | PR #83 (this run) | PR #84 (plugin platform rewrite) |
|--------|----------------------|--------------------------------|
| Scope | 23 packages + 5 plugins JSR-alpha readiness | Plugin platform rewrite Phase 0 (8 in-scope packages) |
| Quality bar | `harmonisation/STANDARDS.md`, `PUBLIC-SURFACE-PATTERNS.md`, `DOCS-STRUCTURE.md` | Inherits PR #83 quality bar verbatim |
| Run type | Multi-target evaluate-then-plan (docs-only) | Research + design + per-package plans |
| Output | 28 evaluate+plan pairs + master `PLAN.md` | `plan.md` + `decisions/2026-05-05-verdict-deltas.md` + research docs |

## Quality Bar Inheritance

PR #84 **inherits** PR #83's quality bar without modification:

- `harmonisation/STANDARDS.md` (§1-11) applies uniformly to all packages in both PRs.
- `harmonisation/PUBLIC-SURFACE-PATTERNS.md` (5 canonical patterns + anti-patterns) applies to all.
- `harmonisation/DOCS-STRUCTURE.md` (`/docs/` contract) applies to all.

PR #84 does **not** modify these harmonisation docs. If a conflict arises, PR #83's versions are authoritative.

## Verdict Deltas (PR #84 overrides PR #83)

PR #84 introduces **verdict deltas** for 8 in-scope packages. Where deltas exist, PR #84's verdict takes precedence:

| Package | PR #83 Verdict | PR #84 Verdict Delta | Supersession |
|---------|-----------------|---------------------|--------------|
| `config` | Restructure → ready | Extended by PR #84 research | PR #83 `plan_config.md` valid as baseline; PR #84 extends |
| `aspire` | Refactor-light → ready | Extended by PR #84 research | PR #83 `plan_aspire.md` valid as baseline; PR #84 extends |
| `telemetry` | Refactor → ready | Extended by PR #84 research | PR #83 `plan_telemetry.md` valid as baseline; PR #84 extends |
| `plugin` | Restructure → ready | **Restructure → Rewrite** | PR #83 `plan_plugin.md` **superseded** by PR #84's rewrite plan |
| `workers` | Restructure → ready | **Restructure → Rewrite** (workers-core split) | PR #83 `plan_workers.md` **superseded** for core split; surface plan still valid |
| `sagas` | Refactor → ready | **Refactor → Rewrite** (sagas-core split) | PR #83 `plan_sagas.md` **superseded** for core split; surface plan still valid |
| `triggers` | Restructure → ready | **Restructure → Rewrite** (triggers-core split) | PR #83 `plan_triggers.md` **superseded** for core split; surface plan still valid |
| `streams` | Refactor-light → ready | **Refactor-light → Rewrite** (streams-core split) | PR #83 `plan_streams.md` **superseded** for core split; surface plan still valid |

## New `-core` Packages (PR #84 only)

PR #84 introduces 4 new packages **not present** in PR #83:

- `@netscript/workers-core`
- `@netscript/sagas-core`
- `@netscript/triggers-core`
- `@netscript/streams-core`

These are **not missing** from PR #83 — they didn't exist when PR #83 ran. PR #84 owns:
- Their evaluate+plan pairs (or equivalent research docs)
- Their adherence to PR #83's quality bar
- Their integration with the existing package+plugin pairs

## Document Conflict Resolution Order

When documents conflict, the authority order is:

1. **Doctrine** (`.llm/research/architecture-doctrine-docs-v2/doctrine/`) — highest authority
2. **PR #83 harmonisation docs** (`harmonisation/STANDARDS.md`, `PUBLIC-SURFACE-PATTERNS.md`, `DOCS-STRUCTURE.md`)
3. **PR #84 decisions/research** (`decisions/2026-05-05-verdict-deltas.md`, `research/cli_plugin_system.md`)
4. **PR #83 per-package plans** (`plan_<pkg>.md`) — superseded where PR #84 indicates
5. **PR #83 evaluate files** (`evaluate_<pkg>.md`) — reference only after PR #84 verdict deltas

## Cross-Links

- PR #83 master plan: [`PLAN.md`](./PLAN.md)
- PR #83 context pack: [`context-pack.md`](./context-pack.md)
- PR #84 verdict deltas: [`decisions/2026-05-05-verdict-deltas.md`](../../feat-plugin-platform-rewrite--phase-0-research-and-design/decisions/2026-05-05-verdict-deltas.md)
- PR #84 plugin system research: [`research/cli_plugin_system.md`](../../feat-plugin-platform-rewrite--phase-0-research-and-design/research/cli_plugin_system.md)
- PR #84 plan: [`plan.md`](../../feat-plugin-platform-rewrite--phase-0-research-and-design/plan.md)

---

*This document bridges PR #83 and PR #84. When in doubt, doctrine > PR #83 harmonisation > PR #84 research > per-package plans.*
