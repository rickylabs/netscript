# Drift Log: SDK root cache-provider isolation

Drift is append-only. Record facts that diverge from the locked plan, doctrine, or current-state
documentation.

No material drift is recorded in S1.

Tool availability note (non-scope): the requested `rtk` executable is unavailable on this host, so
focused raw `rg`/Git reads were used. This does not change product scope or the structured gate
requirements.

## 2026-08-30 — PLAN-EVAL cycle 1 measurement repair

- Severity: plan evidence correction; no product rescope and no implementation started.
- The locked S2 deletion of `globalThis.Deno` was not executable: Deno's Node-compat layer crashed
  before `hasCacheProvider()` could be read. The revision keeps Deno intact and makes the observed
  `true` boolean the only acceptable base red.
- The generated derivative plan skipped the Lume-owned agent-docs pair. The ceiling now explicitly
  owns `.llm/assets/agent-docs/prose.json.gz` and `provenance.json`, plus the three additional
  public prose pages that teach the removed behavior. The cascade is locked in tool dependency
  order.
- The accepted three-move design and Archetype-2 doctrine verdict are unchanged. F9's neighbouring
  Fresh-root reachability remains an out-of-scope coordinator follow-up reference.
