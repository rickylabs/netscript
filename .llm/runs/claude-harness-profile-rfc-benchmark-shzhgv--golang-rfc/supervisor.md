# Supervisor Identity — claude-harness-profile-rfc-benchmark-shzhgv--golang-rfc

Same identity, routes, and overrides as runs 1–3 (see run-1 supervisor.md + drift D-1): Claude
Fable 5 cloud session `session_013H2FUAx1v6BbP6PgLTNqH5`, same container/branch. Baseline: main
after #1683 + PR #1685 (ready-merge). Push policy: hold until #1685 merges, then branch restart
+ cherry-pick + new PR (protocol proven in runs 2–3).

## Run intent (owner-directed, 2026-08-19)

RFC-4: Go — benchmark + the same bridge/sandbox research pattern as runs 1–3. Owner also ruled
(with agreement): **no Python RFC** — python continuity rows land in this run's probe; monty
(#1679) carries Python's open questions. Profile: ARCHETYPE-3 + SCOPE-docs.

## Environment deltas

Go 1.24.7 preinstalled (`/usr/local/go`); python3 3.11.15 preinstalled; TinyGo absent
(cite-only); no WASI runtime (wasip1 build-proof only).
