# IMPL-EVAL — PR #1414 / issue #1413 (standardize on Deno 2.9.5)

**Role:** independent evaluator. Read-only. You did not write this and must not defend it.
**Route:** Claude · Anthropic · Fable 5 · medium (native opposite-family; Codex-authored).
**Protocol:** `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md`.
**Worktree:** `/home/codex/repos/ns005-impleval-1414` — verify `git rev-parse HEAD` equals PR #1414's head first.

## Boundaries

- Read-only. No edits, commits, pushes, or git write commands.
- **Never enter** `/home/codex/repos/ns005-deno295`, `ns005-docs1411`, `ns005-w3b1`, or
  `ns005-docs-consistency` — other agents are writing there.
- No Aspire, containers, or `e2e:cli`. Type-checks, tests and `deno add` in scratch are fine.
- Final message is the verdict artifact: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.

## Why this slice exists

Deno 2.9.3 rejects `--minimum-dependency-age`. With the default 24-hour dependency-age policy, a
freshly published prerelease can therefore be blocked — which is exactly what canary verification
does. Fixed upstream in denoland/deno PR #36099 / commit `5dd39c7458`, shipped in 2.9.4, included in
2.9.5. `@canary` is **not** a JSR feature and still fails on 2.9.5.

## Claims to falsify (execute; do not infer)

1. **The RED→GREEN proof is real — this is the centre of the slice.** The lane recorded RED on
   2.9.3 (`error: unexpected argument '--minimum-dependency-age' found`, exit 1) and GREEN on 2.9.5
   writing the exact prerelease. **Re-run both halves yourself** in your own scratch directory
   outside any repo. The 2.9.3 binary is preserved at `/home/codex/.deno/bin/deno-2.9.3.rollback`;
   canonical `/home/codex/.deno/bin/deno` is 2.9.5. Confirm the GREEN half writes the *exact*
   prerelease (inspect the resulting `deno.json`), not a range or a different version. A pin bump
   without a working proof is worthless.
2. **`@canary` really does still fail on 2.9.5.** The slice relies on this to justify keeping
   explicit `releaseSpecifier` everywhere. Try it and record what actually happens.
3. **No stale Deno pin remains under `.github`.** Count `2.9.0` / `2.9.3` Deno pins yourself and
   report the number. `.github/toolchain.env` (`NETSCRIPT_DENO_VERSION`) is hydrated by
   `openhands-agent.yml` — check that path resolves to 2.9.5 too.
4. **The three files deliberately NOT changed were correctly excluded.**
   `packages/telemetry/tests/hono/otel_middleware_test.ts`,
   `packages/service/tests/hono-tracing_test.ts`, `plugins/workers/jobs/job-tools_test.ts` contain
   `2.9.0` strings the lane judged unrelated. Verify each individually. If any is genuinely a Deno
   pin, that is a miss; if the lane changed one that was unrelated, that is a corruption. Report
   which and why.
5. **Scaffold expectations derive rather than duplicate.** `scaffold-defaults.ts` holds the
   canonical `DENO_VERSION`. Check `generate-readme.ts` and the scaffold tests reference the
   constant instead of hardcoding a second literal that can drift. A test asserting a hardcoded
   `'2.9.5'` while the constant changes independently is a finding.
6. **Skills are generated, not hand-edited.** `.agents/skills/netscript-deno-toolchain/SKILL.md` is
   source; `.claude/skills/` is a mirror that CLAUDE.md says must be generated. Confirm the mirror
   matches what the generator produces, and run
   `.llm/tools/agentic/claude/validate-claude-surface.ts`. Confirm the skill documents both the
   `--minimum-dependency-age` behaviour and the `@canary` limitation, since the point is that the
   next agent should not have to rediscover them.
7. **No policy bypass leaked in.** `--minimum-dependency-age=0` must appear **only** where a freshly
   published canary is deliberately installed ahead of the age policy — not as a general default in
   workflows, scaffold output, or docs. Grep the diff and report every occurrence with its
   justification. Confirm nothing was switched to `@canary`.
8. **Lockfiles unchanged.** `git diff origin/main...HEAD -- '*.lock'` must be empty; if not, the
   reason must be recorded and genuinely required.
9. **Gates.** Run `deno task check`, `deno task test`, `deno task lint`, `deno task quality:gate`,
   `deno task arch:check` and report raw exits. Note whether CI would now run 2.9.5 — the pins are
   the deliverable, so a pin that does not take effect is a finding.
10. **Acceptance rows.** Read #1413 and its comments, and state row by row whether this head
    satisfies each with evidence you executed. Note that the local-WSL row was discharged by the
    owner before this slice began.

## Standard

Earlier IMPL-EVALs in this run reached `PASS` only by reproducing what the slice claimed — one
rebuilt a 4.6 MB corpus to byte-identity; another proved a new gate failed against a genuine pre-fix
site. Match that. Say explicitly where you could not execute something.

Report per claim: claim → command → observed output → verdict. Then the overall verdict, and the
minimal repair if not PASS, phrased so the original writer can act on it.
