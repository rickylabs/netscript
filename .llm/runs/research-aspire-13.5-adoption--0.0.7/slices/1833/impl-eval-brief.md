You are an INDEPENDENT IMPL-EVAL evaluator, in a SEPARATE session from the implementation author
(Codex GPT-5.6 Sol). Do not inherit or restate the author's claims. EVALUATE ONLY — no edits.

## Worktree (read-only)

`/home/agent/projects/netscript/worktrees/007-eval-slot2` — detached at `b7d0a60ac`.
Base `main` `71d5fb8e0`; evaluate `git diff 71d5fb8e0..HEAD`.

## Slice

**#1833 / PR #1835** — residual Aspire key-normalization mismatches. `Closes #1833`.
Follow-up to #1831 (merged), which fixed the browser **full** key only.

Three residuals were to be fixed:
1. **Shorthand divergence** — SDK replaced only hyphens; Aspire normalizes all invalid identifier
   chars. Proven pre-fix: `orders.api` → SDK `VITE_ORDERS.API_URL` vs Aspire `VITE_ORDERS_API_URL`.
2. **Deploy prebuild** — `build-windows-prebuild.ts` *skipped* full-key injection for hyphenated
   names instead of normalizing.
3. **Cross-package pin corpus too narrow** — only two inputs, so a one-sided rule change preserving
   those could diverge on e.g. `a--b` while staying green.

## Hard constraints to verify

- **`packages/sdk/src/discovery/service-url.ts` MUST be unchanged.** The server path correctly
  preserves hyphens and matches real Aspire server output; changing it breaks real discovery.
- **#1831's merged browser full-key behaviour must be preserved exactly** (it shipped under an
  accepted IMPL-EVAL).
- **The normalization rule must remain single-source** — no third/fourth divergent copy.

## What to assess (cite `file:line`)

- Do SDK and Aspire now agree on the **shorthand** for all invalid-character classes — leading,
  embedded, trailing punctuation, consecutive underscores, whitespace, empty string, leading digit?
  Find an input where they still disagree, or state that you could not.
- Does the deploy prebuild now emit the **normalized full key**, and is its extracted
  `buildVitePrebuildEnvironment()` actually covered by tests that would fail on regression?
- **Is the widened corpus genuinely sufficient?** The prior evaluation showed a two-input pin was
  defeatable by a change preserving those inputs. Would the new corpus fail on a one-sided change
  such as collapsing consecutive underscores, or stripping leading digits? Demonstrate, don't assert.
- Fallback ordering (browser full → shorthand → server) still intact.
- Doctrine: no `any`, unsafe casts, or new lint-ignores; `packages/sdk` public-surface impact.

## Output

**[PHASE: IMPL-EVAL] [VERDICT: <PASS|CHANGES_REQUESTED>]**

### Findings
numbered; severity + what + `file:line` + why it matters + required action. If none: "None."

### Test adequacy
explicitly answer the corpus-sufficiency question

### Verdict rationale
3–6 sentences

Under 900 words. Ground every claim in a file you read. Say so if you cannot verify something.
