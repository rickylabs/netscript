# Browser policy review — FAIL_FIX

Independent Claude Opus 5.5 high effort, read-only. Policy shape accepted; proof, ratchet semantics and reporting need correction.

**FAIL_FIX**

The policy is the right shape for this slice. All three blockers are about proving or recording it, not changing its design.

**Why a baseline fits #2413.** The existing findings come from two places, and both would need edits outside this run's approved scope:
- **Contrast failures** come from token colours. Examples: muted nav labels at 3.64:1, white on destructive at 3.85:1, the success and secondary badges at about 4.3:1. Changing those colours is the deferred tokens v2 / theme work, and it would also change the before screenshots that S0 is supposed to keep unchanged.
- **The critical tray-menu finding** (`aria-required-children` and `listitem` inside `role="menu"`) comes from `packages/fresh-ui/registry/components/ui/desktop-tray-menu.tsx`. That file is outside the approved write surface, which only covers the token builder, `deno.json`, the lock, the README and `registry/theme/*`.

So holding the existing findings in a reviewed baseline, instead of fixing them here, is defensible. The policy also doesn't weaken anything:
- It's a new gate, and no existing workflow gate is removed or loosened.
- The scan stays complete, with no disabled rules and no excluded DOM.
- Custom routes start with zero allowances.

### Blockers

**F1. The negative control doesn't test the baseline matching.** The injected unnamed button triggers `button-name`, a rule that has no baseline entries. That control would still fail even if matching were broken at the rule level, so it only proves "a new rule fails". It doesn't prove "a new target under an already-baselined rule fails", which is where a baseline gate usually goes wrong. Add two more controls, run through the same gate:
- one new element that breaks a rule already in the baseline, such as low-contrast text injected into the page or an extra `li` inside the existing `role="menu"`;
- one extra copy of a baselined node, to show the count limit is enforced.

Keep the unnamed button as the third control.

**F2. "Counts ratcheted" needs a definition that can only go down.** As described, a finding that gets fixed would keep its allowance, and a later regression on the same target would come back silently. The gate must also fail when:
- a baseline entry no longer matches anything (a stale allowance);
- a fingerprint's observed count is below its baseline count, until the baseline is lowered in a reviewed commit.

Without that, the baseline becomes a suppression list that only grows. It also needs a provenance record: which axe-core version and Chromium version produced it, and that it was reviewed.

**F3. The plan and Definition of Done claim more than this delivers.** Plan decision 5 says axe checks "real pages with no rule suppressions", and the PR's Definition of Done says routes "pass … axe scans". The planned risk response was "minimal corrections … record scope expansion first", and the plan says "No new architecture debt is accepted." To keep reporting honest:
- Record a dated entry in `drift.md` for the switch from fixing to a baseline.
- Update decision 5 and the Definition of Done to say "no serious/critical findings beyond the reviewed S0 baseline".
- List the baselined findings as **existing** accessibility debt, by rule, impact, component and route/theme/width. Name the later epic slice that retires each group: tokens v2 for contrast, a fresh-ui component slice for the tray menu.

Nothing should be reported as "axe clean".

### Not blocking
- **Selector stability.** Axe targets include `:nth-child(...)` and escaped Tailwind class names, so fingerprints can change when content does. Confirm the baseline matches on the CI runner before recording a green result, and expect a reviewed baseline update whenever gallery content changes.
- **Readable reports.** The Playwright JSON reporter stores the axe attachments as base64. Also writing each axe report as a plain JSON file in the output directory would make the uploaded artifact easier to review.
- **Before PNGs location.** `test-results/` is gitignored, so the committed before PNGs need a separate tracked path. The capture script appears to handle this; check it in IMPL-EVAL.

I wrote no files and ran no commands.
