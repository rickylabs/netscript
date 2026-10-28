# Corrective implementation review — PASS

Independent Claude Opus 5.5 high effort, read-only, resumed the original implementation evaluator. Reviewed the corrective working tree based on `9d40623fbcaaf0b25a57e28ec6708bbda4eb7290` before sign-off. No code changes after this verdict.

**PASS**

I found no blocking issues in these corrections. I read the corrections diff, the five changed source files, the regenerated manifest file (TSV), the updated worklog and drift notes, the new gate receipts, and the CI check and quality logs. I wrote nothing and ran nothing.

- **Moved-artifact fix (recorder):**
  - **Fixed:** The recorder now takes each attachment's whole path below its project's original output directory and re-applies it beside the moved `results.json`. A path that falls outside the output directory now fails instead of being read.
  - **The new test would have caught the old bug:** The old code dropped the case folder and looked for `<report dir>/attachments/<file>`, which does not exist in the test's setup, so it would have failed.
  - **The real downloaded CI artifact also works:** The candidate built from it has all 8 cases and is marked pending review.
  - **Five contract tests pass** at head 9d40623 through the durable gate receipt.
- **Gate catalog change:** The contract gate gains `--allow-read`, `--allow-write` and `--allow-run=node`. These only reach the contract test, so it can make a temp folder and start the recorder in Node. They do not affect the browser gate or any accessibility check. The CI browser job already installs Node 24.
- **Theme persistence test:**
  - **Before:** Storage was pre-set to the final expected value, so the old check passed whether or not the toggle saved anything.
  - **Now:** The pre-set value is cleared after the page renders and the starting theme is checked. The test then checks the saved value right after Enter (the other theme) and again after Space (back to the original).
  - **Proof it can fail:** Removing the toggle's storage write makes the real browser case fail with "expected dark / received null".
  - **No effect on evidence:** The screenshot and axe scan still run after the toggle returns to the original theme, so they are unchanged. The corrected 8-case matrix passes.
- **README ownership fix (Aspire parity):**
  - **No check was loosened:** One scoped rule gives `tools/fresh-ui-browser/` an owner as a tooling doc. The manifest was rebuilt by the tool, not edited by hand, and it is current. No path was excluded and the expected version is still 13.5.3.
  - **Three rows added:** the browser README; `fresh-ui-quality.yml`, now enforced at phase 1 as a CI workflow, which adds a check; and `fresh-ui-quality_test.ts`.
  - **Result:** Parity reports 996 checked and 0 failures, and you report all 26 parity regression tests passing.
- **Test-5:** The only failure is a Chrome startup timeout in the existing generated-browser test, which this PR does not change. The gate is kept, nothing was loosened, and it has not been reported as green.
- **Privacy:** The corrections add no private machine details to tracked files.

These items do not block code approval, but they must be done before READY:
- **Update the PR body (`pr-body.md` on disk) for the corrective head.** It is out of date:
  - it says 4 contract tests, but there are now 5;
  - it says the package-quality job is "still finishing";
  - it names the IMPL-EVAL head as 958c2b5cb.
  - It should also disclose that at 9d40623 the CI `quality`, `close-gate` and `test-5` checks failed, and say how each was resolved.
- **Hold back green claims for the corrective head.** Do not report `quality`, `test-5` or close-gate as green until they actually pass there.

This approves the code corrections only. It is not proof that the corrective head will pass CI.
