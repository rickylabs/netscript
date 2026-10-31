**S2 slice review, issue 2269 (read-only, blockers only): PASS**

### Confidence policy
- **Majority-coverage rule.** `#confidence` returns `low` unless the top section covers at least `minimumIntentCoverage` (0.6), weighted by inverse document frequency, of the original intent's content terms. Both 0.6 and the 0.5 page-context share are named in `GUIDANCE_RANKING_POLICY`.
- **Unknown terms force `low`.** An original term that appears nowhere in the corpus and isn't covered makes the result `low` straight away, so a big BM25 score can't hide it.
- **Concept aliases can't fake coverage.** A concept's alias terms only count when the top section contains one of that concept's required terms. Expanding a concept can't make an unsupported original term look covered.
- **Stop words.** `netscript`, `versus` and `vs` are now ignored as framing words, which is reasonable.

### Page context
- `#applyPageContext` only runs when no concept is activated. It lifts other sections of the anchor's page by at most half the anchor's score.
- It caps them strictly below `anchor − closeScoreGap`, so the strongest anchor never changes.
- Your negative control is the right one: removing this pass brings back the original ownership-case failure.

### Golden fixture
- The plugin case uses the `ordered-prefix` mode with only its two specific plugin routes, which is the option I allowed. The checkout-saga snapshot I rejected is gone.
- The ownership case keeps its original 3 expectations.
- Getting-started names the CLI `init` section, as approved.
- The case count stays at 8, and the checks that both adapters agree and repeat runs match are unchanged.

### Issue fixtures (`issue-2269-guidance*`)
Every issue intent and the named sub-intents are covered:
- **Resolve to the right page/section:** "gate service readiness separately from liveness" and "readiness and liveness" both go to `pages/services-sdk/services#health-readiness-liveness`, and "KV watch capability" goes to the KV reference.
- **Return `low` with the explicit weak-support fallback:** KV prepared-view, `getMany`, half-life renewal and the bounded abortable reader. I confirmed `getMany`, prepared views and half-life don't appear in the docs, so `low` is honest for those.
- **Returns `low` anyway:** "TTL renewal". Sliding stream TTL renewal is documented, but the fallback only says support is weak and to confirm with `search_docs`. It doesn't falsely claim nothing is documented.
- **Off-topic controls** ("quantum entanglement …") return `low`.
- **Every case** checks the citation and that every recommended or related page and section actually opens with `get_doc`.

The search fixture covers both outcomes:
- `withReadinessCheck` and `getMany` return the explicit no-seam fallback.
- `ReadinessHandler`, `expireIn` and "stream reader" find their pages with no fallback.

Your reported 7 failures when the old confidence logic is restored count as a valid negative control.

### Documentation
- The `docs/site/reference/mcp/index.md` edit was forced by `docs:exports-drift` on the new public subpath. It is accurate and recorded in `drift.md`.
- The `./docs` export row was regenerated in the export corpus.

### Not blocking
For `low` cases, the fixture's `pages` field is never asserted, so it reads as an expectation it doesn't enforce. Either assert those pages appear in the recommendations or drop the field.

I didn't run any gates; the results above are as you reported them. Before the final IMPL-EVAL you still need green results at the commit head for:
- the full MCP suite, plus check, lint and fmt
- `quality:gate`
- `check:agent-docs-prose`, `check:publish-assets`, `check:assets-barrel` and `check:mcp-export-corpus`

This is a slice review only. It does not certify merge readiness.

VERDICT: PASS (S2 slice)
