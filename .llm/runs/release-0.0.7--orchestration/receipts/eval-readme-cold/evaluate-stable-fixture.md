[PHASE: IMPL-EVAL] [VERDICT: PASS]

# Independent bounded review: stable pre-publish test fixture

Head (immutable, full): `6884b7548a0fdc53a17c52ef343c6025a7527d93`
("test(cli): resolve unpublished release fixtures from the checkout"), parent
`b8fb15bc136feb98ef81c21d010f43b1ee282798` (the reviewed 0.0.7 release cut). Evaluator worktree
`/home/agent/projects/netscript/worktrees/007-eval-readme-cold`, detached at the exact candidate
head; all five prior evaluator artifacts preserved untracked and untouched.

Evaluator: same independent session `0039d1ad-72eb-4047-964c-8b326ff65902` (not author or
coordinator), Claude Code + OpenRouter, model `z-ai/glm-5.3-flash`, 2026-09-03. No source edits,
no merge, no release, no runtime/container lease, no policy waiver.

## Delta shape

`git diff --name-status b8fb15bc1..6884b7548`: exactly one changed file —
`packages/cli/src/public/features/root/public-command-tree_test.ts` (9 insertions, 1 deletion; the
deletion is the rewritten import line). No other file differs from the release cut, so **no
shipped file differs from `b8fb15bc1`** (verified by name-status, not by dumping generated/binary
diffs — there are none).

## Verification 1 — fixture-only; no mocking, no skipped assertions, no shipped change

- The change **adds** an assertion and **adds** helper application; it removes no assertion. The
  new assertion `serviceConfig.imports['@netscript/sdk'] === 'jsr:@netscript/sdk@' + cliMeta.version`
  is evaluated against the generated fixture `deno.json` **before** the helper rewrites it, so it
  proves the real public pin (`0.0.7` from the CLI's own manifest) exactly as CI's failing
  subprocess saw it. Nothing about the generated output is relaxed.
- The query is **not mocked**. The real public command tree (`createPublicCommandTree`) still
  executes both real `generate resource` subprocess invocations (`--dry-run`, as before). The
  pre-existing helper `packages/cli/tests/support/local-workspace-imports.ts` (present at the
  parent, already used by 4 other CLI test files) only rewrites the generated fixture's
  `deno.json` `imports`: repository-catalog npm entries, repository imports, the fixture's own
  imports, and every `@netscript/*` workspace export mapped to a `file:` URL of the checkout —
  failing closed if an export target is not a real file. Module resolution moves to the checkout;
  the code under test does not. No shipped behavior, generated output, dependency, or manifest
  changes — the rewrite lives only inside the temp fixture, removed in the test's `finally`.
- Application scope is exactly right: `with-service` (root + app) is the only fixture whose app
  runs real `generate resource` subprocesses needing SDK module resolution (the `users.list`
  query-factory probe). The later `with-db-service` and `without-service` fixtures use only
  static checks (`assertExampleImportsResolve` / `assertAppConventionsResolve`), so they
  correctly need no helper. The helper's single-use-per-process guard is respected (two distinct
  roots).
- Later assertions are not masked: nothing after the rewrite re-asserts the published pin, and
  `assertExampleImportsResolve` validates resolution in the rewritten fixture — i.e. actual
  resolution is proven, not assumed.

## Verification 2 — publish-manifest exclusion

`packages/cli/deno.json` publish block: the include list contains `src/**/*.ts`, but the exclude
list contains `**/*_test.ts` (and `**/*.test.ts`, `e2e/`). The sole changed path matches
`**/*_test.ts` and is therefore excluded from the CLI publish surface. Combined with the one-file
name-status above, the published 0.0.7 artifact is byte-identical in intent to the reviewed cut.

## Verification 3 — focused tests via the native structured wrapper

| Command | Result |
| - | ------ |
| `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/public/features/root/public-command-tree_test.ts` | **exit 0 — 5 passed / 0 failed / 0 ignored** (durationMs 6692 — real subprocess work). Structured report retained at `.llm/runs/readme-cold-release-proof--0.0.7/stable-fixture-test-report.json` |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file <test file>` | exit 0 — 1 file / 1 batch / 0 diagnostics |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --file <test file> --config .llm/runs/fix-sdk-cli-key-normalization-residuals--1833/cli-quality-deno.json` | exit 0 — 1 file, 0 findings |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file <test file> --config .llm/runs/fix-sdk-cli-key-normalization-residuals--1833/cli-quality-deno.json` | exit 0 — 1 file, 0 findings |

Root lint/fmt intentionally exclude `packages/cli` (their `--exclude` regex names `packages/(cli)`),
so no root-wrapper coverage refusal was triggered here; the CLI-quality config above is the
maintained CLI lint/fmt surface, and both wrappers accepted `--config` directly. Nothing was
misreported as a source defect.

## Verification 4 — real caveat of the helper's root/app catalog behavior

`useLocalWorkspaceImports` ends with `Object.assign(config, { catalog: repositoryConfig.catalog })`,
copying the repository root's `catalog` into **both** fixture configs. Two genuinely different
consequences, both benign here:

1. **Inert copy in the app:** `serviceApp` is a member of the generated fixture workspace, and
   Deno resolves `catalog:` only from a workspace root — the catalog copy in the app config is a
   silent no-op. Resolution does not depend on it.
2. **Live copy in the fixture root:** `with-service` is the fixture workspace root, so the copied
   repository catalog is live there and can alter npm-version resolution inside the fixture
   relative to a real published install.

Neither affects the correctness of this correction: resolution in the test is carried by the
concrete `imports` map (catalog entries converted to explicit `npm:` specifiers plus `file:` URLs
per `@netscript/*` export), not by the catalog copy, and actual resolution is proven twice — by
the real subprocesses running to completion (5/0, 6.7 s) and by the post-rewrite
`assertExampleImportsResolve` static validation. Per the review contract, the catalog-belongs-at-
the-root warning is therefore recorded as a caveat, not a failure. Secondary helper trait worth
remembering: it throws on a second application to the same root within one process
(`installedProjectRoots`), which any future fixture reuse must respect.

## Rationale and boundaries

The candidate is a minimal, correct test-fixture correction for a real pre-publication ordering
problem: the generated public SDK pin is right (`0.0.7`, now asserted), but JSR cannot serve it
before publication, and the resolver's failure surfaced as a misleading missing `users.list`. The
fix restores true resolution from the checkout under test while keeping every original assertion
and both real subprocesses. It does not weaken the release: this is a test-quality review, **not**
a canary-gate bypass — the mandatory canary gate and the exact published-version runtime remain
coordinator-owned, and owner authorization to retain canary.10 evidence after this non-published
fixture correction is explicitly pending and out of scope here.

## Verdict

**PASS** — fixture-only, resolution-only, assertion-preserving; publish surface unchanged;
focused file 5/0 with retained report; check/lint/fmt clean under the CLI quality config; helper
catalog caveat recorded with resolution proven.
