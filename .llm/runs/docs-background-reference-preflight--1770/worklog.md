# Worklog: background-reference startup preflight documentation

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `docs-background-reference-preflight--1770` |
| Branch | `docs/background-reference-preflight` |
| Archetype | `N/A — docs-only` |
| Scope overlays | `SCOPE-docs.md` |

## Design

### Public Surface

- Existing page `/orchestration-runtime/how-to/deploy-local-aspire/` gains one startup
  troubleshooting entry; no new route or navigation item is introduced.

### Domain Vocabulary

- **Declared background reference** — required service/plugin configuration attached to a
  background processor.
- **Reference preflight** — endpoint resolution performed before processor registration.
- **HTTP endpoint** — the named `http` endpoint required from the referenced Aspire resource.

### Ports

- Source template → public documentation: technical claims and message strings are consumed from
  `generate-register-background.ts`.
- Public documentation → generated publication assets: site build and checked-in generator chain.

### Constants

- Two source-owned message shapes: `service reference` and `plugin reference`.
- Two source-owned fatal causes: resource missing, or resource has no `http` endpoint.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| S1 | Document the fail-fast preflight at the AppHost startup troubleshooting point and record run decisions/evidence. | Source-format/build/link/accuracy/snippet/export gates plus exact-message grep/review. | `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md`; `.llm/runs/docs-background-reference-preflight--1770/**` |
| S2 | Regenerate the complete site-derived agent-docs and publish-asset chain with S1 provenance. | `check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets`, `check:mcp-export-corpus`, targeted `deno check`. | `.llm/assets/agent-docs/prose.json.gz`; `.llm/assets/agent-docs/provenance.json`; `packages/cli/src/kernel/assets/agent-docs.generated.ts`; `packages/mcp/src/publish-assets.generated.ts` |

### Deferred Scope

- Error/runtime changes, new pages, changelog work, and Aspire-version guidance are intentionally
  excluded by issue #1770.

### Contributor Path

Future Aspire startup errors belong beside the failing `aspire start` step on this existing runbook;
technical wording should be re-verified against its owning generator before editing prose.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| ---------- | ----- | ---- | ----- |
| 2026-08-30 | Plan | Research | Re-baselined branch, issue, source template, placement candidates, and generator chain at `3e5cbabf`. |
| 2026-08-30 | Plan | Plan-Gate | Fresh native Fable 5 medium session `017op5BRKMFMRHGH3TRdnBM3` returned `PASS`; implementation was held until the verdict. |
| 2026-08-30 | Baseline | README standard | Clean detached `origin/main` at `3e5cbabf` reproduced `docs:readme:check` exit 1: only `packages/bench/README.md` lacks `## Install`. |
| 2026-08-30 | S1 | Implement | Added one startup-footgun entry covering both exact message templates, pre-registration timing, and both fatal configuration causes. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Use the local Aspire runbook | Reader encounters the error while `aspire start` is booting the AppHost. | `plan.md` D1; candidate page review |
| Quote two templated messages | Service and plugin branches are parallel but distinct source strings. | `generate-register-background.ts` |
| Explain both fatal causes | Both resolve to a missing `http` endpoint and are equally fatal required configuration. | source comment and optional-chaining branches |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| None observed through S1 implementation. | N/A | yes |

## Gate Results

### S1 source gates

| Command | Exit | Result |
| ------- | ---- | ------ |
| `deno task --cwd docs/site check:source-format` | 0 | PASS |
| `deno task --cwd docs/site build` | 0 | PASS; 639 files generated and rendered-output check passed |
| `deno task --cwd docs/site check:links` | 0 | PASS; 35,344 internal links across 227 pages resolve |
| `deno task --cwd docs/site check:caveats` | 0 | PASS; 18 caveat markers resolve |
| `deno task docs:links` | 0 | PASS; no broken links or anchors |
| `deno task docs:accuracy` | 0 | PASS |
| `deno task docs:snippets` | 0 | PASS; 581 snippets scanned |
| `deno task docs:exports-drift` | 0 | PASS |
| `git grep -c "background reference" -- docs/site` | 0 | PASS; count `1` on the selected page |

The independent S1 `review_codex` session also reran `docs:accuracy` and `docs:links` with exit 0
and returned PASS, with no technical or prose findings. The clean-baseline `docs:readme:check`
result is recorded above. Final S2 gates will be reported with real exit codes in the PR acceptance
evidence; S2 must remain derived-assets only, so no post-S1 evidence edit will be folded into that
commit.

## Handoff Notes

- PLAN-EVAL should first inspect D1–D4 against the template and the two candidate documentation
  surfaces, then confirm the derived chain and two-commit provenance ordering.
