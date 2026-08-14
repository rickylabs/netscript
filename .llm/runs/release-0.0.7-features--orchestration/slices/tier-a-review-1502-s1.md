# Tier-A review — #1502 slice S1

**Reviewer:** `topic-features-0.0.7` (native Claude Opus 5 · high · Remote Control, session
`19621a0b-c6a0-47c6-b826-93c1634a6875`) — a different session from the Codex generator
`019ffcc5-d3e1-7c13-9815-e9956ec43683`.

**Reviewed head:** `86d0110a545e449dfa094fc961a37a327604d23a` (local == remote == PR head).

**Verdict: `CHANGES_REQUESTED` — three defects inside S1's own normative contract, all bounded.**
S2 is **not** released until they are fixed.

## Slice hygiene — verified, all clean

| Check | Evidence | Result |
| --- | --- | --- |
| Commit scope | `git show --name-only 86d0110a5` | 12 files: the RFC, the leaf run dir, 5 receipts. **No** `packages/**`, `plugins/**`, or `deno.lock` |
| Head reconciliation | `git rev-parse HEAD`; `git ls-remote` | both `86d0110a5`; tree clean; no upstream |
| Run dir in same commit | same | `plan.md`, `research.md`, `worklog.md`, `context-pack.md`, `drift.md`, `supervisor.md` all moved with the slice |
| Durable receipts | `check-cli-plugin-s1`, `docs-source-format-s1`, `docs-accuracy-s1` | `outcome: PASS`, `exitCode: 0`, `gitHead == actualGitHead == 3e0c8858b`, no mismatch allowance |
| PR state | live PR #1651 | open **draft**; exactly one `status:` label (`status:impl`); 0 review threads; 0 current CI failures |
| Turn terminated cleanly | rollout `task_complete` at `2026-08-14T23:40:48Z` | D-5's missing-marker symptom did **not** recur |
| Stopped for review | `agentic:codex-status` | 0 agents; S2 not started |
| House shape | `rfcs/0000-template.md` vs the RFC | all 10 sections present, in template order; frontmatter complete, `rfc: 0000`, `status: Draft`, tracking issue #1502, milestone 0.0.7 |

**Verdict notes closed as instructed:** N-1 (durable citation `implement.md:24` @ `8775be7b3` in
`plan.md:32`, `research.md:26`, `drift.md:74`, plus the explicit "`leaf-contracts.json` … was not
edited" statement at `research.md:33`), N-2 (leaf `supervisor.md` now routes both formal gates to
Opus 5 and records the cycle-2 identity; Fable marked unassigned), N-3 (resolved by introducing
`PluginCliInvocationResult` rather than reassigning the published `PluginCliResult`, with a migration
disposition and a dedicated epic child). N-4 correctly retained for the S4 final-head rerun.

## Findings — must fix before S2

### F1 — `PluginCliDiagnosticCode` is used in a normative signature but never declared (blocking S2)

`rfcs/0000-plugin-cli-contribution.md:350` types the failure boundary as:

```ts
readonly code: PluginCliDiagnosticCode | `plugin.${string}`;
```

`PluginCliDiagnosticCode` appears **exactly once in the whole document** — at that use site. It is
never declared in the normative block, and unlike `PluginCliCapability` — which gets an explicit
deferral at line 281 ("completed with the S2 security and transaction model. Their placement is
fixed here; their values are not improvised in S1") — it carries no deferral note either. So the
section that S1 declares normative rests on an undefined type, and a reader cannot tell whether that
is an omission or a deliberate gap.

The material is already present: line 369 describes it as "a finite exported tuple with a derived
union" and enumerates 14 stable meanings. Fix by either declaring the tuple and derived union in the
S1 code block, or adding the same explicit deferral sentence used for `PluginCliCapability`.
Declaring it is preferable — S1 owns the failure contract, and the codes are already decided.

### F2 — `definePluginCliContribution`'s return type contradicts its prose

Line 117 states the call "returns a deeply readonly definition". Line 278 declares:

```ts
export function definePluginCliContribution<
  const TDefinition extends PluginCliContributionDefinition,
>(definition: TDefinition): Readonly<TDefinition>;
```

`Readonly<T>` is shallow — it freezes the top-level properties only, so `commands`, nested
`children`, `arguments`, and `options` remain mutable in the returned type. Either the prose or the
signature is wrong. Since immutability is load-bearing here (the whole design rests on "a
contribution is immutable static data", line 20), the signature should express deep readonly, or the
prose must be corrected to shallow and the immutability claim re-scoped. Do not leave the RFC
asserting a guarantee its own normative signature does not provide.

### F3 — the handler-ref type appears to enforce an invariant it does not

Line 225 types the module reference as `` readonly module: `./${string}` ``, and the invariant at
line 288 forbids "Absolute paths, URLs, bare specifiers, parent traversal, and self-import through a
published JSR specifier". The template literal pins only the `./` prefix: `'./../escape.ts'` and
`'./../../etc/passwd'` both satisfy the type while violating the invariant.

The contract is correct; the risk is that an implementer reads the type as sufficient and skips the
traversal check — which is a path-escape defect in a seam whose entire purpose is import safety. Add
one sentence stating the template literal is a shape hint and that normalization/traversal rejection
is normative validation, not type-enforced.

## Not findings

The three above are the whole list. The public-ownership table, dependency-direction rule, two-phase
collision contract with total ordering, descriptor-only help/completion, and the rejected-alternatives
section are internally consistent and match the locked plan decisions. The deliberate S2/S3 gaps at
lines 395–406 are declared as gaps rather than left implicit, which is the right treatment.

## Receipt-head observation (not a finding)

The three durable S1 receipts attest `3e0c8858b`, the parent commit — the gates ran against the
working tree that became `86d0110a5`, before it was committed. That is the same disclosure class as
verdict note N-4 and is acceptable for an intermediate slice, since the S4 final-head rerun is what
binds for IMPL-EVAL. Record it explicitly in `worklog.md` rather than leaving "exact command/head in
`receipts/…`" to imply S1-head coverage, so no later reader mistakes a parent-head receipt for
final-head evidence.

`receipts/source-format-s1.json` and `source-format-s1-write.json` are structured **wrapper reports**
(`command`/`cwd`/`summary`/`findings` shape), not `run-gate.ts` durable receipts — they carry no
`outcome`, `exitCode`, or `gitHead`. Label them as wrapper output in the evidence table so the
receipt set is not overcounted at S4.

## Disposition

Fix F1–F3 and the two evidence-labelling points in one bounded S1 fix-up commit, rerun only the
docs-scoped gates the change touches, push by explicit refspec, comment on #1651, and stop again for
Tier-A review. S2 (discovery, bootstrap isolation, transactional generation) is released only after
that review passes — the S1 contract is the foundation S2 builds on, so it is fixed at the slice that
owns it rather than patched later.
