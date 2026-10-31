**Verdict: PASS — the callout addendum slice is signed off for review. This is not a merge or release certification.**

I found no code blockers, scope problems or evidence-honesty issues in the combined UI and carrier slice, measured from baseline `9769d7b91`.

### Implementation against the locked plan

- **There is one label, and the type stays in the accessible name.**
  - `docs/site/_components/callout.vto:5-7` renders one `.ns-callout__label`. It shows the sentence-case type (Note, Tip, Important, Warning, Caution, or Error for the legacy alias), or the author's title (through `ic`) instead. The eyebrow is gone, and unknown types still resolve to Note.
  - `docs/site/_config.ts:241-249` builds the accessible name from the stable `data-variant` plus the rendered label text. The result is "Type", or "Type: Title" for a custom title. Because the type always comes from `data-variant`, running the step again during an incremental render can't append the title twice.
- **The typography and geometry match the plan.**
  - The head is a grid with columns `1lh` and `minmax(0,1fr)`, `align-items:start`, an 8px gap, and the label at Host Grotesk weight 500 in the inherited 14px/22px (`docs/site/styles/components.css:444-467`).
  - The icon box is 1lh square with the 18px glyph centred. The body uses `margin-left: calc(1lh + 8px)`. The tone colour still comes only from the existing generated `*-text` roles.
  - The mobile title offsets are removed (`components.css:895-897`).
- **Twins keep the type.**
  - `docs/site/_plugins/ai-tooling.ts:229-242` handles only `aside.ns-callout` that has a type, a label and a body. It writes a `[!TYPE]` marker, the label (with inline markup kept) and the body, each once. Every other `aside` keeps the old serializer.
- **The tests check the details independently.**
  - `tools/fresh-ui-browser/docs-tests/docs.spec.ts:757-860` finds each callout by accessible name and confirms there is no eyebrow or old title element.
  - For all 12 gallery callouts it checks:
    - exactly one label and one body;
    - that the header text equals the label;
    - the font family, weight, size and casing;
    - that the icon is the tone colour and sized to the line height, with an 18px glyph;
    - that the icon centre sits within 1px of the first line's centre;
    - that the body's left edge equals the label's left edge, with an 8px gap;
    - that long custom titles wrap.
  - It also checks that each tone's marker and header appear exactly once in the twin, and that the marker count equals the number of callouts.

### Carrier slice

- **Every change is explained.** `.llm/runs/orch-divybot-6470427461--s8c/callout-carrier-comparison.json` shows 207 stored rows and 208 decoded entries, with nothing added or removed. The 107 changed pages exactly match the pages with callouts. No page changed without a callout and no callout page stayed unchanged, so the diff is fully accounted for (`llms.txt` is the only other change). The context entries are byte-identical and every row's integrity was verified.
- **The MCP growth fits the change.** The embedded docs went from 283,546 to 283,750 bytes, still under the 294,912 budget. The small increase matches the markers added to the embedded pages that have callouts.
- **`--allow-dirty` was again used only for the generated prose that step 1 had just written.**
- **The lock file matches main.** `docs/site/deno.lock` was restored to exactly match main after every step that rebuilds the site had finished.

### Evidence (reported to me, not observed)

- the focused callout browser run, 12/12 with four zero-blocking axe audits;
- carrier freshness and the generated-TS check;
- 12 tooling tests;
- the build, 24,219 links and 15 caveat references;
- exports, snippets, quality and typed check/lint/fmt;
- reproducibility for 254 HTML pages and 205 twins, with only the known #2453 Pagefind metadata differences and the strict default kept.

### Still pending (not certified)

- **The full serialized browser run of 116 tests,** including the screenshot matrix and axe audits.
- **The injected style-policy negative controls,** and the screenshot visual inspection that is still running.
- **Post-commit assets-barrel freshness.**
- **Hosted CI and the refreshed Pages artifact at the new head.**
- **The full CLI E2E (`scaffold.runtime`).** It's still unproven locally because Docker is unavailable, and the classifier skip limitation remains disclosed. This doesn't block IMPL-EVAL for a docs-content change, but it still blocks merge readiness under `AGENTS.md`.
- **Deferred work is unchanged.** #2450 and #2453 remain as previously recorded.
