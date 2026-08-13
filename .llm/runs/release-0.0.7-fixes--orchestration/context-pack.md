# Context pack — release 0.0.7 fixes topic

- Coordinator artifacts: `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`.
- Immutable dispatch base and current live `origin/main`: `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- Approved plan head: `331f7c664`; coordinator control head at dispatch: `5330285f65242eff639cfc5c7ed68a80740de910`.
- Current wave: Wave 0. `legacy-port-pin-sweep` is clean/paused on contract drift at `f3cf40909`
  with draft PR #1643. `scaffold-generated-output-correctness` is clean/paused at `42572af32` with
  draft PR #1654; its frozen contract must be amended before a separate PLAN-EVAL and implementation
  resume. Both attached implementation threads are idle. No evaluator has launched and no global
  expensive-gate lease is held.
- Merge/release authority remains exclusively with `codex-root-0.0.7`.
- Exact leaf identities and steering commands live in `leaf-registry.md` and each leaf's
  `codex-thread-ids.md`.
- Required coordinator action for #1243: replace the leaf contract with explicit surfaces/remedy,
  or disposition the issue outside this leaf. The topic orchestrator cannot authorize the rescope.
- Required coordinator action for #1262/#1263/#1588: amend the generator surface, then authorize a
  separate PLAN-EVAL against `42572af32`. Do not grant the shared scaffold runtime gate implicitly;
  that remains a distinct global lease decision.
