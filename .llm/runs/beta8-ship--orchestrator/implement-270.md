use harness

# Slice brief — #270 (E11): RetrieverPort — hybrid vector+keyword retrieval + citation provenance

## SKILL
Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules
- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-270`, branch `feat/270-retriever-port`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-270`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-270 rev-parse HEAD` must start `955b4abf`.
- Push: `git -C /home/codex/repos/ns-b8-270 push origin HEAD:refs/heads/feat/270-retriever-port`.
- Worklog at `/home/codex/repos/ns-b8-270/.llm/runs/feat-270-retriever-port--codex/worklog.md`.

## Task (issue #270 — read it FULLY; Contract shape is the contract)
`RetrieverPort` in `@netscript/ai`, sitting ABOVE `EmbeddingProviderPort` (E6):
- `retrieve(query, k)` → ranked results with `matchedBy: vector | keyword | hybrid` and
  citation-ready provenance (enough to render an `[n]` citation chip: source id, title, span).
- Hybrid combiner: vector ⊕ keyword with a title-boost; ANN/FTS backends are APP-OWNED adapters —
  the port admits an adapter, it does not embed one. Ship an effect-free in-memory reference
  adapter (injected documents, naive keyword match) for tests/examples only.
- Follow the existing ports/adapters layering; re-baseline against `packages/ai/src/ports/` first
  (no RetrieverPort exists at baseline — verify).

## Validation (evidence in worklog)
- Scoped check/lint on `packages/ai`; unit tests (vector-only, keyword-only, hybrid overlap
  dedup + rank fusion, title boost, matchedBy tags, provenance shape, k-bound);
  `deno doc --lint` clean; publish dry-run green if export map changed.

## Done means
Port + reference adapter + tests committed and pushed, worklog committed. Report "DONE" or "BLOCKED: <why>".
