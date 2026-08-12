# Slice B — #1417 implementation evidence

**Branch:** `fix/1417-publish-dry-run-no-mutation`  
**Commit:** `1a05934e9`  
**Baseline:** `origin/main@01aa12b67e36b643e1ca4f94421ecba07e030db5`  
**PLAN-EVAL:** N/A per run drift D-2.  
**IMPL-EVAL:** required; separate Fable 5 medium session, pending supervisor dispatch.

## Implementation decision

Option 1 (the preferred approach) is implemented: workspace and MCP package dry-runs copy the
checkout to a temporary workspace, run the unchanged `deno publish --dry-run` gate there, and
remove the copy in `finally`. Catalog materialization and Deno's publish-shape processing still run;
neither receives a path into the source checkout. This remains safe if the process is interrupted:
an abandoned temporary directory is possible after a hard kill, but a partially rewritten source
manifest is not.

The mutation has two participants. NetScript's `publishWorkspace` intentionally materializes npm
`catalog:` entries before invoking Deno. Deno's package-scoped dry-run can also rewrite manifest
publish metadata. The defect was exposing the live checkout to either mutation. The regression
tests simulate both classes, plus an attempted `deno.lock` write, against the real isolation seam.

## Negative control — final regression suite red without isolation

Isolation was temporarily replaced with `return await operation(sourceRoot)`, the exact final
two-test suite was executed, and then isolation was restored before any commit. Real untruncated
output:

```text
$ deno test --allow-read --allow-write --allow-run .llm/tools/release/publish-workspace_test.ts
Check .llm/tools/release/publish-workspace_test.ts
running 2 tests from ./.llm/tools/release/publish-workspace_test.ts
publish dry-run isolates catalog and Deno manifest rewrites in a throwaway workspace ... FAILED (58ms)
package dry-run isolates MCP publish array rewrites ... FAILED (6ms)

 ERRORS 

publish dry-run isolates catalog and Deno manifest rewrites in a throwaway workspace => ./.llm/tools/release/publish-workspace_test.ts:5:6
error: AssertionError: Values are not equal.


    [Diff] Actual / Expected


-   true
+   false

  throw new AssertionError(message);
        ^
    at assertEquals (https://jsr.io/@std/assert/1.0.19/equals.ts:67:9)
    at commandRunner (file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace_test.ts:34:9)
    at async publishWorkspaceInPlace (file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace.ts:127:20)
    at async file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace.ts:58:14
    at async withThrowawayWorkspace (file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace.ts:216:10)
    at async publishWorkspace (file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace.ts:57:12)
    at async file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace_test.ts:14:5

package dry-run isolates MCP publish array rewrites => ./.llm/tools/release/publish-workspace_test.ts:46:6
error: AssertionError: Values are not equal.


    [Diff] Actual / Expected


-   true
+   false

  throw new AssertionError(message);
        ^
    at assertEquals (https://jsr.io/@std/assert/1.0.19/equals.ts:67:9)
    at file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace_test.ts:63:7
    at async file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace.ts:71:20
    at async withThrowawayWorkspace (file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace.ts:216:10)
    at async publishMemberDryRun (file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace.ts:70:3)
    at async file:///home/codex/repos/ns006-f-b-dryrun/.llm/tools/release/publish-workspace_test.ts:54:5

 FAILURES 

publish dry-run isolates catalog and Deno manifest rewrites in a throwaway workspace => ./.llm/tools/release/publish-workspace_test.ts:5:6
package dry-run isolates MCP publish array rewrites => ./.llm/tools/release/publish-workspace_test.ts:46:6

FAILED | 0 passed | 2 failed (74ms)

error: Test failed
EXIT_CODE=1
```

## Green gate transcripts

The sections below are machine-recorded command stdout/stderr with explicit exit codes. Empty
fences for git assertions are the required empty output, not omitted output.


### Clean-tree precondition

Command: `git status --porcelain`

Exit code: **0** · elapsed: 0.0s

````text
````
