use harness

# Wave 1 fixes leaf — `sdk-typed-error-channel` (#1350 / PR #1671) — **slice S5**

You are the sole implementation agent for slice S5, launched by topic orchestrator
`topic-fixes-0.0.7` under Codex coordinator `codex-root-0.0.7`. One branch → one worktree → one
active agent. Never start a second sender at this worktree; steer this same thread.

You are the **generator**. You do not self-review and you do not self-certify. A separate Tier-A
review and a separate opposite-family IMPL-EVAL follow your push.

## SKILL

Activate and use: `netscript-harness`, `netscript-doctrine` (**Archetype 1 — small contract**, with a
`docs` overlay already discharged at S3), `netscript-tools` (structured wrappers are the ONLY verdict
source), `netscript-deno-toolchain`, `jsr-audit` (JSR applies to both packages), `netscript-pr`,
`rtk`.

## Identity

- Issue **#1350**, PR **#1671** (draft, sole `status:impl`). Milestone `0.0.7`, `priority:p1`.
- Worktree: `/home/codex/repos/netscript-007-leaf-typed-error`
- Branch: `fix/sdk-typed-error-channel`, **no upstream by design**. Push by explicit refspec only:
  `git push origin HEAD:refs/heads/fix/sdk-typed-error-channel`
- Expected HEAD before you start: `bd97a7c03a3fe9b9c2534fd53c9fb0518801bb31`
- Run dir (exists): `.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/`

Slices S1–S4 already landed. S5 is the final **source** slice.

## Frozen contract — exactly three product files plus one test file

1. `packages/contracts/src/application/contract-primitives.ts`
2. `packages/sdk/src/client/errors.ts`
3. `packages/sdk/src/ports/service-client.ts`
4. `packages/sdk/tests/readme-doctest_test.ts` (tests only)
   plus existing run artifacts under the run dir.

**A fifth product path is a rescope. Stop and report; do not widen.** In particular
`packages/contracts/src/public/mod.ts` is **forbidden** — see "What the coordinator denied".

## Task 1 — the `baseContract` annotation (verified; apply as given)

Apply `briefs/1671-s5/verified-baseContract-annotation.patch` from the orchestration run dir. It has
already been executed end-to-end by Tier-A against `main@9634735bc0` + this leaf's content. Apply the
**same** form; if you believe it needs to change, stop and report rather than improvising.

Mechanism: TypeScript **instantiation expressions**. `ReturnType<typeof oc.errors>` (the pre-leaf
base) collapses the type parameter to its `ErrorMap` upper bound and **erases the six literal codes**
— the exact regression #1350 exists to fix. `ReturnType<typeof oc.errors<{…exact map…}>>` keeps the
parameter instantiated, so the six codes survive **and** the annotation names no oRPC builder type.
`ContractBuilder` is no longer imported at all; drop it from the `@orpc/contract` type import or lint
fails `no-unused-vars`.

Two traps already hit — do not re-walk them:

- The error-map literal must use the **public type** `ContractObjectSchema<X, X>`, **not**
  `typeof <PascalCaseAlias>`. The PascalCase aliases are declared `ContractSchema<…>`, which drops
  the `.shape` member that `CrudRoute` requires: that variant fails `packages/contracts/crud.ts`
  with 5 × `TS2345`. `contracts/mod.ts` alone does **not** catch this — you must check `crud.ts`.
- `ContractSchema<unknown, unknown>` is **not** substitutable for oRPC's `Schema<unknown, unknown>`
  (`TS2322`; `StandardSchemaV1` lacks `_input`/`_output`/`parse`/`safeParse`). Do not attempt that
  swap anywhere.

## Task 2 — the ten SDK `private-type-ref` corrections

Implement corrections **#1–#10** from the S4-R map in `worklog.md` (`errors.ts`, `service-client.ts`).
Target: SDK private-type-ref returns to its baseline of **3**, i.e. **0 new**.

Amendments to that map, binding:

- **#11 and #12 are superseded / refuted.** #11 is subsumed by Task 1's annotation. #12
  (`Schema → ContractSchema`) is refuted — do not implement it.
- **#1/#4/#6/#8 (`ThrowableError → Error`)**: record this in the worklog as a **declared design
  decision**, not as a notational rewrite. It is factually equivalent today (`Registry` is
  un-augmented repo-wide, so `ThrowableError` resolves to `Error`), but `Registry` is a consumer
  extension point and hardcoding forecloses downstream augmentation. It is acceptable only because
  these signatures are leaf-new. Say that plainly.
- **#7/#9/#10 (inlining `ClientPromiseResult` / `ProcedureErrorFromNode`)**: record as a **bounded,
  accepted coupling with a named drift risk** — "if oRPC renames `__error`, `TError` inference
  degrades silently" — not as "purely notational". Keep the duplication minimal.

## Acceptance — all executed, all recorded with structured output

| Gate | Required |
| --- | --- |
| `contracts` doc-lint, all 4 entrypoints | **9** — exact baseline parity |
| `sdk` doc-lint, all entrypoints | **3** — exact baseline parity, 0 new |
| `baseContract`'s only private ref | `oc` (already pinned) — no `ContractBuilder`, no `Schema`, no `BaseContractErrors` |
| `deno check --unstable-kv` on `contracts/mod.ts`, `contracts/crud.ts`, `sdk/mod.ts` | clean |
| `packages/contracts` + `packages/sdk` suites | ≥ **78 / 0** |
| lint + fmt (`--ext ts,tsx`) both packages | 0 / 0 |
| `docs:exports-drift` | PASS, exit 0 |
| `deno publish --dry-run` both packages | PASS (slow-types) |

**Type-level proof, required.** Assert through the package entrypoint that `keyof` `baseContract`'s
`~orpc.errorMap` is `Equal<>`-exactly the six literals, with `IsAny` and `[never]` guards so it cannot
pass vacuously, plus a `.shape` retention assertion. **Name the expected RED:** the same assertion
against the base `ReturnType<typeof oc.errors>` annotation fails `TS2344`. Record both the RED and the
GREEN in one structured run; do not re-run for tidier output.

## Withheld gates — complete them in this slice

These were recorded `NOT_RUN` at S4 and are now due: `contracts-jsr-audit`, `sdk-jsr-audit`,
`netscript-jsr-specifiers`, and the selected export guards. Run them through
`.llm/tools/gates/run-gate.ts` so receipts bind to the exact head. Report red honestly; do not
suppress.

## The `surface:diff` caveat — report it, do not bank it

`deno doc` renders the new annotation as `ReturnType<typeof oc.errors>`, dropping the instantiation
argument. Because `surface-diff.ts` hashes `deno doc` declarations, the `baseContract`
"export signature changed" major **disappears** (undeclared majors 532 → 531).

That is a **tooling false negative, not reduced breakingness** — the resolved type genuinely changed.
Two obligations: keep the breaking-change disclosure at **full strength** (the `SafeFailure` arm
change and the public failure `null` → `undefined` consumer break remain breaking, not patch-level),
and report `surface:diff` for `baseContract` as **not a valid signal** rather than as a clean result.

## What the coordinator denied — do not reopen

- **No barrel growth.** `packages/contracts/src/public/mod.ts` is untouched. Exposing
  `ContractBuilder`/`Schema`/`BaseContractErrors` there was measured at **10 → 21** private-type-ref
  and a **red** `docs:exports-drift`; it is withdrawn.
- **No metadata vocabulary or initialization.** Do not define, export, or depend on
  `NetScriptProcedureMeta`. #1466 owns it. Preserve the fourth generic as `Record<never, never>`.
- **No lint allowances.** Zero `@ts-ignore`, `@ts-expect-error`, `deno-lint-ignore`, `as any`,
  `as unknown as`. Suppression-to-green is review-blocking.
- **`docs/site/reference/sdk/index.md` stays out of this leaf.** Its rows are accurate emphasis debt
  tied to the package JSDoc; a separate exact follow-up covers it. Do not edit it and do not file the
  follow-up yourself.
- No `#1348` / `#1466` mutation. No label, checkbox, readiness, or merge action. No runtime lease —
  no Aspire, Docker, or `e2e:cli`.

## Finish

Commit, push by explicit refspec, post the S5 phase comment on #1671 with the structured gate
evidence, update `worklog.md` / `context-pack.md` / `drift.md`, and **stop**. Report your exact head
sha. Tier-A review and IMPL-EVAL are someone else's; do not request or perform them.
