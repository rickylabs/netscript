# Plan

Scope: internal release-status description and its existing test. Package archetype N/A; no published package, plugin, CLI, scaffold, or runtime contract changes. SCOPE-docs applies to run evidence.

Locked: recognize only matching success state and conclusion; report E2E success and a later step failure. Keep unknown and actual terminal failure behavior.

One slice: modify `.llm/tools/release/canary-failure-description.sh`, extend `.llm/tools/release/watch-canary-e2e_test.ts`, retain required run evidence. Prove with a regression test, old-helper mutation red, restored green, full release-tool tests, root check/lint/fmt:check, and independent IMPL-EVAL.

Risk: claiming success from inconsistent inputs. Mitigation: require both success values and test mismatches. Description must remain within GitHub status length (140 characters).

Open decisions: none. PLAN-EVAL: N/A, bounded mechanical review fix with existing contract and explicit acceptance criteria. Debt delta: none. Deferred: broader workflow and package redesign. No release cut; release-gate class N/A.
