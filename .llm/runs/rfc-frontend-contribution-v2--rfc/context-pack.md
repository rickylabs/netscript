# Context Pack: Unified Frontend Contribution RFC

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `rfc-frontend-contribution-v2--rfc` |
| Branch         | `docs/rfc-frontend-contribution-v2` |
| Current phase  | `plan-eval (Draft PR submission)` |
| Archetype      | `N/A (RFC + empirical Wave-0 probes)` |
| Scope overlays | `docs, frontend` |

## Current State

Unified Fresh-3-ready RFC drafted at [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md), matching `rfcs/0000-template.md`, explicitly superseding PR `#890` seed docs and unifying with accepted `RFC 0005`. All three Wave-0 empirical probes are packaged cleanly under `.llm/runs/rfc-frontend-contribution-v2--rfc/probes/` with zero leftover build directories and re-verified (`Probe A 18/18`, `Probe B 15-cell matrix exit 0`, `Probe C 10/10`). Zero source files in `packages/`, `plugins/`, `apps/`, `examples/`, or `deno.lock` were modified.

## Completed

- Branch `docs/rfc-frontend-contribution-v2` created off `af5107b8d` (`main`).
- Wave-0 probe scripts, fixtures, and fresh `.log` captures staged & re-executed cleanly (`probes/`).
- Live GitHub state verified for `#922`–`#946`, PR `#890`, PR `#2670`, `#1465`, `#1469`–`#1476`, `#400`, `#427`, `#432`, `#1520`–`#1521`, the 6 stray `epic:design-system` issues in milestone `#24`, and `rickylabs/eis-etl` consumer issues.
- `rfcs/0000-frontend-contribution.md` and harness artifacts (`supervisor.md`, `research.md`, `worklog.md`, `context-pack.md`, `drift.md`) authored.

## In Progress

- Running doc link & accuracy validation, committing clean docs-only delta, pushing branch, opening Draft PR targeting `main` (`0.0.10`), and linking PR back to parent coordinator.

## Next Steps

1. Run scheduled adversarial RFC review (`Fable 5.2`, Friday 23:30 UTC after Claude subscription reset) and lock Owner Forks `F-1`–`F-5`.
2. Reconcile GitHub milestone/issue state upon RFC acceptance (move the 6 stray `epic:design-system` issues out of `Frontend Contribution (#24)`, close satisfied Wave-0 `#923`–`#927` and `#1469`–`#1470` after verification, pull `#1473`/`#1474` into `0.0.10` W1).
3. Launch `0.0.10` W1 -> W2 -> W3 (`#940` before `#933`) using Neon builders (`antigravity/gemini-4-neon` `xhigh`) and `Opus 5.5` (`xhigh`) + `Hydrogen` (`xhigh`) PR reviews.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Zero Fresh/Preact/Vite/DOM deps in `@netscript/plugin-frontend-core` (Archetype 1) | Owner requirement & `RFC 0007` | Fresh 2.3.3 isolated in `@netscript/fresh/plugins` + `@netscript/fresh/vite`; Fresh 3.x / GPUIX share pure `middleware -> handler({ data }) -> pure page` + neutral `descriptor` contracts |
| `@layer ns-plugins, ns-app;` prelude | Empirical Probe B `C2` | Fixes inverted `@layer ns-app, ns-plugins;` from PR `#890` |
| Unify with `RFC 0005` spine | Accepted `RFC 0005` | `ContributionIdentity` quartet, `anchors`, 6-state taxonomy, `.passthrough()` (`#1474`), containment (`#1473`) |
| Break `#933` <-> `#940` cycle in `0.0.10` W3 | Dependency analysis | Land `defineFrontendTestSuite` (W3a `#940`) before `plugins/workers` dogfood (W3b `#933`) |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `rfcs/0000-frontend-contribution.md` | `new` | Unified Fresh-3-ready Frontend Contribution RFC |
| `.llm/runs/rfc-frontend-contribution-v2--rfc/{supervisor,research,worklog,context-pack,drift}.md` | `new` | Harness v3 run artifacts |
| `.llm/runs/rfc-frontend-contribution-v2--rfc/probes/*` | `new` | Re-verified Wave-0 Probes A, B, C, fixtures, and fresh `.log` outputs |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | `PASS` | `deno task docs:links`, scoped `check-internal-doc-links.ts`, `deno task docs:accuracy` |
| Fitness | `N/A` | Docs & probe packaging only |
| Runtime | `PASS` | Probe A `18/18` (`exit 0`), Probe B 15 cells (`exit 0`), Probe C `10/10` (`exit 0`) |
| Consumer | `Spec-verified` | `eis-etl#63/#421/#422/#426/#438/#448/#450/#453` + NetScript PR `#2670` captured |

## Open Questions

- Forks `F-1` through `F-5` in [`rfcs/0000-frontend-contribution.md#unresolved-questions`](../../../rfcs/0000-frontend-contribution.md#unresolved-questions).

## Drift and Debt

- Drift: Recorded in [`drift.md`](./drift.md) (PR `#890` seed merged state, `vite.ts:397` foreign-`importer` signals race in `--no-lock` workspace, `Probe A` `--check` `TS2322` on inline helper routes, `sse.ts` unexported, `stable-v1-adapter.ts` metadata strip, owner routing override, live `origin/main` rebase).
- Debt: Zero implementation debt introduced in this docs-only run; RFC specifies remediations for `resolvePluginLocalName`, `resolveTarget`, `AstExtractor`, `stable-v1-adapter.ts`, and `_layout.tsx.template` `<Partial>` ordering.

## Commits

- See the Draft PR's commit list + validation summary on `docs/rfc-frontend-contribution-v2` (V3 retired `commits.md`).
