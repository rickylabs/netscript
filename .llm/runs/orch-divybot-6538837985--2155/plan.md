# Plan & Design — READY FOR REVIEW

Scope: one docs-only PR for #2155, E2, feature tier, overlay SCOPE-docs. The described runtimes are archetype 3 with DSL 4 and plugin 5 surfaces, but no implementation or export changes are authorized. Package quality/publish audits are N/A for this docs-only diff. Doctrine 08 governs state, crash and delivery claims.

Locked decisions: shipped source is the behavior authority; distinguish generated runtime wrappers from packaged entrypoints; retain historical URLs; prefer a standalone worker handler and streams producer over inventing a saga/job transport. Retry remains a definition field; builder omission is explicit. Existing fixes are evidence-backed in research, not repeated runtime patches.

1. S0 — bootstrap run evidence and draft PR. Gate: live issue/PR duplicate check, current-main baseline and path review. Only this run directory.
2. S1 — reconcile all twelve findings in the docs, retaining one coherent explanation per topic. Files: workers overview/tuning; saga reference; streams overview; triggers overview; plugin-system; glossary; author-a-plugin; deployment recipe; storefront checkout chapter; old eis-chat worker chapter; chat index. Gate: docs site verify (build, rendered output, links, caveats), docs snippets, docs accuracy; independent substantive review before slice sign-off. Every slice updates worklog/context.
3. S2 — record remaining gate evidence, scope drift and dated lessons; push final head and run exact-head evaluation. Gate: review-thread checker, CI state, final independent evaluation. Only this run directory unless evaluator requires a scoped docs correction.

Design risks: claims that promise exactly-once external effects; async writes accepted without delivery; producer teardown closing a shared stream; confusing packaged/generated process names; undocumented builder policies; intentional old-track redirects. Mitigation: inspect source and test names, check receipts, stop a shared producer without EOF, link canonical explanations, compile the new snippets. No runtime E2E locally (owner prohibition).

Required local gates: `deno task --cwd docs/site verify`; `deno task docs:snippets`; `deno task docs:accuracy`; source-format tests through structured test wrapper if docs tooling changes; scoped structured check/lint/fmt for any new TS tooling. Check generated-carrier freshness without committing out-of-scope package files. No raw root format. Full CLI E2E N/A: no scaffold output or runtime wiring changes.

PLAN-EVAL selected by explicit assignment, before S1; separate Claude Opus 5.5 high, read-only, blockers only. Max 2 plan rounds, max 5 implementation rounds; never bypass evaluation independence. Final verdict must name exact pushed SHA.

Open decisions: none affecting authorized docs implementation. Scope conflict on generated carriers is safe to defer to measured gate outcome and coordinator; never bypass it.

Deferred: runtime fixes, builder API enhancement, session/chat durability redesign, release and merge. No new architectural debt; existing builder policy gap is a coordinator handoff.

## PLAN-EVAL round 1 correction — retry export shape locked

The builder result is a non-exported local `base`. The module exports exactly one trigger definition for its id, as `export default Object.freeze({ ...base, retry: { ...full policy... } }) satisfies typeof base`. The retry policy declares all five required fields (maxAttempts, initialDelayMs, maxDelayMs, backoffMultiplier, jitter); it is a replacement, not a partial merge.

Static contribution discovery recognizes direct exported builder calls only. It will not list this wrapped definition, while the runtime registry imports every exported runnable definition and does load the default export. Document both facts explicitly; no unsupported claim that the override appears in static counts. Risk: exporting the base as well would create duplicate-id definitions, with namespace ordering choosing the winner. Mitigation: exactly one exported runnable definition; the base stays private. Gate: focused snippet compile through existing compiler plus a small docs-tooling check of runtime registration and export count if needed. This is not scaffold.runtime E2E.
