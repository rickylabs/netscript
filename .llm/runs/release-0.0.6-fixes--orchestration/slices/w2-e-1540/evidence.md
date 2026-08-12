# W2-E implementation evidence — interrupted publish/preflight tree safety (#1540)

**Branch:** `fix/1540-publish-interrupt-tree-safety`\
**Implementation commit after final rebase:** `7beab3cda`\
**Draft PR:** [#1573](https://github.com/rickylabs/netscript/pull/1573)\
**PLAN-EVAL:** PASS at `4970ad86f`; MiniMax M3, run `31601287489`, evaluated against `5705aeb19`.

## Implemented invariant

Real `publish` and `preflight` now create a detached temporary Git worktree at the source checkout's
exact `HEAD`. Catalog materialization and the unchanged publisher request run from that worktree.
The source checkout is input only, so its safety does not depend on `finally`, signal handling, or
any other cleanup executing.

Normal completion removes and prunes the worktree. `SIGKILL` is untrappable and may leave the
temporary worktree plus its Git administrative entry behind; general orphan scavenging remains the
explicitly deferred debt accepted by PLAN-EVAL. No signal handler or scavenger was added.

Every staged member manifest must pass `Deno.lstat()` as a regular, non-symlink file before it is
written. The existing real-publish and preflight arguments, provenance behavior, workspace-relative
layout, materialized manifest contents, and publish checks are unchanged.

## Negative control — regression RED before implementation

The final two hard-kill cases were run against the prior in-place implementation before the
production change. The helper's atomic handshake proved it had entered the publisher seam after
materialization, then the parent sent `SIGKILL` to the outer helper. Both modes left the tracked
service manifest dirty, so the test failed for the intended reason.

```text
$ deno test --allow-read --allow-write --allow-run .llm/tools/release/publish-workspace_test.ts
running 4 tests from ./.llm/tools/release/publish-workspace_test.ts
publish dry-run isolates catalog and Deno manifest rewrites in a throwaway workspace ... ok
package dry-run isolates MCP publish array rewrites ... ok
interrupted publish cannot materialize catalog imports in the source tree ... FAILED
interrupted preflight cannot materialize catalog imports in the source tree ... FAILED

ERRORS

AssertionError: publish left tracked source files dirty after SIGKILL
[Diff] Actual / Expected
-    M packages/service/deno.json

AssertionError: preflight left tracked source files dirty after SIGKILL
[Diff] Actual / Expected
-    M packages/service/deno.json

FAILED | 2 passed | 2 failed (161ms)
error: Test failed
EXIT_CODE=1
```

The source fixture and any test worktree residue were removed by the surviving parent after this
negative control. No release command or publisher was invoked.

## Executed interruption proof — GREEN

Command:

```text
deno test --allow-read --allow-write --allow-run .llm/tools/release/publish-workspace_test.ts
```

Untruncated output:

```text
Check .llm/tools/release/publish-workspace_test.ts
running 5 tests from ./.llm/tools/release/publish-workspace_test.ts
publish dry-run isolates catalog and Deno manifest rewrites in a throwaway workspace ... ok (16ms)
package dry-run isolates MCP publish array rewrites ... ok (4ms)
interrupted publish cannot materialize catalog imports in the source tree ...
------- output -------
{"mode":"publish","signal":"SIGKILL","sourceStatus":"","sourceHasCatalog":true,"lockUnchanged":true,"stageHasMaterializedCatalog":true,"stageOutsideSource":true,"publisherArgs":["publish","--allow-dirty"]}
----- output end -----
interrupted publish cannot materialize catalog imports in the source tree ... ok (77ms)
interrupted preflight cannot materialize catalog imports in the source tree ...
------- output -------
{"mode":"preflight","signal":"SIGKILL","sourceStatus":"","sourceHasCatalog":true,"lockUnchanged":true,"stageHasMaterializedCatalog":true,"stageOutsideSource":true,"publisherArgs":["publish","--allow-dirty","--no-provenance","--token","jsr-preflight-no-upload-invalid-token"]}
----- output end -----
interrupted preflight cannot materialize catalog imports in the source tree ... ok (63ms)
real publish rejects a symlinked member manifest before materialization ... ok (21ms)

ok | 5 passed | 0 failed (187ms)
EXIT_CODE=0
```

For each real mode the emitted record is printed only after the test has:

- observed the atomic post-materialization handshake;
- sent `SIGKILL` to the outer helper and awaited its failed exit;
- executed `git status --porcelain` in the source fixture and obtained the empty string;
- read `packages/service/deno.json` and found `"zod": "catalog:"`;
- compared `deno.lock` byte-for-byte with its committed baseline;
- found materialized `npm:zod@^4.4.3` in the staged manifest;
- proved the publisher `cwd` is outside the source fixture; and
- matched the unchanged mode-specific publisher arguments.

## Required gate verdicts

### Root check

```text
$ rtk proxy deno task check
Task check deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx --exclude "^(.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)"
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-w2-1540"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":2879,"batches":24,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
EXIT_CODE=0
```

### Root test

The exact task ran to completion. Its final, untruncated verdict block was:

```text
$ rtk proxy deno task test
Task test deno test --allow-all
...
ok | 3236 passed (617 steps) | 0 failed | 17 ignored (3m33s)
EXIT_CODE=0
```

The full run includes the five `publish-workspace_test.ts` cases above; no failure was hidden or
filtered. Per-test `ok` lines are not duplicated here because the root runner emitted several
thousand of them; the decisive complete suite verdict is preserved verbatim.

### Root lint

```text
$ rtk proxy deno task lint
Task lint deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)"
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-w2-1540","exitCode":0},"selection":{"filesSelected":2013,"batches":11},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
EXIT_CODE=0
```

### Root format check

```text
$ rtk proxy deno task fmt:check
Task fmt:check deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)" --ignore-line-endings
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-w2-1540","mode":"check","summary":{"filesSelected":2013,"batches":11,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
EXIT_CODE=0
```

### Release-tool scoped check

```text
$ deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-w2-1540"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":42,"batches":1,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
EXIT_CODE=0
```

### Root publish dry-run

```text
$ rtk proxy deno task publish:dry-run
Task publish:dry-run deno run --allow-read --allow-write --allow-run .llm/tools/release/run-publish-dry-run.ts
Publishing a workspace...
...
Success Dry run complete
EXIT_CODE=0
```

The unchanged dry-run emitted its normal package file census and known unanalyzable dynamic-import
warnings. It completed successfully; no real publication, authenticated request, canary dispatch,
release publish, tag push, or hand-run publish/preflight script occurred.

Immediately afterward:

```text
$ git status --porcelain=v1
EXIT_CODE=0

$ git diff --stat -- deno.lock
EXIT_CODE=0

$ rg -n '"zod": "catalog:"' packages/service/deno.json
27:    "zod": "catalog:"
EXIT_CODE=0

$ git worktree list --porcelain | rg 'netscript-publish-worktree-'
EXIT_CODE=1
```

The two empty command bodies above are the required empty outputs. The worktree search exits 1
because it found no matching orphan after normal completion and test-parent cleanup.

## Diff hygiene

Only `.llm/tools/**` and this harness artifact changed, so `quality:gate` is not required by the
slice. The explicit owned-file scan is:

```text
$ rg -n 'deno-lint-ignore|as unknown as|@ts-ignore' .llm/tools/release/publish-workspace.ts .llm/tools/release/publish-workspace_test.ts .llm/tools/release/tests/fixtures/publish-interrupt-helper.ts
EXIT_CODE=1

$ git diff --stat -- deno.lock
EXIT_CODE=0
```

Both searches have empty output: there is no forbidden suppression/cast match and no `deno.lock`
diff. `git diff --check` also exits 0.

## Final-head re-sync and verification

Immediately before the ready transition, `origin/main` had advanced to `a553afef4`. The branch
rebased cleanly; all required gates were then rerun against the rebased implementation head. The
final-head verdicts supersede the earlier counts where main added files or tests:

```text
$ rtk proxy deno task check
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-w2-1540"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":2885,"batches":25,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
EXIT_CODE=0

$ rtk proxy deno task test
ok | 3247 passed (617 steps) | 0 failed | 17 ignored (3m34s)
EXIT_CODE=0

$ rtk proxy deno task lint
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-w2-1540","exitCode":0},"selection":{"filesSelected":2019,"batches":11},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
EXIT_CODE=0

$ rtk proxy deno task fmt:check
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-w2-1540","mode":"check","summary":{"filesSelected":2019,"batches":11,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
EXIT_CODE=0

$ deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-w2-1540"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":42,"batches":1,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
EXIT_CODE=0

$ rtk proxy deno task publish:dry-run
Success Dry run complete
EXIT_CODE=0
```

The final-head focused interruption transcript again emitted both `SIGKILL` records with empty
`sourceStatus`, intact source catalog, byte-identical fixture lock, staged materialization, and a
stage outside the source. Its aggregate was `5 passed | 0 failed (366ms)`.

After the final dry-run, raw `git status --porcelain=v1`, `git diff --stat -- deno.lock`, and
`git diff --check` all exited 0 with empty output. The service catalog sentinel remained at line 27;
the forbidden-pattern and temporary-worktree searches both exited 1 with empty output.

## Acceptance map

1. Both real modes materialize only in detached worktrees; the executed `SIGKILL` records show empty
   source porcelain and the catalog sentinel intact.
2. The process was killed after a deterministic atomic post-materialization handshake; no cleanup in
   the killed process could run.
3. The identical hard-kill regression failed for both modes before the implementation and passes for
   both afterward.
4. The fixture lock is byte-identical in both hard-kill records, and the repository lock has an
   empty diff after focused, full, and dry-run gates.

Formal IMPL-EVAL remains deliberately pending. This implementation session does not self-certify
that separate-session acceptance box.
