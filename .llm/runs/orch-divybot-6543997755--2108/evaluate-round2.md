**Final IMPL-EVAL at the pushed head: no blockers.** The code and evidence are ready to hand off. Merge still waits on CI checks that are running now and on the e2e-cli `scaffold.runtime` verdict, which only the coordinator can obtain.

**Head attestation**
- Local HEAD, the remote branch and PR #2535's head are all `6a62a6fdb000fa045cb5e901aa64fe78c70cb374`.
- The working tree is clean.
- The PR is open, ready for review (no longer a draft) and mergeable.

**S2 commit (`6a62a6f`)**
- It changes only:
  - the recipe added to `add-a-plugin.md`;
  - the one-page update to the generated MCP docs bundle;
  - the run evidence.
- There are no source changes after the S1 commit (`d715d0a`) that I signed off.
- The committed run evidence has no operator paths, hostnames, allocated ports or session IDs. The only path mentioned is a repo-relative scratch directory.

**Both readiness conditions from round 1 are met**
- You report that `check:assets-barrel` and `quality:gate` both exit 0 at the committed head. I took the head-level results from your logs and did not rerun them.
- The PR body is rewritten:
  - It starts with `Refs` and has no closing keyword.
  - It describes the actual fixes.
  - It says local-source installs now launch local service source while public installs keep their pinned JSR versions.
  - It lists the proof's limits and records the carried-forward non-blocking notes.
  - It says plainly that the e2e-cli `scaffold.runtime` verdict is required and unproven, and that there is no KV-only tier, with the follow-up proposed.

**CI at this head (read-only snapshot, not awaited)**
- Nothing is red.
- Passed: `build`, `close-gate`, `code-quality`, `breaking-migration`, `command-postgres`, the browser test shard and the change classifiers.
- Still pending: `quality`, `fresh-ui-quality`, and the `check` and `test-1` to `test-6` shards. The shards include the new KV-only consumer regression test.
- Skipped: both `scaffold-runtime` jobs, because they wait for the coordinator to add the `e2e-cli-gate` label.

**Outstanding before merge (not code defects)**
1. The pending CI checks must finish green at this exact head.
2. The coordinator must add `e2e-cli-gate` and get a green full `scaffold.runtime` run. This is required because local-source plugin services now launch branch source. It was not run locally and is neither claimed nor waived.

Only the coordinator may merge.

VERDICT: MERGE 6a62a6fdb000fa045cb5e901aa64fe78c70cb374
