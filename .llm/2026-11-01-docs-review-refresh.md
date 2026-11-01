# Docs review refresh — 2026-11-01

Assignment: refresh existing PR #2452 for #2451 through a normal merge and READY handoff. Main already incorporates all original maintained-source follow-ups. Preserve its content, renderers, tokens, defaults and tests; remove superseded differences rather than reconstructing the old patch.

The normal merge is d096ad665. All maintained files match main 6a1d84a byte for byte. The remaining delta retains the original run and records the current audit and validation. Original failed experiments and historical reviews remain available; fresh review and evidence use dated refresh artifacts in .llm/runs/fix-docs-review-followups--2451/.

Lesson: a conflicted PR may be fully superseded in source without its history having merged. Audit each acceptance item against current main, resolve overlaps to preserve the richer current implementation, prove source identity, and rerun consumer/carrier gates. Do not equate old green evidence with a current verdict. Refs links and a READY report hand off to Cockpit; this worker does not merge.

#2450 retains token-source consolidation ownership. A fresh strict build still reproduces Pagefind filter/meta/entry entropy, so #2453 remains separate. The existing bounded workflow policy is explicit and does not claim strict full reproducibility.
