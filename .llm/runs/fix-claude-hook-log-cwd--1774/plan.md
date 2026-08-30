# Plan: make Claude hook logging independent of turn cwd

## Run Metadata

| Field          | Value                                                               |
| -------------- | ------------------------------------------------------------------- |
| Run ID         | `fix-claude-hook-log-cwd--1774`                                     |
| Branch         | `fix/claude-hook-log-cwd-independent`                               |
| Phase          | `plan-eval`                                                         |
| Target         | Checked-in Claude hook configuration and repository agentic tooling |
| Archetype      | N/A — not a published package/plugin or shipped CLI                 |
| Scope overlays | none                                                                |

## Archetype

N/A. The owned surface is `.claude/settings.json` plus `.llm/tools/agentic/claude/**`, not a
`packages/**` or `plugins/**` publish unit. Archetype-6's package/public-CLI gate matrix would add
irrelevant JSR and consumer gates. The repository-tooling implementation still applies doctrine
A6/A7/A8/A14, AP-2/AP-9/AP-19, layering-by-concern, and the explicit no-`any`/no-cast rule.

## Current Doctrine Verdict

N/A for repository tooling. Doctrine file 10 measures the 36 published package/plugin roots and does
not assign `.llm/tools/agentic/**` a package verdict. This change creates no published surface or
doctrine debt.

## Axioms in Play

| Axiom | Why it matters                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------ |
| A6    | A wrapper that only changes cwd/path would be unjustified indirection.                                       |
| A7    | Use Claude's documented `${CLAUDE_PROJECT_DIR}` contract and Deno's native granular permissions.             |
| A8    | Keep configuration, logging behavior, focused tests, and surface validation in their existing concern files. |
| A14   | The unchanged RED→GREEN fixture and structured gates are the durable contract.                               |

## Goal

Both checked-in Claude log handlers execute the logger from the checkout where the Claude session
was launched and append to that launch root's hook log when turn cwd is the launch root, a nested
`.llm/runs/<run>` directory, or a modeled foreign checkout. The repair fixes #1774's nested-cwd
resolution defect against the session launch root only; it must remain host-neutral and grant only
the permissions the logger actually needs.

## Scope

- Convert both configured command handlers to exec form: executable `deno`, explicit `args`, and a
  logger path rooted at `${CLAUDE_PROJECT_DIR}`.
- Anchor logger output at the session launch root in `CLAUDE_PROJECT_DIR` when Claude supplies it,
  with `Deno.cwd()` retained only as the compatibility fallback for direct non-Claude invocation.
- Narrow configured hook permissions to the three read environment keys and the session launch
  root's `.llm/tmp/claude/hooks` write subtree; remove runtime `--allow-read`.
- Add a focused fixture that parses the live settings and exercises `PreToolUse` and `Stop` from
  root, nested run cwd, and a sibling-decoy cwd.
- Align the direct hook task, Claude surface validator lock check, and agentic README/help text with
  the resolved root and permission contract where they would otherwise become stale.
- Maintain harness worklog/context and per-slice PR comments.

## Non-Scope

- Do not change hook event schemas, matchers, stdout/stderr behavior, blocking semantics, or JSONL
  record shape.
- Do not repair `wslHome()` or the retired `/home/codex` default. That is a sibling Codex-launcher
  configuration defect with separate contracts/tests, tracked by #1776.
- Do not make hook execution or output follow `EnterWorktree`. Claude keeps `CLAUDE_PROJECT_DIR` at
  the session launch root while cwd follows the entered worktree; supporting worktree-following
  output would require a different root contract and fixture.
- Do not change Remote Control, evaluator routing, OpenRouter, OpenHands, or other lane sessions.
- Do not edit `.github/workflows/**`; no CI wiring is required, so the repo-scope PAT is sufficient.
- Do not run Aspire, Docker, browser, `e2e:cli`, or `scaffold.runtime`; none proves this surface and
  this leaf has no serialized expensive-gate lease.

## Hidden Scope

- An absolute executable path alone is not enough: the logger's current output path is also
  cwd-relative.
- `CLAUDE_PROJECT_DIR` is the session launch root, not a moving active-worktree pointer. The repair
  deliberately stabilizes execution/output against that root and makes no `EnterWorktree` claim.
- The checked-in direct task and mandatory validator currently carry broader or root-relative
  invocation arguments and must not document a contradictory permission contract after GREEN.
- Harness identity/evidence artifacts necessarily record the actual worktree and the confirmed
  retired-host fact. The host-path acceptance assertion applies to product/config/runtime docs
  changed by the repair, not the run artifacts whose purpose is exact host provenance.

## Locked Decisions

| ID  | Decision                                                                                                                                                                                    | Rationale                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Use `${CLAUDE_PROJECT_DIR}` in `.claude/settings.json` as the session launch root.                                                                                                          | Claude exports/substitutes the checkout root where the session started. It is host-neutral but does not follow `EnterWorktree`; #1774 fixes nested cwd resolution against this launch root only.                                          |
| D2  | Use exec form (`"command": "deno"`, explicit `args`) for both events.                                                                                                                       | Official guidance for placeholder paths; avoids shell tokenization and handles spaces safely.                                                                                                                                             |
| D3  | Use the same session-launch-root env value for logger output, falling back to `Deno.cwd()` only when the variable is absent.                                                                | Anchors real hooks to their documented launch checkout while preserving direct task/script behavior outside Claude.                                                                                                                       |
| D4  | Do not add a wrapper or root-discovery helper.                                                                                                                                              | Settings-only and script-only are incomplete, while a wrapper merely renames existing platform/tool contracts and adds a seam.                                                                                                            |
| D5  | Configure exactly `--no-prompt`, `--allow-env=CLAUDE_PROJECT_DIR,NETSCRIPT_RUN_ID,CLAUDE_SESSION_ID`, and `--allow-write=${CLAUDE_PROJECT_DIR}/.llm/tmp/claude/hooks`; omit `--allow-read`. | The named env values and launch-root log subtree are the only required permissions. Optional `--no-prompt` hardens future TTY-attached invocation without widening access.                                                                |
| D6  | Preserve empty stdout/stderr on success, exit 0, append-only JSONL shape, and non-blocking hook configuration.                                                                              | #1774 fixes false-positive module resolution only.                                                                                                                                                                                        |
| D7  | The test parses live settings and supports the current shell form plus planned exec form; it is not edited between RED and GREEN.                                                           | Proves the repair rather than a duplicated command and leaves a visible historical RED.                                                                                                                                                   |
| D8  | Model a foreign cwd with a temp-dir decoy logger at `<case-3 cwd>/.llm/tools/agentic/claude/claude-hook-log.ts`, while modeled `CLAUDE_PROJECT_DIR` names this launch checkout.             | RED must reach the decoy (marker present and distinctive exit); GREEN must bypass it (marker absent and launch-root record present). This proves the configured launch-root value wins over cwd, not that Claude follows `EnterWorktree`. |
| D9  | Keep the `wslHome()` defect out of scope and track it as #1776 in research/plan/handoff.                                                                                                    | Repairing it changes unrelated Codex launcher behavior and its historical-default unit test; #1776 owns that work for milestone 0.0.8.                                                                                                    |
| D10 | PLAN-EVAL is selected and mandatory.                                                                                                                                                        | The owner explicitly requires a plan stop and the combined path/output/permission fixture design benefits from adversarial review.                                                                                                        |

## Exact Planned Handler Contract

Each `PreToolUse` and `Stop` command handler will retain its current matcher and type, with this
execution shape:

```json
{
  "type": "command",
  "command": "deno",
  "args": [
    "run",
    "--no-lock",
    "--no-prompt",
    "--allow-env=CLAUDE_PROJECT_DIR,NETSCRIPT_RUN_ID,CLAUDE_SESSION_ID",
    "--allow-write=${CLAUDE_PROJECT_DIR}/.llm/tmp/claude/hooks",
    "${CLAUDE_PROJECT_DIR}/.llm/tools/agentic/claude/claude-hook-log.ts"
  ]
}
```

"Required" permissions means: read only those three environment names; create/append only inside the
session launch root's hook-log subtree; no runtime filesystem read, network, run, sys, FFI, or broad
environment/write grant. `--no-prompt` is non-permission hardening. Hook process output remains
empty on success; the durable JSONL event stays within the session launch checkout.

## Open-Decision Sweep

| Decision                              | Status        | Notes                                                                            |
| ------------------------------------- | ------------- | -------------------------------------------------------------------------------- |
| Project root source                   | resolved now  | D1: documented session launch-root contract; it does not follow `EnterWorktree`. |
| Settings, script, or wrapper          | resolved now  | D2–D4: combined settings/script, no wrapper.                                     |
| Output root and missing-env behavior  | resolved now  | D3: project root with cwd compatibility fallback.                                |
| Permissions                           | resolved now  | D5 and exact handler contract above.                                             |
| Both event cases                      | resolved now  | D7: live-settings enumeration asserts exactly `PreToolUse` and `Stop`.           |
| Launch-root-versus-cwd discrimination | resolved now  | D8: reachable temp-dir decoy has positive RED and negative GREEN evidence.       |
| Worktree-following execution/output   | safe to defer | Explicit Non-Scope; #1774 fixes nested cwd against the session launch root only. |
| Validator/task/docs alignment         | resolved now  | Included in GREEN if made stale by the new contract.                             |
| `wslHome()` retired default           | safe to defer | Confirmed sibling defect tracked by #1776; unrelated launcher surface.           |
| CI workflow wiring                    | safe to defer | No workflow edit is needed; existing tasks and CI discovery cover the test.      |
| Expensive runtime/scaffold gates      | safe to defer | They do not exercise Claude hook execution and require a lease this leaf lacks.  |

No unresolved decision would force implementation rework after PLAN-EVAL.

## Commit Slices

| #  | Slice and proof                                                                                                                                   | Files                                                                                                                                                                                       | Proving gate                                                                                                |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| S0 | Bootstrap establishes run identity and draft PR. Complete.                                                                                        | Run artifacts                                                                                                                                                                               | Branch/remote/PR inspection                                                                                 |
| S1 | Research re-derives both event failures and closes root/scope/permission decisions. Complete.                                                     | `research.md`, `worklog.md`, `context-pack.md`                                                                                                                                              | Raw exact-command reproduction                                                                              |
| S2 | Plan locks implementation and executable gates; hard-stop for PLAN-EVAL.                                                                          | `plan.md`, `worklog.md`, `context-pack.md`, `drift.md` if needed                                                                                                                            | Separate-session PLAN-EVAL checklist                                                                        |
| S3 | RED fixture proves current nested-cwd failure for both configured events and positively reaches the sibling decoy. Commit and push while failing. | `.llm/tools/agentic/claude/claude-hook-log_test.ts`, `worklog.md`, `context-pack.md`                                                                                                        | Structured focused test exits nonzero for nested cases and records decoy marker/distinctive exit for case 3 |
| S4 | GREEN repair makes the unchanged fixture pass and aligns permission/documentation surfaces.                                                       | `.claude/settings.json`, `deno.json`, `.llm/tools/agentic/claude/claude-hook-log.ts`, `.llm/tools/agentic/claude/validate-claude-surface.ts`, `.llm/tools/agentic/README.md`, run artifacts | Unchanged focused fixture + `agentic:check-claude`                                                          |
| S5 | Gate/handoff records structured focused/root evidence and prepares separate IMPL-EVAL without implementation churn.                               | `worklog.md`, `context-pack.md`, PR body/comments                                                                                                                                           | Full selected gate table green; raw git diff/status                                                         |

All implementation slices are below 30 and ordered. S3 must remain its own visible commit before S4.
Each slice is pushed with the exact owner-provided refspec and receives one PR phase/slice comment.

## Fixture Contract

- Read and validate `.claude/settings.json`; find command handlers under exactly the event constants
  `PreToolUse` and `Stop`.
- Send a distinct valid JSON payload for each event and assert exit/output plus the resulting event
  record.
- Cases per event:
  1. cwd = session launch root → exit 0;
  2. cwd = launch-root nested `.llm/runs/<fixture>` → exit 0 after repair;
  3. cwd = a directory returned by `Deno.makeTempDir`, with the decoy logger placed exactly at
     `<case-3 cwd>/.llm/tools/agentic/claude/claude-hook-log.ts` so the current relative command
     reaches it. RED requires the decoy marker to be present and its distinctive nonzero exit; GREEN
     requires the marker to be absent, exit 0, and the unique payload to appear in the modeled
     session-launch-root event log.
- Create the entire decoy tree under the system temp root, never under any `worktrees/` directory,
  and remove it in `try/finally` with `Deno.remove(..., { recursive: true })` even after assertion
  or child-process failure.
- The fixture substitutes `${CLAUDE_PROJECT_DIR}` with the test's launch-root value to model
  Claude's documented behavior. It does not run Claude or prove that the variable follows an entered
  worktree; that behavior is explicitly Non-Scope.
- Before repair, case 2 must fail for both events with the current nested module URL. The RED commit
  records the structured wrapper output and is pushed before any config/script change.
- The same test file, byte-for-byte unchanged, runs GREEN after S4.
- The fixture asserts configured env/write permissions, absence of `--allow-read`/broad grants, and
  absence of either host-specific home path in the owned product/config/doc files.

## Risk Register

| Risk                                                                         | Mitigation                                                                                                                         |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| A test duplicates the intended command and false-greens stale settings.      | Parse and execute live `.claude/settings.json`.                                                                                    |
| Absolute paths break spaces or platform tokenization.                        | Use official exec form and one argument per element.                                                                               |
| Correct script loads but output lands under nested cwd.                      | Assert unique payloads in launch-root JSONL and no nested/decoy marker.                                                            |
| A sibling/global logger satisfies a weak exit-only assertion.                | RED reaches the decoy positively; GREEN asserts launch-root event plus absent decoy marker.                                        |
| Fixture placeholder substitution diverges from Claude behavior.              | Treat substitution as a documented model, assert only launch-root-over-cwd behavior, and keep `EnterWorktree` claims out of scope. |
| A failed decoy fixture leaves state that poisons a later run.                | Use `Deno.makeTempDir` outside `worktrees/` and unconditional recursive cleanup in `try/finally`.                                  |
| Permission narrowing accidentally blocks ordinary hooks.                     | Launch-root/nested/temp-decoy cases execute the actual Deno process with exact settings args; the validator repeats lock check.    |
| Permission claims drift across task/validator/docs.                          | Align all direct invocations in S4 and assert handler args.                                                                        |
| RED commit is mistaken for finished work.                                    | Keep PR draft/status lifecycle and comment explicit failing evidence; GREEN is the next slice only after PLAN-EVAL.                |
| Host-path check flags required harness provenance or misses product leakage. | Scan/assert the owned product/config/runtime-doc set explicitly; explain run-artifact provenance exclusion.                        |
| Scope silently expands into broken `/home/codex` launcher default.           | D9/#1776 plus file list prohibits `agentic-lib.ts`/launcher test edits.                                                            |
| Validation mutates `deno.lock`.                                              | Use `--no-lock` hook executions and inspect `deno.lock`/git status after every gate.                                               |

## Anti-Patterns to Resolve or Avoid

| AP / rule                                                            | Status   | Plan                                                                                                       |
| -------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| AP-2 helper that renames a platform primitive                        | risk     | No wrapper/root helper; use Claude placeholder and Deno APIs directly.                                     |
| AP-9 premature abstraction                                           | risk     | Keep the focused command-execution logic test-local; no production abstraction for two identical handlers. |
| AP-19 permissions assumed silently                                   | existing | Replace broad configured permissions with executable exact grants and update text/validator.               |
| No explicit `any`, `as any`, `as unknown as`, or blanket lint ignore | required | Typed JSON narrowing in the fixture; focused lint plus source-pattern review before sign-off.              |
| Layering by concern                                                  | required | Config selects command, logger owns event persistence, validator owns surface gate, test owns fixtures.    |

## Fitness Gates

| Gate                                                   | Required | Expected evidence                                                                                      |
| ------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------ |
| Focused RED history                                    | yes      | S3 commit: both nested events fail, while case 3 reaches the decoy marker/distinctive exit             |
| Focused GREEN fixture                                  | yes      | Same S3 test file passes launch-root/nested/temp-decoy cases after S4                                  |
| Claude surface                                         | yes      | `deno task agentic:check-claude` JSON result `ok: true`; `deno.lock` unchanged                         |
| Focused Claude launcher regression                     | yes      | Structured wrapper passes hook test plus `remote-model-launcher_test.ts` and `hybrid-launcher_test.ts` |
| Scoped type check                                      | yes      | Structured check wrapper over `.llm/tools/agentic/claude`, exit 0                                      |
| Scoped lint                                            | yes      | Structured lint wrapper over `.llm/tools/agentic/claude`, zero findings                                |
| Scoped format                                          | yes      | Structured fmt wrapper over changed TS/JSON/Markdown files, zero findings                              |
| No-host-path assertion                                 | yes      | Fixture scans the exact six-file owned set listed below and passes for both forbidden home paths       |
| No-`any`/cast review                                   | yes      | Lint plus explicit changed-TypeScript pattern check, no finding/ignore                                 |
| Root test                                              | yes      | `deno task test` structured wrapper exits 0 (usable at this host/base)                                 |
| Raw git/lock hygiene                                   | yes      | Clean owned diff, `deno.lock` unchanged, exact commits copied from `git log`                           |
| PLAN-EVAL / IMPL-EVAL                                  | yes      | Separate native opposite-family verdict artifacts; this session performs neither                       |
| JSR / publish / consumer / Aspire / browser / scaffold | N/A      | No package/plugin/public runtime/scaffold surface; no expensive-gate lease                             |

## Validation Plan

| Order | Gate                   | Command or check                                                                                                                                                                                                                                                                                                                           | Expected result                                                                                        |
| ----- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| 1     | RED                    | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/agentic/claude/claude-hook-log_test.ts`                                                                                                                                                                                             | Nonzero in S3; nested failures name both events, and case 3 records the decoy marker/distinctive exit. |
| 2     | GREEN focused          | Same command, unchanged test file                                                                                                                                                                                                                                                                                                          | Exit 0 after S4; launch-root/nested/temp-decoy cases for both events pass.                             |
| 3     | Claude surface         | `deno task agentic:check-claude`                                                                                                                                                                                                                                                                                                           | Structured JSON `ok: true`; lock unchanged.                                                            |
| 4     | Focused hook/launchers | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/agentic/claude/claude-hook-log_test.ts .llm/tools/agentic/claude/remote-model-launcher_test.ts .llm/tools/agentic/claude/hybrid-launcher_test.ts`                                                                                   | Structured test report passes.                                                                         |
| 5     | Check                  | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic/claude --ext ts`                                                                                                                                                                                                                                 | Structured report passes.                                                                              |
| 6     | Lint                   | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic/claude --ext ts`                                                                                                                                                                                                                                  | Structured report has zero findings.                                                                   |
| 7     | Format                 | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file .claude/settings.json --file deno.json --file .llm/tools/agentic/claude/claude-hook-log.ts --file .llm/tools/agentic/claude/claude-hook-log_test.ts --file .llm/tools/agentic/claude/validate-claude-surface.ts --file .llm/tools/agentic/README.md --ext ts,json,md` | Structured report has zero findings.                                                                   |
| 8     | Root regression        | `deno task test`                                                                                                                                                                                                                                                                                                                           | Structured root report passes; no zombie caveat on this host.                                          |
| 9     | Raw integrity          | direct `git diff --check`, `git status --short`, `git diff <base> -- deno.lock`, and changed-file review                                                                                                                                                                                                                                   | No whitespace/lock/unowned churn; product diff matches plan.                                           |

The validator command in gate 3 is the mandatory `CLAUDE.md` gate for this configuration/hook
change. Gate outputs are recorded in `worklog.md`; durable CI may wrap allowlisted commands in the
gate-receipt runner, but no receipt substitutes for semantic fixture coverage.

The no-host-path assertion scans exactly these owned product/config/runtime-documentation files:

1. `.claude/settings.json`
2. `deno.json`
3. `.llm/tools/agentic/claude/claude-hook-log.ts`
4. `.llm/tools/agentic/claude/claude-hook-log_test.ts`
5. `.llm/tools/agentic/claude/validate-claude-surface.ts`
6. `.llm/tools/agentic/README.md`

It asserts that neither forbidden host-home string occurs in any of those files. It intentionally
does not scan unrelated `.llm/tools/agentic/**` files with pre-existing retired-path documentation,
or harness artifacts that record exact host provenance.

## Arch-Debt Implications

| Entry                       | Action         | Notes                                                                                      |
| --------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| Existing architecture debt  | none           | No matching Claude-hook debt.                                                              |
| New debt                    | none expected  | The complete repair and fixture land together.                                             |
| `wslHome()` retired default | defer to #1776 | Confirmed sibling defect tracked for milestone 0.0.8, not silently accepted as #1774 debt. |

## Dependencies

- Installed Claude Code's documented `CLAUDE_PROJECT_DIR` placeholder/env behavior.
- Deno exec-form permission flags and existing structured wrapper scripts.
- Separate supervisor-dispatched native Claude/Fable PLAN-EVAL and later IMPL-EVAL sessions.

## Deferred Scope

- Repair and migration policy for `wslUser()`/`wslHome()` defaults, tracked by #1776.
- Hook execution/output that follows `EnterWorktree` instead of the session launch root.
- Any generalized hook-command framework or wrapper.
- CI workflow edits and expensive runtime/scaffold validation.
- Hook schema, matchers, blocking behavior, log rotation, redaction, and retention.

## Drift Watch

- Claude placeholder/exec semantics differ from current official docs or installed `2.1.251`.
- The fixture cannot execute both live handler forms without production helper code.
- Minimum permissions require read/network/run/sys or a broader write subtree.
- Product changes touch any file outside the locked S3/S4 lists, especially launcher/home code or
  `.github/workflows/**`.
- `deno.lock` changes, sibling/global state is required, or an expensive gate becomes necessary.

Any such fact is appended to `drift.md`; material scope change returns to the owner/PLAN-EVAL.

## Plan-Gate Handoff

After this cycle-1 amendment, the plan is ready for one separate-session cycle-2 PLAN-EVAL.
Implementation remains prohibited until `plan-eval.md` records `PASS`. The evaluator should confirm
the launch-root-only claim, reachable positive-RED/negative-GREEN decoy contract, six-file host-path
assertion set, exact permission args, and #1776 deferral pointer; all other plan decisions stand.
