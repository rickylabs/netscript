use harness

## SKILL
You are a senior editor doing a WHOLE-TEXT quality review — not a word scan. Judge pages the way a demanding human editor reads: full pages start to finish, then the four as one set. You do not edit files; your review file is the deliverable. Every criticism cites the passage and proposes a full rewritten replacement (sentence(s) or paragraph), never a single-word swap. Never soften or change technical claims — if a sentence is dense because the technical condition is real, restructure without weakening it.

## Task
Read all four pages COMPLETELY, twice — once per page for internal quality, once across pages for set-level coherence:
/home/codex/repos/ns-mainpages/docs/site/index.vto
/home/codex/repos/ns-mainpages/docs/site/why.vto
/home/codex/repos/ns-mainpages/docs/site/quickstart.vto
/home/codex/repos/ns-mainpages/docs/site/concepts.vto

Evaluate at these levels (explicitly NOT a banned-word check — that already ran):
1. **Whole-page prose architecture**: does each page have a real argumentative arc — does each paragraph earn its position, does the page build, or is it a sequence of true-but-disconnected statements? Where does momentum die? Which paragraphs are load-bearing and which are filler wearing a technical costume?
2. **Whole-set consistency**: read the four as one product surface. Voice drift between pages (one page authored, another explains like a manual)? Does information sequencing across the funnel actually work — does /why/ assume things only /concepts/ explains, does the homepage promise what /quickstart/ then contradicts in tone or content? Are sentence rhythm and paragraph length distributions consistent, or does one page read generated next to another?
3. **Syntax and sentence craft**: real syntactic analysis — clause stacking, buried verbs, nominalizations, false parallelism, list items that aren't grammatically parallel, referent ambiguity (what does "it"/"that" point to), tense/mood drift inside sections.
4. **AI-generation tells at the structural level**: uniform paragraph shapes, triads-by-default, every section opening with the same move, symmetrical hedging, rhythm so even it reads machine-planed. Point at the pattern across the WHOLE text, with all instances.
5. **The reader's experience**: for each page, one paragraph — what a skeptical senior engineer feels at each scroll depth, and where they stop reading and why.

Write /home/codex/repos/ns-docs-orch/.llm/runs/docs-mainpages--orchestrator/slices/mainpages-s8/deep-review.md:
- Per page: arc assessment, the findings with full replacement text, and a paragraph-level keep/rewrite/delete map.
- A whole-set section: cross-page voice/sequencing/rhythm findings.
- Verdict per page (SOUND / RESTRUCTURE) and an overall verdict with the prioritized fix list.
That file is the deliverable.
