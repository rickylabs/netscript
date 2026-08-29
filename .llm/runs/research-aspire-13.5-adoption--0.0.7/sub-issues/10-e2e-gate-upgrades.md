# [aspire-13-5 S10] E2E gate upgrades: doctor receipt, `describe --follow` evidence, `stop --force` cleanup, resource-command gate class

> DRAFT TEXT ONLY. Labels: `type:test`, `epic:aspire-13-5`, `area:tooling`, `area:cli`, `gate:e2e`,
> `priority:p1`, `status:triage`. Milestone: `0.0.7`. Partial for #1372 (reference, no close).

## Summary

Use the 13.5 CLI surface to make `scaffold.runtime` evidence structured and deterministic.

## Scope

- Preflight: `aspire doctor --format Json --non-interactive --nologo` captured as a gate receipt
  (`preflight.aspire`); fail on `status: fail`, warn on `warning`.
- Readiness evidence: `aspire describe --follow --format Json` NDJSON captured during startup into
  `.netscript/e2e/aspire-describe.ndjson` (bounded by `ASPIRE_CLI_START_TIMEOUT`); the wait gates
  assert convergence from the stream rather than polling.
- Cleanup: `CLEANUP_ASPIRE_STOP` runs `aspire stop --apphost <path>` then, with `--cleanup`,
  `aspire stop --force --apphost <path>`; post-stop probe confirms no DCP-labelled containers remain
  for that AppHost path.
- New gate class `resource-command` (`cli-surface.ts`): invoke S8's typed commands and background
  child restarts (`aspire resource <bg> restart`) and assert state via `describe` — the observable
  half of #1372 for background children.
- Receipts flow through `.llm/tools/gates/run-gate.ts` as today.

## Boundaries

No new suites; no OpenHands trigger changes; no saga compensation semantics (#1372 residual).

## Acceptance

- [ ] `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` green on both tiers with
      the new receipts present in `.llm/tmp/gate-receipts/`.
- [ ] Persistent-container leak after `--cleanup` = 0 (docker ps receipt).
- [ ] #1372 updated with what S10 covers and what remains (compensation status, streams).

## Tests / gates

E2E suite itself; gate unit tests under `packages/cli/e2e/tests`.

## Docs / static asset regeneration

`packages/cli/e2e/README` / netscript-cli skill gate table; `gen:assets-barrel` if skills change.

## Related

Part of #<epic>. Depends on S7, S8. Related: #1372, #1388, #542.
