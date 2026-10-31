# Canary rehearsal proof

Use a disposable clone outside the active worktree; release:canary -- 0.0.9 --dry-run mutates all manifests and carriers. prepareRelease prints publish:readiness only after findVersionResidue returns empty, so reaching that gate proves the reported blocker is gone. Inspect built docs/site/_site/r/*.json against the bumped root version as an independent copy check. Never run a non-dry canary for this issue.
