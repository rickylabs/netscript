use harness

# #1502 / PR #1651 — owner-verdict amendment (bounded, one turn)

You are the **original and only** author of this leaf, Codex thread
`019ffcc5-d3e1-7c13-9815-e9956ec43683`, in `/home/codex/repos/netscript-007-features-1502`. The
owner has ruled on the overlap question and released the hold. This is one focused amendment turn —
not a new phase, not a rewrite.

## What the owner decided

The owner reviewed comment
`https://github.com/rickylabs/netscript/pull/1651#issuecomment-5300440887` ("Verify your RFC is not
a duplicate or overlapping recently merged: `rfcs/0003-command-composition-kit.md`") and selected
**option 1: keep and narrow.**

Your RFC is **not** a duplicate. Its plugin CLI discovery, routing, help/completion, bootstrap, and
isolation core is genuinely distinct and stays exactly as it is. The single real overlap is **C6**,
where your host-owned generation-plan transaction meets RFC 0003 / #1490's command-store generation.
The remedy is to narrow C6's ownership claim, not to add more cross-RFC specification.

Coordinator checkpoint carrying the verdict:
`eb46e33fb6493ce6ef5350f7abd6e4da51854577` on `chore/release-0.0.7-orchestration`.

## Start state — verify before editing

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/netscript-007-features-1502` |
| Branch | `docs/rfc-plugin-cli-contribution` |
| Dispatch head | `0e302ad3a5915b7a820adcac0a9d5bdc2d7d0019` |
| Local == remote == PR head | required before you start and again when you finish |
| PR #1651 | open **draft**, exactly one lifecycle label `status:impl` |

Resolve local `HEAD`, the explicit remote ref, and the live PR head independently. A mismatch means
stop and report, not edit a nearby commit.

## The eight-point contract — this is the entire scope

1. **Preserve the distinct core.** The descriptor, router, registry, capability, bootstrap, and
   isolation architecture is unchanged. Do not split the RFC, do not weaken its ownership of the CLI
   axis, do not remove the C6 section.

2. **C6 owns only generic CLI contribution workspace-plan execution:** canonical text plan
   validation; preview/apply safety; the common stage / check / commit / rollback mechanics; and
   generic registry / plan / journal doctor states.

3. **RFC 0003 / #1490 exclusively owns** command-store provider selection; Prisma schema, models,
   and indexes; migration creation, application, and refusal; the generated command-store bridge and
   transaction-client types; DB-specific validation; and business-command receipt / audit / outbox /
   transaction semantics.

4. **The adapter direction.** The adapter may map RFC-0003 domain output into
   `PluginCliGenerationPlan` and the shared executor. State both prohibitions explicitly:
   - **C6 must not** parse Prisma, choose provider SQL or indexes, own any part of the migration
     lifecycle, or define command-store semantics.
   - **RFC 0003 / #1490 must not** define another generic plugin CLI mount, or a second workspace
     stage/rollback engine.

5. **Doctor split.** C6 reports generic registry / plan / journal health. RFC 0003 reports
   command-store schema / migration / bridge health. Neither diagnoses the other's domain.

6. **Close the evaluator's C6 preview observation.** Planner output is **preview-invariant**: the
   planner returns the same canonical plan for preview and for apply. `invocation.preview` cannot
   change plan construction; only the host execution mode decides whether anything is mutated. Write
   this as a normative statement in the C6/generation section, not as a note.

7. **Amend the compatibility/ownership text and the C6 roadmap row**, naming RFC 0003 and #1490
   explicitly. Concrete sites I verified in `rfcs/0000-plugin-cli-contribution.md`:
   - **line 887** — the RFC 0003 compatibility row. Its "Laws this RFC reuses" cell says
     *"host-owned execution"*, which is **factually wrong about RFC 0003**: execution there is
     `@netscript/service/commands` with **consumer-owned composition**. Correct it.
   - **line 891** — "assignability between the payloads is a failure, not reuse", stated without
     qualification. This is false as written: your `PluginCliJson` and RFC 0003's `CommandJson` are
     the same six-member recursive JSON union (member order differs only), so they are mutually
     assignable today and a conformance test asserting the blanket rule would fail. Scope the law to
     the **envelope, definition, and result** payload types — where it is true and load-bearing —
     and say plainly that structurally identical plain-JSON value aliases are expected and are not
     evidence of coupling. **Do not** add a brand or discriminant to `PluginCliJson`; that is a
     design change the owner did not authorize.
   - **line 957** — the `#1475` row in the amend/fold-first table. Add **#1490 under #1363** with
     the ownership delimitation from points 2-4.
   - **line 1019** — the C6 roadmap row ("Host-owned generation-plan transaction and doctor
     integration"). Its disposition and exit-evidence cells must carry the narrowed scope and name
     RFC 0003 / #1490.
   - **line 1102** — the prior-art bullet for RFC 0003; align it with the corrected execution owner.
   - line 899 already assigns durable business rollback to RFC 0003 correctly — leave it.

   Do **not** edit `rfcs/0003-command-composition-kit.md`, any `packages/**` or `plugins/**` source,
   `deno.lock`, any issue, or any central cluster state.

8. **Repair the PR body.** Three defects, all verified against the receipts:
   - The `check` row cites *"1,033 files, 9 batches, 0 failed"* against `check-final.json`. That
     receipt has `stdout.bytes: 0` (sha256 `e3b0c442…`, the empty-string digest), `durationMs: 51`,
     `exitCode: 0`, `outcome: PASS` — it contains **no figures at all**. The numbers come from
     `check-cli-plugin-cycle1.json`, `invocationId ns1502-plan-fix1-check-cli-plugin`, at head
     `d71b78c3…` — a different commit. **Drop or relabel** the figures as cycle-1 evidence; do not
     merely re-point the citation, because no final receipt supports them. Describe the 51 ms final
     run plainly and accurately as a valid cached re-check that passed and emitted no output.
   - The body names `c987f009e502df0bbeb33c3d23f508bc6f320238` as the final receipt/journal head.
     The branch has since advanced through `04d431028…` to `0e302ad3a…` and will advance again with
     this amendment. Update the head list and the receipt blob links to the amended head.
   - "Next action: Tier-A topic review, then coordinator dispatch to a fresh native Claude Opus 5
     medium opposite-family IMPL-EVAL session" describes a handoff that has already happened twice.
     Rewrite the Harness section to the truth: the owner's keep-and-narrow verdict, this amendment,
     and the pending Tier-A plus one final bounded IMPL-EVAL. Update the "Review-thread gate — PASS;
     0 threads, 0 unanswered" line so it cannot be read as "nothing is outstanding" — owner comment
     `5300440887` exists and is an **issue** comment, outside the review-thread gate's scope. State
     that distinction rather than deleting the line.

## Explicitly out of scope

The earlier 12-item checklist you may have anticipated is **superseded**. Four of its items are now
**forbidden**, because writing them would make your RFC define semantics the same verdict assigns
exclusively to RFC 0003:

- a brand or discriminant on `PluginCliJson`;
- a normative outcome mapping (`applied` / `replayed` / `conflict` / key reuse / in-progress /
  aborted / store / codec / application error) across the adapter;
- cancellation and deadline **settlement** semantics for the executor or store;
- identity-domain mapping between plugin invocation identity/idempotency and RFC 0003 command
  identity.

Adding any of them is a finding against you at Tier-A, not thoroughness. Capability disambiguation
(plugin CLI permission tokens vs `CommandStoreCapabilities`) is in scope only insofar as the
ownership text needs it to be unambiguous — one clarifying sentence, not a new section.

No PLAN-EVAL is authorized and none is required: the owner resolved the sole design choice and no
plan or scope expansion remains. If you nevertheless conclude that a point above forces a change to
an approved **locked D-series decision** rather than a refinement of one, **stop and report** rather
than proceeding on your own judgement.

## Deliverables and sequence

1. One **amended content commit** containing the RFC edits (and RFC-adjacent leaf journals if the
   RFC's own accuracy requires it). Record its SHA — this is the **content head**.
2. **Rerun the six contracted gates at that content head**, on a clean tree, through
   `.llm/tools/gates/run-gate.ts`: `check`, `test`, `publish-dry-run`, `arch-check`,
   `docs-source-format`, `docs-accuracy`. Use fresh distinct `invocationId`s (suggested prefix
   `ns1502-amend-`). Every receipt must record `gitHead == actualGitHead ==` the content head, with
   **no** `allowGitHeadMismatch`. Recompute the evidence-set verdict yourself and **name the exact
   six receipt files** it covers — do not hand the next reader a bare `SUFFICIENT` and do not let a
   `receipts/*final*.json` glob stand in for the contracted set (three receipts share
   `gateId: publish-dry-run`, which `evidence-set.ts` reads as duplicate-or-contradictory).
3. A separate **receipt/journal-only commit** if required, plus the PR-body repair.
4. **Explicit push**, then prove **local == remote == PR head**.
5. Update the leaf `worklog.md`, `drift.md`, and `context-pack.md` with the owner verdict, what you
   changed and where, and the new heads.

## Prohibitions

Do not mark the PR ready, relabel it, merge, publish, reply to or resolve owner comment
`5300440887`, tick or close #1502, file an issue, mutate central cluster state or #1348, take an
expensive-gate lease, or run `scaffold.runtime`. Preserve lock hygiene — commit no `deno.lock`
churn. Do not launch a replacement author session; you are the preserved author and this thread is
the only one that may touch this worktree.

## Report back

Content head, evidence head, the six receipt paths with their `invocationId`s and outcomes, your
recomputed sufficiency verdict over exactly those six, the exact RFC line ranges you changed, the
PR-body diff summary, and final local/remote/PR head equality. Then stop — Tier-A review and the
final IMPL-EVAL are not yours to launch.
