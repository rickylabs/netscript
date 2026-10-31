# Plan & Design — READY FOR REVIEW

Archetype 5 plugin glue with Archetype 6 CLI concern. Scope is static saga registry discovery, its inspector and doctor parity tests. Baseline is current fetched main. No new dependency, package export path, runtime convention or schema.

## Locked decisions

1. Canonical declaration is `defineSagaConfig('id', 'sagas/runtime.ts')` in scanned `.config.ts` modules. Both arguments must be static nonempty string literals; generation reports declaration file/id and remediation on unsupported expressions. Support whitespace/comments and quote variants without evaluating project source. Skip comments and string/template contents to avoid incidental declarations. Existing native defineSaga discovery remains unchanged.
2. Inspector exposes declaration id and entrypoint metadata. Generator unions declared runtime modules with legacy discovered modules, deduplicates and sorts deterministically. Explicit declarations bypass conventional filename suffixes, not filename excludes or first-line registry-ignore policy. Config files themselves never enter the runtime registry.
3. Resolve project-relative .ts/.tsx paths statically within the configured scan roots (normalize ./ and separators). Reject absolute, URL, escaping, missing and config-file targets. A declaration pointing to an excluded/ignored target is an actionable conflict, never silent success. An ignored/excluded config file is not an active declaration. Validate the target has a supported export (`default`, `saga`, or `definition`) without executing it; runtime shape validation remains in the generated resolver. Do not attempt to evaluate a factory to prove its returned type or id at generation time.
4. Reuse root doctor runtime-registry drift check through protocol-2 selected source authority. Add integration tests proving a stale empty or partially populated registry fails doctor and fresh output agrees. Do not introduce direct filesystem scans into the adapter's narrow FileSystemPort.
5. Zero declarations and no legacy candidates yields the existing valid empty registry. Root generation must propagate declaration failures before writes.

## Slices and proving gates

- S0: run bootstrap, design checkpoint, independent PLAN-EVAL; commit/push and draft PR before source edits. Files: this run directory.
- S1: one cohesive change: inspector, registry generator, a declaration parser/selector module only if size warrants, saga CLI tests and README; CLI installed-runtime integration tests prove protocol-2 generation and doctor parity. Structured focused test/check/lint/fmt, full quality:gate, plugin JSR audit/doc lint; independent cross-family IMPL-EVAL before implementation commit. Include run worklog/context in commit, push and comment.
- S2: final evidence and dated lesson, run/context only; ready PR after clean implementation evaluation, final same-session evaluator reviews exact pushed head. Check review threads and snapshot CI. Ask coordinator to arm e2e-cli-gate for scaffold.runtime; never run it locally, never merge.

## Risks and mitigations

- Incidental comments/strings: tokenize before recognizing declarations; test false positives and dynamic arguments failing closed.
- Legacy behavior/exclusion regression: golden registry and root installed ignore/zero-item regression tests unchanged.
- Missing files or exclusions silently erase declarations: explicit validation before rendering/writing, with file/id/path diagnostics.
- Self-composing module side effects: generation and dry-run only read text; fixture throws if evaluated during generation. Import generated registry separately only to assert actual `agent-action` membership.
- Doctor may appear green on stale empty output: compare generator-selected paths through existing root drift check; test stale and regenerated states.

## JSR audit / gates / deferred scope

Apply jsr-audit: current metadata/export map/publish whitelist remain; changed interfaces and helper return values have explicit annotations and docs. Run audit-jsr-package and structured doc-lint for plugins/sagas. Full quality:gate includes dependency/architecture scans; report baseline failures honestly if encountered. No new dependency or lock changes allowed.

No open rework-forcing decision. Aliased/dynamic config evaluation, application module execution, runtime implementation, and changes to other B1 packages are deferred. Per-saga runtime definitions still validate at registry import. No accepted architectural debt anticipated. Required full scaffold.runtime CI is explicitly unproven until coordinator supplies exact-head verdict.
