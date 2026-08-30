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

- **Declared background reference** — required service/plugin configuration for a background
  processor whose registration block is not explicitly disabled.
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
| S3 | Narrow the preflight claim to processors that are not explicitly disabled and reconcile the formal evaluation/run history. | Source-format/build/link/accuracy/snippet/export gates plus source review. | `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md`; `.llm/runs/docs-background-reference-preflight--1770/**` |
| S4 | Regenerate the complete derived chain with S3 as provenance. | Asset drift checks and targeted `deno check`. | The same four generator-owned derived assets as S2. |
| S5 | Record repaired-head gate evidence and the supervisor handoff without changing prose or generated assets. | Raw git/status/lock/provenance verification. | `worklog.md`; `context-pack.md`; `evaluate.md` |

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
| 2026-08-30 | Formal IMPL-EVAL | Evaluate | Supervisor-dispatched evaluation at `d5ba40eb` returned `FAIL_FIX`: B1 found the unqualified universal claim despite the enclosing `Enabled !== false` guard; B2 found the PR body presented an implementation-lane internal review as the formal verdict. |
| 2026-08-30 | S3 | Repair | Verified the guard directly, narrowed every repeated claim, retained the exact message templates, reconciled the run history, and prepared a fresh derived-only regeneration. |
| 2026-08-30 | S4 | Regenerate | Regenerated all four publication assets from S3 `e4f47289b`; derived-only commit `14d5aefd` records `sourceCommit: e4f47289b`. |
| 2026-08-30 | S5 | Gate evidence | Re-ran the complete 13-command gate list at `14d5aefd`; every command exited 0. Reproduced the clean-main README baseline red and prepared the supervisor handoff. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Use the local Aspire runbook | Reader encounters the error while `aspire start` is booting the AppHost. | `plan.md` D1; candidate page review |
| Quote two templated messages | Service and plugin branches are parallel but distinct source strings. | `generate-register-background.ts` |
| Explain both fatal causes | For a processor that is not explicitly disabled, both resolve to a missing `http` endpoint and are equally fatal required configuration. | enclosing `Enabled !== false` guard, source comment, and optional-chaining branches |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| The original claim was unconditional, but the generator preflights only inside the `Enabled !== false` block. External Augment review caught the same conditional-as-universal defect class as the earlier permission-wording defect. | Corrected | yes |

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

### S3 conditionality repair source gates

| Command | Exit | Result |
| ------- | ---- | ------ |
| `deno task --cwd docs/site check:source-format` | 0 | PASS |
| `deno task --cwd docs/site build` | 0 | PASS |
| `deno task --cwd docs/site check:links` | 0 | PASS |
| `deno task --cwd docs/site check:caveats` | 0 | PASS |
| `deno task docs:links` | 0 | PASS |
| `deno task docs:accuracy` | 0 | PASS |
| `deno task docs:snippets` | 0 | PASS |
| `deno task docs:exports-drift` | 0 | PASS |
| `git grep -c "background reference" -- docs/site` | 0 | PASS; count `1` |

`git diff --word-diff=porcelain d5ba40eb -- deploy-local-aspire.md` confirms the repair changes
only the conditionality clause; both quoted message templates remain unchanged.

### S4 repaired asset-head gates

| Command | Exit | Result |
| ------- | ---- | ------ |
| `deno task --cwd docs/site check:source-format` | 0 | PASS |
| `deno task --cwd docs/site build` | 0 | PASS |
| `deno task --cwd docs/site check:links` | 0 | PASS |
| `deno task --cwd docs/site check:caveats` | 0 | PASS |
| `deno task docs:links` | 0 | PASS |
| `deno task docs:accuracy` | 0 | PASS |
| `deno task docs:snippets` | 0 | PASS |
| `deno task docs:exports-drift` | 0 | PASS |
| `deno task check:agent-docs-prose` | 0 | PASS |
| `deno task check:assets-barrel` | 0 | PASS |
| `deno task check:publish-assets` | 0 | PASS |
| `deno task check:mcp-export-corpus` | 0 | PASS |
| `deno check --unstable-kv packages/cli/src/kernel/assets/agent-docs.generated.ts packages/mcp/src/publish-assets.generated.ts` | 0 | PASS |

Additional evidence:

- Clean detached `origin/main` at `3e5cbabf`: `deno task docs:readme:check` exited 1 solely because
  `packages/bench/README.md` is missing `## Install`; this reproduces the pre-existing baseline.
- `git status --porcelain` after generation and all gates: empty.
- `deno.lock` remains identical to `origin/main`, blob
  `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2`.
- `git diff --name-only origin/main...HEAD -- '*.mmd' '*.svg'`: empty, so `diagrams:check` is N/A;
  Chromium is also unavailable in this environment.
- S4 `14d5aefd9ad40f584e63eab905278be460be7b01` contains exactly the four generated assets, and
  `provenance.json.sourceCommit` is the immediately preceding S3 commit `e4f47289b`.

## Handoff Notes

- Fresh supervisor-dispatched IMPL-EVAL should verify the `Enabled !== false` qualifier across the
  page and run artifacts, confirm the exact message templates did not change, and rerun the full
  derived-chain gate set at the repaired pushed head.
