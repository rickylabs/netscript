# Delta re-review — #1729 ADVISORY-1 repair

Verdict: **DELTA_PASS** — the cycle-1 `PASS_IMPL` (artifact `907cce4147`) remains valid at
`608f68b076bfb724d111bdaf075fd4111703d937`.

Reviewer: Claude Fable 5, separate session from the cycle-1 evaluator, the author (Codex
`gpt-5.6-sol`), and the topic supervisor. Worktree `/home/codex/repos/netscript-007-eval-1729-delta`
(detached at `608f68b07`, product paths untouched, `git status` clean). All probes ran in pristine
`git archive 608f68b07 | tar -x` extractions under `$CLAUDE_JOB_DIR/tmp` (`delta-a`, `delta-c`,
`ref`), deleted afterwards. No Aspire, Docker, browser, `e2e:cli`, or expensive gate.

## Delta

`git diff --name-only 9abc76d48 HEAD | grep -E '^(packages|plugins)/'` → exactly three:
`assets/agent/guidance.md.template` (one hunk, one line), `assets/embedded.generated.ts`
(2 changed lines), `features/agent/init/init-agent_test.ts` (one assertion string). Plus
`worklog.md`, `drift.md`, `context-pack.md` under the run dir.

## Checks

| # | Check | Command (archive) | Result |
| --- | --- | --- | --- |
| 1 | Claim accurate | `delta-c`: `netscript-dev init evalapp --path <archive>/.llm/tmp/evalapp --yes --non-interactive --no-git --editor vscode`, add the `drift.md` `"@netscript/cli": "workspace:"` fixture import, then `agent init --host all --editor vscode` (exit 0). `grep -c` on generated `apps/evalapp-web/AGENTS.md` (2,072 bytes) | `definePage` 1 (line 18), `withResource` 1 (line 18), `withForm` 1 (line 24) — the three topics now claimed are present as composition steps. `defineRouteContract` 0, `staleTime` 0, `dehydrat` 0, `optimistic` 0 — the four rerouted topics are exactly the cycle-1 zero-count set. Reroute targets are real: MCP `find_guidance` and `netscript agent init --with-docs` are both named in the generated root's "Ask the connected tools first" section. Pointer neither over- nor under-states. |
| 2 | Link + instruction preserved | `grep -n 'app build guide' AGENTS.md` in the generated root | Line 6 contains `` `apps/<app>/AGENTS.md` `` and `read it before app work instead of inventing a parallel pattern` verbatim; target file exists in the scaffold. #1674 box 2 intact. |
| 3 | Barrel current | `delta-a`: `deno task gen:assets-barrel` (exit 0), then `cmp` of the five generated files against an untouched archive (`ref`) | **IDENTICAL** ×5 (`cli/embedded.generated.ts`, `skills.generated.ts`, `agent-tools.generated.ts`, `agent-docs.generated.ts`, `plugin/embedded.generated.ts`); `embedded.generated.ts` sha256 `5ae7fcdd3c45c64bb33474cd8fb494191dada1cdd4dad54b59f3af1cb243ff40` on both sides. REPRODUCES, independently confirmed. |
| 4 | Nothing else moved | product-path diff above; template diff hunk count = 1; generated root section headers; `delta-a`: `run-deno-test.ts -- --allow-all packages/cli/src/public/features/agent/init/init-agent_test.ts` | No sixth product path. Only the "Build in the framework's order" paragraph changed; "Inspect Deno before implementing" (#1672) and "Invoke the right installed skill" (#1675) sections are outside the hunk and render unchanged; generated root still has 0 `.claude` references. Installer suite exit 0, **22 passed / 0 failed**. |

## Notes

- Scaffold `agent init` on a local-source project still needs the disposable workspace import
  (pre-existing, recorded in the author's `drift.md` and in cycle-1) — unchanged by the repair.
- ADVISORY-2 is out of scope here and tracked as #1737; not re-examined.

**DELTA_PASS at `608f68b076bfb724d111bdaf075fd4111703d937`.**
