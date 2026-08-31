# Cleanup, ownership, and scope receipt

The second AppHost was already absent after V6's validated launcher termination and exact-path
`aspire stop`. At `2026-08-29T23:01:57.390Z`, the repository reporter found exactly one survivor:
container `790117a5e93eebc352085f7ca22ba098a4b440d31fbcd1fd63d0b62fa4ee8b7b` (`postgres-f5c10f81`).
It classified the container `owned`, with apparent owner the exact assigned worktree and a mount
below the registered generated-project owned root. No foreign or unknown resource was reported.

The dry-run teardown exited 0 at `2026-08-29T23:02:07Z`, applying nothing. After positive ownership
proof, the same exact slice/worktree command with `--apply` exited 0 at `2026-08-29T23:02:18Z`,
removed only that container ID, stopped no AppHosts, and escalated nothing.

The final leak check exited 0 at `2026-08-29T23:02:28.189Z` and states “No surviving Aspire
resources found.” Independent final snapshots show `aspire ps` is `[]` and Docker has zero rows.

Evidence:

- `04-leak-check-before-teardown.raw.txt`, `04-leak-report-before-teardown.md`
- `04-teardown-preview.raw.txt`, `04-teardown-apply.raw.txt`
- `04-leak-check-final.raw.txt`, `04-leak-report-final.md`
- `04-aspire-ps-final.json`, `04-docker-ps-final.jsonl`
- `04-final-validation.raw.txt`

Committed scope is limited to this harness run plus the append-only `aspire-otel-cli-discovery`
outcome. The generated project remains ignored below `.llm/tmp/`; no file under `packages/`,
`plugins/`, or the generator changed, and `deno.lock` is unchanged.

The durable `harness-tooling-check` receipt at `04-gate-harness-tooling-check.json` is `PASS` at
commit `cef4ec83b6e4f5af0206a20e265f395057c33f0f` (9 checked tooling entrypoints, exit 0, 2.939 s).
This proves the receipt runner/tooling surface used by the handoff; it is not a substitute for the
independent implementation evaluation.
