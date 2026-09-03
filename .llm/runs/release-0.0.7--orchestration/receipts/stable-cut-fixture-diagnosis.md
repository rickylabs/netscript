# Stable-cut pre-publication fixture diagnosis

- Main/source: a2d5b8b75083769b946c03ab772e08f2634e2b35.
- Stable cut PR1984: b8fb15bc136feb98ef81c21d010f43b1ee282798.
- Failing CI: https://github.com/rickylabs/netscript/actions/runs/33766502843.
- Structured artifact: 9898232876; native test report retained in preflight
  .llm/tmp/stable-cut-ci-first/test.report.json.
- Test counts: 5269 pass, 1 fail, 14 ignored. The sole failure is
  public init emits resolvable app conventions with and without the example service.

## Exact cause, not a hypothesis

Scaffolded with the in-tree public CLI at b8fb15bc1, using the same init options as the test:
with-service, app dashboard, db none, --ci --yes --no-aspire --no-git --service --service-name users.
Preserved generated fixture at preflight/.llm/tmp/stable-cut-cli-diagnosis/with-service.
Its app deno.json correctly pins jsr:@netscript/sdk@0.0.7.
Running the actual resolver's dynamic-import/query-factory script exits 1 with:

    TypeError: Could not find version of '@netscript/sdk' that matches specified version constraint '0.0.7'

The production resolver replaces every nonzero subprocess result with the misleading
Query procedure 'list' does not exist on client 'users'. No production code was edited.

The existing packages/cli/tests/support/local-workspace-imports.ts helper installed at the
fixture root AND app resolves the actual checkout exports. The identical subprocess then exits
0 and prints PROCEDURE_OK. Applying only at the app fails missing root catalog resolution;
both calls are required. Deno warns that the app catalog field is ignored; root catalog works.

## Permanent test-only candidate

Commit 6884b7548a0fdc53a17c52ef343c6025a7527d93, explicitly pushed to
fix/cli-prepublish-test-fixture; worktree /home/agent/projects/netscript/worktrees/007-stable-fixture-repair.
Only packages/cli/src/public/features/root/public-command-tree_test.ts differs from b8fb15bc1
(9 insertions, 1 deletion). It asserts the original public SDK exact-version pin, then uses the
existing local fixture helper before executing the original real subprocess and all assertions.
CLI publish.exclude contains **/*_test.ts; no published file or manifest differs.

At the committed candidate, native run-deno-test reports 5 pass / 0 fail / 0 ignored.
Report: repair/.llm/tmp/stable-fixture-repair-test.report.json.
Native targeted check reports 1 selected / 0 failed batches / 0 errors.
Native targeted lint and fmt report 1 selected / 1 processed / 0 errors, using the existing
.llm/runs/fix-sdk-cli-key-normalization-residuals--1833/cli-quality-deno.json.
The initial root-config lint refusal is expected coverage protection because root excludes CLI;
it was not reported as PASS. No broad formatting or lock changes were made.

## Release boundary

Canary.10's pair remains GREEN for product source a2d5b8b75. The current strict verifier only
inherits across an immediate version-only commit and therefore will reject the test-only child.
Owner authorization to retain the already-proven product evidence for this excluded test delta
is requested, not assumed. Stable PR1984 has not been modified or merged. No manual green status,
new release, new canary, runtime lease, container operation, or cache deletion occurred.
Independent review continues on session0039d1ad; see eval-readme-cold/brief-stable-fixture.md.
