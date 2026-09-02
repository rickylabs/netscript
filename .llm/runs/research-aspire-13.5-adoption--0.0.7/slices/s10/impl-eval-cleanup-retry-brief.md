use harness

## SKILL

- `netscript-harness` — IMPL-EVAL protocol, verdict format, evidence rules.
- `netscript-doctrine` — package boundaries for `packages/cli/e2e`.

## ROLE

INDEPENDENT IMPL-EVAL agent. Verdict only; do not edit files.

Repo: /home/agent/projects/netscript/worktrees/007-s11-eval (read-only, detached at the head below)
PR #1760 (S10), head `1085f470a`, base `main`.

Do not dispatch or re-run hosted runtime tiers — dual-tier proof is executing on this head. Static
work only.

### Scope

`git diff 96be42114..1085f470a` — `evidence/cleanup.ts` and its test.

### The observed failure this repairs

Run `33626174632`, Postgres tier: **93 pass / 1 fail**. Every functional gate including
resource-command and OTEL passed. The sole failure was `cleanup.aspire-stop` after **1.73s** with one
owned survivor container `5c23e3eb…` at `cleanup.ts:91`.

Claim: `aspire stop --force` returns once teardown is *requested*; Docker removes containers
afterwards, so a single immediate probe can observe a container already on its way out. The repair
re-probes with one forced exact-AppHost stop between bounded waits (2s, 5s), retaining every
observation as `survivorAttempts`.

### Judge exactly this

1. **Is the retry genuinely bounded?** It must terminate — a persistent survivor must still fail,
   after a fixed number of attempts, not loop.
2. **Does each attempt observe fresh state?** `inspectAllContainers` is re-run per probe. Verify the
   retry cannot re-evaluate a cached container list, which would make it meaningless.
3. **Ownership semantics unchanged.** Only the exact AppHost may be stopped. Foreign and unproven
   resources must still be reported and never mutated, and `unprovenProcesses` (added earlier in this
   slice) must still be populated.
4. **Is the RED honest?** The tests are injectable rather than driving real subprocesses. Confirm
   they would fail against `96be42114` — in particular that the first test's survivor-then-clear
   sequence proves retry behaviour rather than asserting its own mock.
5. **No product behaviour.** `git diff origin/main...1085f470a -- packages/cli/src plugins` should be
   empty; confirm independently.
6. Anything that would make a real leak *pass* — the failure mode that matters most here, since the
   repair loosens a previously immediate assertion.

Run: `deno check --unstable-kv` on changed paths; `deno test --allow-all packages/cli/e2e/tests/`.

Output STRICT JSONL, last line the verdict:
{"area":"<name>","ok":true|false,"evidence":"..."}
{"verdict":"PASS|FAIL_IMPL","summary":"..."}
Ground every claim in a command you actually ran.
