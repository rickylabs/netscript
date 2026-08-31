use harness

# SLICE — #1664 cross-concern repair: explicit `--client <service>` for data-bound UI scaffolds

Coordinator-ruled. Bounded. **Do not widen it, and do not reorder E2E gates.**

| Field | Value |
| --- | --- |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1664` |
| Branch | `feat/app-service-client-wiring` |
| Base | the worktree's current HEAD — do **not** rebase or merge `main` |
| Run dir | `.llm/runs/feat-app-service-client-wiring--1664/` |
| PR | #1664 (`Closes #1355`, `Closes #1360`) |

## SKILL

`netscript-harness`, `netscript-cli`, `netscript-doctrine` (Archetype 6, `packages/cli`),
`netscript-tools`.

## The defect — a real collision between two shipped features

The hosted `scaffold-runtime` gate fails on `scaffold.ui-data-screen`:

```
Cannot scaffold a data-bound island: multiple query clients are ambiguous.
Candidates: …/lib/payments.ts, …/lib/users.ts.
Exactly one conventional generated client is required.
```

`scaffold.ui-data-screen` arrived with **#1781** and assumes **exactly one** generated query client.
This branch's `generate-service-clients` verb emits one **per service** — which is precisely #1355's
requirement ("there is no verb at all for the second service"). #1781's precondition is therefore no
longer coherent, and the ambiguity error is really a **missing-input** error.

## The ruling you are implementing

**Keep the fail-closed default.** Do not auto-pick, do not reorder gates, do not relax the error when
selection is absent and the choice is genuinely ambiguous.

Add a bounded explicit selector: **`--client <service>`** for data-bound UI page/island scaffolds.

1. **Resolution site:** `packages/cli/src/kernel/application/ui/web-scaffold.ts` (~lines 85–120)
   collects `candidates` from `apps/<app>/lib/*.ts` containing `createQueryFactories(`, plus the
   `routes/examples/**/(_lib)/service-query.ts` fallback, then fails when `candidates.length !== 1`.
   When `--client` is supplied, **filter `candidates` to the one whose conventional service identity
   matches** before that length check. The service name is already parsed from the file via
   `export const <name>Name = '<service>'`; match on that, not on the filename.
2. **Error on missing selection** — when multiple candidates remain and no `--client` was given, keep
   today's message and **add** the remedy: name the available services and state that `--client` picks
   one. A fail-closed error that does not name the fix is half a gate.
3. **Error on a selection that matches nothing**, and on a selection that matches **more than one**
   candidate. Both are distinct, explicitly-tested failures — do not collapse them into one message.
4. **Preserve one-client auto-discovery exactly as it is.** With a single candidate and no `--client`,
   behaviour must be byte-identical to today. This is a hard requirement: it is the path every
   existing project takes.

## Ceiling

- `packages/cli/src/kernel/application/ui/web-scaffold.ts`
- `packages/cli/src/public/features/ui/add/add-ui-input.ts` (add `readonly client?: string`)
- `packages/cli/src/public/features/ui/add/add-ui-command.ts` (declare the flag)
- `packages/cli/src/public/features/ui/add/add-ui-command_test.ts` (command-surface tests)
- a focused application test for the resolver (new file, or the existing web-scaffold test if one
  exists)
- `packages/cli/e2e/src/application/gates/scaffold/ui-data-screen-gates.ts` — pass
  `--client <fixture service>`. Use the **actual** fixture service name; the candidates observed in CI
  were `payments.ts` and `users.ts`, so confirm which the gate expects rather than assuming `users`.

Nothing else. If a file outside this list appears to need changing, **stop and report** — that is a
rescope.

## Definition of done

- Focused tests prove all four behaviours: single-candidate auto-discovery unchanged; `--client`
  selects the matching client; unmatched selection errors; ambiguous-without-selection still errors
  and now names the remedy.
- Scoped `packages/cli` check/lint/fmt via the structured wrappers, each with **non-empty
  `stdout.bytes`** (this repo has a `deno task` cache-replay trap that returns `PASS`/exit 0 with
  zero-byte stdout).
- `packages/cli` tests pass; no test deleted, skipped, or weakened.
- `deno.lock` byte-identical.
- One commit, pushed by **explicit refspec**, plus a PR comment stating the slice, commit, and gate
  evidence. Update `worklog.md` and `context-pack.md` in the same commit.

Do not apply labels, tick acceptance boxes, dispatch an evaluator, or merge. **Do not write any
sentence placing `close`/`closes`/`fixes`/`resolves` immediately before an issue number** — GitHub's
matcher does not parse negation, and this milestone has already had two PRs accidentally register
live closing references that way.
