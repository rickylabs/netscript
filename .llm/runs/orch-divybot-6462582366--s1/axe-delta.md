# S1 axe baseline review

Complete12-case normal capture; all rules and the exact-node multiset validator remain enabled. The candidate run failed only for the two stale allowances below. No new/increased serious or critical finding is accepted.

## Every changed existing fingerprint

- `/design/components|light-1280`: `["color-contrast", "serious", [".ns-gallery-item__head > .ns-badge--warning.ns-badge"]]` count 1 → 0. The theme-seed catalog kind badge now uses readable muted presentation; this also prevents18 new theme-card copies of that old warning-badge defect.
- `/design/components|light-390`: `["color-contrast", "serious", [".ns-gallery-item__head > .ns-badge--warning.ns-badge"]]` count 1 → 0. The theme-seed catalog kind badge now uses readable muted presentation; this also prevents18 new theme-card copies of that old warning-badge defect.

## New cases

- `/design/tokens?preset=studio-utility|dark-1280`: zero serious/critical findings and zero allowances.
- `/design/tokens?preset=studio-utility|dark-390`: zero serious/critical findings and zero allowances.
- `/design/tokens?preset=studio-utility|light-1280`: zero serious/critical findings and zero allowances.
- `/design/tokens?preset=studio-utility|light-390`: zero serious/critical findings and zero allowances.

All other existing fingerprints and counts are unchanged. No known finding moved to a new selector. The original S0 screenshots are retained. Parent source commit is recorded by the recorder; sourceDirty explicitly marks the reviewed migration candidate. The independent supervisor reviews this baseline in the same migration commit.
