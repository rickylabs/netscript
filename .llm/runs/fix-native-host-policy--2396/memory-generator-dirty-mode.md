# Corpus generation versus freshness during a normal merge

A normal --no-commit main merge leaves the package/plugin read set staged and dirty relative
to HEAD. gen:mcp-export-corpus intentionally supports --allow-dirty in this case; record that
it generated from the coherent source union. check:mcp-export-corpus rejects --allow-dirty:
run the freshness check without it. Stage generated outputs before check:assets-barrel,
whose git diff --exit-code checks unstaged regeneration drift against the index. These
checks prove source freshness, not a clean commit or final-head independent acceptance.
