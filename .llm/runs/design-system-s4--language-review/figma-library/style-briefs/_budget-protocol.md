# Figma call budget (owner decision, 2026-10-28; corrected the same evening)

Figma's MCP server allows **200 tool calls per day and 10 per minute** per Full seat on the Professional plan. Every `use_figma`, `get_screenshot`, `get_metadata` and `create_session` call counts. All builders share one seat, so the budget is shared. The owner chose to stay within it.

## Correction (verified ~20:15 UTC)

The refusals that stopped the builders were the **10 calls per minute** limit, not the daily cap. A single probe succeeded after many more than 200 calls had run that day. The binding constraint is therefore the per-minute rate across all builders.

- Run **at most three builders at once**.
- Each builder paces itself to about **3 calls per minute**.
- On a refusal, wait 60–90 seconds, probe with one tiny read, and resume. Never stop a run just because of a refusal.
- The per-run 60-call cap below is lifted. Stop only for context budget, at a category boundary.

## Rules (they add to `_builder-protocol.md` and override it where they conflict)

- **One builder at a time.** Parallel builders only spend the shared budget faster.
- **Budget per run:** at most **60 Figma calls**. Count every call. Stop cleanly at a category boundary before 60.
- **Scripts.**
  - Build a whole category's sets in as few `use_figma` calls as possible: one large script per 3–6 sets, up to the 50k-character limit.
  - Keep helpers inline. A shared prelude is fine, but there is no session state between calls, so paste it into each script.
  - Read state inside the same script that mutates. Never spend a call only to inspect.
- **Screenshots:** two per category at most, the review frame (light and dark) and the strip. Never per set.
  - Verify geometry in-script instead: return measured sizes, variant counts, property parity, unbound-paint counts and text overflow (`textAutoResize` or width checks).
  - Fix defects inside the next build script.
- **Pacing.** No more than 10 calls a minute. Think between calls, not in tiny probes.
- **Errors.** If a call returns the rate-limit error, stop immediately. Write the ledger, with everything built so far and the exact next step, and report. Never retry in a loop.
- **Ledgers:** keep the per-group ledger file and update it before stopping.

## Order of work (coordinator)

1. Fluent: `Fluent/Data table`, review, strip, swap test, sweep (ledger-style-g3b).
2. Filigrane: verify the 8 built Forms sets, then the rest of Forms, then Navigation, Overlays and Data display 1 (ledger-style-g5b).
3. Bloom: Navigation, Overlays, Data display 1 (ledger-style-g1b).
4. Liquid: whatever G2b left (ledger-style-g2b or g2).
5. Brutal: whatever G4b left (ledger-style-g4b or g4).
6. Base categories, each followed by its style passes: Data display 2, Layout & blocks, AI, Desktop, Docs kit.
