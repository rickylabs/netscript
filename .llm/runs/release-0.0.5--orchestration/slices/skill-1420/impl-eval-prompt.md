# IMPL-EVAL — PR #1421 / issue #1420 (toolchain skill: version-agnostic, copy-safe example)

**Role:** independent evaluator, read-only.
**Route:** Claude · Anthropic · Fable 5 · medium (native opposite-family; Codex-authored).
**Protocol:** `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md`.
**Head (immutable):** `ed778e071b03d4db4f4d213dce4990a90331b60b` — identical across remote, local, PR.
**Worktree:** `/home/codex/repos/ns005-impleval-1421` (already at that head).

This is a **small, proportionate** slice: two markdown files. Do not over-audit. Rule as soon as
claims 1–3 are answered.

## Boundaries

- Read-only. Never enter `/home/codex/repos/ns005-w3b1`. No Aspire/containers/`e2e:cli`.
- Deliver the verdict in your final message; do not end by saying you will wait.

## Why this exists

The `0.0.5-canary.18` cut failed at `publish:readiness`:

```
{"gate":"publish-readiness","id":"markdown-pins","status":"FAIL",
 "details":[".agents/skills/netscript-deno-toolchain/SKILL.md:28 @netscript/service@0.0.5-canary.17; ..."]}
```

A worked example pinned a concrete canary, which goes stale at every cut. A first attempt replaced it
with `@<canary-version>` — but inside a `bash` fence `<` is input redirection, so the command was no
longer copy-safe. The amended head uses a quoted `${NETSCRIPT_CANARY_VERSION:?...}` expansion.

## Claims to falsify (execute; do not infer)

1. **The command is genuinely copy-safe and executable.** Extract the fenced snippet and check it
   parses (`bash -n`, or equivalent). Then run it in a controlled way **both** ways:
   - with `NETSCRIPT_CANARY_VERSION` set to a dummy value → the specifier expands as intended;
   - with it **unset** → the `:?` guard fires with its message and non-zero status.
   The second direction is the point: an unproven `:?` guard is decorative. Do not perform a real
   `deno add` against the network — substitute `echo` or use `bash -n`/parameter-expansion probes.
2. **Version-agnostic.** No concrete NetScript release or canary version anywhere in either skill
   file. Confirm `markdown-pins` passes — run `deno task publish:readiness` and quote that gate's
   line. That is the actual unblock condition.
3. **The gate was not weakened and the archive was not rewritten.** `publish:readiness` /
   `markdown-pins` implementation must be byte-identical to `origin/main`; no skip-list entry added.
   `git diff origin/main...HEAD --name-only` should be the two skill files plus run artifacts only —
   and critically, **nothing under `.llm/runs/` archive directories**, whose historical pins
   (`@0.0.1-beta.9`, `@0.0.1-beta.10`, etc.) are true statements about past runs and must survive.
4. **Mirror parity.** `.agents/` source and `.claude/` mirror identical and generator-produced; run
   `.llm/tools/agentic/claude/validate-claude-surface.ts`.
5. **Guidance preserved.** The surrounding prose must still carry the 2.9.3 rejection, the PR #36099 /
   2.9.4 / 2.9.5 history, and the "do not add the bypass broadly" warning. Judge whether a reader can
   still act on the instruction — the skill exists so agents can run these commands.

## Reporting

Per claim: claim → command → observed output → verdict. Then exactly `PASS`, `FAIL_FIX`,
`FAIL_RESCOPE`, or `FAIL_DEBT`, plus the minimal repair if not PASS. Anything unexamined must be
stated as "not examined" with a reason. Concrete blockers only.
