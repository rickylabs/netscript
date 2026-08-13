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
  surface. Locked remedy: explicit required `--stream-url` with Aspire discovery guidance.
- Draft PR #1643 opened from bootstrap commit `e49948bbf`, labeled `status:plan` with milestone
  `0.0.7`.
- First focused structured test falsified the issue's manifest-removal assumption: the shared schema
  requires `backgroundPort` and atomically couples `servicePort` to the service shape; copy mode
  still consumes them. Invalid manifest/fixture edits were restored.
- The release coordinator's authorization was verified from live issue #1243 and PR #1643 at
  `2026-08-13T20:35:47.522Z` (issue comment `5286074974`; PR comment `5286075209`). The sole added
  product surface is
  `packages/cli/src/public/features/plugins/auth/auth-plugin-command_test.ts`.
- The manifest and official-copy `4437` values are required compatibility metadata and remain
  unchanged. No schema/copy redesign is authorized.
- Resume scope is the explicit-URL/fail-loud command behavior, focused tests, and structured
  non-expensive gate receipts. PR #1643 remains draft and moves from `status:plan` to `status:impl`
  only after real implementation evidence is committed and pushed.
- `scaffold.runtime`, Aspire, Docker, merge, publication, and issue/milestone mutation remain
  forbidden. This run owns no runtime resources and needs no cleanup.
