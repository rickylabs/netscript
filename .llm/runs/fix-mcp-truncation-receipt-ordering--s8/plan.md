# Plan: OMB S8 existing-machinery correctness fixes (#1134)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-mcp-truncation-receipt-ordering--s8` |
| Branch | `fix/mcp-truncation-receipt-ordering` |
| Phase | `plan` |
| Target | `packages/mcp` |
| Archetype | `2 - Integration` (RFC S-20 authority for this wave) |
| Scope overlays | `none` |

## Archetype

Archetype 2 is locked by RFC #1123 S-20: MCP tools are bounded flows at external telemetry,
filesystem, process, and protocol boundaries. This slice changes only the existing runner policy
and evidence-persistence seam. It adds no runtime lifecycle, command tree, port, adapter, or plugin.
The full Archetype-2 gate column applies even though the adjacent historical debt classifies the
broader MCP package shape differently.

## Current Doctrine Verdict

The old doctrine census predates `@netscript/mcp` and has no package row. The persistent registry
contains `MCP-A6-V2-SHAPE`, an accepted horizontal-shape debt. This PR neither closes nor deepens it;
the RFC's slice-specific Archetype-2 gate classification governs validation.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1/A2 | Preserve the published MCP result and evidence contracts; no export drift. |
| A6/A8 | One named internal receipt-lifecycle seam; no generic helper or package restructure. |
| A10 | Evidence persistence remains wired at the CLI composition edge. |
| A13/A14 | Thrown/invalid results become explicit failed attempts and fixtures preserve the rule. |

## Goal

Make central truncation honest and make diagnostic receipts reflect only completely validated,
bounded tool attempts, satisfying both close-gated fixtures in #1134.

## Scope

- Propagate central truncation into existing `truncated` metadata.
- Enforce a fixed UTF-8 serialized-result byte ceiling without changing public policy types.
- Move receipt settlement to the runner lifecycle after output validation and bounding.
- Record failed receipts for flow failures, throws, validation failures, and bound failures.
- Add focused fixtures for invalid output and 75-row truncation metadata.

## Non-Scope

- MCP v2 folder/registration shapes and `MCP-A6-V2-SHAPE` debt.
- OpenAPI introspection tools, evidence-class receipt keys (S-16), and receipt acceptance (#1136).
- Public export-map or symbol changes, lockfile updates, CLI scaffold E2E, package restructuring.

## Hidden Scope

- The receipt must settle after both schema validation and central bounding; otherwise an oversized
  result could recreate S-15 with a green receipt followed by a runner error.
- The bounded value is revalidated before success settlement so central policy cannot make the
  advertised output contract false.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Add an internal flow-receipt lifecycle marker/callback shared by `cli.ts` and the runner. | Keeps persistence at composition, validation in the runner, and public `ToolFlow`/options unchanged. |
| D2 | Settle failure for flow-returned errors, throws, invalid output, and byte-limit failure; settle success only after validated bounding. | Prevents green and stale-green evidence for incomplete attempts. |
| D3 | Recursion returns mutation metadata and flips every existing ancestor `truncated` boolean when a descendant is capped. | Makes `{ rows: 75, truncated: false }` impossible after a 50-row central cap without inventing schema fields. |
| D4 | Use an internal fixed UTF-8 serialized-result ceiling; reject still-oversized results instead of deleting object properties. | Enforces the bound while preserving advertised schemas and avoiding a public `TruncationPolicy` change. |
| D5 | Keep the two semantic changes as separate implementation slices after one plan/bootstrap commit. | Each close-gated behavior remains independently reviewable and evidenced. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Publicly configurable byte ceiling | safe to defer | A fixed internal ceiling satisfies this correctness slice; a public option would be export drift. |
| Generic `count` recomputation | safe to defer | Existing `count` fields have different meanings; only explicit `truncated` metadata is safe to mutate generically. |
| MCP v2-shape migration | safe to defer | Explicit adjacent debt owned elsewhere; touching it would rescope this PR. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Evidence callback failure masks the tool result | Preserve existing warning-only behavior in the CLI callback and fixture it. |
| Receipt settles before a later bound failure | Bound and revalidate first; settle success last. |
| Byte enforcement breaks valid schemas by deleting keys | Never delete object properties for the byte ceiling; return a bounded runner error instead. |
| Generic metadata rewrite changes unrelated booleans | Only rewrite properties whose exact key is `truncated` and whose value is boolean. |
| Lock or export churn enters the slice | Verify raw git diff/status per slice; stop on `deno.lock`, `deno.json`, `mod.ts`, or exported-type movement. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | risk | Keep new internal lifecycle module and fixtures focused and below size gates. |
| AP-8/AP-9 | risk | Use one concrete callback seam; no container, port, registry, or configurable strategy. |
| AP-11 | risk | No mutable module-global recorder map; attach lifecycle data to the wrapped flow. |
| AP-13/AP-25 | risk | Filesystem writes stay in CLI composition; runner invokes only an injected callback. |
| AP-16/AP-22 | risk | Use existing role folders and no new barrel. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1..F-5 | yes | `quality:gate`, scoped wrappers, source review, unchanged public exports |
| F-6/F-7 | yes | Baseline full-export doc-lint is green; publish dry-run becomes mandatory only if export drift occurs per slice contract |
| F-8..F-12 | yes | `quality:gate` plus scoped lint/check/fmt and targeted fixtures |
| F-14..F-19 | yes | `quality:gate`, manual diff audit, wrapper-sourced results |
| Runtime/consumer | touched | Targeted runner/receipt/truncation tests; no consumer import gate because exports remain unchanged |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `MCP-A6-V2-SHAPE` | none | Adjacent and untouched; no folder/tool-registration restructure. |
| New debt | none expected | Any required public surface or package-shape movement triggers drift/rescope, not silent debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | receipt fixture | `deno test --allow-env --allow-net --allow-run --allow-read packages/mcp/tests/drift-evidence_test.ts packages/mcp/tests/doctor_test.ts` | invalid/throwing output writes exit 1; ordinary receipt behavior remains green |
| 2 | truncation fixture | `deno test packages/mcp/tests/truncation_test.ts` | 75 rows cap to 50 with `truncated: true`; byte ceiling enforced |
| 3 | package tests | `deno test --allow-env --allow-net --allow-run --allow-read packages/mcp/tests/` | all MCP fixtures pass |
| 4 | scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/mcp --ext ts,tsx` | PASS |
| 5 | scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/mcp --ext ts,tsx` | PASS |
| 6 | scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/mcp --ext ts,tsx` | PASS |
| 7 | framework law | `deno task quality:gate` | quality scan + architecture check PASS |
| 8 | prohibited-pattern audit | diff scan for `deno-lint-ignore`, `as unknown as`, `@ts-ignore`, and `deno.lock` | no additions/churn |
| 9 | conditional JSR | `deno task doc:lint --root packages/mcp --pretty` and package publish dry-run | run only if exported surface changes; otherwise baseline doc-lint + unchanged-surface evidence |

## Dependencies

- Hard-blocks #1136 and #1132 semantics; no implementation dependency within this branch.

## Drift Watch

- Exported types/options, output schema changes, byte-policy configurability, MCP folder shape,
  receipt-key semantics, and any lockfile mutation.
