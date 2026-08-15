# Tier-A review — #1502 owner-verdict amendment

Reviewer: `topic-features-0.0.7`, native Claude Opus 5 · high · Remote Control, session
`19621a0b-c6a0-47c6-b826-93c1634a6875`. Opposite-family to the Codex author thread
`019ffcc5-d3e1-7c13-9815-e9956ec43683`.

Status: **complete — `ACCEPTED_WITH_FINDINGS`.** Basis below was recorded before the author's
turn completed, so the review is not shaped by the author's own account of what it changed.

## Independent basis, established before reading the amendment

Recorded first so the review cannot be shaped by the author's own account of what it changed.

### What RFC 0003 actually owns, read from source

`rfcs/0003-command-composition-kit.md:783-820`, "Schema and bridge ownership", names
`netscript db command-store add --database <config-key>` as the explicit generator and enumerates six
duties:

1. detect the configured Prisma provider;
2. append provider-specific receipt/audit/outbox models under stable `NetScriptCommand*` names;
3. create a reviewable migration including unique/check/index definitions;
4. emit `database/<config-key>/command-store.ts` binding generated delegates and the true
   transaction client to `CommandStorePort<TTx>`;
5. emit and re-export the consumer-specific `CommandTransactionClient` type;
6. refuse to overwrite edited models or to run a migration without the consumer's normal DB command.

Supporting facts: `:202-203` the consumer owns the Prisma schema and generated client;
`:707` "the application owns the tables and migrations"; `:728-729` provider-aware generated
migrations add a partial unique constraint where the provider supports it; `:779-781` canonical JSON
text rather than a provider `Json` scalar, with provider generators free to add native projections;
`:312` `@netscript/database/commands/adapters/<provider>` is the provider adapter surface.

This is the ownership the owner's point 3 assigns exclusively to RFC 0003 / #1490. The amendment must
match it, not paraphrase it loosely and not extend it.

Note the boundary is genuinely narrow: `netscript db command-store add` is a **built-in** CLI route,
not a plugin CLI contribution. C6's generic workspace-plan executor may legitimately be the mechanism
that route uses to stage, check, commit, and roll back files. What C6 must not own is provider
detection, model authoring, migration lifecycle, and the emitted bridge/transaction-client types.

### What the amendment must not do

Four items are forbidden by the owner verdict (see `worklog.md` supersession table and D-10). Their
presence is a **finding**, not thoroughness:

- a brand or discriminant on `PluginCliJson`;
- a normative outcome mapping across the adapter;
- cancellation/deadline settlement semantics for the executor or store;
- identity-domain mapping between plugin invocation identity and RFC 0003 command identity.

### Pre-amendment defects I verified myself, which the amendment must resolve

| # | Defect | Evidence |
| --- | --- | --- |
| A | RFC 0000:887 attributes "host-owned execution" to RFC 0003 | RFC 0003 execution is `@netscript/service/commands` with consumer-owned composition (`:207`, `:202`) |
| B | RFC 0000:891 asserts blanket payload non-assignability | `PluginCliJson` and `CommandJson` (RFC 0003:332-338) are the same six-member recursive JSON union; mutually assignable today (D-11) |
| C | RFC 0000:957 amend/fold table omits #1490 / #1363 | table lists #1475 but not the live command-store implementation ownership |
| D | RFC 0000:1019 C6 roadmap row claims unnarrowed "host-owned generation-plan transaction and doctor integration" | overlaps RFC 0003 duties 1-5 above |
| E | PR body `check` row cites figures the receipt does not contain | `check-final.json`: `stdout.bytes 0`, sha256 `e3b0c442…` (empty-string digest), `durationMs 51`, `exitCode 0`. Figures come from `check-cli-plugin-cycle1.json` at head `d71b78c3…` |
| F | PR body names `c987f009e…` as final head; "Next action" prose describes a completed handoff | branch is at `0e302ad3a`; two handoffs have since occurred |
| G | Evaluator's carried C6 preview observation open | must be closed normatively as preview-invariance of planner output |

## Checks to run against the amended head

1. Every point 1-8 of the contract is discharged in the RFC text, not merely in the journals.
2. Defects A-G above are resolved, each verified by reading the amended line — not by the author's
   report.
3. No forbidden item was added. Grep the diff for outcome-union vocabulary, idempotency-state
   vocabulary, brand/discriminant introductions on `PluginCliJson`, and cancellation-settlement
   language.
4. `rfcs/0003-command-composition-kit.md` is untouched; no `packages/**`, `plugins/**`, `deno.lock`,
   issue, or central-state mutation. Verify by diff, not by claim.
5. The distinct core survives: descriptor, router, registry, capability, bootstrap, isolation
   sections unchanged in substance.
6. All six contracted gates rerun at the amended **content head** with fresh distinct
   `invocationId`s, `gitHead == actualGitHead == content head`, no `allowGitHeadMismatch`.
   **Recompute sufficiency myself** over exactly the six named receipt files; a
   `receipts/*final*.json` glob is not the contracted set because three receipts share
   `gateId: publish-dry-run`.
7. Symbol integrity re-derived mechanically: extract every `PluginCli*` / `PLUGIN_CLI_*` identifier
   from fenced `ts` blocks and diff used against declared, as at S1/S4.
8. Local == remote == PR head equality, clean tree, PR still **draft** at exactly one `status:impl`.
9. PR body accurate at the new head, including the review-thread-gate qualification distinguishing
   the owner **issue** comment `5300440887` from review threads.

## What I checked, and how

Amended heads: content `67e12f02165089ec7431b72d1294147477906282`, evidence
`d45a92ba70e78cc1ff42617ca15f6782f4ea8c21`. Local == remote == live PR #1651 head == `d45a92ba7`;
tree clean; PR **draft**; exactly one lifecycle label `status:impl`.

| Check | Method | Result |
| --- | --- | --- |
| Contract points 1-7 discharged in RFC text | read the amended lines, not the report | **pass** — narrowing at `:211-223` (ownership block), `:799-804` (preview-invariance), `:813-819` (adapter direction + both prohibitions), `:886-890` (doctor split), `:918` (compat row), `:922-926` (assignability), `:993` (#1490 amend/fold row), `:1053` (C6 roadmap row), `:1136-1139` (prior art) |
| Defect A — "host-owned execution" | `grep "host-owned execution"` | **resolved** — zero occurrences; replaced by "`@netscript/service/commands` execution with consumer-owned composition" |
| Defect B — blanket non-assignability | read `:922-926` | **resolved** — law scoped to envelope/definition/result types; plain-JSON aliases named as expected-assignable and explicitly not coupling; **no brand added** |
| Defect C — #1490/#1363 absent from amend/fold table | read `:993` | **resolved** |
| Defect D — unnarrowed C6 roadmap row | read `:1053` | **resolved** — row now reads "Generic plugin CLI workspace-plan executor…" with the exclusive RFC 0003/#1490 reservation and preview-invariant exit evidence |
| Defect G — carried preview observation | read `:180-187` and `:799-804` | **resolved normatively** in both the guide-level and reference-level sections, with `MUST`/`MUST NOT` |
| Forbidden items absent | grepped every added line for outcome-union, idempotency-state, brand/discriminant, settlement, and identity vocabulary | **pass** — every hit is a *disclaimer of ownership* ("C6 MUST NOT … define command-store receipt, audit, outbox, or transaction semantics") or a pre-existing table row re-emitted by column rewrap. No outcome mapping, no settlement semantics, no identity-domain mapping, no brand |
| RFC 0003 untouched | `git diff 0e302ad3a..d45a92ba7 --name-only` | **pass** — 0 hits for `0003-command-composition` |
| Scope/lock integrity | diffstat of both commits | **pass** — content commit touches `rfcs/0000-…` + three leaf journals; evidence commit touches journals + six receipts. No `packages/**`, `plugins/**`, `deno.lock`, issue, or central state |
| Six contracted gates | parsed all six receipts myself | **pass** — six distinct `gateId`s, all `PASS`/exit 0, every one `gitHead == actualGitHead == 67e12f021`, no `allowGitHeadMismatch` |
| Sufficiency | **recomputed by hand**, not read | **SUFFICIENT** — no repeated `gateId`, so the `evidence-set.ts:20-22` duplicate rule does not fire |
| Symbol integrity | re-extracted every `PluginCli*`/`PLUGIN_CLI_*` identifier from fenced `ts` blocks and diffed used vs declared | **pass** — 42 declared, 42 used, 0 undeclared. Three symbols appear once in code and again in prose, matching the S4 baseline |
| Defect E — body cites figures a receipt does not contain | read the body against the receipts | **resolved** — `check-final.json` is no longer cited; the figures are attributed to `check-cli-plugin-cycle1.json` at `d71b78c3` and explicitly "not claimed by the binding cached check" |
| The new cached-check claim | verified against the receipt itself | **accurate** — `check-amend.json` has `durationMs 64`, `stdout.bytes 0`, and `stderr.tail` literally ends `(cached, inputs unchanged)`; its stderr sha256 `cc927711…` is identical to `check-final.json`'s |
| Defect F — stale heads and handoff prose | read the body | **resolved** — 12 receipt links all point at blob `d45a92ba7` and all six are the `*-amend.json` files; the Harness section reflects the owner verdict; the review-thread line now distinguishes the **issue** comment `5300440887` from review threads and states it is neither absent nor resolved |

## Findings

**AF-1 — unresolvable commit SHA in merge-facing body evidence (editorial).**
The PR body's S4 slice line cites "reproducibility fix `04d431d9c`". That object does not exist:
`git cat-file -t 04d431d9c` → `fatal: Not a valid object name`. The real commit is `04d431028`.
I validated all 15 SHA-like tokens in the body; this is the only unresolvable one (`5300440887` is
the comment id, a false positive).

This is a miss inside assigned contract point 8 ("update body/head links … truthfully"), not a new
issue: `netscript-pr` requires evidence a reader can open, and a dead SHA cannot be opened. It
changes no head, no receipt, and no RFC content, so it is **editorial** under the coordinator's loop
policy and does not trigger a formal cycle. It is closed by a body-only correction in the same
scope.

**No substantive findings.** Nothing in the amendment annexes RFC 0003 semantics, and nothing in the
distinct plugin CLI core was weakened.

## Verdict

`ACCEPTED_WITH_FINDINGS` — the amendment discharges the owner's eight-point contract at content head
`67e12f021`, the evidence set is independently `SUFFICIENT` at that head, and AF-1 is a body-only
editorial correction that does not gate the final IMPL-EVAL once applied.
