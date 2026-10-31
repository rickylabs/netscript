# Supervisor and write scope

Issue #2409, continuation of merged #2520 under tracker #2474 F1.
Branch: fix/fresh-authored-route-binding. Baseline: eb9a1299b04a48ffe51348d15bb542606b7a6f82.
Implementation/supervision: OpenAI Codex session; independent review: separate Anthropic session.
Tier: feature, retaining the owner's Claude Opus 5.5/high evaluator override and round limits.

Authorized write surface: this run directory; packages/fresh/src/application/route/manifest-page-module.ts,
manifest-page-module.test.ts, manifest.test.ts, manifest.ts; focused Vite regression tests beneath
packages/fresh/src/application/vite/; docs/site/web-layer/route.md and builders.md only if ownership
wording requires correction; native derived documentation assets only when required for freshness.
Do not edit Fresh UI components, templates, theme presets or other workers' run records.
No new API, dependency, lock change, labels, milestones, merge, tag or release.

Tracker and issue/PR search show #2377/#2373 owned, #2409 unclaimed. PR #2503 file list has no
Fresh route generator overlap. Existing unfinished cells already have issues; do not duplicate.
No local scaffold.runtime. Coordinator schedules expensive CI if required.
