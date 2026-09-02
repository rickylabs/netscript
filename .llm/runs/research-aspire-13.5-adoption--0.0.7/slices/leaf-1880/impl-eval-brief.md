# IMPL-EVAL — PR #1952 (#1880 / #863 gate 2 readiness contract), immutable head 478450a3c

You are the separate-session evaluator (NetScript harness, `.llm/harness/evaluator/protocol.md` and
`verdict-definitions.md`). Route: OpenRouter z-ai/glm-5.3-flash, effort xhigh. You are in a fresh
detached worktree checked out at exactly `478450a3c697b494e68f8c729ff0d9c8d74e5b68`. Do not commit,
push, checkout, rebase, or modify any tracked file. Read-only against git; write only the two output
files named below.

## Scope

Diff base is main `ba6f1f49a` (merge of #1957). Run `git diff --stat ba6f1f49a..HEAD` and confirm
the 16-file set: gate code under `packages/cli/e2e/src/application/gates/scaffold/runtime/`
(`owned-container-log.ts` new, `readiness-disagreement.ts` new, `listener-unreachable-fixture.ts`,
`listener-readiness-gates.ts`), their tests under `packages/cli/e2e/tests/application/`,
`docs/site/reference/aspire/index.md`, `.llm/tools/docs/check-accuracy-and-discoverability.ts`,
regenerated carriers (`.llm/assets/agent-docs/prose.json.gz`, `provenance.json`,
`packages/cli/src/kernel/assets/agent-docs.generated.ts`, `packages/mcp/src/publish-assets.generated.ts`),
plus harness run evidence (`evidence.md`, `aspire-surface-manifest.tsv`). Nothing else.

## Acceptance to judge (#1880 = #863 gate 2)

Gate 2 accepts *either* a corrected probe *or* a documented readiness contract, **plus** a
deterministic reproduction **and** a regression gate. The PR chose the contract. Judge:

1. **Reproduction.** In `listener-unreachable-fixture.ts`, for `controllerListener === 'postgres'`,
   `observeReadinessDisagreement(projectRoot, unhealthyEvidence.testOnly)` runs inside the already
   open #1909 subscription after `observeInducedListenerDeparture` evidence; `readOwnedContainerLog`
   selects the container by ownership proof only (Aspire mounts label src / `ASPIRE_DCP_APPHOST_PATH`
   contained in projectRoot via `pathContained`, exactly one match, never image name alone);
   `assertReadinessDisagreement` requires log-ready + report-Unhealthy and rejects the weaker
   evidence; the receipt carries `readiness` with classification, container id/image, 20-line log
   tail. Sqlite tier: field absent, no docker call.
2. **Permissions.** `listener-readiness-gates.ts` passes `--allow-run=aspire,docker` for the
   listener-unreachable gate only; `runtime-gates_test.ts` and `listener-readiness-gates_test.ts`
   pin it. Confirm no other gate gained `docker`.
3. **Contract doc.** `docs/site/reference/aspire/index.md` states what `Unhealthy` means, why the
   container log is not the readiness authority, what consumers wait on (`aspire wait` /
   `healthReports`; `{}` = unknown). `checkAspireReadinessContract` in
   `check-accuracy-and-discoverability.ts` pins load-bearing phrases — verify by a *dry* read that
   the pinned phrases exist verbatim in the doc (do not mutate the doc).
4. **Carriers.** Regenerated, not hand-edited: run `deno task check:agent-docs-prose`,
   `deno task check:assets-barrel`, `deno task check:publish-assets`,
   `deno task check:mcp-export-corpus`, `deno task check:aspire-version-parity` (all read-only).
5. **#1957 preservation.** `observeInducedListenerDeparture`, `RESOURCE_TRANSITION_FAILURE_CEILING_MS
   = 120_000`, and `verify-typed-db-phase-b.ts` are unchanged versus `ba6f1f49a` (`git diff
   ba6f1f49a..HEAD -- packages/cli/e2e/src/application/gates/scaffold/runtime/verify-typed-db-phase-b.ts`
   must be empty).
6. **Doctrine/scope.** No `packages/*/src` product code beyond the two generated carriers; no
   `plugins/`; no lockfile change; docs+gate code only. Product-behaviour change = FAIL_RESCOPE.
7. Tests: run exactly
   `deno test --allow-all packages/cli/e2e/tests/application/gates/ packages/cli/e2e/tests/application/builders/runtime-gates_test.ts`
   plus `deno fmt --check` and `deno lint` on the changed `.ts` files under `packages/cli/e2e`. Do NOT
   run scaffold runtime suites, `deno task test`, `deno task check`, or anything starting Aspire/Docker.

## Hosted evidence at this head (do NOT rerun) — filled by supervisor

- `e2e-cli` run __RUN__: `scaffold-runtime (aspire + docker + postgres)` __PG__,
  `scaffold-runtime-sqlite (aspire + sqlite + garnet)` __SQLITE__; `quality`, `check-test`,
  `code-quality`, `scaffold-static` __CI__. `close-gate` red only from unticked DoD — never a finding.
- Canary 7 `behavior.live-db-endpoint` failure (order-dependent resource parser) is a separate
  coordinator-owned microfix; out of scope here, do not raise it.

## Output

- Write `.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1880/evaluate.md` using
  `.llm/harness/templates/evaluate.md`: severity-ranked findings with file:line evidence, required
  action per finding, exactly one verdict line `VERDICT: PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT`.
- Also write `.llm/tmp/impl-eval-1952-comment.md`: compact (≤ 60 lines) PR-comment version, first
  line `IMPL-EVAL (separate session, OpenRouter z-ai/glm-5.3-flash xhigh) — head 478450a3c`.
- Finish your final message with the single verdict line. Do not explore the wider repository.
