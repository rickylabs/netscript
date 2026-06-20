# Phase Registry — feat-framework-prime-time--supervisor

Supervisor run; each phase group below is an independent harness slice that merges into the umbrella
branch `feat/framework-prime-time`. Status legend: `planned` → `plan-eval` → `impl` → `impl-eval` →
`merged`.

## Wave A — startable now (no cross-slice deps)

### Blocker batch (gates all downstream waves)

| group | slice | sev | status | PLAN-EVAL | IMPL-EVAL | sub-PR |
| --- | --- | --- | --- | --- | --- | --- |
| A-G1 | sagas-durable-store | blocker | impl (running) | PASS | — | #74 |
| A-G2 | sagas-idempotency-e2e | blocker | impl (running) | PASS | — | #75 |
| A-G3 | sagas-telemetry-spans | blocker | impl (running) | PASS | — | #76 |
| A-G4 | service-auth-seam | blocker | impl (running) | PASS | — | #77 |
| A-G5 | service-graceful-shutdown | blocker | impl (running) | PASS | — | #78 |
| A-G6 | worker-applied-keys-dedup | blocker | impl (running) | PASS | — | #79 |
| A-G7 | rbp-dlq-contract | blocker | impl (running) | PASS (cycle-2) | — | #80 |

The remaining ~67 Wave-A high/medium slices and Waves B/C/D are tracked in `register.md` and will be
promoted into this registry as generator-lane capacity is allocated (per user sign-off on cadence).

## Blocker batch — generator launch manifest (2026-06-20, all 7 in parallel)

Implementation lane: WSL Codex daemon-attached agents (mobile-visible, steerable). Daemon: managed
`codex remote-control` on `YogaBook9i` (`status:connected`, `remoteControlEnabled:true`, socket
`/home/codex/.codex/app-server-control/app-server-control.sock`). Steer a thread ONLY with
`codex exec resume <thread-id> "<follow-up>"` — never a second `send-message-v2` at the same worktree.

| Slice | Sub-PR | WSL worktree | Codex thread id | Launch log |
| --- | --- | --- | --- | --- |
| sagas-durable-store | #74 | /home/codex/repos/netscript-pt-sagas-durable-store | 019ee2b9-1c34-7b82-b8bc-6c54a1c5cde5 | /home/codex/pt-sagas-durable-store.log |
| sagas-idempotency-e2e | #75 | /home/codex/repos/netscript-pt-sagas-idempotency-e2e | 019ee2b9-2ae6-7353-8662-0e0bbf6cf6bd | /home/codex/pt-sagas-idempotency-e2e.log |
| sagas-telemetry-spans | #76 | /home/codex/repos/netscript-pt-sagas-telemetry-spans | 019ee2b9-3a95-7ed0-ab8c-c98bbffd13da | /home/codex/pt-sagas-telemetry-spans.log |
| service-auth-seam | #77 | /home/codex/repos/netscript-pt-service-auth-seam | 019ee2b9-4a4a-7f11-87af-bd3b2a6f558e | /home/codex/pt-service-auth-seam.log |
| service-graceful-shutdown | #78 | /home/codex/repos/netscript-pt-service-graceful-shutdown | 019ee2b9-59f1-70c1-834d-33653e916846 | /home/codex/pt-service-graceful-shutdown.log |
| worker-applied-keys-dedup | #79 | /home/codex/repos/netscript-pt-worker-applied-keys-dedup | 019ee2b9-699e-7011-98d1-3971a362db9f | /home/codex/pt-worker-applied-keys-dedup.log |
| rbp-dlq-contract | #80 | /home/codex/repos/netscript-pt-rbp-dlq-contract | 019ee2b9-7949-79f0-96a4-ef91b3903d11 | /home/codex/pt-rbp-dlq-contract.log |

Branch = `feat/prime-time/<slice>`, off umbrella `fe89b6b4` (+1 empty seed commit so the draft PR
could open). Each branch's remote was created with an explicit `HEAD:refs/heads/<branch>` refspec
(repo `push.default=upstream` mis-targets the umbrella otherwise).

### Dependency / merge ordering

- `sagas-durable-store` (#74) is the FOUNDATION (`KvSagaStore` + `createDurableSagaRuntime` over the
  existing `SagaStorePort`). Merge it FIRST.
- `sagas-idempotency-e2e` (#75) and `sagas-telemetry-spans` (#76) build to that locked contract and
  are briefed to rebase onto merged durable-store before IMPL-EVAL/merge.
- `service-auth-seam` (#77), `service-graceful-shutdown` (#78), `worker-applied-keys-dedup` (#79),
  `rbp-dlq-contract` (#80) are independent — mergeable in any order after their own IMPL-EVAL PASS.

### Launch landmines

- Daemon was UNMANAGED at launch; repaired via the documented codex-user-only anchored-PID +
  socket-removal procedure (user-authorized).
- See memory `wsl-repo-push-default-upstream` for the push refspec rule.

## Notes

- Each slice brief must mandate `use harness`, activate ALL relevant skills + ARCHETYPE + SCOPE,
  adhere to the Architecture Doctrine, and hit the production/enterprise bar (no stubs/no-ops; real
  persistence, error-handling, idempotency, observability, graceful shutdown; full tests; gates
  green).
- PLAN-EVAL (OpenHands minimax-M3) and IMPL-EVAL (OpenHands qwen3.7-max) are separate sessions from
  the generator. No slice implementation before its PLAN-EVAL returns PASS.
- Two FAIL cycles on any slice → escalate to user.
