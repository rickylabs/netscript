# Context pack — legacy-port-pin-sweep

- Direct-to-`main` Wave 0 fixes leaf for #1243.
- Immutable base: `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- Topic orchestrator: `/home/codex/repos/netscript-007-fixes`, run
  `.llm/runs/release-0.0.7-fixes--orchestration/`.
- Approved coordinator artifacts:
  `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`.
- No upstream; explicit push refspec only; draft PR against `main`; no merge or publication.
- Live issue fetched `2026-08-13T20:23:46.556Z`; current issue is open and has no acceptance
  checkboxes. Its milestone comment conflicts with the cluster's 0.0.7 assignment; leaf will not
  mutate central issue state.
- Reproduced live pins in the auth default, streams manifest, and copy fixture. The generated skill
  occurrence is historical diagnostic prose, not a pin.
- #1206's real endpoint-discovery seam lives in `@netscript/mcp`; wiring it crosses the frozen leaf
  surface. Locked remedy: explicit required `--stream-url` with Aspire discovery guidance, plus
  removal of dead manifest/fixture port fields.
- `PLAN-EVAL: N/A` recorded before source edits. Next: commit/push artifact slice and open the draft
  PR, then implement slice 2.
