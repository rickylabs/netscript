# Drift — fix-scaffold-hygiene

## D1 — #968 filed cause was stale

- Severity: minor
- Finding: current `main` already bypasses init prompts when stdin is non-terminal (landed in
  beta.5). The remaining contract gap was the absent `--non-interactive` spelling and the absence of
  a direct non-terminal regression guard.
- Resolution: preserved automatic non-TTY defaults, added `--non-interactive` to public and
  maintainer init, added a prompt-port non-invocation test, and corrected issue #968 in
  https://github.com/rickylabs/netscript/issues/968#issuecomment-5144895872.

## D2 — Aspire JSR audit has baseline failures

- Severity: pre-existing
- Finding: the package audit exits 1 because four existing exported subpath entrypoints lack
  `@module` JSDoc (`application`, `adapters`, `testing`, `public`). None is changed by this slice.
- Resolution: recorded as FAIL for handoff; no scope expansion.

