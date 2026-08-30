use harness

## SKILL

- netscript-harness — evaluator protocol (`.llm/harness/evaluator/protocol.md`, `verdict-definitions.md`); you are the **independent IMPL-EVAL** for Codex-authored work. You never continue implementation and never self-certify.
- netscript-doctrine — `packages/cli`, `packages/plugin-streams-core`, `plugins/*` are framework code: `quality:scan` + `arch:check`, no `any`, no casts, no new `deno-lint-ignore`.
- netscript-tools — scoped wrappers, gate receipts, raw git verification, lock hygiene.
- netscript-pr — closing-keyword and label rules (you verify them; you do not change them).
- aspire — Aspire 13.5 service discovery and dynamic endpoint allocation. **No AppHost start, no host CLI change, no Docker — you hold no runtime lease.**

## Context

Formal **IMPL-EVAL cycle 3** for **S5 of the Aspire 13.5 epic** (#1712): **#1717 — remove runtime
literal ports from plugin contributions, infrastructure, and E2E probes**. PR **#1740**, base `main`.
Route: Claude · Anthropic · Fable 5 · medium — native opposite-family evaluator of Codex · GPT-5.6
Sol work, per `.llm/harness/workflow/lane-policy.md`. Separate session from the generator, from the
supervisor, and from the S7 evaluator.

**Why cycle 3 exists.** Cycle 2 returned `PASS` and the PR was labelled `status:ready-merge` +
`impl-eval:skip`. That verdict is **void** — see drift **D-20**. At reconciliation the PR was red:
`check-test` failed on a stale `plugins/ai` manifest assertion, and `close-gate` failed on three
unanswered `augmentcode` review threads. A supervisor-directed repair cycle then landed four fixes
plus a derived-asset regeneration. **Evaluate the whole S5 contract at the final head**, with the
repair range as the focus — do not assume any part of the earlier PASS still holds.

- Evaluate **exactly** head `aa822069` on `fix/aspire-13-5-s5-literal-ports`.
- Original wave: `0bd8ba832` and below. Repair range: `0bd8ba83..aa822069`.
- Your worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s5-eval` (detached at that head; product files are read-only to you).
- Generator run dir: `.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s5/repair/`
  (`worklog.md` with `## Design` + gate tables, `drift.md`).
- Supervisor Tier-A review: `slices/s5/repair/review-tier-a.md` — treat its findings as claims to
  re-verify, not as conclusions to inherit.

## The four locked repair defects (verify each independently)

- **F-1** — `plugins/ai/scaffold.plugin.json` dropped `officialSource.backgroundPort: 8095` while
  `plugins/ai/tests/manifest_test.ts` still asserted it. Disposition: realign the assertion to the
  new contract (never delete the test), then sweep every other plugin manifest/test pair S5 touched
  for the same stale-assertion class and record the enumeration method.
- **F-2** — `plugins/{workers,auth,sagas,triggers}/streams/factory.ts` replaced the
  `options.baseUrl ?? 'http://localhost:4437'` literal with a helper that **throws** on an omitted
  `baseUrl`, deleting the working Aspire-discovery path. `buildStreamUrl(path, baseUrl?)` already
  falls back to `getStreamsUrl()` (`DURABLE_STREAMS_URL` → `services__streams__http__0` →
  `VITE_services__streams__http__0`/`VITE_STREAMS_URL`). Disposition: pass `options.baseUrl`
  through; prove both arms per plugin; never reintroduce `4437`.
- **F-3** — the CLI install completion announced `plugin.servicePort`, a template port, as if it
  were the allocated endpoint. Disposition: print a port only when `hostPort` is set; presentation
  only, result shape unchanged.
- **F-4** — `.llm/tools/validation/check-aspire-host-ports.ts` matched `CONTRIBUTION_PORT_FALLBACK`
  one line at a time, so a multiline `ctx.port(resource,\n port)` escaped the gate. Disposition:
  full-text matching with real line numbers, self-tests for the multiline fail and single-argument
  pass fixtures, other matchers reviewed for the same defect.
- **T-1** (supervisor Tier-A finding) — `packages/plugin-streams-core/src/domain/constants.ts`
  `DEFAULT_STREAMS_PORT = 4437` had no `@deprecated` marker or named 0.0.8 removal reference, unlike
  `SAGAS_API_DEFAULT_PORT`, `AUTH_API_DEFAULT_PORT`, `TRIGGERS_API_DEFAULT_PORT`. Either the
  deprecation is applied, or a rationale is recorded in the worklog. Verify which, and that the
  outcome is honest.

## Locked decisions this slice must not violate

- **D-14** — `SAGAS_API_DEFAULT_PORT` stays an unchanged, `@deprecated` compatibility export with no
  runtime read; removal in 0.0.8 under a named issue. The S5 literal grep exempts exactly
  `src/constants.ts` plus the deprecation tests.
- **D-16** — infrastructure host-port pins are in scope; research/evaluator evidence is never
  rewritten for parity.
- **D-18** — S5 does **not** close #1365. `Part of #1365` with remaining scope stated; #1370 and
  #979 keep closing keywords.

## What to verify (executed evidence, not the generator's claims)

1. Design checkpoint exists; commit slices match it; `PLAN-EVAL: N/A` justified before slice 1.
2. RED-first where a gate existed — F-4's worklog claims a RED run ("16 passed, 2 failed"); confirm.
3. Each of F-1…F-4 and T-1 is actually fixed at head, with tests that would fail without the fix.
4. No literal runtime port reintroduced anywhere in the diff.
5. Gates you run yourself: `deno task check`, `deno task test`, `deno task lint`,
   `deno task quality:scan`, `deno task arch:check`, `deno task check:assets-barrel`,
   **`deno task check:publish-assets`**, plus scoped wrappers over each touched root. No new
   `deno-lint-ignore` / `as unknown as` / `any`.
6. **Derived assets (D-23, D-26).** `.llm/tools` sources are embedded in
   `packages/cli/src/kernel/assets/agent-tools.generated.ts`, which is in turn a declared input of
   `generate-publish-assets.ts`. Confirm the committed barrels match a fresh generation and that
   only authoritative regenerated files were committed — no hand-edits.
7. Commit trail: per-slice commit, explicit-refspec push, per-slice PR #1740 comment with gate
   evidence; the exact-head evidence table names the SHA it was taken at.
8. PR hygiene: body carries `Part of #1365`, `Closes #1370`, `Closes #979`, `Part of #1712`;
   labels/milestone present. **Report** any inconsistency — do not change labels, draft state,
   milestone, or close anything.
9. No test deleted, skipped, or de-catalogued to green a gate; `deno.lock` untouched unless a
   dependency genuinely changed.

## Known-infra red — do NOT attribute this to S5 (drift D-25)

The NAS container's PID 1 is not reaping: **7,734 zombie processes of 7,844 total, 7,562 of them
PPID-1 `sshd`**. Any gate asserting that no child process survived — notably the hybrid-launcher
cancellation-survivor root test — is a **false red caused by the environment**. Do not re-run it, do
not chase it, and do not return `FAIL_FIX` for it. Judge S5 on its scoped product gates. If you see
a process-survival failure, classify it explicitly as infra and move on.

## Output

Write `evaluate-cycle-3.md` from `.llm/harness/templates/evaluate.md` to the absolute path
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s5/evaluate-cycle-3.md`,
declaring the exact evaluated head inside the file. Post the same verdict as a PR #1740 comment
beginning `**[PHASE: IMPL-EVAL]**` and the head SHA. Verdict ∈ `PASS` / `FAIL_FIX` / `FAIL_RESCOPE`
/ `FAIL_DEBT`.

Do not commit to the S5 branch, do not mark the PR ready, do not merge, do not relabel, do not close
any issue. When finished, message the supervisor session `007-aspire-9a` with the verdict and a
one-line reason.

## Environment (NAS)

Old `/home/codex/repos/...` paths are historical. If `deno` is not on PATH, prepend
`/home/agent/.local/share/mise/installs/deno/2.9.5/bin`. Docker is the sandbox
`DOCKER_HOST=tcp://netscript-dind:2375` and you must not use it. Agentic tooling that shells through
the WSL adapter needs `--user node`. Never commit or publish anything under
`/home/agent/projects/netscript/handoff/`.
