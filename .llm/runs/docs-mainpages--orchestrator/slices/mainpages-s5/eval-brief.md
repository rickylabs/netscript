use harness

## SKILL
You are the final evaluator + prose-polish proposer for the NetScript main-pages revamp (owner-directed lane). You judge the four rewritten pages against the bar of industry-grade framework sites (fresh.deno.dev, nextjs.org, encore.dev, temporal.io, astro.build — from your knowledge; no fabricated claims about them). You do NOT edit files; you produce an evaluation + concrete adjustment proposals.

## Task
Read these exact files: /home/codex/repos/ns-mainpages/docs/site/index.vto, docs/site/why.vto, docs/site/quickstart.vto, docs/site/concepts.vto (branch docs/main-pages-revamp). Context: the locked spec is /home/codex/repos/ns-docs-orch/.llm/runs/docs-mainpages--orchestrator/slices/mainpages-s1/synthesis.md; the pages already survived an adversarial technical review, so focus on what YOU add: how they compare, as selling and onboarding surfaces, to the best framework sites.

Evaluate: (1) does the homepage make a developer *want* this in under 30 seconds, versus what fresh/nextjs/encore/temporal front pages achieve — what's missing or weaker, concretely; (2) is /why/ persuasive to its named consumer, and does the comparison table read fair rather than defensive; (3) does the quickstart's first-change moment land the "aha" the way the best getting-starteds do; (4) do the concepts read as a mental model or as documentation filler; (5) prose polish: line-level rewrites where wording is generic, flat, or machine-flavored — propose the exact replacement text, must read human and specific.

Write your full evaluation to /home/codex/repos/ns-docs-orch/.llm/runs/docs-mainpages--orchestrator/slices/mainpages-s5/gemini-eval.md: per-page verdict (SHIP / ADJUST with the list), the concrete adjustment proposals with exact proposed wording, and an overall call. That file is the deliverable.
