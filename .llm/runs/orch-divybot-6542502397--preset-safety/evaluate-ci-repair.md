# CI repair review (Aspire manifest freshness): **PASS**

Requested and observed model: claude-opus-5-5. The root cause is correctly identified, and the fix is the single row the existing generator would add, with nothing suppressed or weakened. I found no blocking issues.

## Root cause

- The manifest generator `.llm/tools/validation/aspire-surface-manifest.ts` (lines 484-485) builds its inventory with `git grep -il --extended-regexp 'aspire'`, which only sees tracked files.
- `packages/cli/src/public/features/init/init-preset-safety_test.ts` contains `--no-aspire` at line 48, so it matches that search. It is now tracked (`git ls-files --error-unmatch` succeeds).
- During the original local check the test was untracked, so the generator couldn't see it and the local result was fresh. Once the test was committed, CI's regeneration included it and found the checked-in manifest out of date. That is exactly the one failure in the red record of `ci-repair-evidence.json` (998 files expected, 997 checked).

## The fix

- **One row added.** The only change outside the run directory is one line in `.llm/tools/validation/fixtures/aspire-surface-manifest.tsv`: `packages/cli/src/public/features/init/init-preset-safety_test.ts	cli:other	S4	…`. It sits in sorted order between `init-input.ts` and `run-init-command.ts`.
- **The values come from the generator's existing rule.** The class, owner and disposition (`cli:other`, `S4`, "grep-verified in the S4 member table; no emission change expected") are the existing `starts('packages/cli/')` rule at `aspire-surface-manifest.ts:274-279`. They weren't written by hand. The disposition is accurate: the test only passes `--no-aspire` to init and emits nothing Aspire-related.
- **Nothing else changed.** `git diff 411c058 --stat` shows no changes under `packages/`, `.github/`, `deno.json` or `.llm/tools/`, apart from the manifest file. Specifically, the scan scope, parity policy, version pins (the expected version is still 13.5.3), workflows, source and tests are all unchanged.
- **Nothing was weakened.** The deferred count (14), informational count (4) and skipped count (3) are the same before and after the fix, and no paths are reported missing. Only the checked count went from 997 to 998 and the failure count from 1 to 0. No row was dropped and none was moved into a deferred or exempt class.

## What I ran myself

- **Parity check:** `deno task check:aspire-version-parity` (read-only) exited 0 with `ok: true` and `manifestFresh: true`. Counts were 998 checked, 0 failed, 14 deferred, 4 informational, 3 skipped and 0 missing, matching the green record.
- **File hash:** the manifest's SHA-256 is `ad1cf5ea…a36650ff`, which matches `manifestSha256` in the evidence file.
- **Not checked:** the claim that regenerating twice gives identical bytes. Regenerating writes files, so I didn't run it in this read-only review. The fresh result from the parity check is consistent with that claim.

The run notes match what I found. `drift.md` and `worklog.md` record the cause and the repair. `supervisor.md` adds the manifest to the allowed write surface for freshness fixes only. `memory-manifest-tracking.md` records the lesson: stage new files before the final regeneration and parity check.

## Not merge-ready yet

1. **Commit, push and CI rerun:** the repair is still uncommitted. It has to be committed and pushed, and the hosted quality job has to pass at that new head. All required checks must pass at that exact head before a READY report.
2. **scaffold.runtime:** still UNPROVEN because Docker is unavailable. This is unrelated to the repair.
3. **deps-report:** the required check is skipped by policy. Also unrelated.
