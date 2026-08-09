use harness

## SKILL

Activate: `netscript-harness`, `netscript-deno-toolchain`, `netscript-tools`, `netscript-cli`,
`netscript-pr`, `netscript-release`.

Read `.llm/harness/workflow/run-loop.md`. This slice is broad-but-mechanical with one genuinely
verifiable behavioural claim at its centre. Record `PLAN-EVAL: N/A` with justification, then
implement. Keep `worklog.md`, `context-pack.md`, `drift.md` current in
`.llm/runs/release-0.0.5--orchestration/slices/deno-1413/` and commit them with the slice.

You are Tier-D and do not self-certify: the orchestrator runs the mandatory separate-session
IMPL-EVAL, CI and merge. Report back and stop when your gates are green and the draft PR is open.

## Setup

Worktree `/home/codex/repos/ns005-deno295`, branch `chore/deno-2-9-5-toolchain`, off `origin/main`.
You are the only writer here. Push with an explicit refspec only:
`git push origin HEAD:refs/heads/chore/deno-2-9-5-toolchain`. Never push to `main`.

## Mission — issue #1413, milestone 0.0.5

Standardize on **Deno 2.9.5**. This is a release prerequisite sequenced before the next canary,
because the currently pinned toolchain cannot reliably verify a freshly published canary.

Owner-verified upstream facts — do not re-derive, but do not overstate either:

- **2.9.3 rejects `--minimum-dependency-age`.** With the default 24-hour dependency-age policy, a
  freshly published explicit prerelease can be blocked.
- Fixed in denoland/deno PR #36099 / commit `5dd39c7458`, shipped in 2.9.4, included in **2.9.5**.
- On 2.9.5, `deno add --minimum-dependency-age=0 jsr:@netscript/service@0.0.5-canary.17` succeeds
  and writes the exact prerelease.
- **`@canary` is not a JSR feature** and still fails on 2.9.5. Keep explicit `releaseSpecifier` in
  docs and commands.

## Audited surface (verify it yourself; this is a starting map, not gospel)

Under `.github` — 11 files: `toolchain.env` (`NETSCRIPT_DENO_VERSION=v2.9.0`, hydrated by
`openhands-agent.yml`), `ci.yml` ×5, `e2e-cli.yml` ×5, `surface-diff.yml` ×2, `code-quality.yml` ×2,
`release-canary.yml`, `jsr-settings.yml`, `pages.yml`, `publish.yml`, `e2e-cli-prod.yml`,
`e2e-cli-prod-local.yml`.

Outside `.github` — canonical constant
`packages/cli/src/kernel/constants/scaffold/scaffold-defaults.ts:5` (`DENO_VERSION: '2.9.0'`),
`templates/workspace/generate-readme.ts`, `generators_test.ts`, `node-modules-verifier_test.ts`,
`plan-init_test.ts`, `.agents/skills/netscript-deno-toolchain/SKILL.md` + its `.claude/` mirror,
`.llm/tools/agentic/runtime/contract_test.ts`.

**Verify individually, do not bulk-replace:** `packages/telemetry/tests/hono/otel_middleware_test.ts`,
`packages/service/tests/hono-tracing_test.ts`, `plugins/workers/jobs/job-tools_test.ts` — these
contain `2.9.0` strings that are probably unrelated. A blind sweep would corrupt them. Report which
you changed and which you left, with reasons.

## Work

1. Update `.github/toolchain.env` and every workflow pin to 2.9.5. Record the final count of
   remaining `2.9.0`/`2.9.3` Deno pins under `.github` — it must be zero.
2. Update the canonical scaffold constant and make generated READMEs / scaffold tests agree with the
   constant. Prefer deriving from the constant over introducing a second hardcoded literal.
3. Update the toolchain skill in `.agents/skills/netscript-deno-toolchain/SKILL.md` and regenerate
   the `.claude/skills/` mirror (generated, never hand-edited — see CLAUDE.md). Document both the
   `--minimum-dependency-age` behaviour and the `@canary` limitation so the next agent does not
   rediscover them.
4. **Produce the exact RED→GREEN proof** and put it in the PR body verbatim: on 2.9.3 the
   `deno add --minimum-dependency-age=0 jsr:@netscript/service@<a published canary>` invocation
   fails with the flag rejection; on 2.9.5 the same command succeeds and writes the exact
   prerelease. Include raw commands, the `deno --version` for each, and raw exit codes. Run it in a
   scratch directory outside the repo. **This is the centre of the slice** — the pin bump is
   worthless without it.
5. Local WSL is `deno 2.9.3` at `/home/codex/.deno/bin/deno`, and that binary is **root-owned**.
   Do not escalate privileges. If a local upgrade is needed for your proof, use a user-writable
   install location (e.g. a scratch `DENO_INSTALL`) and report exactly what the owner must run to
   upgrade the system binary.
6. Gates with raw exits: `deno task check`, `deno task test`, `deno task lint`, `deno task fmt:check`
   or the scoped wrappers, `deno task quality:gate`, `deno task arch:check`, and
   `.llm/tools/agentic/claude/validate-claude-surface.ts` since skills change.
7. Open a **draft** PR against `main` with `Closes #1413`, milestone 0.0.5, taxonomy labels with
   exactly one `status:`.

## Non-negotiables

- **Do not add `--minimum-dependency-age=0` broadly.** Only where a freshly published canary is
  deliberately installed ahead of the age policy. It is a policy bypass, not a default.
- Do not switch any command to `@canary`.
- **Preserve lockfiles** unless the toolchain change genuinely requires a change; if it does, record
  precisely why.
- Do not start Aspire, containers, or any `e2e:cli` runtime suite. No serialized token is granted.
- Do not weaken, skip, or add an allowance to any gate. A failing gate is a finding to report.
- Report anything you cannot evidence, plainly.
