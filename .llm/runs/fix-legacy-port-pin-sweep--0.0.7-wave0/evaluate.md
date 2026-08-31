# IMPL-EVAL — legacy-port-pin-sweep (#1243 / PR #1643)

## Verdict

**PASS**

The narrowed leaf is implemented correctly, the behavioral claim is independently reproduced at the
evaluated head, receipt evidence is honest, and no hidden behavioral or scope drift was found. PR
#1643 stays draft at `status:impl`. This verdict authorizes nothing further — not ready transition,
merge, issue closure, relabeling, publication, or an expensive gate.

## Evaluator identity

| Field | Value |
| --- | --- |
| Phase | IMPL-EVAL (fresh separate formal evaluation) |
| Requested route | native Claude Opus 5 / effort `low` (owner-authorized) |
| Observed route | native Claude Opus 5 / effort `low` — `respawnFlags: ["--effort","low",...,"--model","claude-opus-5"]` in `jobs/8c47751a/state.json` |
| Session ID | `8c47751a-6a30-4dab-b25c-dbafe9873455` |
| Bridge ID | `cse_01LmSFUzxkHGuH98fiDhgHxH` (`/remote-control` enabled, `bridgeOutboundOnly: false`) |
| PID | `2464105` |
| cwd | `/home/codex/repos/netscript-007-leaf-legacy-port-pin-sweep` |
| Separation | Implementation was Codex / GPT-5.6 Sol / low; this evaluation is a fresh opposite-family session that performed no implementation |

`supervisor.md` still records the IMPL-EVAL lane as `formal_impl_evaluation`: Fable 5 / medium. This
evaluation ran the owner-authorized native Claude Opus 5 / low route per the coordinator instruction
that superseded it. Fable 5 remains unassigned; no silent substitute was made, and any future Fable 5
assignment requires a coordinator amendment recording genuine architectural or exceptional
implementation-review necessity.

## Head resolution

Both refs were fetched and resolved independently; they agree, so no mismatch refusal applies.

| Ref | SHA |
| --- | --- |
| Immutable base | `01e0960494c95ce56eb35892c211a095eb13e6ed` |
| Remote PR head (`gh pr view 1643 --json headRefOid`) | `e6ba15ec6414c0a42b1f9870791131162ea71c36` |
| Remote branch head (`git fetch origin fix/legacy-port-pin-sweep` → `FETCH_HEAD`) | `e6ba15ec6414c0a42b1f9870791131162ea71c36` |
| Local worktree `HEAD` | `e6ba15ec6414c0a42b1f9870791131162ea71c36` |

The stale `af3dca0f5` value in the older leaf-local `evaluate-prompt.md` is superseded and was not
used. Worktree was clean at evaluation time; `git diff --check` over base..head is empty.

## Scope verification

Product delta over the immutable base is exactly two files, both inside the authorized surface:

- `packages/cli/src/public/features/plugins/auth/auth-plugin-command.ts` (original contract)
- `packages/cli/src/public/features/plugins/auth/auth-plugin-command_test.ts` (sole coordinator-authorized addition)

Everything else in the 30-file diff is `.llm/runs/fix-legacy-port-pin-sweep--0.0.7-wave0/` run
artifacts and receipts. `deno.lock` is untouched. No `packages/`/`plugins/` file outside the two
above was modified, added, or deleted.

The coordinator narrowing is real and live, not asserted by the implementation session: issue #1243
comment (rickylabs, 2026-08-13T20:33:34Z) states the streams manifest/copy `4437` fields are required
compatibility metadata to be preserved, and narrows #1643 to explicit URL / fail-loud discovery
guidance plus focused tests. This matches `drift.md` and `plan.md` exactly.

## Independent verification of the required properties

**1. No silent `localhost:4437` default — CONFIRMED.**
`--stream-url` is declared with no `default:` value. The only surviving `4437` occurrence in the file
is inside the human-readable error string (line 117), which is explanatory text, not an inferred
endpoint. The sole remaining `default:` in the file is the unrelated `--auth-url` on `session revoke`
(see N1).

**2. Explicit `--stream-url` required, failing before the session adapter — CONFIRMED, two ways.**
Structurally, the `if (!options.streamUrl) throw new Error(...)` guard precedes any reference to
`dependencies.sessions.list` in the action body, so the adapter is unreachable when the option is
omitted. Behaviorally, the test `session list fails loudly when the stream URL is omitted` asserts
both the rejection and `listCalls === 0` against an instrumented port — the fail-before-adapter
property is test-pinned, not merely incidental.

**3. Actionable Aspire endpoint discovery guidance — CONFIRMED.**
Both the option description and the thrown error name a concrete, runnable discovery path:
`aspire describe streams --format Json`, then append `/auth/sessions` to the streams HTTP endpoint
and pass it via `--stream-url`. The message also states plainly that the legacy pin is no longer
inferred, so an operator hitting the change learns why and what to do in one read.

**4. Manifest/copy port fields remain coordinator-classified compatibility metadata — CONFIRMED.**
`plugins/streams/scaffold.plugin.json` still carries `servicePort: 4437` / `backgroundPort: 4437`,
and `copy-official-plugin-test-support.ts:108-109` is unchanged. Neither file appears in the diff.
`drift.md` correctly records why removal is not mechanical: `packages/plugin/src/protocol/manifest.ts`
requires `officialSource.backgroundPort` and validates the service triple atomically, so deletion
invalidates the shipped manifest. The generated Aspire skill's historical `4437` diagnostic is
explanatory prose about a reproduced failure, not a runtime or config pin, and was correctly left
alone.

**5. Broad formatting mechanically isolated — CONFIRMED.**
The behavior change is `3d32e9ee2` (auth command +17/-6 plus the focused test). The formatting sweep
is a separate commit `a21224586` touching only the same two files. Diffed with `-w
--ignore-blank-lines`, that commit contains only line re-wrapping and double→single quote
normalization — no identifier, argument, control-flow, or default-value change. The semantic commit
therefore remains independently reviewable, which is the property the isolation requirement exists to
protect.

**6. Lock / JSR / publish evidence is honest — CONFIRMED.**
All eight receipts (`check`, `test`, `lint`, `fmt-check`, `quality-gate`, `arch-check`, `doc-lint`,
`publish-dry-run`) report `outcome: PASS`, `exitCode: 0`, and `gitHead == actualGitHead ==
6242edabc3679173c841e2e167f7f5786819e720`. Critically, the delta from that receipt head to the
evaluated head `e6ba15ec6` touches **only** `.llm/` run artifacts and receipts — no product file
changed after the receipts were taken, so the receipts still describe the evaluated product tree.
The JSR report contains zero failing findings. `publish:dry-run` was scoped to `--member
packages/cli` and is a dry run; no publication occurred. `deno.lock` is unmodified, so lock hygiene
holds.

### Checks executed by this evaluator (smallest sufficient set)

| Check | Result |
| --- | --- |
| `deno test --allow-all --unstable-kv <auth test>` at `e6ba15ec6` | 11 passed, 0 failed — reproduces the receipt's claimed 11/0 exactly |
| `deno check --unstable-kv <auth command + test>` | clean |
| `deno fmt --check` on both touched files | 0 findings (via the run's explicit-selection wrapper report; see N2) |
| `git diff --check` base..head | empty |
| Independent `gh` resolution of PR head, labels, draft state, milestone | draft, `status:impl`, milestone `0.0.7` |

Expensive gates were correctly not run and not requested: no `scaffold.runtime`, Aspire, Docker, or
publish. The accepted behavior is a CLI option-contract change fully covered by focused unit tests,
so the withheld runtime gate is not evidence this verdict needed.

## Findings

No blocking finding. Three non-blocking observations, none of which changes the verdict:

**N1 — `session revoke --auth-url` retains a `http://localhost:8094/api/v1/auth` default.**
This is the same defect class as the `4437` pin just removed, in the same file and the same declared
surface. It is out of scope here: #1243 names only the `4437` stream-URL default, and the coordinator
narrowing did not extend to it. Correctly left alone rather than silently swept. Recommend a
follow-up issue so the second half of the pin class is tracked rather than forgotten.

**N2 — `packages/cli/` is excluded from root `deno fmt` (`deno.json` `fmt.exclude`).**
The reformat in `a21224586` was therefore elective, not gate-enforced, and it added ~147 changed
lines of review surface to a 17-line semantic fix on a `priority:p3` item. It is isolated,
behavior-preserving, and verified, so it is acceptable as landed. The note matters for accuracy of
the gate set: the run's `cli-fmt` report passed only because the wrapper selected the two files
explicitly, bypassing the directory exclude. No future reader should infer that root `deno fmt`
covers this path.

**N3 — `plan.md` says the omitted URL "fails at option parsing"; it is an action-time guard.**
The implementation deliberately does not use Cliffy's `required: true`, because that would emit a
generic missing-option error instead of the Aspire discovery guidance the issue asked for. The choice
is correct and better satisfies the issue; only the plan's wording is imprecise. The required
property — failing before the session adapter — holds and is test-pinned.

## Issue resolution state

#1243 filed three items. Item 1 (the auth `--stream-url` default) is resolved. Items 2 and 3 (the
streams manifest fields and `copy-official-plugin-test-support.ts`) were not deferred but
**reclassified** by the live coordinator comment as required compatibility metadata after structured
validation disproved the filing assumption. The PR body correctly references `#1243` without a
closing keyword. Whether the reclassification is sufficient to close #1243 is the coordinator's call,
not this evaluator's; this verdict does not decide it and does not mutate issue state.

## Stop state

Draft PR #1643 remains draft at `status:impl`, milestone `0.0.7`, base `main`. This evaluator
committed only this file, pushed it to the existing branch by explicit refspec, and posted one
structured PR comment. No merge, no ready transition, no publication, no relabeling, no issue
mutation, and no central cluster state was touched.
