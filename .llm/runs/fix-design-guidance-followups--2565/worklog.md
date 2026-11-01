# Worklog

## Authorization and route

User:“Your PR merged…pick the NEXT subtask in scope…implement it, and open the next PR. Don't stop while the tracker still has unfinished cells.” This authorizes continuation beyond the earlier STOP-at-READY boundary. Selected#2565 after live ownership/PR checks;#2569 is already dispatched separately.

Continuing explicit owner overrides, verbatim:

“Relaunch on Sol 6.1 xhigh (owner: Astra is only for pure design work; the earlier Astra trigger was withdrawn).”
“PLAN-EVAL and IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.”

The feature matrix was queried before writing. These continuing owner preferences replace the evaluator cells while retaining separate sessions and vendor families; no session IDs are published. The same evaluator is retained across rounds of this leaf. Stop after two consecutive terminal failures; no third loop.


## Design

1. Public surface: installed netscript-design guidance and app-agent docs track canonical counts/routes/sections and the invoking CLI release; no new CLI flags or package exports.
2. Vocabulary: guidance doc target(source path+MCP slug), current guideline section, release-ref placeholder, materialized design skill. Generated metadata is build-owned data, not a new runtime registry.
3. Ports: existing xref manifest, theme directories/registry, GUIDELINES, embedded bundle/integrity checks, existing filesystem adapter and NETSCRIPT_RELEASE_VERSION. No new IO port.
4. Constants: stable xref keys, generated metadata path, one release-ref token, required semantic guideline headings and the existing release-version authority.
5. Slices: plan bootstrap; one tested/evaluated source+carriers+evidence slice. Exact gates in plan.md. Every implementation commit touches this run.
6. Deferred: other owned leaves, new token axes/styles, versioned Pages hosting and release publication.
7. Contributor path:.llm/tools/docs/generate-design-skill.ts with its fixture tests.

PLAN-EVAL selected for the source-bundle integrity/release-materialization boundary; pending. No product implementation yet.

PLAN-EVAL round 1: FAIL_PLAN; all three contract gaps incorporated into plan.md. Token source remains generator-owned, emitted as runtime data; this avoids a generator importing its own output as authority. Round 2 retains the same independent evaluator. No product changes yet.

PLAN-EVAL round 2: PASS. Product implementation begins after this verdict.

Implementation candidate: 12 generator tests and 69 consumer/scaffold tests PASS. Scoped check/lint/fmt each cover all 8 owned TS files; corrected wrapper invocation uses its default --unstable-kv, not a custom command. No dependency changes. Quality:gate and CLI JSR audit PASS. One-pass scaffold.runtime raw exit1: preflight/cleanup blocked by inaccessible Docker; runtime remains UNPROVEN locally. Read-only leak reporter reviewed unknown/foreign resources without mutation; public report contains counts only.

Merged origin/main 1e4e58f normally (acceptance-mirroring leaf), without conflicts. Generator uses existing --allow-dirty for export corpus extraction; all source carriers generated in order. Candidate source/outputs are staged before read-only regeneration checks so git diff tests regeneration changes against the staged candidate; this is not a clean-tree claim.

Candidate gates complete: 81 focused tests, 15 root checks (review-threads explicit PR args), scoped wrappers 8/8 with no drops, docs and CLI publish gates PASS. Runtime UNPROVEN as recorded. Ready for independent same-session IMPL-EVAL, before implementation commit.

Independent IMPL-EVAL: PASS, no blockers, before source commit. Optional notes retained: exact-token replacement guard is redundant but enforces the locked contract, and the semver canary fixture is intentionally valid even though release tooling currently uses a shorter canary tag shape. No behavior change is needed to support either prerelease form. Source Markdown is provenance; MCP/local docs remain the readable entry. Fresh receipts/CI follow this sign-off commit.
