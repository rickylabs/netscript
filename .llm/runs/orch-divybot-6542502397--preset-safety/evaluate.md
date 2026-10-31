# Final IMPL-EVAL verdict for issue 2516, requirements 1–2: **PASS** (implementation)

Requested model: claude-opus-5-5 at high effort. Observed model: claude-opus-5-5.

Both advisory fixes are in and correct, and I found no new blocking issues. The branch isn't merge-ready yet. Four items still stand between it and READY; they are listed at the end.

## The two advisory fixes

**Advisory 1: recovery guidance (fixed).**
- `docs/site/reference/cli/commands.md:394-396` again tells users what to do if applying the preset fails after the scaffold exists: run `ui:apply --preset` in the generated app, then `netscript agent init --project-root .`.
- The text is limited to dependency-fetch and file-conflict failures. It doesn't claim more safety than the slice delivers, and the existing promise of no scaffold on an invalid URL or schema (`commands.md:392-393`) is unchanged.
- The regenerated docs file has the new text. I decoded the `pages/reference/cli/commands/index.md` entry in `packages/cli/src/kernel/assets/agent-docs-prose.generated.ts` and it contains the recovery sentence, the HTTPS rule and the "schema-validated" wording.

**Advisory 2: test for remote themes reusing the first download (fixed).**
- The new test is at `packages/cli/src/kernel/application/ui/v2/tests/url-preset_test.ts:247-266`.
- It prepares a real `registry:theme` item and checks that no files are written and exactly one fetch happens.
- It then replaces what the server returns with `{}` and applies the preset after the scaffold exists. It checks that the fetch count is still 1, that the original value `#123456` was written, and that the lock records the URL item.
- This covers the remote path (`resolve-preset.ts:62-72`, then `applyRemoteUiPreset`), which the earlier preset-JSON test didn't reach.
- I ran it myself together with the preset-JSON test (`deno test --frozen --unstable-kv -A --filter "/prepared registry theme|prepared init preset/"`): 2 passed, 0 failed. The run also type-checked the module.

No production code changed in the follow-up, so the earlier PASS on the code still holds.

## Evidence I reviewed

- **Regression record** (`regression-evidence.json`): against the baseline, the new tests failed 8 of 8, which shows they catch the bug. With the fix, 10 pass and none fail or are skipped. Each run has a checksum.
- **Gate table** (`worklog.md`) records these as passed:
  - type check, lint and format on all 10 changed TypeScript files, with nothing excluded or dropped
  - `quality:gate`, `release:preflight`, `docs:accuracy` and the CLI JSR audit
  - 13 root check tasks (all except `assets-barrel`) and the four site checks
- **Public files**: the run directory has no absolute paths or session identifiers. The leak evidence gives only verdicts and counts. The leak reporter left 24 resources it couldn't prove ownership of untouched.

## Scope and debt

Scope stayed within the first two requirements. There's no new export, dependency, CLI option or architecture debt. Failures that can still happen after the scaffold exists (dependency fetches, compiler errors) and rollback of a half-built scaffold remain deferred, as agreed.

## Merge-readiness: not ready yet

The code verdict is PASS, but these items block READY:

1. **Full selected CLI suite (public/maintainer init, `ui/apply`, `ui-style-preset` and the URL preset modules)**: still running, with no final report. Pending.
2. **`check:assets-barrel`**: it compares against the Git diff, so it can only run after the regenerated docs file is committed. Pending until the implementation commit lands.
3. **`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`**: raw exit 1 because Docker was unreachable at preflight and at cleanup inventory. This is **UNPROVEN**, as the operator allowed when Docker is unavailable, and must not be recorded as PASS.
4. **Required CI checks at the exact head**: CI skips every job while the PR is a draft. The implementation still needs to be committed and pushed, and the PR moved out of draft so the required checks run. READY is only allowed once they all pass at that exact commit.

The draft PR should keep `Refs #2516` only.
