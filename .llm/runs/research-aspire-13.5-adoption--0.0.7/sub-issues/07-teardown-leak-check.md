# [aspire-13-5 S7] Teardown/leak-check on 13.5: orphan cleanup, `stop --force`, descendant tracking

> DRAFT TEXT ONLY. Labels: `type:fix`, `epic:aspire-13-5`, `area:tooling`, `area:agentic`,
> `priority:p1`, `status:triage`. Milestone: `0.0.7`. Closes #1429.

## Summary

13.5 changes the lifecycle surface the agentic teardown tooling reasons about: `aspire ps` and
`aspire stop` auto-clean orphaned AppHosts whose launching CLI died; `aspire stop --force --apphost`
deletes the AppHost's persistent resources; backchannel sockets are pruned automatically. Re-prove
`agentic:leak-check`/`agentic:teardown` on these shapes and make leak-check see orphaned
`aspire-managed` descendants (PPID 1) it currently misses (#1429).

## Scope

- `.llm/tools/agentic/teardown/{probes,ownership,teardown,leak-check}.ts`: process-tree walk that
  includes re-parented descendants matched by DCP labels / `--apphost` argv / socket path; never
  touch `aspire agent mcp` (`MCP_COMMAND` guard stays).
- `teardown.ts`: after the scoped `aspire stop`, offer `--force` (behind
  `--apply --force-persistent`) only when ownership is proven by path containment.
- Post-stop confirmation probes: wait for DCP helper exit (S2 V6 timing) before declaring clean.
- Fixtures from S3 (`aspire-ps-13.5.3.json`).

## Boundaries

No change to the E2E cleanup gate itself (S10). No host-wide `aspire stop --all`, ever.

## Acceptance

- [ ] Reproduction from #1429 (kill CLI, leave AppHost descendants) → `agentic:leak-check` reports
      the leak; `agentic:teardown --apply` removes only owned resources; receipt in PR.
- [ ] Foreign AppHost in another worktree is reported, never mutated (existing invariant,
      re-tested).
- [ ] `Closes #1429`.

## Tests / gates

Teardown unit tests with 13.4.6 and 13.5.3 fixtures; manual receipt under the runtime lease.

## Docs / static asset regeneration

`.llm/tools/CLEANUP-PLAYBOOK.md` updated; `deno task gen:assets-barrel` (agent-tools corpus embeds
`.llm/tools` docs).

## Related

Part of #<epic>. Depends on S2 (V6, V7), S3. Feeds S10. Related closed: #1046, #970.
