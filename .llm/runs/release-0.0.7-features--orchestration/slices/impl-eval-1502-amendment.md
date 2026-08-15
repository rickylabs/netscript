use harness

# #1502 / PR #1651 — final IMPL-EVAL, bounded to the owner amendment

You are the formal **IMPL-EVAL** evaluator for the owner-verdict amendment on the
`rfc-plugin-cli-contribution` leaf. You are a fresh native Claude session, opposite-family to the
Codex author thread `019ffcc5-d3e1-7c13-9815-e9956ec43683`, dispatched by coordinator
`codex-root-0.0.7`. You did not write this work and you must not defer to the sessions that did.

This is a **bounded** gate, not a re-run of the full IMPL-EVAL. A prior full IMPL-EVAL returned
`PASS` at final head `04d431028…` / content head `120859d5c…`. You are not re-litigating it. You are
judging four things: the amendment, the prior conditional finding, evidence reachability, and the
duplicate/ownership proof.

## SKILL

Read `AGENTS.md`, then the task-relevant parts of:

- `.agents/skills/netscript-harness/SKILL.md` — the IMPL-EVAL protocol; `.llm/harness/evaluator/protocol.md`
  and `.llm/harness/evaluator/verdict-definitions.md`.
- `.agents/skills/netscript-tools/SKILL.md` — durable receipt semantics, **sufficiency is always
  recomputed and never trusted as written**, lock hygiene, git ground truth.
- `.agents/skills/netscript-doctrine/SKILL.md` — Archetype 4 and the fitness gates the RFC claims.
- `.agents/skills/netscript-pr/SKILL.md` — evidence must be openable; close-gate and single-`status:` law.

## Identity to record first

Enable `/remote-control` immediately and record in `evaluate-amendment.md`: Claude session ID,
non-empty bridge session ID, Remote Control URL, PID, exact cwd, requested route, observed route.
Requested route is **native Claude Opus 5 · medium · Remote Control**. Read the observed route from
your job's `respawnFlags` (`/home/codex/.claude/jobs/<jobId>/state.json`), **not** from process argv —
a bg session that claims a spare process does not carry `--model`/`--effort` on its command line.
Report requested and observed distinctly; claim a match only if they match.

## Immutable identity — refuse on mismatch

- Worktree: `/home/codex/repos/netscript-007-features-1502`
- Branch: `docs/rfc-plugin-cli-contribution`
- **Amended content head (what every binding gate attests): `67e12f02165089ec7431b72d1294147477906282`**
- **Evidence head: `d45a92ba70e78cc1ff42617ca15f6782f4ea8c21`**
- PR: #1651, open **draft**, exactly one lifecycle label `status:impl`
- Run dir: `.llm/runs/docs-rfc-plugin-cli-contribution--1502/`

Resolve local `HEAD`, the explicit remote ref, and the live PR head independently and confirm a clean
tree. Note the PR body may carry a later body-only edit; a body edit moves no head. A **head**
mismatch is a hard refusal, not permission to evaluate a nearby commit. Confirm the content head is
an ancestor of the evidence head and that the only delta between them is receipts and run journals —
verify by diff, not by reading the claim.

## The owner's ruling you are checking against

The owner reviewed comment `https://github.com/rickylabs/netscript/pull/1651#issuecomment-5300440887`
and selected **keep and narrow**. The RFC is not a duplicate: its plugin CLI discovery, routing,
help/completion, bootstrap, and isolation core is distinct and stays. The only real overlap was
**C6** versus `rfcs/0003-command-composition-kit.md` and its live implementation **#1490 under
#1363**, and the remedy was to narrow C6's ownership claim.

The eight-point contract the author was given:

1. Preserve the distinct descriptor/router/registry/capability/bootstrap/isolation architecture.
2. C6 owns **only** generic CLI contribution workspace-plan execution: canonical text plan
   validation, preview/apply safety, common stage/check/commit/rollback, generic
   registry/plan/journal doctor states.
3. RFC 0003 / #1490 **exclusively** owns command-store provider selection, Prisma schema/models/
   indexes, migration creation/application/refusal, the generated bridge and transaction-client
   types, DB-specific validation, and business-command receipt/audit/outbox/transaction semantics.
4. The adapter may map RFC-0003 domain output into `PluginCliGenerationPlan` / the shared executor.
   C6 must not parse Prisma, choose provider SQL/indexes, own the migration lifecycle, or define
   command-store semantics. RFC 0003 / #1490 must not define another generic plugin CLI mount or a
   second workspace stage/rollback engine.
5. Doctor split: C6 reports generic registry/plan/journal health; RFC 0003 reports command-store
   schema/migration/bridge health.
6. Planner output is preview-invariant — the same canonical plan for preview and apply;
   `invocation.preview` cannot change plan construction; only the host execution mode controls
   mutation. This closes the prior evaluator's carried C6 observation.
7. Amend the RFC compatibility/ownership text and C6 roadmap explicitly naming RFC 0003 and #1490.
   Edit no RFC 0003, package/plugin code, locks, issues, or central state.
8. Correct the PR-body medium provenance defect and record the valid final cache hit plainly.

## What to evaluate — these four things only

Judge the work, not the paperwork. Where you accept a claim, say what you actually read or ran.

1. **The amendment against the contract.** Read the amended `rfcs/0000-plugin-cli-contribution.md`
   and `git show 67e12f021`. Is each of points 1-7 actually *decided in the RFC text*, or merely
   asserted in a journal? Is the narrowing real — does C6's claimed ownership now stop where RFC
   0003's begins? Read `rfcs/0003-command-composition-kit.md:783-820` ("Schema and bridge
   ownership", the six duties of `netscript db command-store add`) and check the boundary against
   the source rather than against the amendment's paraphrase.

   **Over-correction is also a finding.** Four items were deliberately **forbidden**, because
   writing them would make #1651 define semantics the owner assigned exclusively to RFC 0003: a
   brand or discriminant on `PluginCliJson`; a normative outcome mapping (`applied`/`replayed`/
   `conflict`/key reuse/in-progress/aborted/store/codec/application error) across the adapter;
   cancellation/deadline **settlement** semantics; and identity-domain mapping between plugin
   invocation identity and RFC 0003 command identity. If any appears, report it.

   Check too that the distinct core was not weakened while narrowing C6 — descriptors, routers,
   registry, capabilities, bootstrap, and isolation should be unchanged in substance.

2. **The prior conditional finding.** The earlier verdict was `PASS` conditional on one body-only
   correction: the body cited "1,033 files, 9 batches, 0 failed" against `check-final.json`, a
   receipt with `stdout.bytes: 0` and no figures. Verify the current body no longer makes that
   claim, that the figures are attributed to `check-cli-plugin-cycle1.json` at head `d71b78c3…`, and
   that the new `check-amend.json` cache hit is described accurately — that receipt has
   `durationMs 64`, `stdout.bytes 0`, and a `stderr.tail` ending `(cached, inputs unchanged)`. A
   passing cached re-check is honest evidence; a cached re-check described as if it measured files
   is not.

3. **Evidence reachability.** The contracted set is exactly these `invocationId`s:
   `ns1502-amend-check`, `ns1502-amend-test`, `ns1502-amend-publish-workspace`,
   `ns1502-amend-arch-check`, `ns1502-amend-docs-source-format`, `ns1502-amend-docs-accuracy`.
   **Recompute sufficiency from the receipts yourself.** Check each one's `outcome`, `exitCode`,
   `gitHead == actualGitHead == 67e12f021…`, and the absence of `allowGitHeadMismatch`. Note that a
   `receipts/*final*.json` glob is *not* the contracted set — three older receipts share
   `gateId: publish-dry-run`, and `.llm/tools/gates/evidence-set.ts:20-22` treats a repeated
   `gateId` as duplicate-or-contradictory. Then check reachability in the merge-facing sense: does
   every receipt link and every commit SHA cited in the PR body actually resolve? A dead link is not
   evidence.

4. **Duplicate / ownership proof.** Does the amended RFC now constitute a checkable answer to the
   owner's question — that this RFC is not a duplicate of RFC 0003, with the one genuine overlap
   delimited rather than described? Is the #1490/#1363 ownership statement accurate against the live
   board, or a plausible-looking table? Is `Closes #1502` still correct, and still not readable as
   closing the proposed future implementation epic?

Also confirm scope and lock integrity across `0e302ad3a..d45a92ba7`: no `packages/**`,
`plugins/**`, `deno.lock`, RFC 0003, issue, central cluster state, or `#1348` mutation; no expensive
gate run; the PR never flipped ready.

## Verdict

Write `evaluate-amendment.md` in the leaf run dir containing exactly one of `PASS`, `FAIL_FIX`,
`FAIL_RESCOPE`, or `FAIL_DEBT`, per `.llm/harness/evaluator/verdict-definitions.md`. Ground every
finding in something checkable — file and line, command output, or receipt field. Do not pad the
verdict with praise; a finding a reader cannot verify is not a finding. Distinguish substantive
findings from editorial notes explicitly: under the coordinator's loop policy a substantive `FAIL`
returns once to the same author, while editorial notes do not trigger another formal cycle.

## Authority — narrow

You may change **only** evaluator artifacts (`evaluate-amendment.md`), commit them, push with
`git push origin HEAD:refs/heads/docs/rfc-plugin-cli-contribution`, and post one structured
`[PHASE: IMPL-EVAL] [VERDICT: …]` PR comment recording the verdict, the evaluated content and
evidence heads, your evaluator commit, and your Remote Control identity.

You must **not**: edit the RFC or any package/plugin source, flip the PR to ready, relabel, merge,
publish, close or file issues, reply to or resolve owner comment `5300440887`, mutate central
cluster state, take an expensive-gate lease, or run `scaffold.runtime`. Do not resume or steer the
Codex author thread. Preserve lock hygiene; commit no `deno.lock` churn.

Report the terminal verdict, your evaluator commit, the PR comment URL, and your recorded attachment
identity.
