# 2026-10-31 — Merged-tree fixtures and ambient timers

GitHub PR checks use a merge with current main. During S5a, #2506 changed the
approved Figma handoff from2186 to2189 variables and renamed native ink aliases;
#2507 also regenerated token contrast sources. The branch-local generated name
inventory was valid against its old base but stale in the CI merged tree.
Integrate current main, regenerate the independent name carrier, and derive the
fixture count from its authoritative index. Keep original evidence as historical
results, append new evidence for the updated input. Never revert approved main
fixtures to make a branch gate pass.

Deno tests in a combined shard can have Node ambient types from other modules.
Declare timers as ReturnType<typeof setTimeout> rather than number, even when
the isolated plugin suite passed. The structured failure is processFailure when
compilation fails before TAP; check that field when summary has0 passed/failed.
GitHub uploaded child reports preserve the compiler diagnostic beyond receipt
tails dominated by the measured shard's file list.
