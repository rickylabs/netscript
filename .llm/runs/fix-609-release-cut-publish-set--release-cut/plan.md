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

| Slice | What it proves | Files | Proving gate |
| --- | --- | --- | --- |
| 1. Publish-set audit | Intended scoped members are computed independently of `publish:false`; the effective publisher set is enumerated and unexplained missing/extra members fail. | `.llm/tools/release/preflight-release.ts` (new), `.llm/tools/release/preflight-release_test.ts` (new) | `deno test --no-lock -A .llm/tools/release/`; scoped release-tool check |
| 2. Markdown policy + cut integration | Stale pins fail on the owned surface, deferred site pins report, and both audits run before expensive gates / Git mutation. | `.llm/tools/release/preflight-release.ts`, `.llm/tools/release/preflight-release_test.ts`, `.llm/tools/release/cut.ts`, `.llm/tools/release/cut_test.ts` | release test suite; scoped release-tool check/lint/fmt |
| 3. Evidence and handoff | A safe read-only command enumerates the effective publish set and markdown verdict; no lock churn or release side effect occurs. | run `worklog.md`, `context-pack.md`, `drift.md`, PR body/comments | safe audit/preflight dry-run; raw `git diff -- deno.lock`; separate IMPL-EVAL |

## Gates

- `deno test --no-lock -A .llm/tools/release/`
- scoped check wrapper for `.llm/tools/release`
- scoped lint and format wrappers for changed TypeScript
- safe preflight/audit dry-run that cannot publish
- raw Git verification that `deno.lock` is unchanged
- `scaffold.runtime` and `e2e-cli-prod`: n/a; tooling-only audit does not change scaffold output or published CLI/plugin runtime shape

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
