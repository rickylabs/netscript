# Commits: [Deploy-S1] `deploy.targets.*` config contract (#337)

_Append one line per commit: `- <sha>: <message>`_

- 07cb41e9: CS-1+CS-2 — split deploy schema into `deploy.targets.*` keyed map (shared `DeployTargetBaseSchema` + `WindowsDeployTargetSchema`), `denoBaseImage` 2.5→2, four-barrel rename. Gates: config check PASS, publish dry-run PASS (no slow types).
- 217116e5: CS-3 — re-key CLI `resolveWindowsDeploy` to `userDeploy?.targets?.windows`, resolver `denoBaseImage` fallback 2.5→2, comment-prose fixes. Gate: CLI deploy consumer check PASS (34 files).
- 3acd114b: CS-4 — schema/merge tests (accept targets.windows, clean-break legacy shape, drop unknown keys, merge whole-targets replacement) + one-line docs migration note. Gate: config tests PASS (9/9).
- CS-5: root quality reconcile — no code changes. Gates: config fmt PASS (0), config lint PASS (0), config check PASS (33), whole-cli check PASS (450). cli fmt/lint excluded at root. Run-docs commit follows.
