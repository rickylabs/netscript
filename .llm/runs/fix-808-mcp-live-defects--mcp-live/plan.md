# Plan: fix #808 MCP live-validation blockers

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-808-mcp-live-defects--mcp-live` |
| Branch | `fix/808-mcp-live-defects` |
| Phase | `plan` |
| Target | `packages/mcp`, telemetry infrastructure, and MCP CLI composition |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Archetype

Archetype 6 applies because `@netscript/mcp` ships a stdio tooling engine used by the CLI. The
owner-accepted `MCP-A6-V2-SHAPE` debt entry keeps its horizontal
`domain → application → infrastructure` skeleton: protocol presentation stays thin, flows depend on
ports, and external Dashboard/filesystem/process behavior stays in infrastructure.

## Current Doctrine Verdict

`@netscript/mcp` post-dates the package table in doctrine chapter 10. The specific current verdict
is the open, accepted `MCP-A6-V2-SHAPE` entry: keep the brief-locked horizontal Archetype-6 skeleton
until a real package-owned CLI surface warrants the v2 kernel/vertical migration. This run neither
deepens nor closes that debt.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1/A2 | Tool output schemas and explicit unavailable states are published contracts. |
| A6/A7 | Reuse the telemetry query port and Deno raw imports; do not invent duplicate parsers or runtime asset loaders. |
| A8 | Parsing, flow aggregation, and external adapters retain one reason per file. |
| A10 | The `./cli` composition root selects defaults and overrides without business logic. |
| A13/A14 | False-empty telemetry and self-invalid output are crash-boundary and fitness-function failures. |

## Goal

Make all 13 `@netscript/mcp` tools return contract-valid, semantically truthful results against a
fresh real scaffold, with live-capture telemetry fixtures, a bounded doctor contract, a usable
package-shipped docs default, and retained command-safety regressions.

## Scope

- Normalize the observed Aspire 13.4.6 OTLP envelope at the telemetry infrastructure owner.
- Add an MCP boundary regression driven by a fixture regenerated from the live Dashboard endpoint.
- Aggregate doctor output so it cannot exceed its schema while preserving family evidence.
- Default docs tools to package-shipped embedded documentation; keep explicit filesystem overrides.
- Turn missing explicit docs roots into structured, actionable tool errors.
- Retain live and automated guards for command allow/deny, command catalog, and 13 names.
- Correct the five existing `./cli` private-type references while touching that entrypoint.

## Non-Scope

- No protocol/tool renames, new tools, dependency upgrades, publish, release cut, evaluator dispatch,
  merge, or Archetype-6 folder migration.
- No Dashboard UI changes and no telemetry business aggregation moved into MCP presentation.
- No full 3.5 MB website snapshot embedded in the package; explicit `--docs-root` remains the path
  for a larger/local corpus.

## Hidden Scope

- A live scaffold must remain running long enough to trigger a worker, capture the raw Dashboard
  response, and drive every stdio tool.
- The final one-pass cleanup run is distinct from the no-cleanup capture run.
- The docs error contract needs flow-level handling so missing overrides never degrade to bare zero.
- Run artifacts, per-slice PR comments, and exact push refspec are part of each commit trail.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Fix OTLP envelope/nesting/kind normalization in `packages/telemetry` infrastructure; at the MCP infrastructure edge, load the local ASP.NET Dashboard CA for loopback HTTPS only; prove both through the MCP adapter boundary. | The parser is owned by the reusable telemetry adapter; local certificate discovery is MCP/Aspire edge composition. Duplicating parsing or globally disabling TLS verification would violate doctrine and security. |
| D2 | Preserve the doctor cap; expose one top-level aggregate per family and bound detailed family checks with an explicit overflow summary. | Raising the cap weakens token discipline; pagination would be a breaking input/output contract for a one-shot diagnostic. |
| D3 | Use the package-shipped README as the embedded default corpus; explicit flag/environment roots select the filesystem adapter. | It is always present in the published package, works over JSR via raw text import, and makes list/search/get useful immediately. |
| D4 | A missing explicit filesystem corpus returns `docs_corpus_not_found` naming the path and `--docs-root` remediation. | Empty-by-default is no longer possible; explicit overrides must also fail explicitly rather than silently. |
| D5 | Capture the live response before implementing normalization and keep its envelope, OTLP nesting, casing, and provenance comment in the fixture. | The regression must be coupled to reality rather than another hand-invented shape. |
| D6 | Formal evaluator passes are owner-waived; automated gates and live evidence are recorded without claiming evaluator PASS. | Direct owner constraint: do not dispatch evals. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact set of embedded docs | safe to defer | Package README is the locked minimum; a larger generated corpus can be a later additive change. |
| Support for other Aspire response versions | safe to defer | Preserve existing direct-array compatibility and add only observed 13.4.6 OTLP support now. |
| Doctor pagination | safe to defer | Aggregation satisfies the current one-shot contract without a breaking API. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Live capture contains volatile IDs/timestamps or secrets. | Retain structural fields and representative real spans, redact only volatile identifiers/values, and document provenance. |
| Local Dashboard TLS is made insecure globally. | Never disable verification; load only discovered ASP.NET development PEMs into a custom client and only for loopback HTTPS. |
| Resource attributes are lost while flattening nested spans. | Propagate resource attributes into normalized span attributes only where absent; assert service classification in the MCP flow. |
| Embedded raw asset fails over the publish graph. | Use `with { type: "text" }`, include README in publish dry-run, and run package/consumer checks. |
| Doctor aggregation hides failures. | Compute status/counts over all original checks and add an explicit omitted-count summary with the worst omitted severity. |
| Long live run leaves resources behind. | Use the final canonical `--cleanup` gate and verify Aspire/process state afterward. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2/AP-9 | risk | Do not add a second Dashboard parser in MCP; fix the shared telemetry adapter. |
| AP-11/AP-25 | risk | Filesystem, fetch, env, and stdio remain infrastructure/edge concerns. |
| AP-18 | existing test risk | Assert semantic counts/IDs/tool results against the capture, not a giant output snapshot alone. |
| AP-19 | risk | Preserve documented read/net/run/env permissions for chosen adapters. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-3/F-5/F-10/F-11/F-12/F-15..F-19 | yes | `quality:scan`, `arch:check`, scoped wrappers, doc lint, focused tests, manual structural review. |
| F-6/F-7 | yes | package dry-run and full-export doc-lint; no new slow/private types. |
| F-CLI-1..31 | yes/PENDING_SCRIPT | `arch:check` plus manual evidence; accepted horizontal skeleton debt unchanged. |
| Runtime/Aspire | yes | fresh scaffold, job trigger, raw endpoint capture, all 13 stdio tools PASS. |
| Consumer | yes | CLI composition tests plus final `scaffold.runtime --cleanup`. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `MCP-A6-V2-SHAPE` | none | Do not deepen or close; adapters stay infrastructure-owned. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Live capture | `deno task e2e:cli run scaffold.runtime --format pretty` plus Aspire/curl | Scaffold green; raw 13.4.6 capture saved. |
| 2 | Focused tests | package telemetry query tests + MCP suites + CLI MCP composition tests | All pass, including schema round trips. |
| 3 | Scoped static | three `.llm/tools/run-deno-*` wrappers over touched roots | PASS. |
| 4 | Framework quality | `deno task quality:scan` + `deno task arch:check` | PASS, no suppressions. |
| 5 | JSR | `deno task doc:lint --root packages/mcp --pretty` + package dry-run | Zero real diagnostics; dry-run green. |
| 6 | Live matrix | initialize, tools/list, trigger job, all 13 tools, both execute directions | 13/13 PASS with per-tool evidence. |
| 7 | Final runtime | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS and cleanup. |

## Dependencies

- Aspire CLI/Dashboard 13.4.6 and the canonical scaffold runtime suite.
- Existing `@netscript/telemetry/query` port and adapter; no new dependency.
- Package-shipped `packages/mcp/README.md`; no generated website dependency.

## Drift Watch

- Any live response field incompatible with the report, any required public-contract change, any
  lockfile churn, or any need to alter scaffold output is significant drift and requires rescope.
