use harness

## SKILL

- netscript-harness — run loop, commit + push, run-dir artifacts; no self-certification.
- netscript-doctrine — `packages/cli/e2e` is framework code; no `any`/casts/lint-ignores introduced.
- netscript-tools — scoped check/lint/fmt wrappers; `git ls-remote` before any `--force-with-lease`.

## D-194 — S9 owns a red `runtime.aspire-start`; repair it at the root, do not paper over it

### The failure

CI `scaffold-runtime-sqlite` on **#1759 at `042ff3ca5`** returned **`passed=37 failed=1`**. The sole
failure:

```
> runtime.aspire-start: Start generated Aspire AppHost
  FAILED 59ms
  Command exited 1; expected 0.
  NotFound: No such file or directory (os error 2):
    readfile '.../.llm/tmp/cli-e2e/plugin-smoke-20260831-144641/aspire.config.json'
```

Raised at `packages/cli/e2e/src/application/gates/scaffold/local-source-fixture.ts:33`
(`const config = JSON.parse(await Deno.readTextFile(configPath));`). `cleanup.aspire-stop` still
PASSED, so teardown was clean. Run `33404325326`, job `99528225703`.

**59 ms is the tell.** This is not an AppHost startup problem — the gate never got as far as starting
anything. It failed immediately on a missing file.

### It is yours — this was established by a control, not by suspicion

The same suite, on the same CI, at a head that does **not** contain S9's gate changes (#1747
`2032d4ed7`, run `33404321608` attempt 2), returned `scaffold-runtime-sqlite` **success**. The
environment is fine. The delta is S9.

Your diff touches exactly this area: `runtime-gates.ts` (+7/−4), `scaffold-gates.ts` (+7),
`scaffold-capability-gates.ts` (+8), `runtime/listener-readiness-gates.ts` (+26),
`runtime/runtime-scripts.ts` (+27), plus the new `aspire-mcp/` gate family and the new
`agent.aspire-mcp-smoke` registration.

### What to do

1. **Find the actual root cause before changing anything.** The likely shapes, in order of
   suspicion — confirm or eliminate each with evidence rather than picking one:
   - the workspace identity is wrong: `runtime.aspire-start` is resolving a **`plugin-smoke-*`**
     workspace, while `aspire.config.json` was written into the scaffold workspace this suite
     actually created. Check what your gate registration changed about which workspace/`cwd` the
     runtime gates receive;
   - **gate ordering**: inserting `agent.aspire-mcp-smoke` moved `runtime.aspire-start` ahead of the
     step that produces `aspire.config.json`;
   - a **capability/suite wiring** change routed the sqlite tier through a fixture path that never
     runs the config-emitting step.
2. **Repair the cause.** Do **not** satisfy the gate by creating `aspire.config.json`, stubbing the
   read, try/catching the `NotFound`, skipping the gate on the sqlite tier, or relaxing
   `local-source-fixture.ts`. If you conclude the correct fix genuinely *is* in
   `local-source-fixture.ts`, say why explicitly and show that the fixed path still fails when the
   config is legitimately absent.
3. **Add regression coverage** that fails without your fix — a deterministic test asserting the
   workspace/ordering invariant you restored, so this cannot silently regress again.
4. Keep every other part of S9 unchanged. This is a repair, not a redesign.

### Runtime rules

- **Do NOT start Aspire, Docker, or any AppHost.** Host runtime leases are serialized and another
  slice holds the lease. Your proof is static/deterministic; the runtime verdict comes from CI.
- Do not run `e2e:cli` runtime suites locally.

### Verification before pushing

- Focused `deno check --unstable-kv`, lint, and fmt (scoped wrappers, `--ext ts,tsx`) on every file
  you change.
- The focused tests covering the gates you touched, plus your new regression test.
- Repo-wide `deno task check` — expect `failedBatches: 0`.
- State plainly which root cause you confirmed and which you eliminated.

### Push

Branch `fix/aspire-13-5-s9-skills-mcp-alignment`, currently `042ff3ca5`. Run
`git ls-remote origin refs/heads/fix/aspire-13-5-s9-skills-mcp-alignment` immediately before pushing.
This should be a fast-forward; if a force would be required, **stop and report**.

### Out of scope

- No rebase onto main, no PR base change, no label or lifecycle change.
- **No self-dispatched evaluator.** The supervisor dispatches a fresh IMPL-EVAL automatically once
  your repair changes evaluated bytes — that is already authorized, so do not request or run one.

### Report back

The confirmed root cause with the evidence that established it, the causes you eliminated, the exact
repair, your regression test's name and its red-without-fix proof, every verification command's exit
code, the new head, and confirmation the worktree is clean and the push landed.
