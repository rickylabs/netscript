# Research — README minimum dependency age

## Baseline

- Branch and `origin/main` start at `3149d18e18fdd7cfbd0fac5a06f48f781d3a391a`.
- Production red: `e2e-cli-prod` run `33708533076`, published version
  `0.0.7-canary.9`; `readme.quickstart.01-install-cli` exited 1.
- The preceding #1975 isolation fix worked: the receipt records a run-owned
  `DENO_INSTALL_ROOT`, so the prior global-install collision is not this failure.

## Findings

1. Deno 2.9 applies its default 24-hour minimum dependency age even without a project config.
2. `deno install --global` does not consume a cwd `deno.json` for this policy, and no environment
   override exists.
3. The public printed install command appears in the root README, package README, docs Quickstart,
   the two expected-command constants, and semantic drift/application tests.
4. The existing Quickstart callout currently tells readers to add the flag manually; that becomes
   contradictory once the primary command carries it.

## Open questions

None. The coordinator ruled this a public install-command defect and locked the exact spelling and
position of `--minimum-dependency-age=0`.
