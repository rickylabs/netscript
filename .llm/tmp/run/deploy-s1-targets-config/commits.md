# Commits: [Deploy-S1] `deploy.targets.*` config contract (#337)

_Append one line per commit: `- <sha>: <message>`_

- 07cb41e9: CS-1+CS-2 — split deploy schema into `deploy.targets.*` keyed map (shared `DeployTargetBaseSchema` + `WindowsDeployTargetSchema`), `denoBaseImage` 2.5→2, four-barrel rename. Gates: config check PASS, publish dry-run PASS (no slow types).
- 217116e5: CS-3 — re-key CLI `resolveWindowsDeploy` to `userDeploy?.targets?.windows`, resolver `denoBaseImage` fallback 2.5→2, comment-prose fixes. Gate: CLI deploy consumer check PASS (34 files).
