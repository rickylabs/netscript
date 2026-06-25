# PLAN-EVAL — chore/release-prep-alpha3--release-prep

- Plan evaluator session: `pr-129 / run-28196492395-1` (OpenHands, openrouter/minimax/minimax-m3)
- Run: `chore-release-prep-alpha3--release-prep`
- Surface / archetype: none (no `packages/`/`plugins/` archetype surface beyond test fixtures)
- Scope overlays: `SCOPE-docs.md` (Slice 1 — Pages deploy); WSL Codex lane (Slice 2 — CLI test fixtures)
- Baseline: `origin/main @ bc72364a` (post-#128 Deno 2.9 adoption)
- Branch evaluated: `chore/release-prep-alpha3`

## Checklist results

| Plan-Gate item                          | Result            | Evidence / location |
| --------------------------------------- | ----------------- | ------------------- |
| Research present and current            | PASS              | `.llm/tmp/run/chore-release-prep-alpha3--release-prep/research.md` exists; F1–F5 re-baselined against current `main`. Spot-checks pass (see Hard checks). |
| Decisions locked                        | PASS              | `plan.md` §"Locked decisions" D1–D3 are stated with rationale. |
| Open-decision sweep                     | PASS              | No deferred decisions would force rework — Slice 1 trigger block + Slice 2 derivation approach are both concrete. Sequencing explicitly keeps the bump out of this PR. |
| Commit slices (< 30, gate + files each) | PASS              | 2 slices, each names its gate and files; ordered Slice 2 → Slice 1. |
| Risk register                           | PASS              | `plan.md` §"Gates" names per-slice verification (actionlint, deno test green-at-bumped-version, `deno.lock` unchanged). |
| Gate set selected                       | PASS              | CI lane (Slice 1) + CLI test lane (Slice 2) chosen; no package/plugin archetype → F-* fitness gates not applicable. |
| Deferred scope explicit                 | PASS              | `research.md` §"Out of scope" lists: `docs/user-site` `pages.yml` cleanup, the actual bump/tag/release, #116 prod demo. |
| jsr-audit surface scan (pkg/plugin)     | N/A               | Run does not change any JSR-published package surface. Slice 2 is test-only + one doc-comment; runtime scaffold surface is already zero-drift (F4). |

## Hard checks (refute or confirm with evidence)

### F1 grounding — `docs/site/_data.ts` reads version from `packages/cli/deno.json`

**PASS.** `docs/site/_data.ts:14-20` (verified):

```ts
import cliPackageJson from "../../packages/cli/deno.json" with { type: "json" };
export const releaseVersion: string = cliPackageJson.version;
export const releaseSpecifier: string = `@${releaseVersion}`;
```

No docs-side version code is needed. When `main` bumps to `0.0.1-alpha.3`, a docs build on `main`
reads `alpha.3` automatically.

### F2 grounding — Pages source, env allow-list, and `docs/site/` parity

**PASS.**

1. `gh api repos/rickylabs/netscript/pages` →
   `{ build_type: "workflow", source: { branch: "main", path: "/" } }`. Pages source IS `main`.
2. `gh api repos/rickylabs/netscript/environments/github-pages/deployment-branch-policies` →
   `main`, `docs/user-site`, `release/jsr-readiness` all allow-listed (`protected_branches: true`,
   `custom_branch_policies: true`). `main` IS allow-listed.
3. `gh api repos/rickylabs/netscript/compare/main...docs/user-site` → 0 differing files under
   `docs/site/**` (overall `ahead_by: 197`, `behind_by: 50`, but those are outside `docs/site/`).
   Deployed content is identical; Slice 1 changes only *when/where* it builds.

No FAIL_PLAN gap. The plan correctly notes this is "no work on the docs side."

### F3 grounding — `pages.yml` is absent on `main`, and `release:` events fire only from default branch

**PASS.**

- `git ls-tree origin/main .github/workflows/` shows only: `ci.yml`, `e2e-cli-prod.yml`,
  `e2e-cli.yml`, `openhands-agent.yml`, `publish.yml`. No `pages.yml` on `main`.
- `pages.yml` exists only on `origin/docs/user-site:.github/workflows/pages.yml` (verified).
- GitHub workflow behavior: `on: release:` events trigger workflows in the **default branch**
  (`main`). Without `pages.yml` on `main`, no docs rebuild fires on a release today.
- Slice 1 IS the missing redeploy trigger. Plan correctly cites `e2e-cli-prod.yml` + `publish.yml`
  as the precedent (`on: release: { types: [published] }` + `workflow_dispatch`).

### F4 grounding — Test files assert literal `@0.0.1-alpha.2`; `jsr-specifiers.ts` derives version from `cli/deno.json`; derivation preserves assertion strength

**PASS.**

1. `packages/cli/src/kernel/constants/jsr-specifiers.ts:8-10`:
   ```ts
   import cliPackageJson from '../../../deno.json' with { type: 'json' };
   export const NETSCRIPT_RELEASE_VERSION: string = cliPackageJson.version;
   ```
   So runtime scaffold output (via `JSR_SPECIFIERS` + `import-resolver.ts`) is already drift-free.

2. Hardcoded `@0.0.1-alpha.2` literals exist at the cited line numbers (verified):

| File                                              | Lines (matches)                       |
| ------------------------------------------------- | ------------------------------------- |
| `jsr-import-resolver_test.ts`                     | 12,16,20,24,28,48,49                  |
| `copy-official-plugin-copy_test.ts`               | 187,191,195,204,439,445,451,455       |
| `generators_test.ts`                              | 38                                    |
| `scaffolder_test.ts`                              | 85                                    |
| `import-resolver_test.ts` (kernel/adapters/scaffold/tests/) | 21,22                          |
| `import-resolver.ts`                              | 164 (doc-comment — cosmetic only)     |

3. Derivation approach in plan: import `NETSCRIPT_RELEASE_VERSION` (or `netscriptJsrSpecifier(...)`)
   and build expected specifiers as `` `jsr:@netscript/fresh@${NETSCRIPT_RELEASE_VERSION}` ``.
   This asserts the **correct** specifier — just computed from the same source the runtime uses,
   not hardcoded. Assertion strength is preserved (the test still calls
   `assertEquals(actual, expected)` with the exact right string; on a bump, both sides move
   together).

### Scope/lane — no `packages/` runtime, no `plugins/`, zero-cast, no `deno.lock` churn

**PASS.**

- Plan scope: (a) `.github/workflows/pages.yml` (new file, CI lane), (b) the listed CLI test
  files, (c) one doc-comment in `import-resolver.ts`, (d) one guard test file
  (`packages/cli/src/kernel/constants/version-drift_test.ts`).
- No `packages/` runtime source touched. No `plugins/` source touched.
- Zero-cast rule: the only existing accepted cast (`jsr-specifiers.ts:68` — `as const`) is
  unchanged. The new test fixtures use template-string interpolation, no new casts.
- `deno.lock`: plan explicitly states "unchanged" and gates it. Slice 2 only edits test
  assertions; Slice 1 only adds a workflow YAML file. No lock churn by construction.

### Sequencing soundness — bump stays out of this PR; derivation does not break the CURRENT suite

**PASS.**

- Plan Sequencing #5: the actual `deno bump-version prerelease` + tag + GitHub Release is a
  **separate step after this PR merges**. Correct: this PR should not advance
  `packages/cli/deno.json` (or any other manifest) because that would change the JSR publish
  surface mid-PR and mix the release-critical change with the gate-prep change.
- Will Slice 2 break the CURRENT (unbumped, `0.0.1-alpha.2`) suite?
  - Current `packages/cli/deno.json:3` = `0.0.1-alpha.2`.
  - `NETSCRIPT_RELEASE_VERSION` (derived from that) = `0.0.1-alpha.2`.
  - A test that asserts `` `jsr:@netscript/fresh@${NETSCRIPT_RELEASE_VERSION}` `` evaluates to
    `'jsr:@netscript/fresh@0.0.1-alpha.2'` — identical to today's hardcoded literal.
  - **Conclusion:** the derivation does NOT break the current suite. It makes the suite
    bump-*safe* for the later release PR.
- After the bump PR: `cli/deno.json` → `0.0.1-alpha.3` → `NETSCRIPT_RELEASE_VERSION` →
  `0.0.1-alpha.3` → all derived specifiers auto-update. Tests stay green.

## Open-decision sweep (evaluator-run)

`none` — every concrete choice is locked in the plan's D1–D3, and the deferred items
(`docs/user-site` workflow cleanup, the bump itself, #116 prod demo) are explicitly listed as
out-of-scope and would not force rework of this PR if deferred.

## Verdict

`PASS`

All six hard checks hold. The plan is implementable as written; no missing gate; sequencing is
sound; scope is clean.

### Implementation may begin

- Slice 2 (Codex) first: derive test fixtures from `NETSCRIPT_RELEASE_VERSION`, add the drift
  guard test, prove green-at-bumped-version via the plan's temporary-local-bump gate, commit.
- Slice 1 (Codex) second: add `.github/workflows/pages.yml` on `main` with the trigger block
  (push `main` paths-filtered, `release: published`, `workflow_dispatch`), pinned `deno-version:
  '2.9.0'`, build/deploy jobs ported verbatim from `docs/user-site:.github/workflows/pages.yml`,
  commit.
- Open PR, IMPL-EVAL (separate session, qwen3.7 max).

## Notes

- The plan correctly identifies that #112's "dynamic version" half is already done (F1) and the
  only release-blocking pieces are the missing `pages.yml` trigger (D2) and the test-fixture
  bump-safety (D3).
- Plan's gate "actionlint if available" is reasonable for Slice 1; the authoritative proof is
  the merged workflow appearing in `gh workflow list` + a `workflow_dispatch` dry run.
- The plan explicitly does NOT run `e2e:cli scaffold.runtime` here — correct, since neither slice
  changes scaffold runtime output; that smoke runs at release time via `e2e-cli-prod.yml`.
- Deferral of `docs/user-site` `pages.yml` cleanup is acceptable: leaving it does no harm
  because the Pages source is now `main` and that workflow's push trigger is on
  `docs/user-site` only.