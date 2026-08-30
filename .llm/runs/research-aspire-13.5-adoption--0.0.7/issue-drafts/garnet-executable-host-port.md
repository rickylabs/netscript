# Draft issue: fix(cli): Garnet executable arm binds host port 6379 regardless of Aspire allocation

> Filed 2026-08-30 as #1742 (Backlog / Triage; coordinator owns milestone).

> Found by S5 IMPL-EVAL (F-5, low, pre-existing — outside the S5 D-16 contract). Labels:
> `type:fix`, `area:cli`, `area:aspire`, `priority:p2`, `epic:aspire-13-5`, `status:triage`.
> Milestone: `0.0.8` (or 0.0.7 if the S6/S8 runtime lease window allows a receipt).

## Summary

`garnetExecutableSetup` (generated `register-infrastructure` cache arm, `Mode: 'Executable'` and the
Docker-less `Auto` fallback) emits `addExecutable(…, ['tool', 'run', 'garnet-server', '--port',
'6379'])`. The Garnet *process* therefore binds host `6379` irrespective of the endpoint port Aspire
allocates for the resource, so two `aspire start --isolated` runs of one project collide in
Executable/Auto mode even after S5 made every other host port opt-in (D-16).

## Acceptance

- [ ] The Garnet executable receives its listen port from the Aspire-allocated endpoint
      (`withEndpoint` target port / env reference), not a literal.
- [ ] `check:aspire-host-ports` fitness gate covers the executable-arm argv (RED on today's emission).
- [ ] Generator test for Executable and Auto arms; `scaffold.runtime-sqlite (aspire + sqlite + garnet)`
      green on CI.
- [ ] Two `--isolated` starts in Executable mode do not collide (receipt under a runtime lease).

## Related

Part of #1712 (follow-up to #1717 / S5). Evidence: `slices/s5/evaluate.md` F-5 on
`origin/research/aspire-13.5-0.0.7`.
