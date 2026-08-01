# Drift Log: agent init skill discoverability

## 2026-08-01 — supplied repro command is stale

- **What:** The described behavior reproduces, but not with the exact path/flag in the brief.
- **Source:** direct CLI execution and `agent init --help`.
- **Expected:** `packages/cli/src/main.ts agent init --host claude --project-root <tmpdir>`.
- **Actual:** `packages/cli/src/main.ts` is absent and `agent init` rejects `--project-root`; running absolute `packages/cli/bin/netscript-dev.ts agent init --host claude` with the temp directory as cwd installs the stated three skills totaling 164 lines.
- **Severity:** minor
- **Action:** accept for this run and use the live entrypoint for artifact proof.
- **Evidence:** research.md finding 1 and captured repro output in the supervisor session.
