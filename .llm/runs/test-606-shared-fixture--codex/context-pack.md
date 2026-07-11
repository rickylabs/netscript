# Context Pack

Issue #606 consolidates local-source import preparation used by #597 UI AI and #598 Flow-B. The shared helper, both refactors, and unit coverage are complete. Focused tests and scoped check/lint/format pass. The CLI cannot execute individual gate IDs; full `scaffold.runtime` remains orchestrator-owned (drift D2). Slice is ready for orchestrator review.

Rebased onto current `origin/main` at `7f7ed76b`, including #631 (`523a154a`). Published Flow-B workers rewriting uses #631's helper; local-source preparation uses #606's helper. Post-rebase focused tests and scoped check/lint are green.
