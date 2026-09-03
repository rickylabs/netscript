# Independent bounded review: stable pre-publish test fixture

Continue the existing independent evaluator session. Read AGENTS.md and relevant skills.
No source edits, no merge, no release, no runtime/container lease, no policy waiver.

Review exact commit `6884b7548a0fdc53a17c52ef343c6025a7527d93` against its parent
`b8fb15bc136feb98ef81c21d010f43b1ee282798`. There is exactly one changed file:
`packages/cli/src/public/features/root/public-command-tree_test.ts` (9 insertions, 1 deletion).

Stable PR #1984 at b8fb15bc1 failed CI 33766502843 with 5269 passing tests, 1 failure,
14 ignored. The failure is the public init conventions test's `generate resource` subprocess.
The coordinator reproduced the exact child stderr: generated SDK pin is correctly 0.0.7,
but JSR does not have stable 0.0.7 before publication. The resolver masks this as missing
`users.list`. Applying the pre-existing local-workspace-imports test helper to the fixture
root and app makes the real query-factory probe pass. No product resolver code is changed.

The candidate adds an assertion that the public generated SDK pin equals the CLI version,
then uses that existing test helper before real generate-resource invocations. All original
assertions and real subprocesses remain. The complete focused file passed 5/0 at the committed
candidate. Type check passed; targeted lint and fmt passed with the existing no-workspace
CLI quality config `.llm/runs/fix-sdk-cli-key-normalization-residuals--1833/cli-quality-deno.json`.
Root lint intentionally excludes CLI, so do not misreport the coverage refusal as a source defect.

Verify independently:
1. The fixture-only change does not mock the query, skip existing assertions, or alter shipped
   behavior, generated output, dependencies, or manifests.
2. The sole changed `_test.ts` path is excluded by the CLI publish manifest; no shipped file
   differs from b8fb15bc1. Do not dump generated/binary diffs.
3. Run the focused test file through the native structured wrapper, retaining its report.
4. Report any real caveat of the existing helper's root/app catalog behavior. A warning about
   catalog only belonging at the root is not a failure if actual resolution is proven.

Write `evaluate-stable-fixture.md` and the test report under
`.llm/runs/readme-cold-release-proof--0.0.7/` in your evaluator worktree.
Return PASS or FAIL_FIX with exact head, commands, counts, and rationale. This is a test-quality
review, NOT authorization to bypass the mandatory canary gate. Owner authorization to retain
canary.10 evidence after this non-published fixture correction is pending. Stop after the bounded
verdict; do not launch more reviewers or repair release policy.
