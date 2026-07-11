# Context Pack

Issue #603 adds a budgeted multi-turn runner over the existing Codex launcher/resume plumbing.
PLAN-EVAL is owner-waived as D1. Implementation must reuse #604 classification, preserve
RouteIdentity and sender ownership, append thread records, write a watcher-compatible heartbeat,
validate, commit, and push without opening a PR.

Implementation and all scoped/full agentic gates are green (220 tests). Remaining close steps are
raw diff/status review, commit, explicit-refspec push, and supervisor IMPL-EVAL/sign-off.
