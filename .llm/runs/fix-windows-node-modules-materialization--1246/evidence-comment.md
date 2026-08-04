**[PHASE: IMPLEMENTATION] [GATE: CONSUMER] [STATUS: PASS]**

Canonical merge-readiness command:

`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`

Final result: `passed=71 failed=0`. This covered generated Fresh dev preflight, generated workspace
type-checking, Aspire restore/start, dashboard readiness, app-home serving, official plugin/runtime
behavior, telemetry, and cleanup. The post-run leak reporter found no resources owned by this
worktree.

Native Windows execution is not claimed from WSL. The PR intentionally uses `Refs #1246`; native
Windows no-intervention startup and Windows init→Aspire→frontend CI remain tracked for 0.0.6 against
the upstream Deno defect.
