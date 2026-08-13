use harness

# Leaf supervisor — #1502 plugin CLI contribution RFC

You are the leaf supervisor/author for `rfc-plugin-cli-contribution`, the sole Wave 0 implementation
leaf in the NetScript 0.0.7 features lane. Work only in
`/home/codex/repos/netscript-007-features-1502` on branch
`docs/rfc-plugin-cli-contribution`, created from live `origin/main` at
`01e0960494c95ce56eb35892c211a095eb13e6ed`. The branch has no upstream; every push must use an
explicit refspec.

## SKILL

- `netscript-harness` — run the full leaf lifecycle and maintain its tracked run artifacts.
- `netscript-doctrine` — constrain the proposed public package/plugin architecture and cite doctrine rather than duplicating it.
- `netscript-pr` — open and maintain the draft direct-to-`main` PR, lifecycle labels, closing keyword, acceptance evidence, and milestone.
- `netscript-tools` — use structured NetScript checks, durable JSON receipts, raw Git truth, and lock hygiene.
- `netscript-cli` — inventory the live CLI/scaffold/plugin command surfaces and use canonical command/gate names.
- `netscript-deno-toolchain` — inspect public APIs with `deno doc` and use repo dependency/publish wrappers instead of ad-hoc registry checks.
- `jsr-audit` — apply the publishability rubric to every planned public `packages/**` or `plugins/**` surface before slicing.
- `codex-wsl-remote` — preserve attached-thread identity, explicit-refspec push safety, and native-WSL execution.
- `rtk` — compress exploratory read-heavy Git/search output; never use it as durable gate evidence.

Read every selected skill completely before acting. Also read `AGENTS.md`,
`.llm/harness/workflow/activation.md`, `run-loop.md`, `lane-policy.md`,
`gates/plan-gate.md`, `evaluator/plan-protocol.md`, the archetype decision tree,
`ARCHETYPE-4-dsl-builder.md`, `SCOPE-docs.md`, the gate matrix, relevant architecture doctrine,
`rfcs/README.md`, live issue #1502 with comments, and the current RFCs that its issue names or that
govern compatible contribution contracts—at minimum RFC 0001, RFC 0003, and RFC 0005. Inspect live
package surfaces with `deno doc` before broad source reads.

## Deliverable and boundary

Deliver an RFC document in the repository house shape for one typed plugin CLI command contribution
and generation seam. The RFC must explicitly decide descriptors/routers/help/completion/errors;
discovery and async bootstrap; isolation, collisions, deterministic ordering, and plugin-absent UX;
generator/scaffolder contribution without host-internal exposure; transactional output,
preview/no-write, doctor integration, capability checks; manifest/pointer ownership; compatibility
with accepted frontend, SDK, runtime, and DevTools RFCs; and migration/supersession of deploy-specific
proposals #904–#908.

The RFC must propose a later implementation epic with PR-sized children and a duplicate-file audit,
but this leaf must not implement the CLI seam, mutate package/plugin source, file duplicate issues,
or alter milestone scope. It must not touch #1348 or the central release-0.0.7 cluster state. It must
not merge, publish, flip the PR ready, or run local publication.

Approved contract: archetype 4 (public DSL/builder) plus docs overlay. Inspection surfaces are
`packages/cli/`, `packages/plugin/`, `rfcs/`, `rfcs/0003-command-composition-kit.md`, and
`rfcs/0005-devtools-contribution.md`. Treat package paths as research inputs, not an authorization to
edit framework code. Any necessary file-boundary change is drift: stop, record it, and ask the topic
orchestrator.

## Mandatory phase sequence

1. Reconcile live `origin/main`, issue #1502, its comments, and existing PRs. Record any drift from
   this baseline before continuing. Do not reset or delete anything.
2. Create the leaf run directory `.llm/runs/docs-rfc-plugin-cli-contribution--1502/` with
   `supervisor.md`, `research.md`, `plan.md`, `worklog.md` (including `## Design`),
   `context-pack.md`, `drift.md`, `plan-eval.md` placeholder, `evaluate.md` placeholder, and
   `receipts/`. Record model/session/worktree/branch/base and requested/observed route.
3. Research first. Inventory the live CLI/plugin seams and every existing consumer proposal named by
   #1502. Cite exact files/symbols and use `deno doc` for public surfaces. Search for prior RFC or
   issue proposals so the later epic proposal does not duplicate them. Apply the JSR audit rubric
   to every planned publishable public surface and name slow-type/export/asset risks.
4. Write a locked plan and Design checkpoint. Enumerate reviewable commit slices, proving gates,
   risks, open-decision sweep, deferred implementation, contributor path, and exact proposed RFC
   path after checking the live RFC index. The plan must include the approved gate contract:
   structured check/test evidence, publish dry-run and architecture checks where the proposed
   surface makes them applicable, docs source-format and accuracy checks, and no global expensive
   gate. `quality:gate` runs only if the actual diff touches `packages/**` or `plugins/**` (which is
   out of scope); do not claim it for a docs-only diff.
5. Commit only the bootstrap/research/plan/design slice, including updated run artifacts. Push by
   explicit refspec: `git push origin HEAD:refs/heads/docs/rfc-plugin-cli-contribution`.
6. In the same turn, open a DRAFT PR directly against `main` using the NetScript PR body shape. It
   must carry `Closes #1502`, milestone `0.0.7`, exactly one lifecycle status, type/area/priority/RFC
   taxonomy, a checkable DoD, run-dir path, slices, honest validation, and a fenced
   `acceptance-evidence` mapping for all five issue boxes. Because the opening diff is docs/run
   artifacts only, apply `ci:skip-e2e` and `ci:skip-scaffold`. Do not manually link #1348 in the
   GitHub Development sidebar.
7. Move the draft PR to the PLAN-EVAL request state but do not evaluate your own plan. #1502 has a
   mandatory bounded PLAN-EVAL; `PLAN-EVAL: N/A` is forbidden. Stop before authoring the RFC and
   report exactly: PR number/URL, commit SHA, plan head, labels, run-dir state, remaining decisions,
   and the separate evaluator handoff needed. Do not dispatch a rival evaluator or start the RFC
   content slice in this turn.

## Evidence and safety

- Type-check/test/lint/format verdicts must come from the structured wrappers. Durable checks use
  `.llm/tools/gates/run-gate.ts` with JSON receipts under the leaf run directory when supported;
  preserve domain JSON child reports.
- Never delete or regenerate `deno.lock`, never use cache reload, and never fold unrelated changes
  into a commit.
- Do not run `scaffold.runtime`; it is not part of this RFC leaf and the release has one global
  expensive-gate slot.
- Commit in reviewable slices, update `worklog.md` and `context-pack.md` in every slice, and push +
  post the per-slice PR comment before moving on.
- The topic orchestrator performs Tier-A substantive review. A fresh opposite-family session must
  produce PLAN-EVAL before RFC authoring and IMPL-EVAL after the RFC/gates. You may not self-certify.

End this first turn only after the draft PR and plan-eval handoff exist, with a final line exactly
`BLOCKED: awaiting separate-session PLAN-EVAL`.
