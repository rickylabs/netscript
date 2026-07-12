# PLAN-EVAL — quality-q754-tail--codex

- Plan evaluator session: Claude Opus 4.8 (`claude-opus-4-8`), Claude Code session
  `session_01WMKgGNRNc4UG9E7bjDryF1`, 2026-07-12
- Run: `quality-q754-tail--codex`
- Surface / archetype: seven package roots — telemetry/aspire (Arch 2), sdk/fresh-ui (Arch 4),
  bench (Arch 6), plugin-ai-core/plugin-auth-core (Arch 1)
- Scope overlays: frontend (`fresh-ui`); none otherwise
- Baseline evaluated: `e465a6db0045e240835766b9d42ccb6e0123ccda` (harness plan-lock commit; its
  parent `3b3d615b` is the code baseline the plan cites)

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselines the rejected unreachable commit `f656c0ca` against `3b3d615b` on 2026-07-12; hard reset confirmed; carried-in allowance strategy explicitly rejected. Spot-checked: scanner reproduces 16 findings / `allowCount:0` across the seven package roots (see sweep below). |
| Decisions locked                        | PASS   | `plan.md` Locked Decisions L1–L7 with rationale; Axioms A1/A2/A6/A14; per-package archetype assignment. |
| Open-decision sweep                     | PASS   | `plan.md` Open-Decision Sweep table: allowance-need = safe to defer (default no, L7 gates any allowance on a demonstrated upstream impossibility + evaluator review); Fresh UI summary-prop breaking-change = must-resolve-now, resolved by typing the rendered element and compiling consumers. My independent sweep found no unflagged rework-forcing decision. |
| Commit slices (< 30, gate + files each) | PASS   | `worklog.md` Design → 4 ordered slices, each names proving gate + files; exact per-file targets enumerated in `research.md` findings (primitives.tsx, platform-popover.ts, Accordion.tsx, accordion.types.ts, ai.contract.ts, auth.contract.ts, http-client-link.ts, otel-sdk.ts, orpc/_types.ts, orpc/error-plugin.ts). |
| Risk register                           | PASS   | `plan.md` Risk Register (5 risks + mitigations) plus Anti-Patterns table (AP-2/9/14/20). |
| Gate set selected                       | PASS   | `plan.md` Fitness Gates + Validation Plan: F-5/F-7 (`doc:lint`), F-6 (package-local publish dry-run, six publishable; bench `publish:false` N/A), F-10 (tests), F-19 (scoped check/lint/fmt), code-quality scanner `--max-allow 4` target 0, doctrine (`arch:check`). Browser validation correctly N/A (no visual change; regression test substitutes). Aligns with archetype-gate-matrix for Arch 1/2/4/6. |
| Deferred scope explicit                 | PASS   | `plan.md` Non-Scope + Hidden Scope; `worklog.md` Deferred Scope (browser screenshot N/A unless behavioral drift). |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` jsr-audit section: all seven export maps scanned; slow-type/surface risks named (Preact VNode, accordion props, oRPC private-type diagnostics, telemetry explicit annotations); each risk maps to a slice; planned proof = per-package full-export doc:lint + package-local publish dry-run + scoped wrappers + tests; no export-map/dependency change. |

## Open-decision sweep (evaluator-run)

None that force rework if deferred. Verified each substantive boundary carries a locked decision and
a fallback:

- Telemetry public oRPC types (L3) — research finding #3 verifies the public surface
  (`StandardHandlerOptions`/`StandardHandlerPlugin`/`Context`/`ProcedureClientInterceptorOptions`)
  via cached `@orpc/server@1.14.6` declarations; L7 provides the document-impossibility fallback if
  an upstream invariant cannot be narrowed.
- SDK contract-router narrowing (L4) — keeps the small public `ContractLike`, narrows at the adapter
  edge; `http-client-link.ts:68` cast confirmed present.
- Plugin `ErrorMap` normalization (L6) — the guard/normalizer lives in each core package
  (plugin-ai-core, plugin-auth-core) reading the unchanged shared `BASE_PLUGIN_ERRORS`; consistent
  with the seven-root scope (`packages/plugin` is not edited).
- Fresh UI VNode/style/summary/event corrections (L5) — public-narrowing consumer risk is flagged
  with a consumer search + fresh-ui tests + a focused summary-event regression test.

## Verdict

`PASS`

## Notes

- Spot-check reproduction (read-only): running `.llm/tools/quality/scan-code-quality.ts` over the
  seven whole-package roots yields 16 findings, `allowCount:0`, `ok:false`. The three prose-only
  lexical matches resolve to `packages/aspire/src/application/build-vite-env-var-name.ts:34`,
  `packages/sdk/src/cache/mod.ts:20`, and
  `packages/bench/tasks/t1-storefront-api/reference/netscript/router.ts:9` — matching research
  finding #2 ("Aspire, bench, and SDK comments"). Every remaining finding is a real `unsafe-cast`
  or `explicit-any`/`explicit-any-ignore` at a named source site the plan owns.
- Non-blocking refinement for implementation (not a Plan-Gate failure): `deno task arch:check`'s
  hardcoded root list covers plugin-ai-core and plugin-auth-core but not telemetry/aspire/sdk/
  fresh-ui/bench. The plan's "doctrine gate = `arch:check` plus focused interpretation" should, at
  implementation, invoke `check-doctrine.ts --root <pkg>` (or `arch:check:repo`) per touched
  non-covered root so the doctrine verdict is per-root, not just the aggregate task. IMPL-EVAL
  should require that per-root evidence.
- Slice 1 bundles the three non-telemetry comment rewordings (aspire/sdk/bench) under a
  telemetry-scoped check/test gate; acceptable because the seven-root scanner is the proving gate
  for lexical findings and comment-only edits cannot break compilation. IMPL-EVAL should still
  confirm the touched packages' scoped fmt/check stay green.
- The no-PR / force-with-lease harness variant and the absent remote branch are recorded as
  owner-authorized minor drift in `drift.md`/`supervisor.md`; not a Plan-Gate concern.
