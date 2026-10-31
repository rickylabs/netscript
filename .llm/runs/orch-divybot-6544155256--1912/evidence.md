# Published CLI parity evidence

Published CLI: `jsr:@netscript/cli@0.0.8`. Deno: `2.9.7`.

Linux ran locally; Windows ran on `windows-latest` through the branch-dispatched existing production workflow. Both used a fresh consumer initialized by the published CLI with streams/workers and normal plugin generation to prepare the lock. Aspire outputs came directly from init/plugin installation.

Successful Windows run: https://github.com/rickylabs/netscript/actions/runs/41208565476
Tested CI implementation on both operating systems: `bcefeaa33ce3d8971ff3dad3dbfb6e7686e21439`. Linux ran the repaired script bytes subsequently committed at this head.
Windows job: success; ordinary production runtime job: deliberately skipped in parity-only mode.

`<project>` is a placeholder for the fresh consumer root; reports contain no operator paths.

| OS | Scenario and exact published command | Exit | Native report excerpt |
| --- | --- | --- | --- |
| Linux | clean: `deno run --no-config -A jsr:@netscript/cli@0.0.8 generate plugins --check --format json --project-root <project>` | 0 | `status: current; outputs: 1; drift: []` |
| Linux | clean: `deno run --no-config -A jsr:@netscript/cli@0.0.8 generate aspire --check --format json --project-root <project>` | 0 | `status: current; outputs: 15; drift: []` |
| Linux | hostile-byte-mutation: `deno run --no-config -A jsr:@netscript/cli@0.0.8 generate plugins --check --format json --project-root <project>` | 1 | `status: drift; outputs: 1; drift: [{"path":".netscript/generated/plugin-workers/job-registry.ts","kind":"bytes"}]` |
| Linux | hostile-byte-mutation: `deno run --no-config -A jsr:@netscript/cli@0.0.8 generate aspire --check --format json --project-root <project>` | 1 | `status: drift; outputs: 15; drift: [{"path":"aspire/apphost.mts","kind":"bytes"}]` |
| Windows | clean: `deno run --no-config -A jsr:@netscript/cli@0.0.8 generate plugins --check --format json --project-root <project>` | 0 | `status: current; outputs: 1; drift: []` |
| Windows | clean: `deno run --no-config -A jsr:@netscript/cli@0.0.8 generate aspire --check --format json --project-root <project>` | 0 | `status: current; outputs: 15; drift: []` |
| Windows | hostile-byte-mutation: `deno run --no-config -A jsr:@netscript/cli@0.0.8 generate plugins --check --format json --project-root <project>` | 1 | `status: drift; outputs: 1; drift: [{"path":".netscript/generated/plugin-workers/job-registry.ts","kind":"bytes"}]` |
| Windows | hostile-byte-mutation: `deno run --no-config -A jsr:@netscript/cli@0.0.8 generate aspire --check --format json --project-root <project>` | 1 | `status: drift; outputs: 15; drift: [{"path":"aspire/apphost.mts","kind":"bytes"}]` |

The hostile mutations append a comment to `.netscript/generated/plugin-workers/job-registry.ts` and then, independently, `aspire/apphost.mts`. Each is restored in a finally block before proceeding. All eight before/after comparisons (sixteen snapshots) confirm unchanged consumer source/lock bytes across inspection; installed node_modules trees are excluded.

Sanitized reports: linux.json and windows.json. SHA-256:
- Linux: `297d954a7ba5162b878d0cc9e6294e73b81122849ee6b486fe514ab725f6ef06`
- Windows: `7f74a7950af8aca273296f6ad2734c292fa5ef010a68f8a11f21bd387cb6fb5f`

Earlier Windows run https://github.com/rickylabs/netscript/actions/runs/41207980660 failed before checks in a redundant normal Aspire regeneration due to DNS lookup error 11003. It certifies nothing. The reviewed setup repair removed that unnecessary step without changing any acceptance command/assertion.

Scoped structured check/lint/fmt pass; workflow-policy tests pass 16/16; workflow YAML parses; review-thread gate passes with zero unanswered threads. Full `deno task e2e:cli` was attempted but remains UNPROVEN after Aspire/Docker preflight failure; no scaffold runtime was started. These parity results do not certify a release or full runtime health.

No product code, labels or milestones changed. No issue closure, merge, tag or release authorized. Final exact-head independent evaluation is linked from the PR IMPL-EVAL phase comment.
