# Design checkpoint

1. Public surface: existing deps:* commands gain explicit standalone project selection and truthful coverage; browser CI contract and Dependabot ownership remain machine-checked.
2. Vocabulary: standalone project, direct declaration, locked inventory, selected project, unsupported production install. No framework APIs.
3. Ports: native npm process for lock-only inventory/outdated/provenance/audit; existing stable registry resolver for latest; filesystem manifest/lock reads. No new runtime/package dependencies.
4. Constants: one project path/manifest/lock/manager registry; command builders own npm flags; use it in wrapper coverage metadata and tests.
5. Commit slices: bootstrap/run+draft; one complete implementation slice plus independent review covering routing/config/contract/regressions; final evidence in same commit. Gates are focused structured wrappers plus native tool proof and full quality scan.
6. Deferred: browser severity/baselines #2460, S3 fingerprints #2462, component work and all releases; no npm/version/lock upgrades or install.
7. Contributor path: .llm/tools/deps/standalone-projects.ts explains registration, supported commands and report contracts.

No source edits before selected PLAN-EVAL PASS. Pending independent plan review.

PLAN-EVAL round1 FAIL_PLAN preserved. Required correction: two wrappers ship to consumers, so keep their sources byte-identical and route root tasks through internal code. Refine exact native command/error/coverage contracts and config negative controls. Canonical Aspire generator authority joins scope (fixture alone is insufficient). Design checkpoint amended: internal standalone-deps.ts is the root repository entrypoint; standalone-projects.ts remains contributor contract/registry. deno.json task strings only change; no dependency/import-map/lock changes. Selected code gate remains stopped pending same-session plan re-review.

Revised PLAN-EVAL PASS. Final supervisor write set supersedes earlier append-only scope notes. Conditions locked: direct-only freshness, lookup failures non-clean/exit3, exact original workspace child permissions/codes, in-memory workflow controls, public compact native evidence, canonical internal command docs. Source implementation begins only after this PASS.

## Implementation and evidence

Implemented explicit standalone project routing, strict read-only manifest/lock inventory, shared existing stable-channel comparison (direct locked-stable scope), native npm provenance/audit with dev coverage and 0/1/2/3 exit contract. Root default reports expose excluded npm scope. Shipped consumer wrappers/metadata/carrier are byte-identical; root task edits affect only outdated/why routing.

Dependabot owns exact npm directory, weekly exact-pin paired updates and labels[]. CI guards reject16 in-memory removal/bypass/condition/order/path controls. Legacy workflow test was executed on an in-memory removed-step copy and incorrectly passed, reproducing the gap without mutating tracked workflow. New guard rejects it. Canonical Aspire rule/fixture retains ci:workflow/S1 enforcement;1024 rows,0 unmatched.

93 structured tests pass including prior workflow/classifier/shard assertions. Nine-file check/lint/fmt pass with no drops. Live selected wrappers pass census/latest/outdated/why/audit; prod-install intentionally exits2. Native npm12.1.0 and11.21.1 cold provenance/audit pass with no node_modules; audit covers7 packages including dev graph,0 advisories. Browser manifest/lock, root/private locks and shipped wrappers/carrier hashes unchanged. All relevant carrier/parity/preflight gates pass. Full CLI runtime attempted and UNPROVEN for host Aspire/Docker limits; foreign/unknown resources left alone. Public compact proof is in reports/.

IMPL-EVAL round1 FAIL_FIX: F1 test child cached-only module graph not statically imported; F2 audit advisoriesFound ignores severity threshold; F3 default census fields lack assertion/summary proof. Repair all three before same-session re-review. Also tighten help/provenance scope/job skip guard and drift notes. One consecutive implementation failure; source review remains pending.

## Source-review repair gate

F1 fixed with explicit census/prod-install module imports in test graph. CLI checks pass with a newly created isolated Deno module cache; cached-only read-only children prove no accidental dependence on another shard. This is local cold-cache proof, not a CI claim (draft workflow skips real required jobs until readiness).

F2 fixed: advisoriesFound follows npm's severity-threshold exit, totalAdvisories retains all levels; low advisory under high floor remains in native report, exits0 with fail-on-find and advisoriesFound false. F3 fixed: no-selector census CLI test asserts5 dependencies, included coverage and all legacy counts; native-evidence summary now contains exact fields. Provenance/audit distinguish resolved-graph scope from direct inventory; help flags and drift updated. Added a17th negative control for job if:false. Final93 tests, cold-cache case,9-file scoped gates, quality/architecture and preflight pass. No source changes after these gates; same-session re-review follows.

Final same-session IMPL-EVAL PASS. All required and optional source notes addressed or explicit (default why pretty remains structured JSON). Final source reconciled against baseline f4aa307 and authorized write set; no architectural debt. Reviewed commit/push, five-box acceptance evidence and readiness follow. Continue #2460 after readiness, without waiting for remote CI.
