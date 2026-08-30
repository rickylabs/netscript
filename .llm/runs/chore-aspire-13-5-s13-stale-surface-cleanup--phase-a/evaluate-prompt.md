use harness

## SKILL

Read these files completely before evaluating:

- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/netscript-doctrine/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.agents/skills/netscript-cli/SKILL.md`
- `.agents/skills/aspire/SKILL.md`
- `.llm/harness/evaluator/protocol.md`
- `.llm/harness/evaluator/verdict-definitions.md`
- `.llm/harness/templates/evaluate.md`
- `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`

You are the independent IMPL-EVAL evaluator: a fresh native Claude Fable 5 medium session,
opposite-family to the Codex implementation session. Do not inherit its verdict and do not
self-certify.

## Target

- Slice S13, issue #1724, epic #1712, draft PR #1779.
- Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s13`.
- Branch: `chore/aspire-13-5-s13-stale-surface-cleanup`.
- Base: S10' commit `a46ea16d`.
- This is IMPL-EVAL cycle 2 after cycle 1 returned `FAIL_FIX`. Evaluate product/tooling changes
  exactly in `a46ea16d..fc0a0c8ccc02ed8f741931de3455e7778df8697d`, with focused re-evaluation of
  `e3ffb5ddcbaa717b9db22c2ca29573626a20de69..fc0a0c8ccc02ed8f741931de3455e7778df8697d`.
- The worktree has untracked exact-head receipt artifacts. Treat them as evidence, not product
  changes. You may write exactly one file:
  `.llm/runs/chore-aspire-13-5-s13-stale-surface-cleanup--phase-a/evaluate.md`.
  Do not edit any other file, commit, push, comment on GitHub, mark ready, merge, or relabel.

Read the branch run artifacts completely: `plan.md`, `research.md`, `context-pack.md`, `drift.md`,
`worklog.md`, `supervisor.md`, and receipts under
`.llm/runs/chore-aspire-13-5-s13-stale-surface-cleanup--phase-a/`.

The supervisor directory is strictly read-only:
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/`.
Read its `sub-issues/13-stale-surface-cleanup.md` fully, plus `plan.md` decisions D-13/D-16/D-17,
`drift.md` decisions D-30/D-39/D-45/D-54/D-55/D-60, `aspire-surface-manifest.tsv`,
`tools/aspire-surface-manifest.ts`, `stale-surface-inventory.md`, and
`slices/s{5,6,8,9,10}/handoff-phase-a.md`. The supervisor `slices/s13/impl-eval-brief.md` is useful
context, but its stale placeholders, separate-worktree path, external write target, and instruction
to post a PR comment are superseded by this prompt.

## Ratified contract

D-17 is explicit option -> `NETSCRIPT_TELEMETRY_ENDPOINT` -> `ASPIRE_DASHBOARD_PORT` -> new
`aspire_ps` step -> `DEFAULT_TELEMETRY_ENDPOINT`. `aspire_ps` reads a running AppHost's
`dashboardUrl` from `aspire ps --format Json`; the existing generated `.netscript/aspire-cli.ts`
logic must be extracted into a shared injectable runtime-edge helper. Preserve `source` for every
step. Domain code performs no IO. The compatibility default is `http://localhost:18888`, but
generated code must contain no bare `18888`; telemetry templates render env -> running AppHost ->
`dashboard unavailable — run aspire ps` semantics.

## Independent verification

1. Read the existing cycle-1 `evaluate.md` first, then inspect the remediation commit and exact-head
   receipts. Independently decide whether F-1 is fixed and F-2/F-3/F-4 are fixed or validly
   dispositioned. Inspect the full diff and commits. Confirm RED-first tests and commit-by-slice evidence match the
   locked design; PLAN-EVAL is N/A only because the epic exhausted two plan-eval cycles and the
   coordinator ratified D-1 through D-17 before dispatch.
2. Verify resolver precedence and every `source`, S2-shaped and empty-`[]` fixtures, injected port,
   and infrastructure-only process IO. Verify the MCP README precedence line and public exports.
3. Verify the telemetry route, Windows env adapters, consumer CI ordering, AppHost wording,
   `SCAFFOLD_COMMUNITY_TOOLKIT` removal, and ownership `MCP_COMMAND = aspire agent mcp` behavior.
4. Verify regenerated carriers and manifest freshness. Run only static/read-only commands needed to
   challenge the receipts. Scratch files may be created only below `.llm/tmp/` and must be removed.
5. Verify parity phases 1 and 2, phase 1 default, phase-2 report behavior, fixed 13.5.3 compat rule,
   archival/git-ignored exclusions, lockfile skip, stale/unmatched manifest checks, and tests.
   Confirm `.github/workflows/ci.yml` is not flipped. The flip is intentionally deferred unless S1
   #1727, S9 #1759, and S11 #1771 are all on main; current evidence says S1 is absent. List every
   remaining non-archival phase-2 owner group and confirm none is S13-owned.
6. Verify required static/doctrine evidence: MCP and touched CLI/validation checks, lint, fmt,
   tests; `quality:scan`; `arch:check`; assets/publish freshness; Claude sync check; emitted samples;
   targeted doc lint. A report-mode parity receipt may be process-PASS while its child report is
   intentionally `ok:false`; do not misstate this as phase-2 enforcement green.
7. Inspect for forbidden scope and technique: no docs/site prose, skill behavior prose, version
   pins, archival-row edits, resource emission, runtime/E2E, new `any`, unsafe casts, lint ignores,
   or IO outside the runtime edge. Existing unrelated doctrine warnings and the pre-existing MCP
   root doc-lint `SchemaViewName` defect are not S13 failures unless this diff deepens them.
8. PR hygiene may be checked read-only if available. Report deficiencies in `evaluate.md`; do not
   fix them.

No AppHost start, no containers, no `e2e:cli`. Do not run `aspire start`. If checking the host,
only `/home/agent/.local/bin/mise exec -- aspire ps --format Json --nologo --non-interactive` is
allowed, and it must remain `[]`; `docker ps -a` must remain empty.

## Output

Write the complete `.llm/harness/templates/evaluate.md` structure to the allowed local
`evaluate.md`, replacing the cycle-1 verdict with a complete cycle-2 evaluation and declaring exact
evaluated head `fc0a0c8ccc02ed8f741931de3455e7778df8697d` and evaluator
identity `native Claude / Fable 5 / medium`. Verdict must be exactly one of `PASS`, `FAIL_FIX`,
`FAIL_RESCOPE`, or `FAIL_DEBT`, following `verdict-definitions.md`. `PASS` means Phase A is complete;
S13 has no Phase B. Explicitly state whether the parity flip was applied or deferred. Leave no
other filesystem changes when finished.
