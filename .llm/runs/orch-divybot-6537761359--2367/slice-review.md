# Slice review: issue #2367 (pre-commit, working tree)

**Result: PASS. No blockers.** I couldn't open `slice.diff` because reads outside the worktree were denied, so I reviewed the changed files in the working tree directly against the baseline I read during PLAN-EVAL.

## What I confirmed

- **Duplicate and alias refusal before overwrite.**
  - The `parts.has(option)` check sits after the alias lookup and before the value is translated or stored (`postgres-connection-string.ts:79`).
  - Because keys are already lowercased and trimmed, the check catches:
    - repeats of the same key, aliases and case variants;
    - identical repeated values;
    - empty passwords;
    - a second value that is itself invalid (`SslMode=Allow`, `Port=bad`).
  - The error reports the canonical key, not the alias the user typed.
- **Credential-safe errors.**
  - The message is fixed and `cause` is unset.
  - `assertDuplicateRefusal` (`postgres-connection-string_test.ts:132-147`) checks the message, stack, `String()` and JSON forms. None of them may contain the raw secret, the encoded secret, the escaped forms or the original input.
  - The generated Prisma and engine probes run the same check, and the engine probe also confirms the environment variables are unchanged.
- **Quoting.** The tokenizer is unchanged. Option-like text inside a quoted password stays part of the value (lines 149-156), and both quote-escape styles have refusal tests.
- **TLS spellings.** `verify-ca` and `verify-full` are accepted in any case and covered in the package tests. The generated Prisma path is tested with both spellings.
- **Numeric ports.** `String(Number(value))` runs after the existing ASCII-digit and range check, so `05432` becomes `5432`, `00001` becomes `1` and `065535` becomes `65535`. Values out of range are still refused.
- **URIs unchanged.** URIs still pass through byte-for-byte, including a URI with a repeated `sslmode`.
- **Generated paths.**
  - The template matches the maintained source: the `duplicate-key` reason, the check, the SSL map and the port change.
  - The embedded barrel contains the same changes. Repeated regeneration produces identical bytes.
  - Tests cover the Prisma config loaded through jiti in both local and JSR modes, plus the generated engine.
- **Public docs.** README, `docs/site/reference/database/index.md:87-91` (the full error-reason list, duplicate policy, TLS spellings and ports) and the CHANGELOG Unreleased entry are all accurate. JSDoc is updated.
- **Negative controls.** With the baseline parser restored, all 195 public refusal tests fail: 47 ordered alias pairs × 2 casings × 2 value modes, plus 7 targeted cases. All 3 generated refusal tests also fail. The fixed code was restored and all 213 tests pass again.
- **Gates.** `gates.md` records the scoped check, lint and fmt runs (using the same-style temporary config, with no policy change), doc lint, the package publish dry-run, the JSR audit and `quality:gate`, all exiting 0, with no lock churn.

## Not blocking

- The test title "preserves all five explicit TLS modes" is now out of date.
- The port and TLS-spelling tests have no baseline negative control. The plan required negative controls only for the duplicate-refusal tests, so this is not a gap.

**e2e-cli CI is still required and unproven.** Generated output changed, local `scaffold.runtime` is prohibited, and the coordinator owns the label that arms CI. This review is not the final verdict on the exact pushed head.

VERDICT: PASS
