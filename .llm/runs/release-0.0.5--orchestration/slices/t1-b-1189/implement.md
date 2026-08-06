use harness

## SKILL

Read and follow the worktree root `AGENTS.md`, `netscript-harness`, `netscript-pr`,
`netscript-tools`, `netscript-cli`, `netscript-doctrine`, `jsr-audit`, and the internal `aspire`
diagnostic skill completely. Read the applicable A5/plugin and service/runtime overlays, gate
documents, issue #1189, PR #1316, and the existing tracked run
`.llm/runs/fix-plugin-linking-seam-1189--1189/` before changing code. Use `rtk` for read-heavy
git/gh/rg and wrap `deno task` validation as required by the root instructions.

## Role

You are the implementation supervisor for milestone cluster T1-B: issue #1189 on existing PR #1316,
branch `fix/plugin-linking-seam-1189`, worktree `/home/codex/repos/ns005-cachetiers`. Run as Codex
GPT-5.6 Sol low with bypass permissions. You own this PR repair and its live proof only. The
milestone orchestrator retains merge, release, canary, issue-closure, and acceptance authority. Do
not merge, publish, close issues, launch a competing agent, or perform your own formal IMPL-EVAL.

## Current evidence

- PR #1316 targets `canary/0.0.5-canary.14`; its head at dispatch is
  `a33ccec4ee167cc1e23a80fa7c25a08e4d8e3f5e`.
- The current train base is
  `origin/canary/0.0.5-canary.14@2508eb8c99c9cfc55e0c9f1d7ab72fea745db492`.
- Existing unit/CLI evidence proves the public linking schema, one four-surface reconciler,
  third-party equality, explicit identifiers, both install orders, uninstall intent, and no
  plugin-specific core branch.
- Current CI is red because plugin removal leaves an empty `Apps: {}` object.
- Issue acceptance box 5 and two PR DoD boxes remain unearned: a fresh user scaffold must start
  without manual appsettings edits, a real service must call the fixture third-party plugin, and
  correlated OTEL traces/spans must prove the cross-resource call.
- The orchestrator refreshed `leak-report.md` immediately before launch. All observed survivors are
  foreign or unproven. Do not stop, remove, restart, or mutate any of them.
- A pre-existing unrelated `deno.lock` diff was preserved as stash
  `7eb4ed16d6944c1d1c904895bcb76b4361ad8a57` (`stash@{0}` at dispatch; diff hash
  `6f706f8fbaa20262600f625665eabd5610aa4acc`). Do not pop, drop, rewrite, or commit it.

## Mission

1. Fetch current refs and integrate `origin/canary/0.0.5-canary.14` into the existing public PR
   branch without rebasing or force-pushing. Resolve only real conflicts and record the exact base
   commit.
2. Reproduce the empty-`Apps` removal failure with the focused existing test. Fix cleanup through
   the generic desired-state seam so all declared surfaces prune symmetrically; do not add a
   fixture/plugin-specific branch.
3. Earn the missing observational acceptance with a fresh, run-owned consumer:
   - scaffold a new local-source project and install the fixture third-party plugin with the public
     CLI path;
   - add a consuming service and start through Aspire without hand-editing `appsettings.json`;
   - invoke a real service endpoint whose execution crosses into the fixture plugin;
   - capture correlated trace/span identifiers and the successful cross-resource relationship, not
     merely Healthy/Running state or an empty health report;
   - retain honest RED-before/GREEN-after artifacts in the tracked run.
4. Resource safety is absolute. Start at most the run-owned AppHost needed for this proof, choose
   non-conflicting supported ports, keep scratch under a narrow run-owned root, and pass that root
   to leak/teardown tools when required. Never clean a foreign/unproven survivor. If safe execution
   is genuinely impossible, stop and report `BLOCKED` with exact evidence instead of weakening the
   proof.
5. Run protocol/reconciler/install/remove focused tests, scoped check/lint/fmt, doctrine and JSR
   gates, docs links, plugin parity/consumer proof, then the mandatory one-pass
   `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`. Verify artifacts, not exit
   codes alone. Finish with a post-run leak check and clean only positively proven run-owned
   resources.
6. Update tracked run evidence and the PR body/DoD to current truth. Do not tick issue box 5 or
   introduce/retain the closing keyword unless the live call and correlated OTEL artifact are both
   real and cited; leave final issue-body mutation to the orchestrator.
7. Commit coherent changes and push only with the explicit refspec
   `git push origin HEAD:refs/heads/fix/plugin-linking-seam-1189`. Do not use bare push.
8. Finish by writing a concise handoff in the run worklog: commits, exact changed files, commands
   and results, owned-root/cleanup evidence, live call request/result, trace/span correlation,
   current PR SHA/check state, remaining risk, and `READY_FOR_QWEN_IMPL_EVAL` or
   `BLOCKED: <evidence-backed reason>`.

## Guardrails

- Preserve unrelated dirty state and never stage it. The refreshed `leak-report.md` is
  orchestrator-generated current evidence and may be committed if retained accurately.
- Thin plugin/core ownership, third-party parity, generated-consumer proof, and service/runtime
  telemetry are release gates; do not replace them with mocks.
- Formal IMPL-EVAL is a new Qwen 3.8 Max high session dispatched by the orchestrator after your
  implementation handoff. Do not cross that evaluator phase.
- Your final non-empty response line must be exactly `DONE` if the pushed PR is ready for that
  evaluator, or `BLOCKED: <reason>` if not.
