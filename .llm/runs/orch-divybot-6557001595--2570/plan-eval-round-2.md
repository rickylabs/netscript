**Verdict: PASS**

The binding "PLAN-EVAL corrections" section closes all six round-1 blockers, and the new facts it depends on match the current source. This covers the plan only; nothing has been implemented or validated.

## Blocker closure

- **B1, commands: closed.** All commands now use `plugin install <kind> --name <kind>`, which matches `install-plugin-command.ts:31-63`. The service command is `service add --name <svc> --with-client`. Both live in one constants module, with tests that check them against the real command options. The new follow-up command, `netscript generate resource <name> --app <app> --client <name> --procedure list`, matches the real options in `generate-resource-command.ts:48-55` (`--procedure` is required).
- **B2, detection timing: closed.** Option (a) is locked:
  - A server-only projection is read at request time, with the six-state union fixed in S1.
  - "Ready" is set only after a successful typed read.
  - Auth detection doesn't depend on stale route manifests, and no-auth builds have no static BFF import.
  - Plugin identity comes from the persisted linking metadata. `canonicalName`/`resourceConfigKey` exist in `kernel/adapters/plugin/installed-plugin-declarations.ts` and `plugin-reference-reconciler.ts`.
  - Lifecycle regressions are listed.
  - Most importantly, any required variant still "installed-unwired" at the end blocks READY. That stops the fallback from being passed off as done.
  - `supervisor.md` keeps reconciler edits out of scope, which matches this choice.
- **B3, procedure matrix: closed.** The memory variant gets `list({limit,offset,search})`, which matches `contract.memory.ts.template:35-39`, and `updateStatus` as its only mutation, with no create. Direct detail lookups are bounded, and an explicit unavailable state covers the case where the lookup budget runs out. The database variant uses `getById` and the existing create flow. Adapters are chosen by `dbEngine`.
- **B4, runtime invariants: closed.** The plan keeps the markers that `probe-app-reference.ts:28-45` and `probe-app-dynamic-route.ts:41-51` check:
  - `/examples/orders/[id]` with `data-order-id` and its link back to itself;
  - the `/examples/<service>` leaves and their markers;
  - links from home to `/design` and `/design/composition` in dev.

  No e2e edits are planned without a drift entry.
- **B5, CommandPalette: closed.** The plan installs the single `command-palette` item and lets the registry resolve its dependencies. It measures the CSS total, including transitive styles, and doesn't pull in the whole `ai` bundle. The registration files are now in the authorized write surface.
- **B6, acceptance map: closed.** The #2570 acceptance items and four #2566 regression cases each map to a slice and a proof.

## Non-blocking notes for implementation

1. The original "Capability contract" bullets (lines 35-39) and "Preserve old `/examples` links where useful" (line 23) still read as init-time selection. The corrections section explicitly overrides them, but a one-line pointer next to them would stop an implementer misreading them.
2. Dashboard "generated route count" and the #2566 route-count case should count the same way in dev and production, with design pages left out in production. One shared function from `navigation.ts` or the projection would keep the test from depending on build mode.
3. When live plugin adapters are added in S2, each one needs a negative test showing that an installed-but-unreachable plugin reports `unavailable` and not `ready`.

Implementation may begin with S1.
