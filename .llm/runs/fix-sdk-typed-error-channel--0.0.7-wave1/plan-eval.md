# PLAN-EVAL — fix-sdk-typed-error-channel--0.0.7-wave1

- Plan evaluator session: Claude bg session `50898ac7-6e79-4f31-ae18-694bb36b7c79` · 2026-08-15
- Run: `fix-sdk-typed-error-channel--0.0.7-wave1` · PR #1671 (draft) · issue #1350
- Surface / archetype: `packages/contracts` + `packages/sdk` published surface · Archetype 1 slice
- Scope overlays: `docs`

## Identity (Step 0)

| Field | Observed |
| --- | --- |
| Session PID / bridge | pid `636411` (`~/.claude/sessions/636411.json`), `bridgeSessionId` `session_015RuDy1h3UiCkLzo1PLk5Sc`, Remote Control `https://claude.ai/code/session_015RuDy1h3UiCkLzo1PLk5Sc` |
| Job | `50898ac7`; `respawnFlags` = `--permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1671 PLAN-EVAL" --effort medium --model claude-fable-5` |
| Requested route | `formal_plan_evaluation` → native Claude · `claude-fable-5` · medium · Remote Control (`lane-policy.md:45`, `routing-policy.ts:326-332`) |
| Observed route | Claude · `claude-fable-5` · medium · Remote Control — **matched** |
| Generator separation | Plan author is Codex `01a006f3-ae2d-7941-bd17-2ac71dd3d0f0` (`supervisor.md`); this is a separate opposite-family session — invariant holds |
| cwd | `/home/codex/repos/netscript-007-leaf-typed-error` |
| `git rev-parse HEAD` | `2fa2f71dc5b498c16221461439e53b9f5dc1d5d5` == immutable head; `gh pr view 1671 --json headRefOid` == same |

## Step 1 — phase invariant

```text
$ git diff --name-only 0ef48c2ec..HEAD
.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/codex-thread-ids.md
.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/context-pack.md
.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/drift.md
.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/plan.md
.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/research.md
.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/supervisor.md
.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/worklog.md
```

`.llm/runs/` only; working tree clean. **PASS.**

## Step 2 — ownership boundary (re-derived from live records)

- #1348 body header (fetched via `gh issue view 1348`): "Stage 0 is accepted; #1466 owns procedure
  metadata; #1349–#1353 are amended below." The older `NetScriptProcedureMeta.policy` prose is
  declared historical/non-normative in that same header.
- #1350 comment `5227724542` (rickylabs, 2026-08-08): #1350 "remains focused on the
  `safe()`/literal-preserving error repair and must land the shared four-generic `ContractBuilder`
  spelling … It does **not** silently own `NetScriptProcedureMeta` initialization."
- #1466 (OPEN, milestone 0.0.7): "define NetScriptProcedureMeta without erasing contract errors" —
  owns public shape, propagation to clients/generated clients/query factories, docs.
- `rfcs/0001-sdk-client-contributions.md:1269-1272` stage table: 1a (#1350) "Preserve the concrete
  base error map and client error channel exactly as filed"; 1b metadata "owner selected in Stage 0"
  → #1466 per #1348 header. `:347-370` requires the explicit four-generic annotation and forbids
  `ReturnType<typeof oc.errors>`.

Plan judgement: `plan.md` "Locked error contract" pins the builder to
`ContractBuilder<Schema, Schema, MergedErrorMap<Record<never,never>, typeof commonErrorMap>, Record<never,never>>`
and states "assigns no fields or semantics to [the fourth slot]"; "What becomes public" says no
metadata type/field/initialization/export. The only metadata proof is the compile-only
`Equal<BaseMeta, Record<never, never>>` guard, which I executed at base — it is **already green at
base** (see Step 5), so it is a regression guard, not an acceptance claim depending on #1466. No
plan acceptance item requires #1466. **PASS.**

Advisory (non-blocking, close-gate): #1350's own acceptance boxes 2–4 still literally mention "the
RFC 0001 procedure-metadata type … through … client inference, and handler inference". The PR body
carries `Closes #1350`; at IMPL/close the PR must state explicitly which boxes are satisfied under
comment `5227724542` (slot preserved, no vocabulary) and that metadata *semantics* are #1466 — do not
tick metadata boxes. (I did not touch #1348/#1466/#1350.)

## Step 3 — scope ceiling

- `plan.md` "Exact six-path ceiling" lists exactly the six authorized paths; "A seventh … is a
  rescope requiring a fresh coordinator ruling"; `public/mod.ts`, `contracts/README.md`, bench files
  named as not authorized. `research.md:199-200`: "`packages/contracts/src/public/mod.ts` is
  explicitly denied for this leaf; there is no metadata definition/export branch." `drift.md`
  entry 4 "Denied: The contracts public barrel". No conditional branch survives. **Confirmed.**
- Is `ports/service-client.ts` sufficient end-to-end? Executed probe (transient file under
  `packages/sdk/tests/`, deleted; tree clean):
  - `createORPCClient(link) as { list: (input) => ClientPromiseResult<Out, ErrorFromErrorMap<…>> }`
    compiles → the runtime cast in `packages/sdk/src/client/service-client.ts:65` stays comparable
    once `ServiceClientMethod` carries `TError`; that file does **not** need to change. **Confirmed
    sufficient** in type space (`errors.ts` extraction + port `TError` derivation).
  - `service-query-utils.ts:161` `call: ServiceClientMethod<TInput, TOutput>` and
    `tests/type-fixtures/sdk-client-contributions-rfc_type.ts:194-198` remain assignable iff the
    added error generic is defaulted — the plan's compatibility-default risk row covers it.
  - `rg "errors\.[A-Z_]+\("` across `packages plugins` finds only `errors.INTERNAL(` in a plugin-core
    comment; no baseContract handler uses an undeclared code, so tightening the error map does not
    ripple into a seventh path.
- Hidden-seventh-path check: `packages/sdk/deno.json` maps **no `zod`** (executed: a probe
  `import { z } from 'zod'` under `packages/sdk/tests` → `TS2307`). The plan's fixture "builds a
  real route from `baseContract`" and needs schemas; it must use `@netscript/contracts`-exported
  schemas (`CursorPaginationInputSchema`, `SuccessSchema`, `NotFoundErrorSchema` — resolvable, probe
  compiled) rather than adding a `zod` mapping. See advisory A2.

**PASS.**

## Step 4 — breaking-change honesty

Upstream pinned `@orpc/client@1.14.6` (`dist/index.d.mts:139-161`): `SafeResult` = success arm |
`[Exclude<TError, ORPCError>, undefined, false, false]` | `[Extract<TError, ORPCError>, undefined,
true, false]`; `safe<TOutput, TError = ThrowableError>(promise: ClientPromiseResult<…>)`. Current
NetScript (`packages/sdk/src/client/errors.ts:39-49,86`): one failure arm, `data: null`,
`isDefined: boolean`, `SafeResult<TOutput, TError = unknown>`, `safe<TOutput>(PromiseLike)`.

- The plan's declared break (`null`→`undefined` failure `data`, one arm→two literal arms, tighter
  `baseContract` key space, `TError` default `unknown`→`ThrowableError`) is **correct and not
  over-declared**. Executed repo search (`SafeFailure|data === null` over packages/plugins/docs)
  finds only `errors.ts`, `client/mod.ts` and the generated reference table (names only) — matches
  research §3.
- Blast radius, repo-wide consumer search (research §3, executed `rg` commands), migration note,
  0.0.7-minor placement are all present. **Confirmed.**
- One understatement (advisory A3): the locked shape writes `type SafeFailure<TError>` with **no
  default**, whereas today `SafeFailure<TError = unknown>` is legal to reference bare. That is an
  extra, avoidable break not listed; keep a default (`= ThrowableError`) unless dropping it is
  intended and then declare it.

**PASS.**

## Step 5 — proof and docs

Executed at base with the plan's exact snippet against real exports (`baseContract`,
`ServiceClient`, `safe`, `isDefinedError`):

```text
TS18046 [ERROR]: 'result.error' is of type 'unknown'.        ← plan snippet: result.isDefined && result.error.code
TS2339  [ERROR]: Property 'code' does not exist on type 'never'.  ← isDefinedError(error) path (#1350's probe)
keyof typeof baseContract['~orpc']['errorMap'] = 'NOT_DECLARED'   ← accepted at base (no error)
Equal<BaseMeta, Record<never,never>> / IsAny false                ← both GREEN at base
Equal<BaseMeta, Record<string,unknown>> / unknown                 ← RED at base (lines 8,9)
```

- The RED is genuine and for #1350's reason (`TError` erased → `unknown` → `never` after
  `Extract`). However the plan's validation row 1 says the *plan snippet* fails with "TS2339 `code`
  on `never`"; the snippet as written fails with **TS18046 on `unknown`** — the `never` diagnostic
  only appears via `isDefinedError`. Advisory A1: record both diagnostics as the expected RED.
- Six literal codes + code-specific `data` + `NOT_DECLARED` negative + non-oRPC `Error` in the
  `isDefined:false` arm do prove the acceptance; the meta-slot `Equal` is a guard already green at
  base — correctly framed as "retained", not proven-new.
- Docs: grep of both pages for `isDefinedError|safe\(|error\.(code|data)|typed|inferred|drift`
  shows every error-story location is inside the disposition tables (`sdk.md` 12-20, 31-38, 58-70,
  113-114, 196-198; `discover-services.md` 9-14, 96-101, 114-115, 135-154, 205-229). Remaining
  "typed client" mentions (`sdk.md:237`, `discover-services.md:20,26-27,37-38,243,249,279`) are
  input/output claims that stay true; no overcorrection planned.
- Out-of-scope prose: `packages/bench/.../reference/README.md:45-47` and `router.ts:7-8` say
  `baseContract` "is type-erased (`{ '~orpc': any }`)" — already stale today, becomes more so;
  `rubric.md:16` stays true. `packages/contracts/README.md:13-76` does **not** describe erasure
  (it says the error map "is already applied" — true before and after); research §3 overstates
  that file. Deferring is honest, but "tracked follow-up debt" currently has no home:
  `.llm/harness/debt/arch-debt.md` has no entry (grep `bench|contracts/README|1350` → none). See A4.

**PASS.**

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` "Re-baseline and authority" against `0ef48c2ec`; spot-checked §1 loss points at `contract-primitives.ts:81,98`, `errors.ts:39-49,75,86`, `ports/service-client.ts:168-171`, `client/service-client.ts:65` — all accurate |
| Decisions locked                        | PASS   | `plan.md` "Locked error contract", "Source authority by decision" |
| Open-decision sweep                     | PASS   | `plan.md` "Plan-Gate state"; evaluator sweep below found none that force rework |
| Commit slices (< 30, gate + files each) | PASS   | 4 slices, each with proof/files/gate |
| Risk register                           | PASS   | 7 rows with mitigations |
| Gate set selected                       | PASS   | Archetype-1 F-set matches `archetype-gate-matrix.md:22-40`; docs overlay; 12-row validation table |
| Deferred scope explicit                 | PASS   | `plan.md` "Debt and deferred scope" |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` "JSR/publish surface scan" (raw dry-run authority, F-DOCT-5 known red) |

## Tier-A claims tested

| Claim | Verdict |
| --- | --- |
| Head carries no product code | Confirmed |
| #1466 owns metadata; #1350 keeps only the empty fourth slot | Confirmed against #1348 header, #1350 comment 5227724542, #1466 body, RFC stage table |
| Six paths exact; `public/mod.ts` denied, not conditional | Confirmed |
| `ports/service-client.ts` is the real loss point and is sufficient | Confirmed by cast-comparability probe |
| Breaking, not patch-level | Confirmed (plus one unlisted default-drop, A3) |
| RED fails at base for #1350's reason | Confirmed; diagnostic text differs from plan (A1) |
| Meta-slot assertion proves slot retained without vocabulary | Confirmed (already green at base — guard) |
| Stale README/bench prose honestly deferred | Confirmed for bench; research overstates contracts README (A4) |

## Open-decision sweep (evaluator-run)

None that would force rework. Two implementation choices are left open but are safe to defer: (a)
whether the port derives `TError` via upstream `ErrorFromErrorMap` or a NetScript-owned structural
`DefinedError<K, Data>` union (both work with the structural `DefinedErrorLike` extraction);
(b) whether `safe()`'s parameter names upstream `ClientPromiseResult` or a NetScript-owned
`Promise<T> & { __error?: { type: TError } }` alias (avoids an upstream type in the published d.ts;
AP-14 concerns re-export, so either is permitted).

## Verdict

**`PASS`** — implementation may begin.

### Advisories (non-blocking)

- **A1 RED diagnostic.** Record the expected RED as *both* `TS18046 'result.error' is of type
  'unknown'` (plan snippet) and `TS2339 … 'never'` (`isDefinedError` path). Same defect, two texts.
- **A2 No `zod` in `packages/sdk`.** Build the fixture route from `@netscript/contracts`-exported
  schemas; adding a `zod` mapping to `packages/sdk/deno.json` would be a seventh path.
- **A3 `SafeFailure` default.** Keep `SafeFailure<TError = ThrowableError>` (or declare the dropped
  default as part of the break).
- **A4 Debt home.** In slice 4 add an `arch-debt.md` (or issue) entry for the bench prose so
  "tracked" is literal; correct research §3's claim about `packages/contracts/README.md`.
- **A5 Close gate.** Do not tick #1350 metadata boxes; state the split under comment 5227724542.
