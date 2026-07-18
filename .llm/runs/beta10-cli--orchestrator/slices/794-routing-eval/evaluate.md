# IMPL-EVAL — PR #794 review-pairing ladder

- Evaluator: Codex · OpenAI · GPT-5.6 Sol · xhigh (`review_claude`), separate opposite-family
  session from the Claude Opus 4.8 generator.
- Subject: `/home/codex/repos/b10-routing`, branch `chore/routing-review-ladder`, head
  `7084c9b0326ba7c5dcedd06ac6fb2bcff98ad8b0`, base
  `origin/feat/beta10-integration` at `7d353be24ccdf0de656f1e70ae73167102da8528`.
- Scope: four-file diff from `git diff origin/feat/beta10-integration...HEAD`; evaluation only.
- Date: 2026-07-16.

## Verdict

**FAIL_FIX**

The machine-readable routes, fallback families, guard, tests, and Sonnet reference all satisfy the
ratified ladder. The plan remains valid, but the canonical human-facing policy contradicts itself
about whether Fable can be auto-selected. Because `lane-policy.md` declares itself the rendered
human authority and the brief explicitly requires no prose/TS drift, the documentation must be
corrected before PASS.

## Numbered findings

1. **Blocking — `lane-policy.md` retains a global “never auto-selected” Fable rule that contradicts
   the new review-lane doctrine (`FAIL_FIX`).** Lines 33–34 and 61–63 say the
   `review_codex`/`review_codex_complex` Fable primaries are restored, in-plan, and auto-selectable,
   matching `routing-policy.ts:239-263`. But lines 84–94 then say “Fable 5 left the Anthropic
   subscription” and that it is outside-plan, approval-gated, and “never auto-selected,” without
   limiting those claims to the still-temporary non-review routes. This makes the single
   human-facing authority internally inconsistent and conflicts with its machine rendering. Scope
   the temporary-substitution heading/introduction and the “never auto-selected” bullet explicitly
   to the non-review routes still carrying `temporary_while_fable_outside_subscription` /
   `exceptional_paid_on_demand` (or otherwise name the two restored review exceptions). This is a
   focused prose fix; no rescope or debt entry is warranted.

2. **PASS — the machine bindings exactly implement the owner-ratified effort-pairing ladder.**
   `light_implementation` is Sol low and resolves to `review_codex_light` Opus high with Sonnet high
   fallback; normal/Sol medium resolves to `review_codex` Fable low with Opus low fallback;
   complex/Sol high resolves to `review_codex_complex` Fable medium with Opus medium fallback; and
   fast/Luna max resolves to `review_codex_fast` Opus medium with Sonnet high fallback. All eight
   review records are `agent: claude`, `provider: anthropic`, so fallback never trades away
   opposite-family review. The future Sol-max → Fable-high rule is present as prose at
   `lane-policy.md:41-43`, and the dated Sol effort-selection guidance is present at lines 67–82.

3. **PASS — the Fable-test rescope does not weaken a production consumer invariant.** Repository
   search found `resolveCanonicalRoute` and `CANONICAL_ROUTE_POLICY` consumed only by
   `runtime/routing-policy_test.ts`; no production module imports `routing-policy.ts`. The revised
   test continues to assert that every non-review Fable route is outside-plan and approval-gated,
   while separate tests assert that the two review Fable primaries are included, ungated,
   unconditional, and actually returned by `resolveCanonicalRoute`. The resolver also excludes
   `token_limit_fallback` from primary selection.

4. **PASS — volatile-model guard and focused runtime/config suite are green.** Evaluator re-ran
   `deno test --no-lock -A .llm/tools/agentic/runtime/ .llm/tools/agentic/config/`: **141 passed, 0
   failed**. This includes all four `no-hardcoded-volatile_test.ts` checks: the derived exact-value
   production-source scan, README allowlist check, and structural model/version/endpoint scan all
   passed. Test-pinned contract literals remain covered by the guard's explicit test allowlist.

5. **PASS — `MODEL_IDS.sonnet` is live, not orphaned.** The new config member is referenced by the
   `review_codex_light` and `review_codex_fast` fallback records at `routing-policy.ts:234` and
   `routing-policy.ts:288`; the fallback test asserts both resolve to Sonnet 5 high.

6. **PASS — focused hygiene gates and subject-worktree integrity.** The scoped repository wrappers
   reported 0 format findings across the four changed files and 0 lint findings across the three
   changed TypeScript files. `git diff --check` passed. A raw final `git status --short` was empty,
   and HEAD remained `7084c9b0`; evaluation did not modify the subject worktree.

7. **Process note (non-blocking).** The slice brief contains the required `use harness` and
   `## SKILL` chapter, and the launch record shows requested/observed route identity matched
   `review_claude` (Sol xhigh). This supervisor-dispatched chore has no dedicated `plan-eval.md` in
   its slice directory; its approved scope and owner-ratified decisions are recorded in the brief
   and orchestrator worklog. Consistent with the orchestrator's prior fix-slice evaluations, this is
   recorded for protocol visibility but is not the basis of the technical `FAIL_FIX` verdict.

## Evidence commands

- `git diff origin/feat/beta10-integration...HEAD`
- `rg` searches for `resolveCanonicalRoute`, `CANONICAL_ROUTE_POLICY`, routing-policy imports, and
  `MODEL_IDS.sonnet`
- `deno test --no-lock -A .llm/tools/agentic/runtime/ .llm/tools/agentic/config/` → 141/141
- `.llm/tools/run-deno-fmt.ts` on the four changed files → 0 findings
- `.llm/tools/run-deno-lint.ts` on the three changed TypeScript files → 0 findings
- `git diff --check origin/feat/beta10-integration...HEAD`
- raw `git status --short` → clean

## Cycle 2

### Verdict

**FAIL_FIX**

Commit `547b40a9a1bb03f6b03f18fa73b9752a3d4e1971` resolves cycle-1 finding 1's
auto-selection contradiction: the section is now explicitly limited to non-review routes and names
`review_codex` / `review_codex_complex` as restored, in-plan, auto-selectable exceptions. However,
the replacement prose introduces one narrower prose/TypeScript mismatch, so the requested no-drift
bar is not yet met.

### Findings

1. **PASS — cycle-1 finding 1 is substantively resolved.** `lane-policy.md:84-97` now limits the
   “never auto-selected” statement to non-review routes and explicitly exempts the two restored
   Fable review primaries. That agrees with the canonical table at lines 33-34 and the unchanged
   `review_codex` / `review_codex_complex` bindings in `routing-policy.ts`.

2. **Blocking — the new scope sentence incorrectly includes the deep-analysis Fable fallback in
   the named-condition substitution group (`FAIL_FIX`).** `lane-policy.md:86-91` says the section
   covers routes carrying `temporary_while_fable_outside_subscription` or
   `exceptional_paid_on_demand`, then parenthetically identifies “the deep-analysis Fable fallback”
   as part of that group. In `routing-policy.ts:110-119`, the deep-analysis Fable route instead
   carries `fallback_only_after_codex_quota_exhausted`; it is a quota-classified fallback behind a
   Codex primary, not a temporary Fable-to-Opus substitution. Remove it from that parenthetical, or
   describe its distinct condition and non-substitution role separately. This is another focused
   prose correction; the TypeScript policy remains correct and unchanged.

3. **PASS — cycle-2 scope and validation are clean.** `git diff 7084c9b0..547b40a9` changes only
   `lane-policy.md`; the three TypeScript files are byte-unchanged. The scoped formatting wrapper
   reported 0 findings, `routing-policy_test.ts` passed **14/14**, `git diff --check` passed, and the
   subject worktree remained clean at `547b40a9`.
