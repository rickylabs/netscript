# Commits: [Deploy-S1] `deploy.targets.*` config contract (#337)

_Append one line per commit: `- <sha>: <message>`_

- 07cb41e9: CS-1+CS-2 — split deploy schema into `deploy.targets.*` keyed map (shared `DeployTargetBaseSchema` + `WindowsDeployTargetSchema`), `denoBaseImage` 2.5→2, four-barrel rename. Gates: config check PASS, publish dry-run PASS (no slow types).
