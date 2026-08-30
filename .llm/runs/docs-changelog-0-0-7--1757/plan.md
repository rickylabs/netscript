# Plan: provisional CLI changelog for 0.0.7

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-changelog-0-0-7--1757` |
| Branch | `docs/changelog-0-0-7` |
| Phase | `plan` |
| Target | `packages/cli/CHANGELOG.md` |
| Archetype | N/A — docs artifact only |
| Scope overlays | `SCOPE-docs.md` |

## Archetype

No package archetype applies. The only product-tree path is a Markdown changelog, treated as a docs
artifact under `SCOPE-docs.md`; no `packages/` or `plugins/` source may change.

## Current Doctrine Verdict

N/A. This slice neither changes nor describes package architecture.

## Goal

Add a concise, consumer-facing `## 0.0.7` section that accurately summarizes the shipped behavior
on current `main`, with an auditable decision for every commit since `v0.0.6`.

## Scope

- Add only the `## 0.0.7` changelog section.
- Record all 33 commit decisions and reasons in `worklog.md`.
- Prove derived-asset non-applicability from the current generators.
- Run every gate in the slice brief and record real exit codes.
- Commit once, push only with the explicit refspec, and open the requested non-draft PR.

## Non-Scope

- GitHub release introduction, notes file, version bump, release cut, publish, merge, issue closure,
  relabeling issues, other PRs, changelog enforcement gate, or unmerged 0.0.7 work.
- Source changes under `packages/` or `plugins/`; `packages/cli/CHANGELOG.md` is the sole allowed
  product-tree file.
- Agent-docs corpus or publish-asset regeneration because the changelog is not an input.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Include 17 commits and exclude 16 using consumer observability, not commit prefix. | Cycle-1 PLAN-EVAL proved that five commits alter the tool bundle installed by `agent init`; four were false exclusions and `01e09604` was understated. |
| D2 | Group related commits into eleven plain bullets with no hashes, PR numbers, attribution, or intro prose. | The mapping below keeps unrelated behavior separate while combining only changes a consumer experiences as one surface. |
| D3 | State breaking SDK error-channel facts directly in a behavior bullet. | Consumers need the actual tuple/default/thenable changes; omitting them would hide a published API break. |
| D4 | Do not regenerate derived assets. | Both generators exclude the changelog by construction. |
| D5 | Select PLAN-EVAL. | Commit-by-commit editorial triage and grouping are substantive judgment with omission/overclaim risk. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Final bullet wording | resolved now | The locked eleven-row map below is the implementation contract for PLAN-EVAL cycle 2. |
| Additional 0.0.7 work | safe to defer | The PR explicitly says provisional; only merged baseline content is eligible. |
| Changelog enforcement gate | safe to defer | Explicitly out of scope in issue #1757. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A misleading subject causes an omission or internal leak. | Read actual diffs for ambiguous commits; preserve all 33 decisions in the worklog. |
| A bullet overstates partially shipped behavior. | Describe only tested/public surface present at `origin/main`; group only when each clause is traceable. |
| Release-introduction prose leaks into the changelog. | Use plain behavior bullets only and preserve the manual boundary in plan, drift, and PR body. |
| Generated assets are unnecessarily churned. | Cite generator lines and run freshness gates without regeneration. |
| The milestone advances while the slice runs. | Keep the fixed baseline explicit and call the section provisional in the PR. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Changelog contract | Inspect heading/bullets and trace each clause to included commits | PASS |
| 2 | Required docs links | `deno task docs:links` | exit 0 |
| 3 | Required README gate | `deno task docs:readme:check` | exit 0 |
| 4 | Publish asset freshness | `deno task check:publish-assets` | exit 0, no generated diff |
| 5 | Asset barrel freshness | `deno task check:assets-barrel` | exit 0, no generated diff |
| 6 | Agent-docs prose freshness | `deno task check:agent-docs-prose` | exit 0 |
| 7 | Scope/lock boundary | Raw git diff/status and `deno.lock` comparison to baseline | only planned files; lock unchanged |

## Locked Changelog Map

| Bullet | Included commits | Draft wording |
| --- | --- | --- |
| B1 | `f7ad44dc`, `01e09604`, `473e8d75`, `cf648f1f`, `3b32d162`, `13878a80` | `agent init` now installs canonical cross-host skills and project guidance together with an updated tool bundle that writes atomic reports, surfaces silent check failures, audits public API quality, verifies `quality-allow` owners against GitHub (the installed scanner now needs environment and network permissions), honors subtree/config lint exclusions, and fails closed when Deno processes fewer files than selected. |
| B2 | `01e09604` | Generated workspace `check`, `lint`, and `fmt-check` flows accept `--skip-apphost` so project-only quality runs can omit AppHost sources. |
| B3 | `0b3ed5d5` | `plugin auth session list` requires an explicit `--stream-url` instead of assuming the legacy localhost endpoint and explains how to discover the Aspire streams endpoint. |
| B4 | `da574111` | Database scaffolds emit only the selected provider's connection helpers, use generated Prisma clients in seeds, and project missing rows as defined 404 responses. |
| B5 | `6917c656` | Generated design registries include the complete component manifest and collection membership instead of a partial catalog. |
| B6 | `8b1e42f7` | Generated Aspire background registration fails before processor startup when a declared service or plugin reference has no resolvable HTTP endpoint. |
| B7 | `3fc0f2f9`, `3561bb64` | The Prisma MySQL adapter exposes the connected adapter contract and classified connection-error hook, ships an executable Prisma 7/mysql2 example, stops root-exporting the legacy `DenoMySqlClient`, `DenoMySqlConnection`, and `ExecuteResult` types, narrows result column types, and deprecates the misleading `verify_identity` TLS selector without changing its legacy runtime behavior. |
| B8 | `baf1cdf6` | AI MCP pools isolate per-server startup/stop failures, expose synchronous per-server status and ready clients, and propagate cancellation through resource reads, registration discovery, and shutdown. |
| B9 | `21d51622` | AI requests can carry application context into tool handlers without forwarding it to providers, and request cancellation now reaches tool dispatch. |
| B10 | `3e8e146a`, `0ef48c2e` | SDK cache queries return fetched data when persistence fails, bound telemetry namespace cardinality, retain incomplete-topology evidence, honor fresh cached entries under stale-only refresh policy, and deduplicate background refresh persistence. |
| B11 | `c73d361e` | SDK service clients preserve exact contract errors through `safe()` and `isDefinedError`; failures now carry `undefined` rather than `null`, `SafeFailure` splits into literal defined and non-defined arms, default `TError` changes from `unknown` to `Error`, `safe()` no longer accepts non-Promise thenables, and `baseContract` rejects error codes outside its six declared literals (`NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, and `SERVICE_UNAVAILABLE`). |

## Deferred Scope

- Top up the provisional section after the remaining 0.0.7 PRs merge.
- Add a separate changelog freshness gate in its own issue/slice.

## Drift Watch

- Any movement of `origin/main`, any generator that reads the changelog, or any required source or
  generated-asset edit is significant drift and requires plan reconciliation before proceeding.
