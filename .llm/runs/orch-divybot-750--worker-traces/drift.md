# Drift

- 2026-10-18: assignment branch `orch/divybot-750` is operator-mandated; retain it rather than normal
  fix/ naming. Inbox closes line must be last in PR body.
- 2026-10-18: RTK absent; use direct commands with structured wrappers as verdict sources.
- 2026-10-18: initial shallow-history rebase aborted without changes; full history fetched and
  rebase on main completed. No source conflict resolutions or unrelated changes retained.
- 2026-10-18: Muse primary OpenRouter route cannot prove allowance without a fresh usage snapshot
  (`paid openrouter route requires --usage-snapshot`); no spend attempted. An initial Go contributor
  preflight was rejected as undeclared, then the keyed MODEL_CATALOG resolved the exact route.
  Native declared fallback Opus 5/xhigh confirmed, session recorded in supervisor.md.
- 2026-10-18: `git` shim rewrote the baseline worktree location into a nested worktrees directory.
  Moved that owned worktree immediately with `/usr/bin/git worktree move` to the required sibling
  path and removed the empty shim-created directory. No product changes in the baseline.
- 2026-10-18: full E2E first failed preflight with unavailable default Docker socket and unselected
  dotnet shim. Verified existing DinD 28.5.2 and .NET SDK 10.0.400; retry selects installed SDK via
  `mise exec dotnet@10.0.400` with `DOCKER_HOST=tcp://netscript-dind:2375`.
- 2026-10-18: read-only leak reporter found no proven run-owned resources; existing deploy AppHost,
  two Postgres containers and other unknown-owner processes were left untouched.
- 2026-10-18: independent review confirmed two intentional read-only consumer effects beyond the
  write surface. `createStreamMutationHook` (workers-core streams producer) no longer adopts the
  ambient worker for executions without stored traceparent; malformed saga parent carriers now
  root rather than adopt ambient context. Valid stored parents and deliberate local nesting are
  preserved. Reviewer independently ran workers streams and the whole saga-core suite: 144 pass,
  4 existing ignored, 0 fail. Author ran additional saga/streams/Fresh consumers: 46 pass.
- 2026-10-18: S1 review PASS_SLICE_REVIEW. Addressed F1 README wrapping, F2 release-note handoff,
  F3 consumer consequence recording, F4 absent-carrier expression, F5 duplicate test span end,
  F6 shared parent-ID constant. Source manifest and changed-source gates refreshed after these edits.
- 2026-10-18: clarified slice gate placement: the full scaffold.runtime gate belongs to final S2
  evaluator/merge-readiness, per AGENTS.md, rather than blocking S1 source sign-off. S1 still requires
  complete affected suites, structured source gates, quality:gate and independent substantive review.
  No functional gate was removed and no merge readiness is claimed before S2.
