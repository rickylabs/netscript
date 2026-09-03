# Coordinator disposition: cold README proof

Independent session0039d1ad-72eb-4047-964c-8b326ff65902 completed PASS_IMPL at exact source
832e53720baf7a8d11e132d93582c48879a4628e. Model z-ai/glm-5.3-flash, requested max via checked-in
agentic:claude-openrouter; raw completed transport retained alongside the verbatim evaluate.md.
The reviewer wrote into the canonical run path in007-eval-readme-cold, not its checkout root.

## Design checkpoint and disposition

The coordinator chose the existing single hosted job and unchanged README command walker. Move
that walker before every other app/scaffold and remove the AppHost NuGet restore; prerequisite
tools and maintainer graph installation remain allowed. A read-only fail-closed count receipt
guards zero AppHosts, containers, images, volumes and custom networks. No schema/runtime/CLI
contract, public API, version, caller, retry, cleanup ownership, or second parallel runtime exists.
The two source paths and regression are exhaustively named in the author plan. This explicit
checkpoint records the design content that existed before implementation; it is not new scope.

The reviewer correctly records its default lint wrapper selection as excluded, not PASS. Separately,
the primary actually linted the test with a temporary config carrying root recommended/jsr rules
plus no-process-global/no-node-globals and no .llm exclusion: one selected/processed file, zero
findings. That receipt is not represented as reviewer-run. Primary YAML import caused two local
lock entries; they were removed with apply_patch after inspection and never committed.

Hosted empirical risk will be measured BEFORE minting the next canary: after workflow-scoped
GitHub authorization, push source832e53720, run its normal CI/close gate, and dispatch its corrected
e2e-cli-prod.yml against existing0.0.7-canary.9. Inspect the cold baseline and verbatim README
receipts; do not call a partial/failed whole run green. This publishes no package and consumes no
canary number. Current official actions/runner-images Ubuntu2404 readme lists no cached Docker
image inventory, but that omission is not empirical proof; actual baseline remains mandatory.

Only after verified final product merges and this pre-publish proof do we freeze the final content,
run composed publish readiness, and dispatch the native next canary. Repeat the exact published
production pair on that new version, close #1881/#863/#1712 with actual evidence, then stable.

The sole current external block is GitHub workflow permission. First device code expired; a second
authorization request is displayed to the owner. Do not bypass the denied push or expose tokens.
