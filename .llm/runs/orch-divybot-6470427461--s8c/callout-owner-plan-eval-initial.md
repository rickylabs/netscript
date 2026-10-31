**Verdict: FAIL_PLAN**

There is one missing decision that blocks starting. Everything else in the plan is sound for the owner's requirements.

### Blocker 1: the plan doesn't say how a custom-titled callout's type survives in Markdown twins and the regenerated carriers

- **Where:** `.llm/runs/orch-divybot-6470427461--s8c/callout-owner-plan.md`, the "Commit slice" line.
- **Problem:**
  - Today the eyebrow is a visible inline element in `.ns-callout__head` (`docs/site/_components/callout.vto:6`). The twin converter writes it out as quoted text (`docs/site/_plugins/ai-tooling.ts`: `aside` → `quoteMd`). So every twin, and the CLI and MCP carriers built from twins, currently carries the callout type.
  - The plan removes the eyebrow and lets a custom title replace the visible type. It keeps the type only in the `afterRender` accessible name, which the twin converter never reads.
  - Every custom-titled callout would therefore lose its type in Markdown twins, `llms-full.txt`, the CLI prose carrier and the MCP embedded docs. For example, the WARNING "Copy-source ownership tradeoff" in `docs/site/web-layer/fresh-ui.md:244` would become a plain quote.
  - The plan regenerates all four carriers in this same slice. Deciding this afterwards would mean redoing the twin serializer and regenerating the carriers again.
- **Correction:**
  - Lock how a callout is written in twins and add it to the slice. For example, have `ai-tooling.ts` read the callout type from a data attribute and emit a GitHub alert marker (`> [!WARNING]`) followed by the label line. Any other explicit format that always keeps the type is fine.
  - Add assertions that a default callout and a custom-titled callout for each tone keep both the type and the title in the twin, and appear exactly once.
  - Note the expected carrier diff, which is every page with a callout, so the carrier comparison can confirm it.

### Checked and passing

- **The label decision covers the owner's requirements.** There is one label only. Default types are in sentence case, with the Error alias and the fallback to Note kept. A custom title replaces the visible type, and the accessible name keeps both the type and the rendered title text. The label uses Host Grotesk Medium at the inherited 14px/22px body size in the tone's text colour. The mono uppercase eyebrow is gone.
- **The geometry adds up.**
  - The icon box is `1lh`, which is 22px at the callout's 22px line height. The 18px glyph is centred in it, so the icon's centre sits 11px down, at the middle of the first label line, even when the title wraps.
  - The grid columns are `1lh` and `minmax(0,1fr)` with an 8px gap. That puts the label's left edge 30px in, and the body's `calc(1lh + 8px)` padding equals the same 30px.
  - Removing the mobile title offsets (`docs/site/styles/components.css:896-902`) is correct.
- **The proof plan is complete.** Every tone gets a long custom title that wraps even at 1280. Independent browser checks cover the label text, the absence of the eyebrow and of duplicates, the font, weight, size and tone colour, the icon centre matching the first line within 1px, and the body's left edge matching the label. They run at 390 and 1280 in light and dark.
- **The gates are kept.** That includes the AA and style negative controls, carrier order and freshness, restoring `docs/site/deno.lock` to exactly match main, reproducibility, the full browser run, and IMPL-EVAL. Deferred items and runtime limits are disclosed, and no merge is certified.

After this decision is added to `callout-owner-plan.md`, re-run PLAN-EVAL before any code.
