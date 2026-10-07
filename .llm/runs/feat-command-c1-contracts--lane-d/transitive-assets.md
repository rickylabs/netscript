# C1 transitive generated consumers

use harness

## Owned repair

CI at360165b45ae07b1a87671b14d09e990769687380 passed shared agent-docs and MCP export corpus freshness, then failed assets-barrel because the CLI embedded copy still held older prose/provenance/export inventory. Native publish-assets also reproduced a stale MCP prose provenance sourceCommit. This slice changes exactly two generated copies, totaling9insertions/9deletions; framework implementation, shared corpus files, locks/manifests, tools, tests, workflows and all historical reports remain unchanged.

The existing native gen:publish-assets and gen:assets-barrel regenerate both consumers. The CLI compressed bytes and provenance exactly match the shared source; only contracts/service command export inventory is added. The MCP fallback's documents, README/version and all other metadata stay identical; only sourceCommit now matches the shared source. [Semantic/source proof and complete generated-chain inventory](./transitive-assets-semantic-proof.json), [all tracked source hashes](./transitive-assets-source-manifest.json).

## Qualification

Native barrel and publish baselines both fail1. Native generation passes0, all seven barrel outputs pass native content --check0, and actual check:publish-assets passes0. All other declared publication assets are unchanged. Existing generator/CLI docs regressions12pass, JSRspecifiers0 and materialized CLI/MCP publishdryruns0. Supervisor independently checks embedded compressed/provenance/MCP equality and runs durable quality:scan/arch:check0. [Actual commands/exits](./transitive-assets-gate-evidence.json). No new test, runtime behavior, tool rewrite, dirty override, freshness bypass, merge or force push.

The Git-diff-based check:assets-barrel deliberately sees the uncommitted repair; its final actual0 must be recorded immediately after supervisor commit. Full exact-head coreCI still pending. Previous two evaluation reports remain byte-exact. The first third-round continuation produced no verdict and was interrupted after a read remained pending following directory relocation; same session retained. It resumes from its original directory at the complete repaired SHA. C2 S4 is separately signed off; S5 remains unreleased until C1's new qualification is reconciled.
