# Drift

## 2026-08-03 — baseline moved

- Severity: routine.
- Prompt base `f663fe0e4` was superseded by supervisor addendum/current `origin/main` `4634afe56`.

## 2026-08-03 — #1021 reproduction refuted

- Severity: significant current-state drift, not scope expansion.
- The issue's 0.0.2 premise no longer holds: current scaffolds emit and track the generated Fresh route files, and a freshly cloned generated workspace passes README `deno task check`.
- Response: do not rewrite correct documentation; locate/strengthen the narrowest regression proof and report the clean-clone CI acceptance box honestly.
