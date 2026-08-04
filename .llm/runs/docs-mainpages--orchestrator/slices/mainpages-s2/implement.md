use harness

## SKILL
Docs main-pages revamp, slice S2: DRAFT the four main pages. SCOPE-docs: you touch ONLY docs/site/{index,why,quickstart,concepts}.vto (and, if strictly needed, their front-matter/nav wiring). No packages/, no plugins/. Every API claim and code sample verified against the workspace source (`deno doc` / direct reads) before it goes in a page. No marketing filler ("seamlessly", "powerful", "enterprise-grade"); prose must be specific and human.

## Task
Worktree: /home/codex/repos/ns-mainpages (branch docs/main-pages-revamp off origin/main).

Your binding spec is /home/codex/repos/ns-docs-orch/.llm/runs/docs-mainpages--orchestrator/slices/mainpages-s1/synthesis.md — the locked arbitration of an adversarial outline round. Read it first, then the two outlines and two critiques in the same dir for the full reasoning (outline-codex.md is your own earlier analysis; the critiques contain verified facts — respect every "locked" point and every ban).

Rewrite the four pages to their locked roles:
- docs/site/index.vto — one screen: the locked hero ("Your checkout survives the crash. Your types survive the refactor."), one-sentence subhead, three locked proof points, ONE code moment (a saga whose caption matches what the code actually does — if you show compensation, the snippet's failure path must actually trigger it; verify against packages/plugin-sagas-core README + define-saga.ts), exit strip of links. Kill everything else per the kill lists.
- docs/site/why.vto — hero "For teams whose TypeScript app has become a system."; the integration-tax argument; comparison table incl. Temporal row with only repo-supportable cells; honest trade-offs section.
- docs/site/quickstart.vto — path not tour: init → scaffold → aspire start → success check → one designed first change. Flags shown must match the success check (check init-command.ts defaults for --service).
- docs/site/concepts.vto — spine contracts → services → plugins → web layer → observability; absorb the homepage's architecture exposition; trim mechanics to links.

Bans (hard): links to /capabilities/, hard-coded :18888, volatile counts, unearned adjectives, absolute competitor claims, cross-page duplication of the same fact (each core fact lives on exactly one page; others link).

Validation before you finish: `cd docs/site && deno task build` exits 0; `deno task docs:links` from repo root passes. Commit your work in small slices on the branch (conventional messages, Refs #1208 is WRONG here — this is Charter A, use no issue ref unless you find a fitting one) and push with explicit refspec `git push origin HEAD:refs/heads/docs/main-pages-revamp`. Do NOT open a PR; the orchestrator does. Write a summary of what you changed per page to /home/codex/repos/ns-docs-orch/.llm/runs/docs-mainpages--orchestrator/slices/mainpages-s2/draft-report.md (that file is the completion artifact).
