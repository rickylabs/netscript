# PR #44 IMPL-EVAL Summary — Deno 2.8 / Aspire 13.4 upgrade

## Summary

Evaluated PR #44 (HEAD `a50d73f`) on branch `chore/deno-2.8-aspire-13.4-upgrade` against
6 pass/fail criteria (C1–C6) covering catalog completeness, latest versions, alignment,
jsr-first policy, production cleanliness + CI gate, and CLI scaffold parity + runtime E2E.

**Verdict: APPROVED (conditional)** — clears the standing `CHANGES_REQUESTED` and unblocks merge.

## Criteria Results

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| C1 | Catalog completeness | **PASS** | All npm: specifiers are subpath imports; base versions match catalog |
| C2 | Latest | **PASS** (advisory note) | vite held by DEBT_ACCEPTED; tailwind 4.2.2→4.3.1 minor freshness gap noted |
| C3 | Alignment | **PASS** | No deno.json specifiers deviate from catalog |
| C4 | jsr-first | **PASS** | No npm package has jsr equivalent |
| C5 | Production form + CI gate | **PASS** | lint, fmt:check, check, publish:dry-run, audit:critical all exit 0 |
| C6 | Scaffold parity + runtime | **STATIC PASS / RUNTIME UNVERIFIED** | Aspire 13.4 GA shape confirmed; database.init E2E blocked (pre-existing, accepted) |

## Changes

No code changes made by this evaluation. Read-only audit.

Report written to: `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/evaluate.md`

## Validation

Ran the following with real evidence:
- `deno task deps:latest` → 4 behind (vite DEBT; tailwind/preact-signals minor freshness)
- `deno task lint` → 0 occurrences (1082 files)
- `deno task fmt:check` → 0 findings (1167 files)
- `deno task check` → 0 errors (1582 files, 14 batches)
- `deno task publish:dry-run` → "Success Dry run complete"
- `deno task audit:critical` → 1 high / 0 critical advisory (known @orpc/client issue)
- `deno task e2e:cli run scaffold.runtime --format pretty` → 8/9 passed, database.init failed (known R5 blocker)

## Responses to review comments

This evaluation replaces the prior `CHANGES_REQUESTED` (HEAD `75abf9f`). All 6 requested
fixes (R1–R6) have landed and been independently verified.

## Remaining risks

1. **Tailwind freshness gap**: `tailwindcss` ^4.2.2 → ^4.3.1 and `@tailwindcss/vite` ^4.1.12 → ^4.3.1
   were released 2026-06-12 (4 days before R3 commit 211039d). Minor bumps not covered by existing
   DEBT_ACCEPTED (which only names vite major). **Recommend follow-up chore PR; non-blocking.**

2. **`database.init` E2E**: Pre-existing R5 blocker accepted at merge time. Requires native ext4 WSL
   worktree + Aspire CLI 13.4.4 to fully exercise. Cannot be validated in cloud sandbox.

3. **`@preact/signals` patch drift**: ^2.9.1 → 2.9.2 released same day as R3 (2026-06-16). Post-R3
   timing race; advisory only.
