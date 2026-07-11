# Plan

## Profile

- Archetype: 6, CLI/tooling (release automation).
- Overlays: none; markdown is input inspected by tooling, not a docs-content rewrite.
- Doctrine: package/plugin doctrine is not changed. No architecture debt expected.

## Locked decisions

1. Add a pure publish-set audit that compares intended scoped, publishable direct workspace members with the publisher's effective member set.
2. Model intentional exclusions as explicit path/reason records; unexplained missing or extra members fail.
3. Ensure audit output enumerates the effective set, making `@netscript/ai` and siblings visible in dry-run evidence.
4. Add a markdown scanner for `@netscript/*@^?0.0.1-<channel>.<n>` pins behind the target cut version.
5. Fail for owned markdown; report `docs/site/**` separately as deferred.
6. Invoke both checks before expensive cut gates and before any non-dry-run Git mutation.
7. Unit-test both pure audits with temporary workspace/markdown fixtures.

## Slices

1. Publish-set audit and tests.
2. Markdown preflight, cut integration, and tests.
3. Gate evidence, dry-run audit output, evaluator corrections, and final harness handoff.

## Gates

- `deno test --no-lock -A .llm/tools/release/`
- scoped check wrapper for `.llm/tools/release`
- scoped lint and format wrappers for changed TypeScript
- safe preflight/audit dry-run that cannot publish
- raw Git verification that `deno.lock` is unchanged

## Risks

- False positives in prose: restrict matching to explicit `@netscript/` package prerelease specifiers.
- Accidental historical scan: exclude run/scratch/cache/worktree trees.
- Hidden exclusions: require non-empty reasons in the explicit exclusion registry.
- Release side effects: expose/read-only audit CLI or cut preflight mode; never exercise publishing.

## Deferred scope

- Rewriting markdown pins.
- Failing `docs/site/**` before #445/#448.
- Registry publication-state reconciliation.
- Package/plugin implementation changes.
