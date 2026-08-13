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
- Draft PR #1643 opened from bootstrap commit `e49948bbf`, labeled `status:plan` with milestone
  `0.0.7`.
- First focused structured test falsified the issue's manifest-removal assumption: the shared schema
  requires `backgroundPort` and atomically couples `servicePort` to the service shape; copy mode
  still consumes them. Invalid manifest/fixture edits were restored.
- Proposed explicit-URL auth diff remains uncommitted because two current tests need changes outside
  the frozen surface. No durable receipts or expensive gates ran.
- Coordinator instruction on 2026-08-13: do not expand or reinterpret the frozen leaf contract; the
  topic orchestrator cannot approve either rescope. PR #1643 stays draft at `status:plan`.
- The exact proposed auth-command diff is preserved in `worklog.md`; the product-source edit was
  removed with `apply_patch` and was never committed.
- Required decision: only the release coordinator may issue a replacement leaf contract naming any
  additional test/schema/copy surfaces and remedy, or disposition #1243 outside this leaf. Resume no
  source work until that explicit coordinator decision arrives.
- No further gates, expensive-gate lease request, issue/milestone mutation, ready transition, merge,
  or publication is authorized. This paused run owns no runtime resources and needs no cleanup.
