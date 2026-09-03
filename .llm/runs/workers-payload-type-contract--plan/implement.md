use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`
(this changes a **published package contract** — archetype, public surface, and gates apply), and
`.agents/skills/netscript-pr/SKILL.md`.

You are the lane (Codex · OpenAI · GPT-5.6 Sol · high, `complex_implementation`) for **#1455**.
Read it in full: `gh issue view 1455 --repo rickylabs/netscript`.

Worktree `/home/agent/projects/netscript/worktrees/007-leaf-1455`, branch
`feat/workers-payload-type-contract`, based on current `origin/main`.

**The issue is `status:plan`, not `status:impl`.** Contract first, then implementation — in that
order, in this one slice. Do not start editing types before Task 1 is written down.

## The defect

`defineJob(...).payload<TPayload>()` narrows the handler payload while the builder is constructed,
then `build()` **erases it**: `JobDefinition<TId>` carries `id`, `entrypoint`, `name`, `topic` and no
payload type. Consequences on the published 0.0.5 surface:

- workers service `JobTriggerInput` exposes `payload?: Record<string, unknown>`;
- trigger-core `enqueueJob<TJobId, TPayload>` infers its payload **independently**, because
  `JobDefinition<TJobId>` has no payload parameter — so a payload for one job compiles when enqueued
  for another;
- generated registries use `JobHandler<any>`, so generation cannot recover the type.

The invariant that must become expressible: literal job id `embed-document` requires
`EmbedDocumentPayload`, while `transcribe-image` requires `TranscribeImagePayload`.

## Task 1 — contract, written before any implementation

Record in `.llm/runs/workers-payload-type-contract--plan/plan.md`:

1. The **exact** proposed public shapes (e.g. `JobDefinition<TId, TPayload>`), and the literal
   id→payload registry/type map to be generated or exported.
2. Every published symbol whose signature changes, and whether each change is **source-breaking** for
   an existing consumer. `deno doc` the current surface — do not infer it from source reading.
3. How `triggerJob` and trigger-core `enqueueJob` bind their payload to the selected definition/id.
4. How generated registration preserves the handler type instead of `JobHandler<any>` **at the
   application boundary**, and what the generator must emit differently.
5. How the same definition serves **runtime validation**, so producer and consumer cannot drift.
6. A default-type-argument strategy so existing `JobDefinition<TId>` uses keep compiling where that
   is achievable, plus an explicit list of what cannot be preserved.

State the breaking-change surface plainly. Do not minimise it.

## Task 2 — implement to that contract

RED-then-GREEN. The RED must be a **compile-time** proof at a consumer call site: a payload for one
job id passed to another must fail to compile (`@ts-expect-error`), and it must fail for this
defect, not incidentally. Record both SHAs.

Preserve runtime behaviour: this is a type-carrying change, not a rewrite of enqueue semantics.

## Explicit non-goals

- **#1451** covers generated-registry operational metadata and handler erasure. Do not absorb it.
- Do not add a consumer-side compatibility shim; the point is that the published surface carries the
  mapping so EIS-Chat can delete its temporary shared job contract.

## Gates

- `run-deno-check.ts` over each touched package root (`--ext ts,tsx`, include `--unstable-kv` if the
  wrapper does not)
- the touched packages' own test suites
- `deno task check` and `deno task test` if the contract change reaches the workspace
- `run-deno-lint.ts` and `run-deno-fmt.ts` over touched roots
- `deno task publish:dry-run` — this is a published surface change
- `deno task arch:check`

Report pre-existing failures separately from ones you introduce; do not let a pre-existing red hide a
new one.

## PR rules

Draft PR on the first commit — a draft skips every runtime job, so mark it ready when you want CI.
`Closes #1455` only if every acceptance box is genuinely satisfied; otherwise `Refs #1455` with
remaining scope stated. Labels `type:feat`, `area:workers`, `area:contracts`, `priority:p2`,
`status:impl`, `orchestrator:fixes`; milestone `0.0.7`.

Write progress to `.llm/runs/workers-payload-type-contract--plan/worklog.md`; the supervisor watches
it. If blocked, write the blocker there rather than stopping silently.
