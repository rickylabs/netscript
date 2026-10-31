# CI and draft PRs

ci.yml skips every job on draft PR events. Actual required contexts materialize on ready_for_review. e2e-cli runtime/native jobs are opt-in on ordinary PRs (e2e-cli-gate / desktop-native-gate / ci:full); this issue explicitly forbids labels, so do not silently add one. deps-report is informational and runs only for release tags or ci:full. Never infer a real CI PASS from an all-skipped draft snapshot.
