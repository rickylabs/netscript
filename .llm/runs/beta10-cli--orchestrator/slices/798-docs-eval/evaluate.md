# IMPL-EVAL — PR #798 beta.10 docs-site refresh

- Evaluator: Codex · OpenAI · GPT-5.6 Sol · xhigh (`review_claude`), separate
  opposite-family session from the Claude documentation workflow.
- Subject: `/home/codex/repos/b10-docs`, branch `docs/beta10-site-refresh`, head
  `093878e84cad4c908e145c4eb17338c8bf6fea29`, base
  `origin/feat/beta10-integration` at `d962502fa2b780727e171c34db046c64ff5ce41d`.
- Scope: issue #796 and the 16-file docs-only diff from
  `git diff origin/feat/beta10-integration...HEAD`.
- Scope overlay: docs. Package/plugin archetype gates: N/A (no source changes).
- Date: 2026-07-17.

## Verdict

**FAIL_FIX**

The issue and docs-only plan remain valid, and the link, internal-wording, and
source-scope gates pass. The implementation is not merge-ready: it omits the
beta.10 `agent init` / `agent mcp` / MCP-tool / installed-skill surface, the new
"exhaustive" command page is missing top-level coverage, the changed plugin
guide names an unsupported `--no-register` flag, and one changed line contains
a bare pinnable `jsr:@netscript/*` specifier. The command-verification evidence
also used or claimed the wrong in-tree composition: four sampled public verbs
exist on the shipped `netscript` tree but are unknown to `netscript-dev`.

These are focused documentation and verification fixes. They do not require an
architecture rescope or debt entry.

## Gate summary

| Probe | Result | Evidence |
| --- | --- | --- |
| 15-command fidelity | **FAIL** | Mandated `netscript-dev` help accepted 11/15; four public plugin verbs were unknown there. The shipped `netscript` binary accepted all 15. One changed tutorial flag, `--no-register`, is absent from both public help and source. |
| Top-level completeness | **FAIL** | Current public help includes `init`, but `commands.md` has no `init` section/entry. The final beta.10 union also includes `agent`, which the PR omits. |
| Agent surface | **FAIL** | Subject HEAD has no agent feature tree; `origin/main` does. The docs contain no `netscript agent` command documentation and retain no-server wording. |
| Three tutorial rewrites | **FAIL** | `contract add` and `contract add-route` preserve the removed manual behavior; plugin registration is default-on, but the documented `--no-register` escape is not a real option. |
| `deno task docs:links` | **PASS** | 96 docs; 0 broken links, 0 broken anchors, 0 orphans. |
| Internal wording in added lines | **PASS** | 0 hits for `#\d+`, `eis-chat`, or harness/evaluator/orchestrator vocabulary. |
| Pinnable NetScript JSR specifiers in added lines | **FAIL** | 1 bare hit: `docs/site/how-to/build-a-durable-chat.md:107`. |
| Source scope | **PASS** | No `packages/` or `plugins/` path in the diff. |
| Subject integrity | **PASS** | Final raw `git status --short` was empty; evaluation made no subject-worktree changes. |

## Numbered findings

1. **Blocking — issue #796's beta.10 agentic-combo documentation is absent, and
   the subject was frozen against a baseline that does not contain the shipped
   agent feature (`FAIL_FIX`).** The issue explicitly requires `netscript agent
   mcp`, `netscript agent init`, the MCP tool surface, and the public skills.
   Neither `docs/site/reference/cli/commands.md` nor any other changed page
   contains `netscript agent`. `docs/site/ai/mcp.md:17-21` instead retains the
   claim that NetScript does not host an MCP server. The newly added
   `reference/ai/skills.md` accurately documents the separate
   `@netscript/ai/skills` loader API (confirmed with `deno doc
   packages/ai/src/skills/mod.ts`), but it does not document the three public
   skills installed by the CLI: `netscript`, `netscript-build`, and
   `netscript-operate`.

   The baseline error is reproducible: `git cat-file -e
   HEAD:packages/cli/src/public/features/agent/agent-group.ts` exits 128, while
   the same path at `origin/main` exists; agentic-combo commit `10162bfd` is not
   an ancestor of HEAD. At `origin/main`, `agent-group.ts` mounts `mcp` and
   `init`; `mcp` accepts `--endpoint`, `--project-root`, and `--docs-root`; and
   `init` accepts `--host claude|vscode|all`. `init-agent.ts` writes `.mcp.json`
   and/or `.vscode/mcp.json`, installs the embedded skill bundle, updates the
   marked AGENTS section, and emits the exact versioned CLI specifier through
   `netscriptJsrSpecifier("cli")`; its tests assert
   `jsr:@netscript/cli@${NETSCRIPT_RELEASE_VERSION}`. Rebuild the docs against
   the actual beta.10 release union (or first reconcile the integration base),
   document those behaviors and the MCP tools/skills, and distinguish the
   `@netscript/ai/mcp` client library from the `netscript agent mcp` stdio
   server.

2. **Blocking — the new command reference is not complete even for the command
   tree present in the subject (`FAIL_FIX`).** Public `netscript --help` lists
   `config`, `deploy`, `init`, `contract`, `db`, `generate`, `marketplace`,
   `plugin`, `service`, and five `ui:*` commands. `commands.md` has headings for
   all except `init`; it only links to the older curated page, despite claiming
   to be the complete verb-and-flag surface and despite the explicit evaluator
   rule that every top-level group appear in `commands.md`. In addition,
   sampled nested help exposed omitted flags, for example `service ref add`
   accepts `--project-root <path>` while the supposedly exhaustive row does not
   list it. Once the release union is used, `agent` is a second missing
   top-level group. Derive the page from the final public command tree and make
   its completeness claim true, rather than relying on prose links to a curated
   page for unlisted groups/options.

3. **Blocking — the changed plugin tutorial invents `--no-register`
   (`FAIL_FIX`).** `docs/site/how-to/author-a-plugin.md:258-267` says
   `netscript plugin new <name>` registers its connector unless the user passes
   `--no-register`. Public `netscript plugin new --help` exposes
   `--project-root`, `--feature`, `--force`, and `--register`; there is no
   `--no-register`. The implementation in
   `new-plugin-command.ts` likewise declares only `.option("--register", ...,
   { default: true })`, and repository search finds no `--no-register` parser or
   test. An isolated Cliffy parse using that exact option declaration rejected
   `--no-register` as unknown. Default registration is real, so the manual-to-CLI rewrite is sound in
   its normal path, but the documented opt-out is not. Remove the nonexistent
   flag claim or land and validate a real negative option under separately
   authorized source scope.

4. **Blocking — the changed-line pinnable-specifier gate is red
   (`FAIL_FIX`).** The independent added-line scan found one bare NetScript JSR
   specifier at `docs/site/how-to/build-a-durable-chat.md:107`:
   `deno add jsr:@netscript/ai`. This line was re-added while replacing a
   hard-coded version elsewhere in the same callout, so it is in the PR's
   changed surface. Use the site's release-derived pin, for example
   `jsr:@netscript/ai{{ releaseSpecifier }}`, then rerun the changed-line gate.

5. **Blocking gate-evidence mismatch — the requested in-tree validator and the
   shipped public command tree are not the same composition.** The 15
   independently selected examples were: `plugin scaffold`, `plugin update`,
   `plugin enable`, `plugin disable`, `service set`, `service remove`, `service
   ref add`, `contract add`, `contract inspect`, `contract version add`, `db
   add`, `db resolve`, `db validate`, `deploy azure-app-service plan`, and
   `plugin new`. With the evaluator-mandated
   `packages/cli/bin/netscript-dev.ts`, 11 returned help successfully, but
   `plugin scaffold`, `plugin enable`, `plugin disable`, and `plugin new`
   returned exit 2 as unknown commands. Running the same 15 against the in-tree
   shipped entrypoint `packages/cli/bin/netscript.ts` returned exit 0 for every
   case and the documented usage shapes matched. Therefore those four verbs are
   not documentation hallucinations, but the PR's claim that its examples were
   verified against the stated in-tree maintainer binary is not trustworthy.
   Reconcile the verification surface (or explicitly use and record the public
   entrypoint that the page documents) and rerun the full command extraction;
   do not treat a mixed public/maintainer tree as exhaustive evidence.

6. **PASS with the exception in finding 3 — the three manual-to-CLI behavior
   probes otherwise preserve semantics.** `contract add cart` calls the shared
   contract scaffolder and regenerates the v1 aggregate, replacing the removed
   manual file-plus-`mod.ts` wiring. `contract add-route` validates and appends
   a route to `CartContractV1`, detects the seeded `baseContract` builder, and
   therefore replaces the removed hand-authored procedure entries. The plugin
   flows register by default: `plugin new` calls
   `ensureNetScriptConfigPlugin`, and `plugin install --local-path` is described
   and implemented as install-plus-registration. Only the nonexistent opt-out
   flag makes that rewritten guide fail.

7. **PASS — the remaining requested docs gates and scope guard are clean.** The
   evaluator reran `deno task docs:links`: 96 docs, 0 broken links, 0 broken
   anchors, 0 orphans. The added-line internal-wording scan returned 0 hits.
   `git diff ... -- packages plugins` returned no paths. A final raw
   `git status --short` was empty, and HEAD remained `093878e8`.

8. **Process note (non-blocking).** The supervisor brief contains `use harness`
   and the required `## SKILL` section; the launch record shows requested and
   observed `review_claude` identity matched Sol xhigh. This orchestrator slice
   has no dedicated `plan-eval.md`; the approved docs scope is carried by issue
   #796, the brief, and the outer worklog. This is recorded for protocol
   visibility and is not the basis of `FAIL_FIX`.

## Evidence commands and sources

- GitHub API via `resolveGithubToken()` for issue #796, PR #798, its commit
  list, and comments; token source only was logged, never the token.
- `git diff origin/feat/beta10-integration...HEAD` and raw git identity/status
  checks.
- `deno run -A packages/cli/bin/netscript-dev.ts <sample> --help` for the 15
  requested adversarial samples.
- `deno run -A packages/cli/bin/netscript.ts <sample> --help` for the same 15
  samples to distinguish real public verbs from maintainer-tree omissions.
- Public top-level `--help`, `plugin --help`, and focused nested help.
- `git show origin/main:packages/cli/src/public/features/agent/...` plus the
  embedded skill bundle and exact-specifier tests.
- `deno doc packages/ai/src/skills/mod.ts` and focused source reads for the
  skills, contract, plugin-new, and plugin-install implementations.
- Isolated Cliffy option-parser probe for `.option("--register", ..., {
  default: true })` plus `--no-register` → unknown option.
- `rtk proxy deno task docs:links`.
- Independent added-line scans for internal wording and NetScript JSR pins.
- Final raw `git status --short` → clean.

## Cycle 2

### Verdict

**FAIL_FIX**

The reconciled release-union base removes cycle 1's baseline precondition, and commit `bcfe26bc`
resolves the phantom flag, bare-specifier, public-entrypoint, MCP/client distinction, command-group,
and most command-reference defects. The cycle still cannot pass because the page that claims to be
the exhaustive public verb-and-flag reference omits one verified public flag, and its new agent-init
summary overstates what the VS Code-only host path installs.

### Findings

1. **Blocking — cycle 1 finding 2 is not fully resolved (`FAIL_FIX`).**
   `docs/site/reference/cli/commands.md:151` documents
   `netscript service ref remove <caller> <callee>` without options. Fresh execution of the shipped
   public entrypoint,
   `deno run -A packages/cli/bin/netscript.ts service ref remove --help`, exits 0 and prints
   `--project-root <path>`. This is the symmetric flag already added to the preceding `ref add` row,
   and its omission contradicts the page's explicit “every command group, subcommand, and flag”
   claim. Add the flag to the `ref remove` row and recheck the complete public command tree.

2. **Blocking — the new agent summaries are inaccurate for a VS Code-only host (`FAIL_FIX`).**
   `docs/site/reference/cli/commands.md:57` says `agent init` installs MCP, all three skills, and the
   marked `AGENTS.md` section for detected agent hosts; `docs/site/reference/ai/skills.md:26-27`
   similarly says the command writes the three skills into the detected host. The shipped behavior
   is host-specific: `init-agent.ts:43-67` writes the skills and `AGENTS.md` only inside the Claude
   branch, while `init-agent.ts:69-76` writes only `.vscode/mcp.json` for VS Code. The already-linked
   Agent tooling page states this distinction correctly. Make these two summaries equally explicit
   so `--host vscode` is not documented as installing files it does not write.

3. **Resolved — cycle 1 finding 1's baseline and missing-surface defects.** The subject is now based
   on reconciled `origin/feat/beta10-integration` at `9d537e4d`; the merge commit is an ancestor of
   HEAD `bcfe26bc`, and the branch contains the shipped agent implementation plus the 13-tool MCP
   reference and Agent tooling capability page. The updated AI/MCP page correctly distinguishes the
   `@netscript/ai/mcp` client library from the `netscript agent mcp` stdio server and cross-links the
   server/tool references. The skills page names the embedded `netscript`, `netscript-build`, and
   `netscript-operate` bundle. An isolated `agent init --host all` run wrote both host configs, the
   three Claude skill directories, and `AGENTS.md`; both configs used the exact versioned
   `jsr:@netscript/cli@0.0.1-beta.9` specifier. The host-specific wording defect is finding 2 above.

4. **Resolved — the remaining cycle 1 command and tutorial defects.** Public top-level help exposes
   `agent`, `config`, `deploy`, `init`, `contract`, `db`, `generate`, `marketplace`, `plugin`,
   `service`, and the five `ui:*` commands; all appear in `commands.md`. The new `init` and `agent`
   sections match focused public help. `--no-register` is gone; public `plugin new --help` confirms
   `--register` defaults to true. The durable-chat addition now uses
   `jsr:@netscript/ai{{ releaseSpecifier }}`. The reference also explicitly identifies the public
   `packages/cli/bin/netscript.ts` composition, resolving cycle 1 finding 5's dev/public evidence
   mismatch.

5. **PASS — fresh command fidelity sample.** Seventeen independently rerun public-entrypoint probes
   all exited 0: top-level help; `init`; `agent`; `agent init`; `agent mcp`; `config inspect`;
   `marketplace publish`; `generate runtime-schemas`; `plugin scaffold`; `plugin auth provider set`;
   `service add`; `service ref add`; `service ref remove`; `contract inspect`; `db resolve`;
   `ui:list`; and `deploy azure-app-service plan`. Their documented verbs exist. The sample exposed
   the omitted `service ref remove --project-root` flag in finding 1.

6. **PASS — requested gates and scope guard.** `rtk proxy deno task docs:links` reports 96 docs,
   zero broken links, zero broken anchors, and zero orphans. Independent scans of all 629 added lines
   found zero issue-number/internal-workflow wording hits and zero bare pinnable
   `jsr:@netscript/*` specifiers. `git diff ... -- packages plugins` returns no paths. The subject
   worktree remains clean at `bcfe26bc` after evaluation.
