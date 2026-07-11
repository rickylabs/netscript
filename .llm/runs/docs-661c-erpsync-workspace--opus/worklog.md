# docs-661c — ERP-SYNC + WORKSPACE quality pass (Opus 4.8)

Issue #661 rollout. Worktree `/home/codex/repos/ns-b8-661c`, branch
`docs/661-erpsync-workspace-quality`, base `955b4abf`. Audit source:
`.llm/runs/docs-audit-662--sonnet/report.md`. Exemplar (read-only):
`ns-b8-661s/docs/site/tutorials/workspace/05-route-authz.md`.

Scope owned: erp-sync series + workspace series **minus** `workspace/05-route-authz.md` (rebuilt in
another worktree — untouched here). Edits are surgical showcase/differentiator framing; most chapters
were already at or above the MedusaJS bar per the matrix, so no code:prose rebalance was needed and
strong chapters (esp. erp-sync/03) were left structurally alone.

## Preflight
- `git rev-parse HEAD` = `955b4abf639522c7da50bd15d20c6e999acb808f` ✓
- `erp-sync/01-scaffold.md` exists ✓
- branch = `docs/661-erpsync-workspace-quality` ✓

## Changes (before → after: framing only; no code blocks touched)

### Proposal #17 — index ledes name the differentiator + one "what this replaces" contrast

**`tutorials/erp-sync/index.md`** — added one lede paragraph after the "off the request path" sentence.
- Before: lede narrated the SAP→Dynamics migration story; differentiator ("durable background
  processing") appeared only mid-body, no competitor-contrast.
- After: names the differentiator explicitly ("durable background processing you did not hand-roll" —
  file-watch/job/queue/cron as first-class primitives in one orchestrated runtime) + contrast sentence
  ("in place of the pile of cron entries, ad-hoc `nohup` workers, and bespoke glue scripts … that
  silently drop a file or a row when a process dies mid-run").

**`tutorials/workspace/index.md`** — added one lede paragraph after the "production burns" sentence.
- Before: lede framed the who/where/which-routes stakes; the "pluggable auth, not a rewrite" idea lived
  only in the "What you will build" section, no contrast in the lede.
- After: names the differentiator ("the identity layer is NetScript's to ship, not yours to rebuild" —
  pluggable backend + normalized session + typed `.withAuthn()`/`.withAuthz()` seam) + contrast ("in
  place of the bespoke sign-in flow and hand-rolled route middleware most stacks reimplement … once per
  app").

### Proposal #18 — deploy chapters surface the one-command scaffold-to-Aspire story explicitly

**`tutorials/erp-sync/05-deploy.md`** — added one lede paragraph after "throwaway infrastructure."
- Before: "one command, one observable stack" stated, but the scaffold→graph provenance (you wrote none
  of the wiring) was only implicit in Step 1.
- After: explicit scaffold-to-Aspire arc — `netscript init` scaffolded the AppHost, each plugin
  contributed its own API + processor, one `aspire start` boots the lot; "empty folder to a live,
  correctly-wired, observable stack with no hand-written orchestration config in between."

**`tutorials/workspace/06-deploy.md`** — added one lede paragraph after "not a production deployer."
- Before: same understatement — one-command reach present, provenance implicit.
- After: names the one-command reach as the differentiator and that none of it was hand-written
  (`netscript init` generated the AppHost; `auth` then `workers` each contributed service + processor;
  one `aspire start` with cross-references injected).

### Matrix #3 — `workspace/03-workspace-data.md` typed-data-layer differentiator strengthened

**`tutorials/workspace/03-workspace-data.md`** — added one lede paragraph after the "blast radius"
sentence. Structure/steps/code untouched.
- Before: lede justified isolation on ops grounds (independent lifecycle, blast radius) but did not name
  the NetScript differentiator; the showcase ("typed client per datasource, multi-db-aware toolchain")
  was left to emerge from the steps.
- After: names the **typed data layer** — one `netscript db add` scaffolds + joins the Aspire graph +
  (after one migrate/generate loop) yields a fully typed Prisma client scoped to *that* datasource with
  its own migration history; "isolation is real at the type level, not just the connection string"; the
  `db` toolchain is multi-database-aware (`--db` on every command).

### Medusa-bar rebalance (Proposal #4 of brief)
No standalone rebalance performed. Per the audit matrix, in-scope chapters are "good" on code:prose;
the only non-good cells in scope are showcase-thin (indexes, deploy chapters, ws/03), which the above
edits address directly. erp-sync/03 left structurally untouched as instructed.

## Validation
- Grep gate (`eis-chat|eischat|VIF|CSB|PR #|pull/[0-9]|dogfood|issues/[0-9]`) on all 5 touched files:
  **0 hits** (exit 1).
- `deno task verify` from `docs/site`: site built (512 files); **23450 internal links across 169 pages —
  all resolve**; **27 caveat markers across 22 pages — all resolve**. Green.
- No APIs invented: every symbol named (`netscript init`, `netscript db add`, `--db`, `.withAuthn()`/
  `.withAuthz()`, `aspire start`) already appears in the edited chapters' existing bodies.

## Constraints honored
- Did NOT touch `workspace/05-route-authz.md`.
- Did NOT open/push a PR. Local commit only.
- All file ops used absolute worktree paths.
