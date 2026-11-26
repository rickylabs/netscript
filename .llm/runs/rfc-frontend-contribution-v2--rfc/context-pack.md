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

Unified Fresh-2-anchored / Fresh-3-&-GPUIX-portable RFC updated at [`rfcs/0000-frontend-contribution.md`](../../../rfcs/0000-frontend-contribution.md) after GPT-6.2 Astra Pass-1 adversarial review (`CHANGES_REQUESTED` on `d05d2346`, verbatim in [`plan-eval.md`](./plan-eval.md) and triaged in [`astra-review-triage.md`](./astra-review-triage.md)). All `B1`–`B8`, `M1`–`M6`, `N1`–`N3`, and `F-1`–`F-5` findings are integrated, all three Wave-0 empirical probes are updated & verified cleanly with zero leftover build directories (`Probe A 19/19 PASS` runtime + `portable-jobs-loader.ts`/`fresh-jobs-adapter.tsx` `--check exit=0`, `Probe B 19 rows: 11 PASS, 5 CAVEAT, 3 FAIL` exit `0`, `Probe C 13/13 PASS` `--check exit=0`), and zero source files under `packages/`, `plugins/`, `apps/`, `examples/`, or `deno.lock` were modified.

## Completed

- Draft PR `#2684` synced & re-derived cleanly with live `origin/main` (`906da5188`, merged `#2670`) inspected read-only via `git show` (zero rebase, preserving fast-forward push).
- GPT-6.2 Astra Pass-1 review saved verbatim in [`plan-eval.md`](./plan-eval.md) and fully triaged in [`astra-review-triage.md`](./astra-review-triage.md).
- Probe A (`P2d` framework-free loader + GPUIX/Fresh 2 execution, dynamic `P4e` `preact-render-to-string@6.8.3`, visible `--check`) & Probe C (canonical RFC 0005 spine + 2 installations, host-owned failure policy, root-anchored containment above `.netscript/generated/`, real `workersContract` authz, W2 HTTP-only gateway separation, presence-only Fresh island redaction without SHA-256 digests + verbatim `#2670` write protocol) fixed and verified cleanly; Probe B re-run cleanly (`19` matrix rows, exit `0`).
- `rfcs/0000-frontend-contribution.md` and run artifacts (`supervisor.md`, `research.md`, `worklog.md`, `context-pack.md`, `drift.md`) updated.

## In Progress

- Running doc link & accuracy checks (`docs:links`, scoped `check-internal-doc-links.ts`, `docs:accuracy`), committing docs-only integration delta, fast-forward pushing onto Draft PR `#2684`, and reporting back.

## Next Steps

1. Run Pass-2 verification review on Gemini 4 `Hydrogen` (`xhigh`) against [`plan-eval.md`](./plan-eval.md) + [`astra-review-triage.md`](./astra-review-triage.md) and obtain owner sign-off on Forks `F-1`–`F-5` (`F-4` HTTP-only W2 default).
2. On explicit owner triage/milestone reconciliation (NOT auto-triggered by RFC acceptance per `B8`), reconcile the 6 non-`#922` issues (`F-5`) and track partial `#923`–`#927`, `#1469`, `#1470` until their W2 / staging / 2-route-root product gates pass.
3. Launch `0.0.10` W1 (`#1474`, `#1473`, RFC 0005-aligned contracts, `.withFrontend`) -> W2 (separate `app`/`devtools` emitters, `@netscript/fresh/plugins`, templates, HTTP-only P5 gateway) -> W3a (`#940` independent fixture + failing-budget control) -> W3b (`#933` Workers dogfood completing `#940` CI receipt + `#939` resource add `--app`) using Neon builders (`antigravity/gemini-4-neon` `xhigh`) + `Opus 5.5` (`xhigh`) / `Hydrogen` (`xhigh`) PR reviews.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Zero Fresh/Preact/Vite/DOM deps in `@netscript/plugin-frontend-core` (Archetype 1) + separated `./loaders/...` | Owner requirement, `B7`, & `RFC 0007` | Fresh 2.3.3 isolated in `@netscript/fresh/plugins` + `@netscript/fresh/vite`; Fresh 3.x is explicitly an unexercised migration target; `./loaders/...` proven across Fresh 2 & GPUIX `RouteModule` |
| Preserve canonical `RFC 0005` spine wire schema (`F-1` / `F-2` defaults) | Accepted `RFC 0005`, `B1`, `B2` | `FamilyRef = { family, major }`, `ContributionEnvelope`, host-assigned `ContributionIdentity`, `{ export: './frontend', framework: 'fresh' }` pointer, `anchors[]`, `(order ?? 0, mountId, id)`, 6-state taxonomy, host-owned policy |
| Presence-only redaction + `#2670` write protocol + HTTP-only W2 P5 gateway | `B3`, `B4`, `B5`, `M4`, `F-4` | Zero browser SHA-256 digests; recursive schema traversal (`z.array`/`z.record`/overlay); real `workersContract` `(principal, resource)` grants; unary HTTP-only W2 |
| `@layer ns-plugins, ns-app;` prelude + package-owned route CSS | Probe B `C2` & `M5` | Fixes inverted `@layer ns-app, ns-plugins;` from PR `#890` |
| Break `#933` <-> `#940` cycle & forbid closing Wave-0 issues on RFC acceptance | `B8` | W3a `#940` uses an independent fixture + failing-budget control and closes on W3b `#933` Workers CI green |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `rfcs/0000-frontend-contribution.md` | `new` | Unified Frontend Contribution RFC (`rfc: 0000`, `status: Draft`, Pass-1 findings integrated) |
| `.llm/runs/rfc-frontend-contribution-v2--rfc/{supervisor,research,worklog,context-pack,drift,plan-eval,astra-review-triage}.md` | `new` | Harness v3 run artifacts, verbatim Astra Pass-1 review, & per-finding triage |
| `.llm/runs/rfc-frontend-contribution-v2--rfc/probes/*` | `new` | Updated Wave-0 Probes A, B, C, separated `portable-jobs-loader.ts`/`fresh-jobs-adapter.tsx`, and fresh `.log` outputs |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | `PASS` | `deno task docs:links`, scoped `check-internal-doc-links.ts`, `deno task docs:accuracy` |
| Fitness | `N/A` | Docs & probe packaging only |
| Runtime | `PASS` | Probe A `19/19` runtime (`exit 0`, loader/adapter `--check exit=0`, harness `--check exit=1` visible), Probe B `19` rows (`11 PASS, 5 CAVEAT, 3 FAIL`, `exit 0`), Probe C `13/13` (`--check exit=0`) |
| Consumer | `Spec-verified + redaction probed` | `eis-etl#63/#421/#422/#426/#438/#448/#450/#453` + merged `#2670` (`resolveSecretFieldSubmission`) verified in RFC & Probe C `3.1`–`3.2` |

## Open Questions

- Forks `F-1` through `F-5` in [`rfcs/0000-frontend-contribution.md#unresolved-questions`](../../../rfcs/0000-frontend-contribution.md#unresolved-questions).

## Drift and Debt

- Drift: Recorded in [`drift.md`](./drift.md) (PR `#890` seed merged state, `vite.ts:397` foreign-`importer` signals race in `--no-lock` workspace, `Probe A` `--check` `TS2322` on inline helper routes, `sse.ts` unexported, `stable-v1-adapter.ts` metadata strip, owner routing override, live `origin/main` rebase).
- Debt: Zero implementation debt introduced in this docs-only run; RFC specifies remediations for `resolvePluginLocalName`, `resolveTarget`, `AstExtractor`, `stable-v1-adapter.ts`, and `_layout.tsx.template` `<Partial>` ordering.

## Commits

- See the Draft PR's commit list + validation summary on `docs/rfc-frontend-contribution-v2` (V3 retired `commits.md`).
