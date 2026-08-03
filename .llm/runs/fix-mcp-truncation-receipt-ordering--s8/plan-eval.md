# PLAN-EVAL — fix-mcp-truncation-receipt-ordering--s8

- Plan evaluator session: Claude Code + OpenRouter / qwen3.7-max, 2026-08-03
- Run: `fix-mcp-truncation-receipt-ordering--s8`
- Surface / archetype: `packages/mcp` / Archetype 2 — Integration (RFC #1123 S-20)
- Scope overlays: none

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` exists; re-baselined against `main @ fb75cf6fc`; 6 findings each with verification path; spot-checked F-1 (truncation.ts:22-23 caps arrays without `truncated` flag) and F-3 (cli.ts:175-209 `withReceipt` writes receipt before runner output validation at mcp-server.ts:104-112) — both confirmed against tree. |
| Decisions locked                        | PASS   | Plan §Locked Decisions D1–D5 each state decision + rationale. D1 (internal lifecycle callback) keeps persistence at CLI composition without changing `ToolFlow`/options. D2 (settle failure for all failure modes, success only after validated bounding) addresses F-3/F-4 root cause. D3 (recursive mutation metadata) solves the `{ rows: 75, truncated: false }` impossibility. D4 (fixed internal byte ceiling; reject rather than delete) enforces bound without schema damage. D5 (two semantic slices after bootstrap) keeps each close-gated behavior independently reviewable. |
| Open-decision sweep                     | PASS   | Plan §Open-Decision Sweep lists 3 items: publicly configurable byte ceiling (safe to defer — fixed internal ceiling suffices; public option = export drift), generic `count` recomputation (safe to defer — only explicit `truncated` metadata is safe), MCP v2-shape migration (safe to defer — adjacent debt `MCP-A6-V2-SHAPE` owned elsewhere). None would force rework if deferred. Evaluator-run sweep found no additional open decisions. |
| Commit slices (< 30, gate + files each) | PASS   | 2 slices (worklog Design §Commit Slices). Slice 1: receipt-after-validation lifecycle + failed-attempt fixture; gate: targeted `drift-evidence_test.ts` + `doctor_test.ts`; files: `cli.ts`, `mcp-server.ts`, one internal runner lifecycle file, receipt tests, run artifacts. Slice 2: honest truncation metadata + byte ceiling; gate: targeted `truncation_test.ts` + runner/package tests; files: `truncation.ts`, `mcp-server.ts` if error mapping needed, truncation tests, run artifacts. Both < 30, each names gate and files. |
| Risk register                           | PASS   | Plan §Risk Register lists 5 risks with mitigations: evidence callback failure masking tool result (preserve warning-only behavior + fixture), receipt settling before bound failure (bound+revalidate first, settle success last), byte enforcement breaking schemas (never delete object properties — bounded runner error instead), generic metadata rewrite (only rewrite `truncated` key with boolean value), lock/export churn (verify raw diff per slice; stop on `deno.lock`/`deno.json`/`mod.ts`/exported-type movement). |
| Gate set selected                       | PASS   | Plan §Fitness Gates covers the full Archetype-2 column: F-1..F-5 via `quality:gate` + scoped wrappers, F-6/F-7 via baseline doc-lint + conditional publish dry-run, F-8..F-12 via `quality:gate` + scoped lint/check/fmt + targeted fixtures, F-14..F-19 via `quality:gate` + manual diff audit + wrapper-sourced results. Runtime/consumer: targeted runner/receipt/truncation tests; consumer import gate N/A (exports unchanged). Archetype-2 fitness gate column fully addressed per `archetype-gate-matrix.md`. Static gates, runtime (optional for A2 — targeted fixtures suffice, no external backend), and consumer (optional for A2 — locked surface) gates correctly scoped. |
| Deferred scope explicit                 | PASS   | Plan §Non-Scope names 5 categories: MCP v2 folder/registration shapes + `MCP-A6-V2-SHAPE` debt, OpenAPI introspection tools, evidence-class receipt keys (S-16), receipt acceptance (#1136), public export-map/symbol changes/lockfile/CLI scaffold E2E/package restructuring. Worklog Design §Deferred Scope mirrors. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` §jsr-audit surface scan: scanned `deno.json`, `mod.ts`, `cli.ts`, full 2-entrypoint `doc:lint` result. Current metadata complete (scoped name, version, description, license, exports, publish include/exclude, ESM entrypoints). Doc-lint baseline: 0 diagnostics. Planned surface risk: **none** — fix adds no export-map entry, changes no symbol re-exported by `mod.ts` or `cli.ts`. Conditional contract: if implementation forces an exported type/signature change → stop, log drift, add scoped doc-lint + publish dry-run evidence. Validation plan step 9 codifies this: `deno task doc:lint` always runs; publish dry-run runs only if exported surface changes. |

## Open-decision sweep (evaluator-run)

None. The three plan-listed deferred decisions are correctly classified:

1. **Publicly configurable byte ceiling** — deferring avoids export drift; the internal fixed ceiling satisfies this correctness slice. No rework.
2. **Generic `count` recomputation** — only explicit `truncated` metadata is safe to mutate generically; existing `count` fields have different per-domain semantics. Correct deferral.
3. **MCP v2-shape migration** — adjacent `MCP-A6-V2-SHAPE` debt has its own owner (#721/S7), target, and gate. Touching it would rescope this PR.

No additional open decisions found that would force rework if deferred.

## Archetype-2 full-column verification

The plan correctly applies the **complete** Archetype-2 gate column from `archetype-gate-matrix.md`:

- **Fitness gates F-1..F-12**: all required for A2, all addressed via `quality:gate`, scoped wrappers, and targeted fixtures. F-13 is `n/a` for A2 (saga invariants).
- **Fitness gates F-14..F-19**: all required for A2, all addressed via `quality:gate`, manual diff audit, and wrapper-sourced results.
- **Static gates**: required for A2, addressed via scoped check/lint/fmt/doc-lint and prohibited-pattern diff scan (validation steps 4-8).
- **Runtime/Aspire validation**: `optional` for A2; plan correctly scopes to targeted MCP fixtures without requiring an external backend.
- **Consumer import validation**: `required` for A2; plan correctly classifies as N/A because exports remain unchanged — and provides the escalation trigger (stop if surface moves).

## MCP-A6-V2-SHAPE debt interaction

The adjacent `MCP-A6-V2-SHAPE` debt (arch-debt.md line 2096) classifies the broader MCP package shape as a horizontal Archetype-6 skeleton deviation, owned by epic #721 / S7 CLI integration slice. This PR's Archetype-2 classification is RFC-locked (S-20) for the runner/evidence seam and does not touch folder structure, tool registration, or command tree shapes. The plan correctly states "none" for debt action and "no folder/tool-registration restructure" in the arch-debt implications table. This PR neither closes nor deepens the debt entry.

## Conditional doc-lint / publish contract

The plan's F-6/F-7 evidence contract is sound:
- Baseline `deno task doc:lint --root packages/mcp --pretty` runs unconditionally (validation step 9, already evidenced as PASS in worklog §Static Gates).
- Publish dry-run (`deno task publish:dry-run` scoped to `packages/mcp`) is mandatory **only if** export drift occurs per the slice contract.
- The research.md surface scan and the plan's locked decisions both confirm no export drift is planned.
- If implementation forces an exported type/signature change, the plan mandates: stop, log significant drift, add scoped doc-lint + publish dry-run evidence before proceeding.

This conditional approach is appropriate for a correctness fix that explicitly does not change the public surface.

## Verdict

`PASS`

## Implementation authorization

Implementation may begin. Two commit slices are authorized:

1. **Slice 1** — Receipt-after-validation lifecycle and failed-attempt fixture (cli.ts, mcp-server.ts, internal runner lifecycle file, receipt tests).
2. **Slice 2** — Honest truncation metadata and whole-result byte ceiling (truncation.ts, mcp-server.ts if error mapping needed, truncation tests).

Implementation must honor the locked decisions D1–D5, the no-export-drift constraint, and the conditional publish dry-run trigger. Any exported surface change stops the slice and triggers drift logging + full F-6/F-7 evidence before proceeding.

## Notes

- The plan's "Hidden Scope" section correctly identifies the settlement ordering hazard (receipt must settle after **both** schema validation and central bounding) — this is the core correctness fix and the most implementation-sensitive element.
- The D3 recursive truncation metadata propagation (flip every ancestor `truncated` boolean when a descendant is capped) is the most novel mechanism; the plan's risk register correctly guards against generic metadata rewrites touching unrelated booleans.
- The D4 "reject rather than delete" byte ceiling policy is architecturally sound — it preserves advertised schemas and avoids a public `TruncationPolicy` change.
