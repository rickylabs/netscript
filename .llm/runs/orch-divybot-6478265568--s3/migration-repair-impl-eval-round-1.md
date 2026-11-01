# IMPL-EVAL for the migration repair round: PR #2467, head d5f5fa5f3 (repair commit faad5805c)

**Verdict: FAIL_FIX.** Two concrete blockers remain. I made no edits and ran nothing; I did not verify external CI.

## Blocker 1: the Markdown repair is not stable under the migration's own formatter, so a second run aborts

**Where:**
- `packages/fresh-ui/registry/components/ui/markdown.tsx.template:122`
- the matching "after" text in the versioned data, `packages/cli/src/public/features/ui/migrate/data/3.ts:100`
- the check that rejects it, `migrate-source.ts:21-33`

**What the "after" text looks like:** `: "ns-markdown"} data-part="root" data-scope='prose'>` on one line of about 108 characters. It mixes double and single quotes. The rest of the template, like every formatted registry `.tsx` file, uses single quotes.

**Why it breaks idempotence:**
- After applying edits, the use case formats every changed file with `deno fmt --no-config --line-width 100 --single-quote` (`generated-source-format-policy.ts:2-7`, `migrate-ui-variants-use-case.ts:73-83`).
- That formatter rewrites `"ns-markdown"` and `"root"` to single quotes. Formatted registry `.tsx` files contain no double-quoted JSX attributes, which shows the formatter normalizes them. Because the line is over 100 characters, it also wraps the attributes.
- On the next run, neither the "before" text nor the exact "after" text exists in the file, so line 24 reports `Customized markdown.tsx, source edit 1` and the whole batch aborts.

**Trigger:** an app that has the 0.0.8 Markdown copy, from the `ai` preset or `ui:add markdown`.
1. Run `netscript ui:migrate variants`: it succeeds.
2. Run it again: it fails with a manual-merge diagnostic.

**Consequence:**
- This contradicts "Running it again makes no changes" (`README.md:5`).
- It permanently blocks later runs for that app, including runs needed to migrate other files.

**Why the evidence missed it:** the consumer replay scaffold doesn't install `markdown`, so its `secondRunChangedFiles: 0` doesn't cover this component. This flaw predates the repair. My earlier PASS missed it, but this round rewrote exactly this hunk.

**Minimal fix:**
1. Write the changed span of the template exactly as the canonical formatter would output it: single quotes, attributes wrapped at 100 characters.
2. Regenerate `data/3.ts` with the existing generator.
3. Add a regression test that applies the Markdown hunk to its "before" text, formats it with the canonical policy, and runs the migration again. It should report zero diagnostics and zero changes. Alternatively, add `ui:add markdown` to the consumer replay.

## Blocker 2: spread detection misses a literal class placed before a spread

**Where:** `packages/cli/src/public/features/ui/migrate/migrate-source.ts:69-72`, where `hasSpreadOnlyTag` is set only when a tag has no `class`/`className` attribute. The residual check at `:128-139` only runs when that flag is set.

**Trigger (same file, direct producer):**

```tsx
const props = { class: 'ns-btn ns-btn--ghost' };
export const view = <button class='ns-btn' {...props} />;
```

In Preact, the later spread wins, so the legacy classes reach the element only through the spread. That is the reported blocker-2 case.

**What happens now:**
- The literal `class='ns-btn'` has no modifiers, so nothing is edited.
- The tag isn't flagged as spread-only, so the residual `ns-btn--ghost` text raises no diagnostic.
- The file is left unchanged, and the matching CSS migrates `.ns-btn--ghost` to `:where(.ns-btn)[data-variant='ghost']`.

**Consequence:** a silent loss of the ghost styling, which is the same failure the repair was meant to close. The README only bounds imported or indirect producers, not same-file ones. The existing control at `migration-preflight_test.ts:112` correctly accepts the opposite order, where the class comes after the spread and wins.

**Minimal fix:**
1. Also set the flag when a spread attribute appears after the class attribute (`attribute.name === '...' && attribute.start > classes.start`).
2. Add this input as a negative test that expects zero writes.
3. Re-run the 0.0.8 consumer replay, because copied components may put a class before `{...props}`.

## Checked, no blocker

- **Reversed CSS state classes are fixed.** `migrate-css.ts` now resolves each token against its whole compound after scanning it. Inside `:is`/`:where`/`:not` it inherits the outer compound; inside other functions, past combinators and across comma branches it does not.
  - Tests cover all five state families in both orders, plus nested `:is`/`:not` cases.
  - Negative controls cover descendant, child-combinator and sibling-branch subjects, a negated base, a base inside an attribute value, and look-alike classes.
  - The rewritten tokens keep their specificity.
- **Spread-only tags are fixed.** Tags with only a spread now fail preflight for `class`, `className`, inline-object and state-hook producers. The whole-app test checks zero writes and unchanged bytes in both dry-run and apply, then shows the corrected producer migrating.
- **The jsx-curly-braces lint failure is fixed.** `data-part="root"` passes the rule. The template guard and the copied-output lint test both include failing string-in-braces controls.
- **Other evidence holds.** The 0.0.8 replay converts 62 files and the second run changes none, both 188-case parity runs pass, and the README describes the same-file detection boundary accurately apart from the gap in blocker 2.

## Still required before READY

Final-head required CI and both runtime jobs.

**Overall verdict: FAIL_FIX** (blocker 1: the Markdown hunk breaks re-runs after formatting; blocker 2: a literal class before a spread escapes preflight).
