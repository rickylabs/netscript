use harness

## SKILL

- `netscript-harness` — IMPL-EVAL protocol, verdict format, evidence rules.
- `netscript-doctrine` — package boundaries for `packages/cli/e2e`.

## ROLE

INDEPENDENT IMPL-EVAL agent. Verdict only; do not edit files.

Repo: /home/agent/projects/netscript/worktrees/007-eval-slot (read-only, detached at the head below)
PR #1754 (S8), branch feat/aspire-13-5-s8-typed-resource-commands, head `ce7e82a76`.

**BOUNDED DELTA EVALUATION — exactly one commit.** S8 already holds evaluated carry for everything
before this. The coordinator's gate found that the tip commit postdates that carry. Evaluate
`git diff ce7e82a76^..ce7e82a76` and NOTHING else. Four files:

- packages/cli/e2e/src/application/gates/scaffold/runtime/runtime-scripts.ts   (+35/-3)
- packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts             (2 lines)
- packages/cli/e2e/tests/application/gates/scaffold/typed-db-background-restart_test.ts (+177, new)
- packages/cli/e2e/tests/application/builders/runtime-gates_test.ts            (7 lines)

Commit subject: "fix(e2e): refresh background runtimes after a preserved-AppHost typed migrate".

**Do NOT re-run the hosted runtime tiers and do NOT re-run the full test suite.** Both tiers are
already green at this exact head and those receipts are reused. Targeted `deno check --unstable-kv`
and the single new test file are in scope if you need them; nothing broader.

### What this change is for

`scaffold.runtime` runs a typed `<db>-cli migrate` against a **preserved, already-running** AppHost.
Before this commit, the success path left background processors holding pre-migration state — the
failure path had an `ASPIRE_RESTART_SCRIPT` fallback, but the success path restarted nothing, so a
preserved AppHost kept stale workers after a schema change. The repair restarts the background
runtime resources explicitly (`aspire resource <name> restart` over the known background resources),
falling back to the existing restart script when that call fails.

### Judge exactly this

1. **Correctness.** Does the success path now actually refresh background state after a typed
   migrate, without spawning a second AppHost? #1720's box 5 requires that no second AppHost appears
   during `db` ops — verify the change cannot violate it.
2. **Fallback integrity.** Is the pre-existing `ASPIRE_RESTART_SCRIPT` failure path preserved rather
   than replaced, and is the fallback reached on a failed `aspire resource … restart`?
3. **Test honesty.** `typed-db-background-restart_test.ts` is new and large (+177). Does it assert
   the *actual* aspire invocations, or does it assert its own mock's shape? A test that would pass
   against the unrepaired code is a finding.
4. **Blast radius.** The 2-line `runtime-gates.ts` and 7-line `runtime-gates_test.ts` edits: are they
   consistent with the above, and do they change any gate's meaning beyond this repair?
5. Anything in the delta that would invalidate a finding S8's earlier carry relied on.

Output STRICT JSONL, last line the verdict:
{"file":"<path>","ok":true|false,"evidence":"..."}
{"verdict":"PASS|FAIL_IMPL","summary":"..."}
Ground every claim in a command you actually ran, with its output. Do not pad the verdict; if the
delta is sound, say so and stop.
