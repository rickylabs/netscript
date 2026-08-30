use harness

## SKILL

- netscript-harness — run lifecycle, slice review gate, evaluator separation (you never self-certify).
- netscript-doctrine — `packages/cli`, `packages/plugin-streams-core` and `plugins/*` are framework code; `quality:scan` + `arch:check` per slice; no `any`, no casts, no new `deno-lint-ignore`.
- netscript-tools — scoped wrappers (`run-deno-check.ts`, `run-deno-test.ts`, `run-deno-lint.ts`, `run-deno-fmt.ts`), gate receipts, lock hygiene.
- netscript-cli — CLI plugin install surface and its completion output.
- netscript-pr — commit-trail comments on the existing PR; do NOT relabel, mark ready, merge, or close anything.
- aspire — Aspire 13.5 service discovery (`services__<name>__<protocol>__<index>`, `VITE_services__*`), dynamic endpoint allocation. **No AppHost start, no host CLI change — this dispatch carries NO runtime lease.**

## Context

You are the GPT-5.6 Sol implementation agent for the **S5 repair cycle** of the Aspire 13.5 epic
(#1712): **#1717 — [aspire-13-5 S5] remove runtime literal ports from plugin contributions,
infrastructure, and E2E probes**. PR **#1740** is already open and carries slices 1–8. Supervisor:
the Claude Opus 5 Aspire topic supervisor (NAS session).

S5 previously reached IMPL-EVAL PASS, but live GitHub state is now red and the earlier PASS is
void. You are repairing four verified defects — one hard CI failure and three unanswered
`augmentcode` review findings that block the `close-gate`. **All four are confirmed by the
supervisor; do not re-litigate whether they are real. Implement the locked disposition below.**

### Your worktree / branch
- Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s5` (native ext4; work ONLY here).
- Branch: `fix/aspire-13-5-s5-literal-ports` at `0bd8ba832`. **No upstream by design** — push only
  with `git push origin HEAD:refs/heads/fix/aspire-13-5-s5-literal-ports`.
- PR #1740 already exists (base `main`). Do not open a new PR. Comment the commit trail on #1740.
- Note: S6's PR #1743 is stacked on this branch. Append commits; never rewrite `0bd8ba832` or
  anything below it.
- Run dir you own: `.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s5/repair/` — write
  `worklog.md` (with a `## Design` section) and `drift.md` there and commit them with your slices.

### Required reading (in order)
1. `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md`
   — locked decision **D-14** (`SAGAS_API_DEFAULT_PORT` deprecation compat) and **D-16**
   (infrastructure host ports). Your repair must not violate either.
2. Issue #1717 acceptance boxes.
3. `packages/plugin-streams-core/src/application/stream-url-resolver.ts` — `getStreamsUrl()` and
   `buildStreamUrl(path, baseUrl?)`. This is the existing, correct discovery chain.
4. `.llm/tools/validation/check-aspire-host-ports.ts` — the fitness gate you are hardening.

## Locked defects and dispositions

### F-1 (CI-red, hard blocker) — `plugins/ai` manifest test not updated with the manifest
`check-test` fails at `plugins/ai/tests/manifest_test.ts:56`
(`AssertionError: Values are not equal. actual 0 / expected 8095`) in run
`33286543750`. S5 removed `officialSource.backgroundPort: 8095` from
`plugins/ai/scaffold.plugin.json` but left the test asserting `backgroundPort === 8095`.

**Disposition:** the manifest change is correct (S5 intent: no literal runtime ports). Update the
assertion to prove the *new* contract — that `officialSource.backgroundPort` is absent/undefined and
that no literal port survives — rather than deleting the test. Rename the test if its name no longer
describes what it proves. Then sweep **every** other plugin manifest/test pair S5 touched for the
same stale-assertion class and fix each one; state in `worklog.md` how you enumerated them (a
targeted `git diff origin/main...HEAD --name-only` over `plugins/**` plus a grep for the removed
keys in `**/tests/**`), and record the full list even where no change was needed.

### F-2 (review thread, medium) — literal-port removal broke Aspire discovery in stream factories
`plugins/workers/streams/factory.ts:52` (and `plugins/auth/streams/factory.ts:46`,
`plugins/sagas/streams/factory.ts:48`, `plugins/triggers/streams/factory.ts:55`) replaced the old
`options.baseUrl ?? 'http://localhost:4437'` literal with a `requiredStreamsBaseUrl()` helper that
**throws** when `baseUrl` is omitted. `baseUrl` is an optional API. `buildStreamUrl(path, baseUrl?)`
already falls back to `getStreamsUrl()`, which resolves `DURABLE_STREAMS_URL` →
`services__streams__http__0` (server) → `VITE_services__streams__http__0` / `VITE_STREAMS_URL`
(browser). S5 therefore deleted the working Aspire-wired path along with the literal.

**Disposition:** remove the `requiredStreamsBaseUrl()` throw from all four factories and pass
`options.baseUrl` straight through to `buildStreamUrl`, letting `getStreamsUrl()` resolve. The
literal `4437` must not come back in any form. Keep the corrected doc comments/examples. Add a
regression test per affected plugin (or one shared table-driven test) proving that (a) an omitted
`baseUrl` resolves through the injected discovery env instead of throwing, and (b) an explicit
`baseUrl` still wins. Do not weaken `getStreamsUrl()`'s existing "not found" error — that error is
the correct terminal failure when nothing is discoverable.

### F-3 (review thread, medium) — CLI announces a template port as if it were the allocated endpoint
`packages/cli/src/public/features/plugins/install/install-plugin.ts:574` leaves `hostPort` unset for
a normal install, but the install completion output still announces `plugin.servicePort`. After S5
that value is only a deterministic template port, never the endpoint Aspire allocates, so the CLI
reports a misleading and usually unreachable port to the user.

**Disposition:** stop presenting a template port as a live endpoint. When `hostPort` is absent, the
completion message must not print a port at all — point the user at the Aspire dashboard / resource
endpoint instead; print a concrete port only when an explicit host port was actually pinned. Keep
the returned data shape intact (`servicePort` may remain in the result object); this is a
presentation fix. Cover it with a CLI test asserting the no-`hostPort` completion output contains no
port number and the explicit-`hostPort` output does.

### F-4 (review thread, medium) — fitness gate is line-scoped and misses multiline fallbacks
`.llm/tools/validation/check-aspire-host-ports.ts:50`: `CONTRIBUTION_PORT_FALLBACK`
(`/\bctx\.port\([^)]*,[^)]*\)/`) is evaluated one line at a time, so a normally formatted
`ctx.port(resource,\n  defaultPort)` is not detected and a plugin can reintroduce exactly the
fallback this gate exists to block.

**Disposition:** make the contribution-fallback detection span lines (match against the file text
with the relevant matcher, not per-line), while keeping the reported location a real line number and
keeping every other matcher's current semantics. Add gate self-tests with a multiline
`ctx.port(resource,\n  defaultPort)` fixture that FAILS the gate and a single-argument
`ctx.port(resource)` fixture that PASSES. Review the other regexes in this file for the same
line-scoping assumption; fix any that share the defect and record the ones that are correctly
line-scoped by design.

## Slices (commit in order; RED-first — write the failing test before the fix)
1. **F-1** manifest/test contract realignment + the cross-plugin stale-assertion sweep.
2. **F-2** stream-factory discovery restoration + regression tests (4 plugins).
3. **F-3** CLI completion port honesty + tests.
4. **F-4** fitness-gate multiline detection + gate self-tests.
5. **Gates + evidence.** Configured `deno task lint`, `deno task check`, `deno task test`, scoped
   wrappers over each touched root, `deno task quality:scan`, `deno task arch:check`,
   `check:assets-barrel` if any generated asset moved. Record every command and its exit code in
   `worklog.md`. Do NOT run `deno task e2e:cli` or any Aspire/Docker runtime — you have no lease.

## Boundaries
- Do not rewrite or amend existing S5 commits; append only.
- Do not touch `packages/aspire` public surface, pins (S1), fixtures (S3), health checks (S6),
  teardown (S7), or resource commands (S8).
- Do not delete, skip, or de-catalog a test to make a gate green. If you believe a test is stale,
  stop and report it instead.
- Do not modify PR labels, milestone, draft/ready state, or close any issue. Do not merge anything.
- Do not modify `deno.lock` unless a dependency genuinely changed; never delete it or run
  `deno cache --reload`.
- Never start Aspire, Docker, or a generated AppHost.

## Commit trail
- After each slice: commit, push with the explicit refspec, then comment on **PR #1740** with the
  slice scope, the commit SHA, and the gate evidence (command + exit code). Update
  `slices/s5/repair/worklog.md` in the same commit — a slice whose commit does not touch the run dir
  is incomplete.

## Stop conditions
- Final non-empty line exactly `DONE` (plain text, nothing after) when slices 1–5 are committed and
  pushed, PR #1740 carries the per-slice comments, and all gates in slice 5 are green.
- Otherwise final non-empty line exactly `BLOCKED: <exact reason and evidence path>` (plain text).
- You do not mark the PR ready and you do not self-certify. The supervisor performs the Tier-A slice
  review and an independent session runs IMPL-EVAL.
