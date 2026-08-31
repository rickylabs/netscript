# Plan: recognize plugin-ai-core exports documentation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-plugin-ai-core-exports-heading--1795` |
| Branch | `docs/plugin-ai-core-exports-heading` |
| Phase | `plan` |
| Target | docs/tooling |
| Archetype | N/A — no package implementation changes |
| Scope overlays | docs |

## Archetype and Doctrine

The page describes an Archetype 1 contract package, but this slice changes only documentation and its drift checker. Doctrine A1/A14 apply: the published surface must be accurately mapped and mechanically checked. No architecture debt is created or deepened.

## Goal and Scope

- Rename only the existing export-table heading to `## Exports`.
- Adopt `plugin-ai-core` into `AUTHORITATIVE_MAPPING` with evidence-based symbol coverage.
- Regenerate the three derived corpus layers in the prescribed order.
- Run every assignment gate and report its real exit code.

## Non-Scope

- Package source changes, symbol-table expansion, and the other #1777 packages.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Use `entrypoints-only`. | Five real `contracts/v1` exports are absent from the dedicated page tables; naming them is honest and evidence-checkable. |
| D2 | Preserve the export rows and all other page content byte-for-byte. | The heading alone causes the entrypoint false negative. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Symbol coverage mode | resolved now | `entrypoints-only`, with the five exact omissions in the reason. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Derived corpus drift | Run generators in the required order, then all derived checks. |
| Lock churn | Compare `deno.lock` to `origin/main`; never commit incidental churn. |
| Stale provenance | Verify `sourceCommit` is an ancestor of final `HEAD`. |

## Validation Plan

Run all commands listed in issue #1795, including exact final status, lock, and provenance checks.

## PLAN-EVAL

`PLAN-EVAL: N/A` — this is a mechanical single-package docs adoption; the sole judgment is resolved directly by reproducible export-set evidence.
