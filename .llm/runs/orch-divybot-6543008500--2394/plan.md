# Plan & Design — READY FOR REVIEW

Archetype 5 plugin wiring, service/docs overlays. Extend only the existing five API factories.
Locked: optional requestLevel and responseLevel fields ('debug' | 'info') in existing
workers/streams options, triggers options, and optional second options objects on auth/sagas
and legacy workers factory. Forward via createPluginService's existing logger configuration.
Each field independently defaults to debug; error response warning behavior remains native.
No global @netscript/service behavior change, auth/CORS/listener change or new exported name.
Streams legacy CLI has no caller factory argument; retains default debug via delegation.

One implementation slice: option contracts, all forwarding, five actual request-record
regression tests, logging docs, negative controls and run evidence. Tests must exercise each
factory, prove default and independently configured levels, and fail if forwarding is removed.
Prefer public service APIs and existing isolated runtime fixtures for stateful services.

Gates: structured scoped check/test/lint/fmt; doc-lint full exports; quality:gate;
JSR audit for five owners; documentation freshness checks when applicable. Native runtime
HTTP tests provide local wiring evidence. Full scaffold.runtime CI is required, explicitly
unproven locally by owner direction; coordinator arms e2e-cli-gate. No local E2E launch.

Risks: global logging/runtime state (isolate children), backgrounds (owned shutdown),
doc closure (stop and report if new exported names needed), inherited quality failures
(compare baseline, never hide), and generated-doc freshness (use repository generator).
No unresolved design decisions. Deferred: core defaults, new config/env resolution, scaffold
rewrite, export/debt growth, release/merge. Only coordinator merges and owns labels/milestones.
