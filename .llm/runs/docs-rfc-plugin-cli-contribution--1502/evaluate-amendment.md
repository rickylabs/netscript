# IMPL-EVAL — owner KEEP AND NARROW amendment (#1502 / PR #1651)

## VERDICT: PASS

Bounded gate. This evaluates only the owner-verdict amendment, the prior conditional finding,
evidence reachability, and the duplicate/ownership proof. The prior full IMPL-EVAL `PASS` at content
head `120859d5c…` / final head `04d431028…` is not re-litigated.

## Evaluator identity

| Field              | Value                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------- |
| Claude session ID  | `e8cd9765-9f6c-4418-bbc2-4a24f221f2d4`                                                 |
| Bridge session ID  | `cse_01Cwg2ukqsMkwpuca5xhzVaG` (non-empty)                                             |
| Remote Control URL | `https://claude.ai/code/session_01Cwg2ukqsMkwpuca5xhzVaG`                              |
| PID                | `375750` (`claude bg-spare`), pty host `375647`                                        |
| cwd                | `/home/codex/repos/netscript-007-features-1502`                                        |
| Requested route    | native Claude Opus 5 · medium · Remote Control                                         |
| Observed route     | `--model claude-opus-5 --effort medium --remote-control` (job `e8cd9765` respawnFlags) |
| Route match        | **Yes** — requested and observed agree on model, effort, and attachment mode           |

Observed route was read from `/home/codex/.claude/jobs/e8cd9765/state.json` → `respawnFlags`, not
from argv. This session is a claimed bg spare (`ps -o args -p 375750` →
`claude bg-spare --bg-spare
/tmp/cc-daemon-1000/59093fbc/spare/8bc34f75.claim.sock`), so its command
line carries no `--model`/`--effort`; argv would have been an unsound route source here.

Author thread `019ffcc5-d3e1-7c13-9815-e9956ec43683` (Codex) is opposite-family and was neither
resumed nor steered.

## Immutable identity — verified, no mismatch

| Check                 | Result                                                                              |
| --------------------- | ----------------------------------------------------------------------------------- |
| Worktree              | `/home/codex/repos/netscript-007-features-1502` ✓                                   |
| Branch                | `docs/rfc-plugin-cli-contribution` ✓                                                |
| Local `HEAD`          | `d45a92ba70e78cc1ff42617ca15f6782f4ea8c21` ✓                                        |
| Remote ref            | `git ls-remote origin refs/heads/docs/rfc-plugin-cli-contribution` → `d45a92ba7…` ✓ |
| Live PR head          | `gh pr view 1651 -q .headRefOid` → `d45a92ba7…` ✓                                   |
| Tree                  | clean (`git status --porcelain` → 0 lines) ✓                                        |
| PR state              | `OPEN`, `isDraft: true` ✓                                                           |
| Lifecycle labels      | exactly one `status:` label — `status:impl` ✓                                       |
| Content-head ancestry | `git merge-base --is-ancestor 67e12f021 d45a92ba7` → true ✓                         |

All three head sources agree, so no body-only edit ambiguity arises.

**Content→evidence delta verified by diff, not by claim.**
`git diff --name-status
67e12f021..d45a92ba7` returns exactly nine paths, all under
`.llm/runs/docs-rfc-plugin-cli-contribution--1502/`: `context-pack.md`, `drift.md`, `worklog.md`
(modified) and the six `*-amend.json` receipts (added). No RFC, source, or lock file is in the
delta.

## 1. The amendment against the eight-point contract

Read `git show 67e12f021` (four files, `rfcs/0000-plugin-cli-contribution.md` +124/−44) and the
amended RFC in place. Each contract point is checked against **RFC text**, not against journal
assertions.

| Point | Decided in RFC text?           | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Yes — core preserved           | Amendment hunks touch only lines ~177, ~211, ~799, ~886, ~910, ~981, ~1043, ~1133. Descriptor/router/registry/capability/bootstrap/isolation sections (contract identity ~240–520, capabilities ~570–630, bootstrap/isolation ~700–730) carry no diff hunk.                                                                                                                                                                        |
| 2     | Yes — normative paragraph      | `rfcs/0000:221-229`: "C6 owns only generic CLI contribution workspace-plan execution: canonical UTF-8 text-plan validation, preview/apply safety, common stage/check/commit/rollback mechanics, and generic registry/plan/journal doctor states."                                                                                                                                                                                  |
| 3     | Yes — exclusive list, complete | `rfcs/0000:221-227` names provider selection; Prisma schema/models/indexes; migration creation, application, refusal; generated bridge and transaction-client types; database-specific validation; business-command receipt/audit/outbox/transaction semantics.                                                                                                                                                                    |
| 4     | Yes — bidirectional `MUST NOT` | `rfcs/0000:816-822`: adapter "may map consumer-owned command-store scaffold output into `PluginCliGenerationPlan`"; "C6 MUST NOT parse Prisma, choose provider SQL or indexes, own any part of migration creation/application/refusal, or define command-store receipt, audit, outbox, or transaction semantics"; "RFC 0003 / #1490 MUST NOT define another generic plugin CLI mount or a second workspace stage/rollback engine." |
| 5     | Yes — doctor split             | `rfcs/0000:889-892`: "C6 doctor scope ends at generic CLI registry, workspace plan, and mutation-journal health. RFC 0003 / #1490 exclusively reports command-store schema, migration, generated-bridge, transaction-client, and database-specific validation health. Neither doctor surface diagnoses or repairs the other's domain."                                                                                             |
| 6     | Yes — normative, stated twice  | Guide level `rfcs/0000:180-184`: planner "MUST return the same canonical plan for preview and apply, and `invocation.preview` MUST NOT change plan construction. Only the host's execution mode decides whether mutation occurs." Reference level `rfcs/0000:802-806` restates it as a planner obligation. This closes the prior evaluator's carried C6 observation.                                                               |
| 7     | Yes — three surfaces amended   | Compatibility table row relabelled "RFC 0003 … **and #1490 under #1363**" (`rfcs/0000:918`); duplicate audit gains a `#1490 under #1363` row (`rfcs/0000:993`); C6 roadmap row rewritten to "Generic plugin CLI workspace-plan executor and registry/plan/journal doctor integration" with the RFC 0003/#1490 exclusion in the disposition column (`rfcs/0000:1053`); prior art updated (`rfcs/0000:1136-1139`).                   |

Point 8 is covered in section 2.

### The narrowing is real, checked against RFC 0003 source

I read `rfcs/0003-command-composition-kit.md:783-820` ("Schema and bridge ownership") directly
rather than the amendment's paraphrase. `netscript db command-store add --database <config-key>`
carries six duties there: (1) detect the configured Prisma provider; (2) append provider-specific
receipt/audit/outbox models under `NetScriptCommand*`; (3) create a reviewable migration including
unique/check/index definitions; (4) emit `database/<config-key>/command-store.ts` binding delegates
and the true transaction client to `CommandStorePort<TTx>`; (5) emit and re-export the
consumer-specific transaction type; (6) refuse to overwrite edited models or run a migration without
the consumer's normal DB command.

Each of the six maps onto a term in the C6 exclusion list at `rfcs/0000:221-227` — duty 1 → provider
selection, duty 2 → Prisma schema/models, duty 3 → migration creation and indexes, duty 4 →
generated bridge, duty 5 → transaction-client types, duty 6 → migration refusal. Nothing in RFC
0003's stated ownership falls inside what C6 now claims, and C6's residue (canonical text-plan
validation, preview/apply safety, stage/check/commit/rollback, registry/plan/journal doctor) is
absent from RFC 0003's list. The boundary closes without a gap and without an overlap.

The capability-vocabulary collision is also delimited: `rfcs/0000:227-229` states that
`PluginCliCapability` values are CLI-invocation permission tokens while RFC 0003's
`CommandStoreCapabilities` describes store capability truth, "and neither vocabulary grants or
defines the other."

### Over-correction — none of the four forbidden items appears

- **Brand/discriminant on `PluginCliJson`** — absent. `grep -n "brand\|__brand\|discriminant"` over
  the RFC returns nothing, and `PluginCliJson` (`rfcs/0000:255-261`) remains a bare recursive JSON
  value alias. The amendment goes the opposite way, stating at `rfcs/0000:922-925` that structurally
  identical plain-JSON aliases "are expected to be mutually assignable and are not evidence of
  coupling." That is the correct resolution: `PluginCliJson` and RFC 0003's `CommandJson`
  (`rfcs/0003:332-338`) are the same six-member recursive union, so they are mutually assignable by
  construction — the pre-amendment blanket rule ("assignability between the payloads is a failure")
  was unsatisfiable for them without adding exactly the brand that was forbidden. The narrowed rule
  still requires envelope, definition, and result payload types to remain distinct, so the domain
  separation the obligation exists to protect is intact.
- **Normative outcome mapping** (`applied`/`replayed`/`conflict`/key reuse/in-progress/aborted/
  store/codec/application error) across the adapter — absent.
  `grep -iE "replayed|idempotency key|key reuse|in-progress|aborted|codec error|store error|application error"`
  returns no hit in the RFC.
- **Cancellation/deadline settlement semantics** — not added. Every cancellation/deadline line
  (`rfcs/0000:156, 213, 577, 600, 627, 705-726, 782`) predates the amendment; no amendment hunk
  intersects those ranges.
- **Identity-domain mapping** between plugin invocation identity and RFC 0003 command identity —
  absent. The compatibility cell still separates the domains without mapping them: "A
  `CommandDefinition` is transactional business intent with idempotency, database receipt/audit/
  outbox, and same-commit laws. A `PluginCliInvocation` is presentation/dispatch input and promises
  none of those" (`rfcs/0000:918`).

### One factual claim the amendment newly asserts — verified

The compatibility row's "Laws this RFC reuses" cell changed from "host-owned execution" to
"`@netscript/service/commands` execution with consumer-owned composition" (`rfcs/0000:918`). Checked
against RFC 0003 source: `rfcs/0003:308` assigns "command definition, executor, envelope, context,
typed application failures" to `@netscript/service/commands`, and `rfcs/0003:817` and
`rfcs/0003:1746` state the generated bridge and the models/migrations are consumer-owned. The
restatement is accurate.

## 2. The prior conditional finding — resolved

The earlier `PASS` was conditional on removing the body's attribution of "1,033 files, 9 batches, 0
failed" to `check-final.json`, a receipt with `stdout.bytes: 0` and no figures.

- The current body makes no such claim. Lines 48–49: "The historical
  `1,033 files, 9 batches, 0
  failed` figures belong only to cycle-1 receipt
  `check-cli-plugin-cycle1.json` at `d71b78c3`; they are not claimed by the binding cached check."
- That attribution is true. `receipts/check-cli-plugin-cycle1.json` has
  `gitHead ==
  actualGitHead == d71b78c3116db4ec3aaaa0447dd527fcd4867f6f` and a `stdout.tail`
  containing `"selection":{"filesSelected":1033,"batches":9,"failedBatches":0}`.
- The new cached re-check is described honestly. Body line 41 says "valid cached re-check, 64 ms, no
  stdout, cached/inputs-unchanged reported on stderr". `receipts/check-amend.json` has
  `durationMs: 64`, `stdout.bytes: 0`, and a `stderr.tail` ending `(cached, inputs unchanged)`. The
  body claims a cache hit and nothing about files measured — the distinction the prior finding
  turned on.

Spot-checked one further body figure for the same failure mode: body line 42 claims "88 passed, 0
failed across 16 focused CLI/plugin files"; `receipts/test-amend.json` `stdout.tail` parses to
`summary: {passed: 88, failed: 0, ignored: 0, totalResults: 88, uniqueFailures: 0}` with 16
`*_test.ts` arguments in `command`. Accurate.

## 3. Evidence reachability and recomputed sufficiency

**Sufficiency recomputed, not trusted as written.** I read each of the six contracted receipts and
checked the fields myself:

| invocationId                      | gateId               | outcome | exitCode | gitHead == actualGitHead == `67e12f021…` | `allowGitHeadMismatch` |
| --------------------------------- | -------------------- | ------- | -------- | ---------------------------------------- | ---------------------- |
| `ns1502-amend-check`              | `check`              | PASS    | 0        | yes                                      | absent                 |
| `ns1502-amend-test`               | `test`               | PASS    | 0        | yes                                      | absent                 |
| `ns1502-amend-publish-workspace`  | `publish-dry-run`    | PASS    | 0        | yes                                      | absent                 |
| `ns1502-amend-arch-check`         | `arch-check`         | PASS    | 0        | yes                                      | absent                 |
| `ns1502-amend-docs-source-format` | `docs-source-format` | PASS    | 0        | yes                                      | absent                 |
| `ns1502-amend-docs-accuracy`      | `docs-accuracy`      | PASS    | 0        | yes                                      | absent                 |

`grep -l allowGitHeadMismatch *amend*.json` → no match. The six `gateId`s are pairwise distinct, so
neither duplicate branch in `.llm/tools/gates/evidence-set.ts:20-25` fires.

I then re-ran the repository evaluator myself over exactly these six files with
`expectedGateIds: [check, test, publish-dry-run, arch-check, docs-source-format, docs-accuracy]` and
`immutableHead: 67e12f021…`:

```text
"sufficiency": "SUFFICIENT",
"reasons": []
```

The glob trap is real and correctly avoided. `receipts/*final*.json` contains three receipts sharing
`gateId: publish-dry-run` (`publish-dry-run-cli-final.json`, `publish-dry-run-final.json`,
`publish-dry-run-plugin-final.json`), plus six files with no `gateId` at all; that set would be
reported duplicate-or-contradictory. The body states "No receipt glob is used" and names the six
files, which matches what I evaluated.

**Reachability, merge-facing.** Every commit SHA cited in the PR body resolves to a commit object in
this repository and is an ancestor of the pushed head `d45a92ba7`: `a02f9690…`, `12276e6d…`,
`86d0110a…`, `bd8b29bf…`, `7a5eb580…`, `171e4e62…`, `120859d5…`, `c987f009…`, `04d43102…`,
`3e0c8858…`, `0e302ad3…`, `d71b78c3…` — twelve of twelve. All six receipt links and the RFC,
research, and worklog links are `blob/d45a92ba70e…` paths, and every target path exists at that
committed head, which is the pushed branch tip. The three fragment anchors also resolve to real
headings: `#compatibility-with-accepted-contribution-rfcs` → `rfcs/0000:907`,
`#amendfold-first-duplicate-audit` → `rfcs/0000:979`, `worklog.md#owner-amendment-binding-evidence`
→ `worklog.md:436`. No dead link found.

## 4. Duplicate / ownership proof

The amended RFC answers the owner's question in a checkable form rather than a descriptive one. The
distinct core — discovery, routing, help/completion, bootstrap, isolation — is untouched by the
amendment (section 1, point 1), so the "not a duplicate" half rests on unchanged text the prior
IMPL-EVAL already passed. The one genuine overlap is delimited by three mutually consistent
statements that a reviewer can test against RFC 0003: the ownership paragraph (`rfcs/0000:221-229`),
the bidirectional `MUST NOT` pair (`rfcs/0000:816-822`), and the doctor split (`rfcs/0000:889-892`).
I verified the delimitation against `rfcs/0003:783-820` above; it partitions rather than describes.

**The #1490/#1363 statement is accurate against the live board, not a plausible-looking table.**
Verified with `gh`:

- #1490 is `OPEN`, titled "[command C9] Generate command stores, service commands, routes, and relay
  wiring from the CLI", labelled `epic:command-composition`, `area:service`, `area:cli`, milestone
  `0.0.10`.
- #1363 is `OPEN`, "Epic: Production command composition — transaction, audit, idempotency, outbox,
  and relay".
- "#1490 under #1363" holds two ways: `repos/rickylabs/netscript/issues/1363/sub_issues` returns
  `1482 1483 1484 1485 1486 1487 1488 1489 1490 1491`, and #1490's body opens "Part of #1363.
  Depends on #1362 and command contracts/stores. Implements RFC 0003 stage 8."
- #1490's live scope corroborates the overlap the owner identified rather than inventing it — its
  checklist includes "Preview is migration-no-write and emitted aliases/root methods are verified",
  a CLI-driven generator with preview semantics, which is precisely the seam C6 previously claimed.

**`Closes #1502` remains correct and correctly bounded.** #1502 is `OPEN` and is the RFC issue
("RFC: Plugin CLI command contribution architecture — one typed mount and generation seam"), which
this leaf completes. Body line 21 states the boundary explicitly: "#1502 is completed by this RFC
leaf; the proposed later implementation epic is separate, unfiled, and not closed by this PR." The
roadmap C1–C10 remains a proposal; no epic issue was filed by this leaf (no issue mutation appears
in the range diff), so the keyword cannot be read as closing the future implementation epic.

## Scope and lock integrity — `0e302ad3a..d45a92ba7`

`git diff --name-status 0e302ad3a..d45a92ba7` returns ten paths:
`rfcs/0000-plugin-cli-contribution.md` plus nine files under
`.llm/runs/docs-rfc-plugin-cli-contribution--1502/`.

- No `packages/**` or `plugins/**` path. ✓
- No `deno.lock`. ✓ Lock hygiene preserved; no lock churn in the range and none introduced by this
  verdict.
- No `rfcs/0003-command-composition-kit.md` mutation — RFC 0003 was read-only inspection surface. ✓
- No issue, milestone, label, or central 0.0.7 cluster state mutation; no `#1348` touch. ✓
- No expensive gate: `scaffold.runtime` is `NOT_RUN` and no expensive-gate lease appears in the
  range. The heaviest receipt is `publish-dry-run-amend.json` at 81 s, a workspace dry run, not a
  runtime suite. ✓
- The PR never flipped ready: the issue timeline contains no `ready_for_review` and no
  `convert_to_draft` event. ✓

## Findings

**Substantive findings: none.** Nothing here returns the work to the author under the coordinator's
loop policy.

**Editorial notes (no formal cycle):**

1. `rfcs/0000:213` — the package-ownership table row lost the words "process execution" when it was
   rewritten from "Workspace staging, validation, atomic commit/rollback, process execution" to
   "Generic CLI workspace-plan validation, staging, checks, commit/rollback, and journal
   diagnostics". Host ownership of gate subprocesses survives normatively at `rfcs/0000:841` ("runs
   the host-selected focused format/check/validation set against the staged view") and
   `rfcs/0000:852` ("Preview names the gates that would run but executes no subprocess"), so the
   decision is unchanged; only the summary table is now less complete than the body it summarizes.
2. `rfcs/0000:918` — the RFC 0003 compatibility cell dropped the sentence "`PluginCliGenerationPlan`
   mutates workspace files only and cannot stand in for a database transaction";
   `grep -i "stand in
   for\|database transaction"` finds no survivor. The substance is preserved
   as an ownership prohibition at `rfcs/0000:816-822` rather than as a payload-capability statement,
   so no decision is lost, but a reader looking for the plan-versus-DB-transaction contrast now
   finds it only in the negative form.

Neither note changes a decision, a gate, or the ownership boundary.

## Verdict rationale

Against `.llm/harness/evaluator/verdict-definitions.md`: approved amendment scope is complete (all
eight contract points land in RFC text, verified per point); required static gates pass with a
recomputed `SUFFICIENT` evidence set bound to the content head; runtime/consumer gates are correctly
`N/A` for an RFC-only leaf; no doctrine violation is introduced or deepened and no `arch-debt.md`
entry is required; run artifacts are updated enough to resume. No condition for `FAIL_FIX`,
`FAIL_RESCOPE`, or `FAIL_DEBT` is met.

**VERDICT: PASS**

- Evaluated content head: `67e12f02165089ec7431b72d1294147477906282`
- Evaluated evidence head: `d45a92ba70e78cc1ff42617ca15f6782f4ea8c21`
