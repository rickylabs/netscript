use harness

Skill reads are complete. Implement NOW in this turn, in this worktree, per the brief at
.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix/brief.md (re-read it once; it is
authoritative and the design is coordinator-accepted: Deno 2.9.5 honours DENO_INSTALL_ROOT then PATH).
Required in this single turn, in order, each as its own commit:
1. RED: focused test asserting spawned env DENO_INSTALL_ROOT under runRoot, PATH prefixed with <root>/bin,
   argv verbatim (no -f), same env for index>=1 — commit the failing test with its failing output in worklog.
2. GREEN: readme-command.ts run-owned install root + env on every README command; optional env param on
   runAspireCommand (quickstart.walk unchanged); receipt.environment. Commit; cite the green output.
3. Scoped gates (check/test/fmt wrappers on packages/cli/e2e; lint changed files; `e2e:cli gates readme.quickstart`).
4. Push the branch and open the non-draft PR exactly as the brief specifies (Part of #1881 / Part of #863,
   no closing keyword, labels, milestone 0.0.7). Record worklog/drift under slices/leaf-1881-fix/.
Do not stop after reading or planning; do not ask questions; do not touch README.md, the workflow, or cleanup.

ADDENDUM (required): initializeState at index 0 must remove any pre-existing <runRoot>/.deno-install
(recursive, NotFound tolerated) before recreating it; the RED/GREEN test must seed a fake
<runRoot>/.deno-install/bin/netscript beforehand and prove it is removed, with argv verbatim and index>=1
inheriting the persisted root/PATH from state.
