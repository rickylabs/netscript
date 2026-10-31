# Worklog

## Design

1. Public surface: published docs accurately describe worker delivery, saga messaging/projections/compensation, trigger actions/retry and stream producers.
2. Domain vocabulary: accepted write versus delivered write; at-least-once delivery; applied-key window; packaged entrypoint versus generated runtime wrapper; one scheduler owner. No new framework terms.
3. Ports: existing saga bus/store, worker idempotency port, stream producer lifecycle/receipt and trigger definition policy. No new runtime dependency.
4. Constants: use existing exported reconnect/buffer defaults and canonical WORKERS_CONCURRENCY. Recipe identifiers are named constants where reused.
5. Commit slices: S0 evidence/draft; S1 complete twelve-item docs reconciliation plus gates; S2 final evidence/handoff. Exact files and proving gates are in plan.md.
6. Deferred: all packages/plugins implementation, generated carriers outside assigned paths, releases and merge.
7. Contributor path: research.md maps every finding to canonical docs and source; streams.md is the extension entry for worker producer usage.

## Owner evaluation override

Verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”

Rationale: owner-selected independent Anthropic evaluator for this OpenAI implementation. Feature matrix queried first; owner override changes evaluator cells only.

## Intake

- Baseline equals fetched origin/main; no prior local changes.
- Original issue body and all comments read. No acceptance boxes exist; all twelve numbered findings are the acceptance surface.
- Related merged PRs are partial; no duplicate full audit found.
- MCP find_guidance then search_docs completed before code research.
- Memory consulted; RTK unavailable, use direct commands.
- Highest-priority operator directive selects reference-only PR body and coordinator-owned labels/milestone; generic closing-footer and automatic-label advice does not apply.
- PLAN-EVAL pending. Implementation has not started.
