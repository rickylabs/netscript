**Verdict: FAIL_PLAN**

There is one blocker, in the contrast extension. The three user-requested fixes (danger/security semantics, distinct icons, and the docs-site lock) are planned soundly.

### Blocker 1: the step-12 kind-badge roles break the merged kind-tag spec and the token-ownership rules

- **Where:** `.llm/runs/orch-divybot-6470427461--s8c/review-blockers-plan.md`, Constants line 10 and the measurement note at line 15.
- **The plan:** "Four generated `--ns-api-kind-*` text roles choose existing syntax step11 unless the exported surface backgrounds need step12 from the matching Figma ramp … No Figma snapshot edits or handwritten colours."
- **Conflict with the merged spec.** `docs/design-system/themes/studio/DESIGN.md:331-334` says kind tags use "its syntax colour" (function and method `function`, class `type`, …). The owner-review round locked exactly that mapping, and the browser test checks tag paint against the `code/syntax/*` role. Repainting light function, type and number tags in step 12 silently drops the owner-locked rule. The plan proposes no spec update and records no owner decision.
- **Conflict with token ownership.** The generator emits only roles the Figma export declares through `codeSyntax`, plus compatibility aliases that point at other semantic roles (`tools/docs-site/generate-tokens.ts:47-66`, `113-146`). The guidelines say Figma owns values while code owns names, and that components never read primitives (`docs/design-system/GUIDELINES.md:35`, `:41-43`). New `--ns-api-kind-*` roles that point straight at Figma primitive ramp steps would be semantic or component roles that exist only in code. "No Figma snapshot edits" doesn't fix that, because the role and its value choice would still be made in code, not Figma.
- **Why it can't wait.** It changes the token layer: the old-declaration compatibility test and token freshness. It changes the kind-tag browser contract and the spec. Deciding later would mean redoing the tokens, the tests and the carriers.
- **Correction (lock one option before code):**
  - **(a) Keep the spec colours (no owner input needed).** Keep kind tags on their exported `code/syntax/*` roles. Make sure no kind tag is ever rendered on `--ns-surface`, or on any background where the measured light ratios fall below 4.5:1. Prove it with the existing actual-ancestor contrast test across every route where tags appear, Docs kit included. If the coordinator's "surface contrast" item really requires tags on raised or sunken surfaces, record that in drift as needing a new owner or Figma export.
  - **(b) Change the spec through its owner.** Get an owner-approved Figma export that adds kind-badge roles to the Scheme collection, plus a matching update to `DESIGN.md:331-334`. Then generate those roles through the normal `codeSyntax` path, with the compatibility and contrast tests updated to match. This needs an owner decision, so it can't be assumed in this plan.

### Checked and passing

- **One callout type contract.**
  - `tools/docs-site/callout-types.ts` defines each type's label, tone, icon and Markdown type, and feeds both the Vento component and the twin serializer.
  - A missing type defaults to Note. An unknown explicit type now fails the build instead of quietly becoming Note.
  - A site-wide scan of authored types fails on unknown or dynamic types. Swapping the public gallery's unknown example for Danger lets that scan cover every case, and unknown rejection is tested separately.
- **Danger and the ERP notices.**
  - Danger uses the destructive tone with the octagon-alert icon and serializes as `[!CAUTION]`.
  - Both ERP notices become caution, with browser and twin assertions.
  - Error stays destructive but gets its own circle-X icon.
- **Distinct icons.** Each type gets its own icon: info, lightbulb, message-square-warning, triangle-alert, octagon-alert and circle-X. Caution and Danger are the only pair allowed to share. Uniqueness is checked against both the normative names and the actual SVG shapes. The 18px glyph in a 22px box with an 8px gap, the single-label typography and all earlier owner assertions are kept.
- **Locks.**
  - Committing the full `docs/site/deno.lock` graph from the native build reverses the earlier "restore to main" rule. The reversal is justified and recorded.
  - It's proved by a fresh native build from clean git that leaves the tree clean and the root lock unchanged.
- **Carriers and gates.**
  - The carriers use the same four generators in the same order, with context and decode preservation and the MCP budget check.
  - The full gate set is kept, plus a scan of the PR diff for operator paths.
  - The plan states that refs-only with no force supersedes the earlier closing-keyword and force-push permissions.
  - There is no merge, tag or release.
  - #2450, #2453 and the Docker/runtime limitation stay explicit.

After this decision is locked in `review-blockers-plan.md`, re-run PLAN-EVAL before code.
