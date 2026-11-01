The CI test repair keeps #2268's intended behavior and adds no blockers. The diff touches one test file and run artifacts only; HEAD is still `660f200` and no production file changed.

**Why the old assertions had to change.** The smoke test passes `--endpoint http://127.0.0.1:1`, a deliberately refused explicit dashboard endpoint, and then calls `get_app_status`. The old assertions expected a warn/fail health summary with a `domains` array. That is exactly the "unreachable telemetry turns into an ordinary-looking summary" behavior #2268 removes. Under the approved design, a refused explicit endpoint is a failed read: it does not fall back to discovery and it returns `telemetry_unavailable`.

**The new assertions are stricter.** They require:
- `isError: true` and code `telemetry_unavailable`, with the fixed message text.
- Provenance state `unavailable`, null span and log counts, a non-empty `servingRevision`, and a valid time window.
- No `counts`, `domains`, `averageDurationMs` or `p95DurationMs` fields, so a refused endpoint can't come back with numbers attached.

The test still runs the real CLI over stdio, and `assertStringIncludes` is imported. Recording the test-file write-scope extension in `drift.md` and `supervisor.md` is correct.

**What I relied on without rerunning.** I didn't run the smoke test myself, because it spawns the real CLI and this round was not to start resources. `ci-follow-up.json` reports that the old assertions fail locally and the updated test passes, with structured check, lint and fmt clean on the file. It also records that every other CI lane passed and `check-test` failed only because of test-5.

**One behavior to state in READY.** When the telemetry read fails, `get_app_status` returns the error and does not include plugin runtime health, even though that health comes from a separate source. This matches the approved plan, which keeps plugin health only on successful empty or partial reads. Users should know the status tool goes fully to an error when telemetry is down.

The final round still needs to review the exact new pushed head, including the live-AppHost evidence once it is attached.

PASS
