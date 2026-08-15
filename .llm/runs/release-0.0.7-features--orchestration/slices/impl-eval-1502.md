use harness

# #1502 / PR #1651 — IMPL-EVAL (fresh separate session)

You are the formal **IMPL-EVAL** evaluator for the `rfc-plugin-cli-contribution` leaf. You are a
fresh native Claude session, opposite-family to the Codex author thread
`019ffcc5-d3e1-7c13-9815-e9956ec43683`, dispatched by coordinator `codex-root-0.0.7`. You did not
write this work and you must not defer to the sessions that did.

## SKILL

Read `AGENTS.md`, then the task-relevant parts of:

- `.agents/skills/netscript-harness/SKILL.md` — **the IMPL-EVAL protocol**; read
  `.llm/harness/evaluator/protocol.md` and `.llm/harness/evaluator/verdict-definitions.md`.
- `.agents/skills/netscript-tools/SKILL.md` — durable receipt semantics, **sufficiency is always
  recomputed and never trusted as written**, lock hygiene, git ground truth.
- `.agents/skills/netscript-doctrine/SKILL.md` — Archetype 4, axioms, anti-patterns, the fitness-gate
  matrix the RFC claims to satisfy.
- `.agents/skills/netscript-pr/SKILL.md` — close-gate law, Definition-of-Done and
  `acceptance-evidence` semantics, closing-keyword rules, single-`status:` law.
- `.agents/skills/netscript-deno-toolchain/SKILL.md` and `.agents/skills/jsr-audit/SKILL.md` — the
  publish/JSR bar the RFC's obligations table asserts.
- `.agents/skills/netscript-cli/SKILL.md` — the real CLI surface the RFC describes.

## Identity to record first

Enable `/remote-control` immediately and record in `evaluate.md`: Claude session ID, non-empty
bridge session ID, Remote Control URL, PID, exact cwd, requested route, and observed route. Requested
route is **native Claude Opus 5 · high · Remote Control**. Read the observed route from your job's
`respawnFlags` (`/home/codex/.claude/jobs/<jobId>/state.json`), not from process argv — a bg session
that claims a spare process does not carry `--model`/`--effort` on its command line. Report requested
and observed distinctly; claim a match only if they match.

## Immutable identity — refuse on mismatch

- Worktree: `/home/codex/repos/netscript-007-features-1502`
- Branch: `docs/rfc-plugin-cli-contribution`
- **Final head (evaluate this): `04d431028c1fe455dc18c05e3fa0779e7b593046`**
- **Content head (what every binding gate attests): `120859d5c762706702cd45a3f2be19664e335e22`**
- PR: #1651, open **draft**, exactly one lifecycle label `status:impl`
- Run dir: `.llm/runs/docs-rfc-plugin-cli-contribution--1502/`

Independently resolve local `HEAD`, the explicit remote ref, and the live PR head, and confirm the
tree is clean with no upstream. A mismatch is a **hard refusal**, not permission to evaluate a nearby
commit. Confirm the content head is an ancestor of the final head and that the only delta between
them is receipts and run journals — verify that by diff, not by reading the claim.

**Live `main` has advanced** from the immutable dispatch base `01e0960494c95ce56eb35892c211a095eb13e6ed`
to `0b3ed5d5a6aea451318f120988c25dfa3993a2ab`. The leaf discloses this in its `drift.md` and asserts
the change does not alter its ownership/coupling findings. Test that assertion rather than accepting
it: if any RFC claim about the live CLI/plugin surface is now stale, that is a finding.

## What to evaluate

Judge the work, not the paperwork. Independently verify each of the following; where you accept a
claim, say what you actually read or ran.

1. **The RFC contract against issue #1502.** Read `rfcs/0000-plugin-cli-contribution.md` in full and
   #1502's required decisions and acceptance criteria. Does the RFC actually decide what the issue
   demands — descriptors, routers, help, completion, errors, discovery, async bootstrap, isolation,
   collisions, deterministic ordering, plugin-absent UX, generator ownership, transactional output,
   preview/no-write, doctor integration, capabilities, manifest/pointer ownership? Is any decision
   asserted rather than made?
2. **Internal consistency of the public API.** Every declared symbol should resolve and every stated
   guarantee should match the signature that provides it. Prior Tier-A review found and closed three
   defects of exactly this class (an undeclared diagnostic-code type, a "deeply readonly" promise
   returning shallow `Readonly`, and a handler-ref template literal that admitted parent traversal).
   Re-derive this yourself rather than trusting that they are closed.
3. **Fields and guards whose predicate can never fire.** One was found and fixed
   (`PluginCliCapabilityGrant.denied` in a plugin-visible grant). `milestone-run.md` § Gate integrity
   names this the signature failure of this kind of work. Look for others.
4. **The six binding receipts and the SUFFICIENT set.** The contracted set is exactly these
   `invocationId`s: `ns1502-s4-final-check`, `ns1502-s4-final-test`,
   `ns1502-s4-final-publish-workspace`, `ns1502-s4-final-arch-check`,
   `ns1502-s4-final-docs-source-format`, `ns1502-s4-final-docs-accuracy`. **Recompute sufficiency
   from the receipts yourself.** Note that `receipts/*final*.json` is deliberately *not* the
   contracted set: three receipts share `gateId: 'publish-dry-run'` (workspace plus two per-member
   runs), and `.llm/tools/gates/evidence-set.ts` treats a repeated `gateId` as
   duplicate-or-contradictory. Check each binding receipt's `outcome`, `exitCode`,
   `gitHead == actualGitHead == 120859d5c…`, and the absence of `allowGitHeadMismatch`. Judge whether
   naming a subset is an honest scoping or an evasion.
5. **Content-head provenance.** Do the gates actually attest the content being evaluated? Confirm no
   binding receipt was edited after the fact.
6. **Compatibility and deferred work.** Are the claims about RFC 0003, RFC 0005, and the accepted
   frontend/SDK/runtime designs accurate, and is deploy #904–#908 supersession concrete enough to be
   acted on? Is the amend/fold-first duplicate audit real board reconciliation against live GitHub,
   or a plausible-looking table? Are the S2/S3 deferrals declared as gaps rather than left implicit?
7. **JSR and publish implications.** Are the measured baselines carried honestly — in particular the
   15 private-type findings and four missing `@module` tags on `@netscript/plugin` — without any
   existing failure relabelled as success?
8. **DoD truthfulness and acceptance evidence.** Nine of ten DoD boxes are ticked; the open one is
   IMPL-EVAL plus Tier-A completion. Verify every ticked box is actually true with openable evidence,
   and that the five `acceptance-evidence` entries map to real, checkable artifacts. A box ticked
   without evidence is the #260 failure this gate exists to stop.
9. **Scope and lock integrity.** Confirm the leaf changed no `packages/**` or `plugins/**` source, no
   `deno.lock`, filed no issue, mutated no central cluster state or #1348, ran no expensive gate, and
   never flipped the PR ready. `Closes #1502` must remain correct and must not be read as closing the
   proposed future epic.

## Verdict

Write `evaluate.md` in the leaf run dir containing exactly one of `PASS`, `FAIL_FIX`,
`FAIL_RESCOPE`, or `FAIL_DEBT`, per `.llm/harness/evaluator/verdict-definitions.md`. Replace the
existing placeholder. Ground every finding in something checkable — file and line, command output,
or receipt field. Do not pad the verdict with praise; a finding a reader cannot verify is not a
finding.

## Authority — narrow

You may change **only evaluator artifacts** (`evaluate.md`), commit them, push with
`git push origin HEAD:refs/heads/docs/rfc-plugin-cli-contribution`, and post one structured
`[PHASE: IMPL-EVAL] [VERDICT: …]` PR comment recording the verdict, the evaluated final and content
heads, your evaluator commit, and your Remote Control identity.

You must **not**: implement or edit the RFC, edit package/plugin source, flip the PR to ready,
relabel, merge, publish, close or file issues, mutate central cluster state, take an expensive-gate
lease, or run `scaffold.runtime`. Do not resume or steer the Codex author thread. Preserve lock
hygiene; commit no `deno.lock` churn.

Report the terminal verdict, your evaluator commit, the PR comment URL, and your recorded attachment
identity.
