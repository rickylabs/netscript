# Plan

Locked scope: four review claims, verified against real pinned client. Preserve upstream finite reads, checkpoint after subscriber success, capped retries, and collection identity.
S1: bound each attempt signal/listener lifetime, prove flat active counts over 256 batches/timeouts/start failures; adapter and colocated tests.
S2: consume finite response text and parse JSON without push spread; prove 200,000 ordered events and next checkpoint; adapter tests.
S3: abort-aware public preload settling on immediate stop/dispose; factory and tests.
S4: reject stopped reads before connecting-state assignment; adapter and tests.
Each regression runs before fixing, then fix reversal mutation must fail within a deadline, restored test passes.
Gate set: check, lint, fmt:check, scoped Fresh structured tests, audit:critical; quality:scan, arch:check, doc:lint, JSR audit and focused consumer check; generated check tasks after merge. IMPL-EVAL mandatory independent session.
PLAN-EVAL N/A: bounded repairs have existing contracts, acceptance criteria and seams; no new public API, package topology or unresolved design tradeoff.
Risk: upstream abort listener installation race; abort-aware public preload plus terminal read guard prevent stranded waiters, per-attempt cleanup handles requests and errors. Large responses still need memory proportional to one batch, but retention must remain constant across batches. Observe system available memory and stop below 6 GiB.
Open decisions: none blocking. CLI scaffold E2E is deferred as no CLI/scaffold/wiring surface is changed; release phase N/A (PR remediation only). Stale fresh-ui lock is out of scope. No new debt.

S5: restore generated MCP export corpus/carrier freshness lost by taking main during merge; generated files and run evidence only. Gate: generator --check plus check:publish-assets and structured scoped MCP source check.
