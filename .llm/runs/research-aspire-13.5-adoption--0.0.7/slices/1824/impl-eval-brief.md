You are an INDEPENDENT IMPL-EVAL evaluator for the NetScript repository, in a SEPARATE session from
the implementation author (Codex GPT-5.6 Sol, session `01a05611-ee74-7ff2-9234-8e00691a3523`).
Do not inherit or restate the author's claims. EVALUATE ONLY — do not edit, stage, commit, or push.

**Note:** the generator produced a self-dispatched evaluation artifact in its own worktree. That is
inadmissible under the harness separation rule and has been discarded. You are the formal evaluation;
ignore any prior verdict material.

## Worktree (read-only, already checked out)

`/home/agent/projects/netscript/worktrees/007-eval-slot2` — detached at
`b05ae25b8`. Base is `main` at `dea449911`; evaluate `git diff dea449911..HEAD`.

## Slice

**#1824 / PR #1831** — "fix(sdk): normalize Aspire browser service keys". `Closes #1824`.

**Defect (verified in source before dispatch):** `packages/sdk/src/discovery/browser-env.ts`
interpolated the resource name raw into the **browser full key**, while the Aspire side normalizes
(`packages/aspire/src/application/build-vite-env-var-name.ts`, `value.replace(/[^a-zA-Z0-9_]/g,'_')`;
its docstring shows `workers-api` → `VITE_services__workers_api__http__0`). So the full-key lookup
could never match for hyphenated resources — masked only by the shorthand alias.

## What to assess (cite `file:line`)

1. **Correctness of the fix** — does the SDK's browser full key now agree with Aspire for hyphenated
   names *and* every other invalid identifier character?
2. **Single-source-of-truth risk (the central question).** The fix defines
   `normalizeViteIdentifierSegment()` locally in the SDK rather than importing from `packages/aspire`.
   Is the accompanying **cross-package agreement test** strong enough to prevent silent divergence if
   either side's rule changes later? Would it actually fail on a one-sided change? If not, say so and
   state what would.
3. **Blast radius.** Confirm the **server** path (`packages/sdk/src/discovery/service-url.ts`) is
   untouched — it correctly preserves hyphens and matches real Aspire server output, so changing it
   would break real discovery. Confirm `createBrowserServiceShortEnvKey` is unchanged.
4. **Test adequacy** — do the tests constrain behaviour or are they shape-only? Are the RED cases the
   right ones? Is fallback ordering (browser full → shorthand → server) still covered?
5. **Doctrine** — no `any`, no unsafe casts, no new lint-ignores, public-surface impact of
   `packages/sdk` considered.
6. Any real defect: an input where the two implementations still disagree, an unhandled edge case
   (empty string, leading digit, all-invalid characters), or a regression in fallback behaviour.

## Required output format

**[PHASE: IMPL-EVAL] [VERDICT: <PASS|CHANGES_REQUESTED>]**

### Findings
numbered; severity + what + where (`file:line`) + why it matters + required action. If none: "None."

### Test adequacy
short assessment, explicitly answering the divergence question in (2)

### Verdict rationale
3–6 sentences

Under 900 words. Ground every claim in a file you actually read. If you cannot verify something, say
so explicitly rather than assuming.
