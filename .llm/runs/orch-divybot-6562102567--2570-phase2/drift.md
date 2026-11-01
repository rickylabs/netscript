# Drift

2026-11-01: RTK absent; direct command fallback, structured wrappers remain authoritative. Specific owner review/process overrides recorded in worklog/supervisor supersede generic dispatcher PR closing and cross-family boilerplate. No product scope drift.

2026-11-01: The agentic app-server launcher hardcodes dangerFullAccess and has no read-only mode. The owner explicitly requires a read-only Codex reviewer; use native `codex exec --sandbox read-only` for this evaluation, supplying a bounded review packet through stdin because prior host evidence shows bwrap shell reads unavailable. Keep raw output/resume identity private. This does not waive independent review or substitute a model.

2026-11-01: Live browser negative control found the merged database contract had no search input, while memory search only matched name. S1 now extends the existing service filter contract/domain predicate to search reference/name/owner/email before pagination in both storage adapters. This is necessary for the owner-required Records search. Initial research claim that both contracts supported search was incorrect.

2026-11-01: S1 slice reviewer was accidentally launched ephemeral; exact resume failed because no rollout was saved. A persistent supervisor review continuation receives the complete prior verdict and repairs. The final mandatory IMPL-EVAL will use a fresh persistent read-only session, re-steered across rounds. No review result is self-certified.

2026-11-01: One S1 reviewer resume inherited the host default model. Its source PASS is not used as the requested Astra sign-off; the same persistent session was explicitly re-steered to Astra/xhigh. Engine-aware SQL search adds the existing scaffold option/writer wiring to S1; this stays inside the declared CLI surface.
