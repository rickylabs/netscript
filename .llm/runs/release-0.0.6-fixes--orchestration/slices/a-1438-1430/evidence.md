# Evidence — Slice A (#1438 + #1430)

Implementation worktree: `/home/codex/repos/ns006-f-a-release-tooling`

Branch: `fix/1438-release-cut-canary-pair-inheritance`

Baseline: `01aa12b67e36b643e1ca4f94421ecba07e030db5`

## Commits

```text
c0b98d93d fix(release): date explicit changelog ranges
a0c298fb5 fix(release): inherit canary pair across coordinated cuts
```

## #1438 — red before, green after

The pre-fix classifier was executed against the measured 62-file v0.0.5 release-cut commit
`6ec75573d`. It used the old writer subset (`discoverVersionFiles`) exactly as the verifier did.

```text
$ deno eval '<measure 6ec75573d with discoverVersionFiles + isVersionOnlyReleaseDiff>'
{"measuredCutFiles":62,"oldWriterFiles":47,"accepted":false}
exit 1
```

The same measured cut was then classified with the release writer's complete prepared-output set.

```text
$ deno eval '<measure 6ec75573d with discoverPreparedReleaseFiles + isVersionOnlyReleaseDiff>'
{"measuredCutFiles":62,"preparedWriterFiles":68,"accepted":true}
exit 0
```

The focused regression test derives its changed set from `discoverPreparedReleaseFiles`, asserts
that it contains manifests, `deno.lock`, agent-docs gzip/provenance, generated barrels, and plugin
pins, then proves a mixed `packages/a/mod.ts` edit returns false. The canary-pair tests additionally
prove that every changed file first faces `isExactVersionReplacement`; only derived
gzip/base64/hash outputs can fall through to the non-mutating writer-reproduction checks, and a
failed reproduction rejects inheritance.

## #1430 — red before, green after

The old `--prev-tag` construction was executed directly. A known previous tag received `since: ''`,
so the closed-issue query count remained zero.

```text
$ deno eval '<execute the pre-fix --prev-tag branch and closed-query predicate>'
{"previousTag":"v0.0.5","since":"","closedIssueQueries":0}
exit 1
```

The focused regression suite proves all corrected branches:

```text
--prev-tag resolves a dated window and queries closed issues ... ok
known previous tag with empty since fails loudly before reporting closed issues ... ok
explicit previous tag uses release date with commit-date fallback ... ok
```

## Focused release-identity tests

```text
$ deno test --allow-read --allow-write --allow-run .llm/tools/release/github-release_test.ts
running 21 tests from ./.llm/tools/release/github-release_test.ts
toVersion strips a single leading v; toTag re-adds it ... ok
version-only diff accepts the complete release version surface only ... ok
version-only diff accepts a realistic coordinated release cut and rejects source drift ... ok
green canary pair accepts current SHA or a version-only immediate parent ... ok
parent canary evidence checks every release path and reproduces derived writer outputs ... ok
parent canary evidence fails when derived writer outputs cannot be reproduced ... ok
canary pair gate fails closed for source drift and API failure ... ok
parent canary evidence rejects seeded manifest drift inside a version file ... ok
formatClosedIssues renders a bulleted list, empty when none ... ok
composeReleaseBody orders intro, changelog, closed issues and drops blanks ... ok
--prev-tag resolves a dated window and queries closed issues ... ok
known previous tag with empty since fails loudly before reporting closed issues ... ok
explicit previous tag uses release date with commit-date fallback ... ok
parseArgs: version positional or flag, defaults to non-prerelease Latest ... ok
parseArgs: --prerelease implies not-Latest; explicit --latest with it throws ... ok
parseArgs: --no-latest overrides the default ... ok
parseArgs: every documented release:publish invocation is accepted ... ok
parseArgs: intro is required (the deliberate manual step) ... ok
parseArgs: version is required ... ok
parseArgs: notes-file and message are mutually exclusive ... ok
parseArgs: unknown flag and missing value are rejected ... ok

ok | 21 passed | 0 failed
exit 0
```

The complete release-tool suite also passed. This quiet confirmation is included in full:

```text
$ deno test --quiet --allow-all .llm/tools/release/
running 2 tests from ./.llm/tools/release/assert-release-version_test.ts
release version coherence reports every coordinated manifest mismatch ... ok (74ms)
release version coherence passes only when the coordinated set matches ... ok (14ms)
running 15 tests from ./.llm/tools/release/canary-label_test.ts
payload includes a PR merge commit buried behind a release update merge ... ok (134ms)
stable version is rejected instead of labelled ... ok (835µs)
repo-style wrong-train label and published version fail drift both ways ... ok (394µs)
drift is scoped to the published canary train ... ok (75µs)
payload uses commit associations, not misleading commit-subject issue numbers ... ok (398µs)
prior canary point is resolved from the published train ... ok (197µs)
first canary falls back to nearest stable first-parent point ... ok (122µs)
did-not-run checks are visibly distinct from passing checks in JSON ... ok (215µs)
closing-link lookup failure prevents a false payload pass ... ok (514µs)
empty payload renders an explicit canary note ... ok (426µs)
a zero-commit range returns explicit genuine-empty evidence without association lookup ... ok (250µs)
a non-empty range without PR associations is a named derivation failure ... ok (231µs)
release note refuses a version absent from registry output ... ok (343µs)
canary release is a prerelease and can never become Latest ... ok (157µs)
drift is scoped to the target train and still catches real divergence ... ok (371µs)
running 12 tests from ./.llm/tools/release/canary_test.ts
canary version takes the maximum registry N across all members including yanked versions ... ok (1ms)
canary version uses tags as a secondary collision guard and tolerates new packages ... ok (609µs)
canary parser accepts only a stable target and task separator ... ok (1ms)
machine result carries the resolved 0.0.4 canary identity ... ok (7ms)
canary republish version must be canonical and belong to the target train ... ok (620µs)
canary republish accepts only a clean checkout matching the tagged tree ... ok (437µs)
canary republish refuses a dirty checkout before comparing committed trees ... ok (315µs)
canary republish names both tree SHAs when tagged content differs ... ok (274µs)
canary ref creation pushes only an ephemeral branch and provenance tag ... ok (558µs)
canary version fails closed when registry discovery fails ... ok (330µs)
JSR registry discovery treats only 404 as a new package ... ok (3ms)
JSR registry discovery retains yanked version keys and rejects malformed metadata ... ok (472µs)
running 3 tests from ./.llm/tools/release/check-jsr-publish-budget_test.ts
publish budget admits a full coordinated workspace before minting ... ok (8ms)
publish budget fails clearly when remaining attempts cannot cover the workspace ... ok (799µs)
publish budget fails closed on unauthenticated or malformed quota data ... ok (743µs)
running 1 test from ./.llm/tools/release/config/no-hardcoded-volatile_test.ts
release endpoint is centralized in config ... ok (8ms)
running 7 tests from ./.llm/tools/release/cut_test.ts
release cut creates its PR through the injected GitHub transport ... ok (1ms)
release cut leaves PR creation failure non-fatal ... ok (278µs)
release cut writes its PR body in a fresh worktree ... ok (8ms)
release cut bump coordinator updates root members and lock with no residue ... ok (26ms)
release cut refuses equal or older versions ... ok (698µs)
canary mode accepts only a same-core canary of the current stable version ... ok (784µs)
release cut parser ignores task separator ... ok (246µs)
running 21 tests from ./.llm/tools/release/github-release_test.ts
toVersion strips a single leading v; toTag re-adds it ... ok (1ms)
version-only diff accepts the complete release version surface only ... ok (512µs)
version-only diff accepts a realistic coordinated release cut and rejects source drift ... ok (22ms)
green canary pair accepts current SHA or a version-only immediate parent ... ok (861µs)
parent canary evidence checks every release path and reproduces derived writer outputs ... ok (1ms)
parent canary evidence fails when derived writer outputs cannot be reproduced ... ok (1ms)
canary pair gate fails closed for source drift and API failure ... ok (599µs)
parent canary evidence rejects seeded manifest drift inside a version file ... ok (627µs)
formatClosedIssues renders a bulleted list, empty when none ... ok (476µs)
composeReleaseBody orders intro, changelog, closed issues and drops blanks ... ok (284µs)
--prev-tag resolves a dated window and queries closed issues ... ok (910µs)
known previous tag with empty since fails loudly before reporting closed issues ... ok (1ms)
explicit previous tag uses release date with commit-date fallback ... ok (808µs)
parseArgs: version positional or flag, defaults to non-prerelease Latest ... ok (172µs)
parseArgs: --prerelease implies not-Latest; explicit --latest with it throws ... ok (973µs)
parseArgs: --no-latest overrides the default ... ok (180µs)
parseArgs: every documented release:publish invocation is accepted ... ok (1ms)
parseArgs: intro is required (the deliberate manual step) ... ok (374µs)
parseArgs: version is required ... ok (252µs)
parseArgs: notes-file and message are mutually exclusive ... ok (182µs)
parseArgs: unknown flag and missing value are rejected ... ok (424µs)
running 5 tests from ./.llm/tools/release/preflight-release_test.ts
publish-set audit includes AI siblings and reports publish:false as missing ... ok (29ms)
publish-set exclusions require a recorded reason ... ok (2ms)
publish-set audit accepts an explicitly reasoned internal exclusion ... ok (5ms)
publish-set audit covers explicit nested workspace members and applies the durable exclusion ... ok (5ms)
markdown preflight blocks stale normal and prerelease pins across docs ... ok (7ms)
running 11 tests from ./.llm/tools/release/preflight-text-imports_test.ts
preflight rejects import attributes in publishable source ... ok (2ms)
preflight ignores import-attribute text in inert source regions ... ok (392µs)
preflight flags cross-line import.meta-relative reads ... ok (1ms)
preflight ignores URL constructors and generated constants without Deno reads ... ok (521µs)
preflight allowlist suppresses a single read line ... ok (591µs)
preflight flags eager fromFileUrl on import.meta.url ... ok (796µs)
preflight ignores embedded string source but still flags following executable code ... ok (362µs)
preflight still flags executable code in a template interpolation ... ok (356µs)
preflight allows protocol-guarded fromFileUrl import.meta conversion ... ok (607µs)
release:preflight task argv accepts a bare separator ... ok (95ms)
file-url check ignores embedded string data but still fails on real syntax ... ok (391µs)
running 2 tests from ./.llm/tools/release/prepare-release_test.ts
shared release preparation runs the stable gate sequence in order ... ok (4ms)
shared release preparation regenerates assets then stops when residue remains ... ok (1ms)
running 13 tests from ./.llm/tools/release/publish-readiness_test.ts
publish readiness emits ordered structured evidence for every composed check ... ok (1ms)
publish readiness fails on a seeded workspace member omitted from the publish set ... ok (547µs)
publish readiness preserves the seeded stale Markdown pin gate ... ok (210µs)
lockstep and residue audit fails on seeded manifest and internal specifier versions ... ok (18ms)
lockstep audit ignores seeded fixture scaffold versions outside the release surface ... ok (9ms)
publish readiness fails on a pin the release no longer ships ... ok (5ms)
publish readiness fails on a seeded versionless framework specifier ... ok (2ms)
first-publish checklist fails on a seeded missing README ... ok (3ms)
first-publish checklist fails over-cap tagline, missing license/exports, and docs pointer ... ok (3ms)
publish readiness fails when seeded first-publish provisioning dry-check fails ... ok (507µs)
new-package evidence enumerates only registry-absent members ... ok (331µs)
registry failure skips dependent first-publish checks instead of using a partial set ... ok (480µs)
publish readiness exercises the real preflight for a seeded text import and carries #810 sunset ... ok (92ms)
running 3 tests from ./.llm/tools/release/release-canary-workflow_test.ts
canary workflow reuses the publisher and records only an awaited green pair ... ok (2ms)
stable publisher uses composed readiness before provisioning and real publish ... ok (438µs)
production E2E waits for JSR propagation for explicit canary dispatches ... ok (234µs)
running 2 tests from ./.llm/tools/release/report-jsr-publish-outcome_test.ts
publish outcome distinguishes none, partial, and complete exact-version presence ... ok (1ms)
exact-version assertion names every missing package ... ok (1ms)
running 3 tests from ./.llm/tools/release/surface-diff_test.ts
surface classifier reports changed/removal as major and addition as minor ... ok (5ms)
surface classifier accepts explicitly declared majors without hiding verdict ... ok (1ms)
surface normalization ignores locations, docs, bodies, and resolution paths ... ok (1ms)
running 1 test from ./.llm/tools/release/verify-canary-pair_test.ts
canary pair verifier parses an explicit repo and rejects malformed input ... ok (2ms)

ok | 101 passed | 0 failed (2s)
exit 0
```

## Required repository gates

```text
$ rtk proxy deno task check
Task check deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx --exclude "^(.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)"
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-f-a-release-tooling"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":2876,"batches":24,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
exit 0
```

```text
$ rtk proxy deno task test
Task test deno test --allow-all
ok | 3188 passed (617 steps) | 0 failed | 17 ignored (3m55s)
exit 0
```

A second full-suite confirmation produced the same cardinality and verdict:

```text
$ rtk proxy deno task test --quiet
Task test deno test --allow-all '--quiet'
ok | 3188 passed (617 steps) | 0 failed | 17 ignored (2m46s)
exit 0
```

```text
$ rtk proxy deno task lint
Task lint deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)"
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-f-a-release-tooling","exitCode":0},"selection":{"filesSelected":2010,"batches":11},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
exit 0
```

```text
$ rtk proxy deno task fmt:check
Task fmt:check deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)" --ignore-line-endings
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-f-a-release-tooling","mode":"check","summary":{"filesSelected":2010,"batches":11,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
exit 0
```

```text
$ deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-f-a-release-tooling"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":40,"batches":1,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
exit 0
```

Owned `.llm/tools/**` lint and format checks were also run because the root aliases intentionally
select only `packages/**` and `plugins/**`:

```text
$ deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/release --root .llm/tools/generate-cli-assets-barrel.ts --ext ts
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-f-a-release-tooling","exitCode":0},"selection":{"filesSelected":41,"batches":1},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}

$ deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/release --root .llm/tools/generate-cli-assets-barrel.ts --ext ts
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-f-a-release-tooling","mode":"check","summary":{"filesSelected":41,"batches":1,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
exit 0
```

## Worktree and lock hygiene

```text
$ git status --porcelain

$ git diff --exit-code 01aa12b67 HEAD -- deno.lock

$ git log --oneline 01aa12b67..HEAD
c0b98d93d fix(release): date explicit changelog ranges
a0c298fb5 fix(release): inherit canary pair across coordinated cuts
exit 0
```

`git status --porcelain` is empty. `deno.lock` is byte-identical to the baseline. No publication,
tag creation/push, `release:publish`, `deno publish`, cache reload, or scaffold runtime was run.

## Harness handoff

PLAN-EVAL is N/A per lane drift D-2. Focused separate-session Fable 5 medium IMPL-EVAL remains
required; this implementation session does not self-certify or merge.

## Draft PR handoff

```text
$ git push origin HEAD:refs/heads/fix/1438-release-cut-canary-pair-inheritance
To https://github.com/rickylabs/netscript.git
 * [new branch]          HEAD -> fix/1438-release-cut-canary-pair-inheritance
exit 0

$ gh pr create --draft --base main --head fix/1438-release-cut-canary-pair-inheritance ...
ok created #1539 https://github.com/rickylabs/netscript/pull/1539
exit 0

$ gh pr edit 1539 --add-label type:fix --add-label area:tooling --add-label area:release --add-label priority:p1 --add-label status:impl-eval --milestone 0.0.6
ok edited #1539
exit 0
```

The post-create API readback verified:

```text
number: 1539
state: OPEN
draft: true
base: main
head: fix/1438-release-cut-canary-pair-inheritance
milestone: 0.0.6
labels: type:fix, area:tooling, area:release, priority:p1, status:impl-eval
status labels: 1
commits:
  a0c298fb58be78db6bb6b1f390474155b06f6087
  c0b98d93d1e21364252932cfcc7a8637610bedf7
body closing keywords: Closes #1438; Closes #1430
acceptance: all shipped implementation and gate criteria checked; separate IMPL-EVAL explicitly unchecked
```

An `[PHASE: IMPL] [VERDICT: COMPLETE]` harness handoff comment was posted. The PR remains draft and
was not merged.

Final ground-truth audit after PR creation:

```text
$ git status --porcelain
exit 0; stdout bytes: 0

$ git diff --exit-code 01aa12b67 HEAD -- deno.lock
exit 0; stdout bytes: 0

$ git rev-parse --abbrev-ref --symbolic-full-name '@{u}'
fatal: no upstream configured for branch 'fix/1438-release-cut-canary-pair-inheritance'
exit 128 (expected: explicit-refspec push deliberately did not establish an upstream)

$ git ls-remote --heads origin fix/1438-release-cut-canary-pair-inheritance
c0b98d93d1e21364252932cfcc7a8637610bedf7 refs/heads/fix/1438-release-cut-canary-pair-inheritance
exit 0

$ gh pr view 1539 --json ...
{"base":"main","closes":[1430,1438],"head":"fix/1438-release-cut-canary-pair-inheritance","isDraft":true,"labels":["type:fix","status:impl-eval","area:tooling","priority:p1","area:release"],"milestone":"0.0.6","number":1539,"state":"OPEN","statusLabels":["status:impl-eval"],"url":"https://github.com/rickylabs/netscript/pull/1539"}
exit 0
```

## IMPL-EVAL FAIL_FIX repair — B-1 agent-docs parent anchor

The separate Fable evaluator demonstrated that the original D-6 HEAD-only reproduction was
self-referential for the agent-docs bundle. A regression with the evaluator's exact attack shape was
added before the repair: a non-version marker was injected into the gzip payload, provenance was
updated to the injected blob's SHA-256 and byte counts while keeping the stable version unchanged,
and the published barrel was synchronized to that gzip and provenance. The simulated HEAD writer
checks explicitly verified the three injected files were mutually consistent.

Before the parent-to-HEAD guard was added, the inheritance call returned the green parent rather
than rejecting, so the new assertion was red:

```text
$ deno test --allow-read --allow-write --allow-run .llm/tools/release/github-release_test.ts --filter 'self-consistent non-version agent-docs injection'
Check .llm/tools/release/github-release_test.ts
running 1 test from ./.llm/tools/release/github-release_test.ts
parent canary evidence rejects self-consistent non-version agent-docs injection ... FAILED (10ms)

ERRORS

parent canary evidence rejects self-consistent non-version agent-docs injection => ./.llm/tools/release/github-release_test.ts:247:6
error: AssertionError: Expected function to reject.
    throw new AssertionError(
          ^
    at assertRejects (https://jsr.io/@std/assert/1.0.19/rejects.ts:118:11)
    at async file:///home/codex/repos/ns006-f-a-release-tooling/.llm/tools/release/github-release_test.ts:324:3

FAILURES

parent canary evidence rejects self-consistent non-version agent-docs injection => ./.llm/tools/release/github-release_test.ts:247:6

FAILED | 0 passed | 1 failed | 21 filtered out (15ms)

error: Test failed
exit 1
```

Option 1 from the evaluator verdict was selected. The verifier now reads the agent-docs gzip as raw
bytes from both the canary parent and stable HEAD, decompresses them, reuses
`bump-version.ts::rewriteNetScriptVersion` to derive the only permitted next payload, and requires
the stable uncompressed bytes to equal that derivation exactly. HEAD writer reproduction remains in
force afterward for provenance and generated consumers. This is smaller than introducing a new raw
docs build input into `release:cut`, and directly proves the invariant being authorized: stable
agent-docs content equals canary-parent content plus only the coordinated version rewrite.

After the repair, the attack is rejected:

```text
$ deno test --allow-read --allow-write --allow-run .llm/tools/release/github-release_test.ts --filter 'self-consistent non-version agent-docs injection'
Check .llm/tools/release/github-release_test.ts
running 1 test from ./.llm/tools/release/github-release_test.ts
parent canary evidence rejects self-consistent non-version agent-docs injection ... ok (10ms)

ok | 1 passed | 0 failed | 21 filtered out (15ms)
exit 0
```

The positive side was checked against the measured v0.0.5 release-cut commit, not only a fixture:

```text
$ deno eval '<invoke isExactAgentDocsVersionReplacement on git-show bytes for 6ec75573d^ and 6ec75573d>'
{"cut":"6ec75573d","previousVersion":"0.0.4","nextVersion":"0.0.5","agentDocsDeltaAccepted":true}
exit 0
```

### B-1 repair gates

```text
$ deno test --allow-read --allow-write --allow-run .llm/tools/release/github-release_test.ts
Check .llm/tools/release/github-release_test.ts
running 22 tests from ./.llm/tools/release/github-release_test.ts
toVersion strips a single leading v; toTag re-adds it ... ok
version-only diff accepts the complete release version surface only ... ok
version-only diff accepts a realistic coordinated release cut and rejects source drift ... ok
green canary pair accepts current SHA or a version-only immediate parent ... ok
parent canary evidence checks every release path and reproduces derived writer outputs ... ok
parent canary evidence fails when derived writer outputs cannot be reproduced ... ok
parent canary evidence rejects self-consistent non-version agent-docs injection ... ok
canary pair gate fails closed for source drift and API failure ... ok
parent canary evidence rejects seeded manifest drift inside a version file ... ok
formatClosedIssues renders a bulleted list, empty when none ... ok
composeReleaseBody orders intro, changelog, closed issues and drops blanks ... ok
--prev-tag resolves a dated window and queries closed issues ... ok
known previous tag with empty since fails loudly before reporting closed issues ... ok
explicit previous tag uses release date with commit-date fallback ... ok
parseArgs: version positional or flag, defaults to non-prerelease Latest ... ok
parseArgs: --prerelease implies not-Latest; explicit --latest with it throws ... ok
parseArgs: --no-latest overrides the default ... ok
parseArgs: every documented release:publish invocation is accepted ... ok
parseArgs: intro is required (the deliberate manual step) ... ok
parseArgs: version is required ... ok
parseArgs: notes-file and message are mutually exclusive ... ok
parseArgs: unknown flag and missing value are rejected ... ok

ok | 22 passed | 0 failed (28ms)
exit 0
```

```text
$ deno test --quiet --allow-all .llm/tools/release/
ok | 102 passed | 0 failed (1s)
exit 0
```

```text
$ rtk proxy deno task check
Task check deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx --exclude "^(.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)" (cached, inputs unchanged)
exit 0

$ rtk proxy deno task lint
Task lint deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)" (cached, inputs unchanged)
exit 0

$ rtk proxy deno task fmt:check
Task fmt:check deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)" --ignore-line-endings (cached, inputs unchanged)
exit 0
```

The root wrapper inputs are `packages/**` and `plugins/**`, which the repair did not change. The
owned release-tool files were re-executed uncached through the scoped wrappers:

```text
$ deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-f-a-release-tooling"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":40,"batches":1,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
exit 0

$ deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/release --ext ts
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-f-a-release-tooling","exitCode":0},"selection":{"filesSelected":40,"batches":1},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
exit 0

$ deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/release --ext ts
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-f-a-release-tooling","mode":"check","summary":{"filesSelected":40,"batches":1,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
exit 0
```

```text
$ rtk proxy deno task test
Task test deno test --allow-all
ok | 3189 passed (617 steps) | 0 failed | 17 ignored (2m59s)
exit 0
```

```text
$ git diff --check
exit 0

$ git status --porcelain
exit 0; stdout bytes: 0

$ git diff --exit-code 01aa12b67 HEAD -- deno.lock
exit 0; stdout bytes: 0

$ git log --oneline 01aa12b67..HEAD
5350d01fc fix(release): anchor agent docs inheritance to parent
c0b98d93d fix(release): date explicit changelog ranges
a0c298fb5 fix(release): inherit canary pair across coordinated cuts
exit 0
```

### B-1 push and PR handoff

```text
$ git push origin HEAD:refs/heads/fix/1438-release-cut-canary-pair-inheritance
To https://github.com/rickylabs/netscript.git
   c0b98d93d..5350d01fc  HEAD -> fix/1438-release-cut-canary-pair-inheritance
exit 0

$ gh pr edit 1539 --body-file .llm/tmp/pr-a-body.md
ok edited #1539
exit 0
```

The PR body now states Option 1 and its rationale, adds the B-1 attack regression and measured-cut
positive control to acceptance, points to D-6, and records B-2 without changing it. The fresh
separate-session IMPL-EVAL checkbox remains unchecked. An implementation handoff comment for
`5350d01fc` was posted; no evaluator verdict was asserted by this session.

Post-update readback found the PR had been switched out of draft during the evaluator cycle. Because
fresh IMPL-EVAL is still pending, it was restored to draft and re-audited:

```text
$ gh pr ready 1539 --undo
✓ Pull request rickylabs/netscript#1539 is converted to "draft"
exit 0

$ gh pr view 1539 --json ...
{"base":"main","closes":[1430,1438],"head":"fix/1438-release-cut-canary-pair-inheritance","headSha":"5350d01fc9f045d0302590a59c91281ea9d0f572","isDraft":true,"labels":["type:fix","status:impl-eval","area:tooling","priority:p1","area:release"],"milestone":"0.0.6","number":1539,"state":"OPEN","statusLabels":["status:impl-eval"],"url":"https://github.com/rickylabs/netscript/pull/1539"}
exit 0
```

Final audit:

```text
$ git status --porcelain
exit 0; stdout bytes: 0

$ git diff --exit-code 01aa12b67 HEAD -- deno.lock
exit 0; stdout bytes: 0

$ git rev-parse HEAD
5350d01fc9f045d0302590a59c91281ea9d0f572
exit 0

$ gh pr view 1539 --json isDraft,state,body --jq '<contract assertions>'
{"b1Regression":true,"implEvalUnchecked":true,"isDraft":true,"optionOne":true,"state":"OPEN"}
exit 0
```

No publication, `release:publish`, `deno publish`, tag creation/push, canary, cache reload, lock
mutation, scaffold runtime, or merge was performed during the repair.
