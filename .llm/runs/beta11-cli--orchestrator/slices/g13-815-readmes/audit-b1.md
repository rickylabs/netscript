# G13 BATCH-B1 docs audit — six flagship READMEs

**Verdict: FAIL**

- Audit lane: `docs_audit` — Codex · GPT-5.6 Sol · medium, opposite-family, single pass over the
  entire six-README changeset.
- Effort: `medium`, as assigned. The optional `large_changeset` → `high` escalation was not used.
- Branch / PR: `docs/815-package-readmes` / #861.
- Audited HEAD at start: `9be37a94fc28b9e56a95b5efd87e508dd26915bc`.
- Files: `packages/{fresh,fresh-ui,sdk,service,cli,aspire}/README.md`.
- Generator context: verified `.llm/runs/beta11-cli--orchestrator/slices/g13-815-readmes/worklog.md`
  exists, then treated it as context only. Every verdict below comes from commands rerun by this
  audit session.
- Exemplar: `packages/mcp/README.md` from `origin/docs/814-mcp-readme`.

## Overall finding

The local branch API tables are largely accurate, the pinned beta.10 install form is necessary, all
42 Markdown links are live, all five Mermaid blocks parse, and the mechanical README/tagline/docs
gates pass. The changeset nevertheless fails accuracy and merge-readiness because it was authored
from stale base `56cf84b5`, conflicts with current `origin/main`, drops newly landed public
surfaces, contains two non-running CLI commands, uses obsolete Aspire paths, makes false
cache-default and engine/mode claims, and leaves two checked-in README doctests red.

## Blocking findings and fix list

### F1 — baseline drift creates false completeness and merge conflicts

`git fetch origin main` advanced `origin/main` to `a87570a6`; `git merge-base HEAD origin/main`
returned `56cf84b5`. `git merge-tree --write-tree HEAD origin/main` exited 1 with content conflicts
in `packages/cli/README.md`, `packages/fresh/README.md`, and `packages/sdk/README.md`.

The current-main public export maps contain surfaces absent from the rewritten at-a-glance tables:

- `@netscript/fresh`: `./desktop`;
- `@netscript/fresh-ui`: `./desktop`;
- `@netscript/sdk`: `./auto-update` and `./desktop`;
- the CLI now has the native desktop package/release command family and current-main README
  material.

This is the changeset-scope failure mode the profile calls out: each table passes against the stale
branch tree, while the set is incomplete against the tree it must merge into.

**Fix:** resume the same Fable generator session, rebase/update onto current `origin/main`, preserve
the desktop/auto-update release union, and rework the affected introductions/features/examples/API
tables as one coherent six-page set. Do not resolve the conflicts by choosing the stale README side.

### F2 — two printed CLI quick-start commands do not run

After a real beta.10 scaffold, these exact commands from `packages/cli/README.md:62-63` failed:

- `netscript service add` → exit 246, `Missing required option: --name`;
- `netscript plugin install workers` → exit 246, `Missing required option: --name`.

The plugin kind is also documented by the live CLI/maintainer contract as singular `worker`, with
the conventional installed name supplied separately.

**Fix:** print executable commands, for example `netscript service add --name orders` and
`netscript plugin install worker --name workers` (plus any non-interactive flag actually required),
then execute the complete quick-start again.

### F3 — Aspire quick-example paths contradict the current scaffold

`packages/aspire/README.md:67,78` uses `dotnet/AppHost/appsettings.json` and `./dotnet/AppHost`.
Executing the literal parse call from the branch root failed with `NotFound`. A freshly generated
beta.10 workspace places `appsettings.json` at the workspace root and the TypeScript AppHost under
`aspire/`, matching `packages/cli/README.md:71` and contradicting the Aspire README.

**Fix:** use the current scaffold paths (or explicitly define the alternate layout as setup) and
rerun both examples from a fresh scaffold.

### F4 — Aspire cache defaults and External-mode matrix are false

`packages/aspire/README.md:95,98-102` says `any + External` is valid and that the scaffold default
is `Engine: 'Garnet', Mode: 'Auto'`.

Observed source/runtime evidence:

- an actual default beta.10 scaffold produced `Engine: "Redis", Mode: "Container"`;
- `buildCacheBlock('redis')` emits Redis/Container and `buildCacheBlock('garnet')` emits
  Garnet/Container (`generate-appsettings.ts:226-241`);
- the package schema default is Garnet/Container (`config.ts:485-490`), not Garnet/Auto;
- the validation matrix permits External for Redis and Garnet, but not DenoKv (`config.ts:623-626`).

**Fix:** distinguish schema defaults from CLI scaffold defaults, state the actual selected scaffold
default, and change `any + External` to the engine set the validation matrix accepts.

### F5 — checked-in README doctests are red

The targeted README/doctest run finished with 7 tests passing and 2 failing:

- `packages/service/tests/_fixtures/readme-examples_test.ts` requires a concrete `auth: { ... }`
  preset example, while the README only asserts in prose that the preset accepts auth;
- `packages/sdk/tests/readme-doctest_test.ts` requires at least one valid JSON fence, but the
  rewrite removed all JSON fences.

**Fix:** reconcile the READMEs with their checked-in executable contracts. If the SDK JSON
requirement is intentionally retired, that is test/source scope outside this README-only changeset
and must be handled explicitly rather than leaving CI red.

### F6 — CLI omits the relevant Mermaid architecture section

Five of six rewrites and the audited MCP exemplar contain a small architecture diagram. The CLI is
the most adapter/flow-heavy page in the batch, but it alone omits `## Architecture`, despite issue
#815 item 5 requiring a diagram for packages with moving parts.

**Fix:** add a compact command-router → ports/adapters → workspace/target diagram and verify it with
the pinned Mermaid parser.

## Exemplar-form deviation: issue #815 item 6

**Verdict: justified deviation; keep the version-pinned form for the prerelease line.**

Independent execution on Deno 2.9.3:

- `deno add jsr:@netscript/sdk` → exit 1: the package has only prerelease versions and Deno suggests
  an explicit beta.10 constraint;
- all six `deno add jsr:@netscript/<pkg>@0.0.1-beta.10` commands succeeded with the sanctioned
  scratch-config equivalent `"minimumDependencyAge": "0"`;
- `deno add --minimum-dependency-age=0 ...` itself is rejected by this Deno build, so the config
  form is the correct `deno add` equivalent;
- the global CLI install succeeded with `--minimum-dependency-age=0` and a temporary
  `DENO_INSTALL_ROOT`; `deno install` supports that flag but ignores a merely discovered scratch
  config for the installed command.

The six READMEs match the already-audited MCP exemplar by printing `@<version>` plus a one-line
prerelease note. Following issue item 6 literally would publish a command that fails today. The
issue/template should record the prerelease exception; this B1 changeset should not regress to the
unversioned form.

## Gate log

| Gate                                          | Command(s)                                                                                                                                                                                                                                                                                            | Scope                                                                                         | Result                                   | Findings / observed                                                                                                                                                         | Proceeded                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Changeset re-baseline                         | `git fetch origin main refs/heads/docs/814-mcp-readme:refs/remotes/origin/docs/814-mcp-readme`; `git merge-base HEAD origin/main`; `git merge-tree --write-tree HEAD origin/main`; export-map reads with `git show origin/main:packages/<pkg>/deno.json`                                              | Whole B1 set against live main and MCP exemplar                                               | **FAIL**                                 | Base `56cf84b5`; live main `a87570a6`; three README conflicts; four packages have omitted newly landed desktop/auto-update surfaces                                         | Flagged F1 for the same generator session; no README edits     |
| README standard                               | `deno run --no-lock --allow-read .llm/tools/validation/check-readme-standard.ts packages/fresh/README.md packages/fresh-ui/README.md packages/sdk/README.md packages/service/README.md packages/cli/README.md packages/aspire/README.md --pretty`                                                     | Six touched READMEs only                                                                      | PASS                                     | `6 README(s) conform`                                                                                                                                                       | Continued                                                      |
| Tagline cap                                   | `deno run --no-lock --allow-read .llm/tools/validation/check-jsr-tagline-length.ts <six READMEs> --pretty`                                                                                                                                                                                            | Six taglines                                                                                  | PASS                                     | `checked=6 over=0`                                                                                                                                                          | Continued                                                      |
| Internal documentation links                  | `deno task docs:links`                                                                                                                                                                                                                                                                                | Whole docs tree                                                                               | PASS                                     | 98 docs; 0 broken links; 0 broken anchors; 0 orphans                                                                                                                        | Continued                                                      |
| External links                                | Deno URL extractor over Markdown link targets, invoking `curl -L --silent --show-error --retry 2 --max-time 30 -o /dev/null -w '%{http_code}' <url>` for every unique target                                                                                                                          | Every Markdown link in all six READMEs                                                        | PASS                                     | 42/42 returned HTTP 200, including badges, GitHub, JSR, docs-site, MCP, and LICENSE targets                                                                                 | Continued                                                      |
| Site build (Lume)                             | `(cd docs/site && deno task build)`                                                                                                                                                                                                                                                                   | Full site with branch applied                                                                 | PASS                                     | Exit 0; diagram plugin verified 22 assets; 528 files generated                                                                                                              | Continued                                                      |
| Internal-wording grep                         | `git diff --unified=0 56cf84b5 HEAD -- <six READMEs>` parsed to added lines, then `/harness                                                                                                                                                                                                           | archetype                                                                                     | doctrine                                 | eis-chat                                                                                                                                                                    | VIF                                                            |
| Versionless-specifier scan                    | Extract `jsr:@netscript/<pkg>` tokens from all six READMEs and reject tokens without `@<version>`                                                                                                                                                                                                     | All install/doc specifiers                                                                    | PASS                                     | 0 bare pinnable specifiers                                                                                                                                                  | Approved the prerelease deviation; see dedicated verdict above |
| Install commands                              | Bare SDK add; six pinned beta.10 adds in a scratch config with `minimumDependencyAge: "0"`; CLI global install under temporary `DENO_INSTALL_ROOT` with `--minimum-dependency-age=0`                                                                                                                  | Every printed install family                                                                  | PASS with sanctioned min-age equivalents | Bare form fails exactly as claimed; six pinned adds pass; installed CLI reports beta.10                                                                                     | Continued                                                      |
| API-at-a-glance / subpath rows                | `deno doc --json <local entrypoint>` for 36 entrypoints; exact symbol membership checks for every named symbol in all six tables                                                                                                                                                                      | Every row and every explicitly named symbol against branch source                             | PASS locally; **FAIL after re-baseline** | 36/36 local entrypoints, 0 missing named symbols; live-main export union is absent from four rewritten tables                                                               | Flagged F1                                                     |
| CLI command-family sampling                   | `deno run -A --unstable-kv packages/cli/bin/netscript.ts <group> --help` for `init`, `contract`, `service`, `db`, `plugin`, all `ui:*`, `generate`, `config`, `agent`, `deploy`, `marketplace`; target help for Deno Deploy, Docker/Compose, Kubernetes, Azure variants, and Cloud Run; `deploy list` | Every family in the command map and deployment table                                          | PASS for family existence                | All sampled help/list commands exit 0; advertised target verb subsets match `deploy list`                                                                                   | Continued to exact examples                                    |
| Printed CLI examples                          | Temporary beta.10 global install; real `init`; real `db migrate`; exact `service add`; exact `plugin install workers`; exact `agent init`; exact `ui:add ai`; local-source dry run                                                                                                                    | Every CLI fenced command/example and high-value inline command                                | **FAIL**                                 | `init` created 183 files/44 dirs; dry run matched; db migrate passed; agent init and ui:add ai passed; service/plugin commands exit 246                                     | Flagged F2                                                     |
| TypeScript/TSX examples                       | Executed reviewed equivalents for Fresh manual binding, Fresh-UI helpers/components, SDK client + live service, service preset/builder auth, Aspire config/inspection; ran the Fresh Vite route-binding test; ran targeted README fixtures/doctests                                                   | Every code fence across the six READMEs                                                       | **FAIL**                                 | Core Fresh/Fresh-UI/SDK/service behavior passes; literal Aspire config path fails; checked-in suite has 2 failures                                                          | Flagged F3/F5                                                  |
| Mermaid syntax                                | Extract each `` ```mermaid `` block and pipe it to `npx --yes @mermaid-js/mermaid-cli@10.9.1 -i - -o /tmp/<pkg>.svg`                                                                                                                                                                                  | Five Mermaid blocks                                                                           | PASS                                     | 5/5 exit 0                                                                                                                                                                  | Continued; flagged missing CLI diagram separately              |
| Template ↔ generated drift                    | `deno task check:assets-barrel`                                                                                                                                                                                                                                                                       | CLI/service/fresh-ui generated asset barrels relevant to described registry/scaffold surfaces | PASS                                     | Generator ran; tracked generated files remained unchanged; exit 0                                                                                                           | Continued                                                      |
| Nav / front matter                            | File-scope inspection plus `docs:links` orphan result                                                                                                                                                                                                                                                 | README-only changeset; no new site page/front matter                                          | N/A / PASS                               | No page was added; site reports 0 orphans                                                                                                                                   | Continued                                                      |
| Prose / standard consistency                  | Full read of all six READMEs plus MCP exemplar; heading extraction with `rg '^## '`; feature-count and command-context inspection                                                                                                                                                                     | Voice, ordering, diagram applicability, setup context                                         | **FAIL**                                 | Voice and broad order are consistent; CLI alone omits the relevant architecture diagram; several failing commands/paths lack valid setup context                            | Flagged F2/F3/F6                                               |
| Cross-page contradiction / false completeness | Whole-set read against MCP exemplar, live main, manifests, actual scaffold output, CLI help, Aspire schema/generator                                                                                                                                                                                  | All six pages as a set                                                                        | **FAIL**                                 | Aspire `dotnet/AppHost` contradicts CLI TypeScript-AppHost scaffold; Aspire default/matrix claims contradict code/output; current-main desktop/auto-update union is omitted | Flagged F1/F3/F4                                               |
| README formatting                             | `deno fmt --check` per README                                                                                                                                                                                                                                                                         | Six files                                                                                     | PASS for five checked targets; CLI N/A   | Fresh, fresh-ui, sdk, service, aspire clean; CLI package config reports `No target files found`, so README-standard is the scoped verdict for that file                     | No mutation                                                    |

## Passing execution detail

- Fresh manual-route example returned page keys `page/default/handler/nav/route/hooks`; the route
  exposed `href`, `safeParseSearch`, and `Link`. The Vite test proving page-module route injection
  passed 1/1.
- Fresh UI helper flow round-tripped the toast and stripped the URL to `/dashboard/deployments`; the
  TSX component example checked and ran under the package's Preact config.
- SDK `defineServices` produced `clients`, `queries`, and `queryUtils`; a live nested v1/orders oRPC
  service returned `{ id: "ord_123", total: 42 }` through `clients.orders.get`.
- Both service runtime examples started on an ephemeral/listed port and stopped cleanly; `/health`
  reported `healthy` in the preset smoke.
- Aspire parsing works against the real package fixture and returned `Name: test-app`, 0 warnings;
  the defect is the README's literal current-scaffold path, not `parseAppSettings` itself.

## Stop-lines honored

- No merge was performed. CI green plus opposite-family audit PASS remains required.
- No release cut, JSR publish, tag push, canary, or stable publish was performed.
- Milestone 13 was not closed.
- No sub-agent brief was created.
- No #824 seed-board filing or ratification action was performed.

## Next

Resume the same Fable 5 generator session for F1–F6, preserve the current-main release union during
conflict resolution, run the now-red README doctests, and return the **entire six-README changeset**
for the next single-pass audit. The audit lane made no README edits.

---

# Second-pass audit — fix cycle 1

**Verdict: FAIL — second audit failure; escalate to the Fable supervisor.**

- Audit lane: `docs_audit` — Codex · GPT-5.6 Sol · medium, opposite-family, one pass over the
  complete six-README changeset.
- Audited HEAD: `0bc4645296e0b78dec2c5f5e39aabac4ea31da49`.
- Live base and merge base: `origin/main` at `a87570a6ca4ad49fae559c368fb7fa80f15b20a0`.
- PR remote: `refs/heads/docs/815-package-readmes` also resolved to `0bc46452` before execution.
- Files: `packages/{fresh,fresh-ui,sdk,service,cli,aspire}/README.md`.
- Generator worklog and PR fix table were verified, then treated as context only. All results below
  were independently executed on the merged tree.

## Second-pass overall finding

F2–F6 are functionally corrected: the formerly failing quick-start commands and Aspire examples run
on one fresh merged-source scaffold, both doctest suites pass, the four new desktop/auto-update
table rows match `deno doc`, and all mechanical gates are green. The changeset still fails the
explicit current-main union gate. The CLI rewrite retains a shortened desktop overview but drops
material operational and safety content that existed on `a87570a6`, contradicting both the required
union-resolution check and the generator's PR claim that **all** main-side desktop content was
folded in. This is the second FAIL cycle, so the audit stops and escalates rather than starting a
third fixer loop itself.

## Blocking finding and fix list

### B2-F1 — CLI conflict resolution is not a complete current-main desktop union

`git show a87570a6:packages/cli/README.md` compared with the merged `packages/cli/README.md:147-184`
shows that the command family and one package/release example were kept, but these main-side reader
contracts were removed:

- the concrete enabled desktop-app configuration (`Type`, `Enabled`, `Workdir`, and
  `PackageTaskName`);
- the `--all-targets` example, compression default/options, and external `zstd` prerequisite;
- explicit platform-signing guidance for Windows, macOS, Linux, and AppImage artifacts;
- release preparation permissions, bsdiff prerequisite, strict sequence/high-water ordering, and
  retry-with-a-higher-sequence failure behavior;
- the release URL pathname mapping, Windows manual-apply explanation, and SDK handling example;
- the deploy embedding permission table covering run/read/write/net/sys/env.

These are not redundant historical prose: they specify configuration needed to make the command
work, host/tool restrictions, private-state behavior, and signing/security boundaries. The shorter
replacement does not preserve them elsewhere in the six-page set. Fresh preserved its main-side
Desktop RPC composition, SDK preserved its Desktop RPC and auto-update examples, and Fresh UI adds
the previously undocumented desktop entrypoint; the union defect is confined to CLI but blocks the
whole changeset.

**Fix:** supervisor decides the rescope after this second failure. If another fix is authorized,
restore the omitted CLI desktop operational/safety contracts in the restructured voice (they need
not be verbatim), then rerun the whole-set audit. Do not merely change the PR fix-table wording: the
published page must retain the reader-relevant current-main content.

## Gate log — second pass

| Gate                                    | Command(s)                                                                                                                                                                                                                                                                          | Scope                                                                            | Result                                     | Findings / observed                                                                                                                                                                                                                                                                                                                   | Proceeded                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Changeset re-baseline                   | `git fetch origin main docs/815-package-readmes`; raw `git rev-parse`, `git ls-remote`, and `git merge-base HEAD origin/main`; `gh pr view 861 --json ...`                                                                                                                          | Whole B1 set, live base, remote head, generator fix table                        | PASS                                       | HEAD and remote are `0bc46452`; base and merge base are `a87570a6`; no stale-base gap remains                                                                                                                                                                                                                                         | Continued                                                                     |
| Previously failing CLI quick start      | Fresh temp scaffold via `deno run -A --unstable-kv packages/cli/bin/netscript.ts init my-app --path <tmp> --db postgres --service --yes --no-git`; from its root run the same entrypoint with `db migrate`, `service add --name orders`, and `plugin install worker --name workers` | Corrected quick-start sequence on one fresh merged-source scaffold               | PASS                                       | Init created 194 files/44 directories; migration exited 0; service `orders` generated on 3001; worker `workers` installed on 8091                                                                                                                                                                                                     | Stopped the audit-owned Postgres container and removed the exact scratch tree |
| Previously failing Aspire examples      | From that fresh scaffold, import merged-tree Aspire and execute `parseAppSettings('appsettings.json')` and `inspectAspire('./aspire')`                                                                                                                                              | Both literal corrected paths against generated layout                            | PASS                                       | Parsed `Name: "my-app"` with 0 warnings; inspection rendered `Aspire path inspection target`                                                                                                                                                                                                                                          | Continued                                                                     |
| Previously failing doctests             | `deno test -A --unstable-kv packages/sdk/tests/readme-doctest_test.ts packages/service/tests/_fixtures/readme-examples_test.ts`                                                                                                                                                     | Both checked-in README contract suites                                           | PASS                                       | 4 passed, 0 failed; TS fences and JSON fence contracts are restored                                                                                                                                                                                                                                                                   | Continued                                                                     |
| Desktop / auto-update API rows          | `deno doc packages/fresh/src/runtime/desktop/mod.ts`; `deno doc packages/fresh-ui/desktop.ts`; `deno doc packages/sdk/src/auto-update/mod.ts`; `deno doc packages/sdk/src/desktop/mod.ts`                                                                                           | Every new merged-tree table row and named symbol                                 | PASS                                       | Confirmed `bindDesktopRpcWindow`, `createDesktopChrome`, `startAutoUpdate`, `createReleaseClient`, `createDesktopServiceClient`, and `createDesktopRpcLink`                                                                                                                                                                           | Continued                                                                     |
| Desktop CLI surface                     | Local public CLI `deploy desktop --help`, `deploy desktop package --help`, `deploy desktop release prepare --help`, and `deploy desktop release serve --help`                                                                                                                       | New native desktop command family, verbs, and printed flags                      | PASS                                       | All four help commands exited 0; documented package/prepare/serve flags exist with matching required/default shapes                                                                                                                                                                                                                   | Continued                                                                     |
| Current-main union / false completeness | `git show a87570a6:packages/{fresh,fresh-ui,sdk,cli}/README.md`; compare desktop/auto-update sections and terms with merged files; full six-page read                                                                                                                               | Main-side desktop release union across the changed set                           | **FAIL**                                   | Fresh and SDK content survived and Fresh UI gained its table row, but CLI dropped the operational/safety contracts listed in B2-F1; generator's “all content” claim is false                                                                                                                                                          | Escalated after second audit FAIL; no README edits                            |
| Cache matrix and defaults               | `rg` and focused reads of `packages/aspire/config.ts:492-500,625-632` and `packages/cli/src/kernel/templates/aspire/generate-appsettings.ts:226-250`; inspect fresh scaffold `appsettings.json`                                                                                     | Corrected Aspire cache claims against merged source and generated output         | PASS for README claims; source drift noted | Schema defaults are Garnet/Container; validation modes are Redis C/E/A, Garnet C/X/E/A, DenoKv L/C/A; fresh default scaffold is Redis/Container. The CLI's separate `deno-kv` template still emits `External`, contradicting its validator; that pre-existing source inconsistency is not repeated as a supported mode by this README | Recorded for supervisor visibility; did not edit source or README             |
| README standard                         | `deno run --no-lock --allow-read .llm/tools/validation/check-readme-standard.ts <six READMEs> --pretty`                                                                                                                                                                             | Six READMEs only                                                                 | PASS                                       | `6 README(s) conform`                                                                                                                                                                                                                                                                                                                 | Continued                                                                     |
| Tagline cap                             | `deno run --no-lock --allow-read .llm/tools/validation/check-jsr-tagline-length.ts <six READMEs> --pretty`                                                                                                                                                                          | Six taglines                                                                     | PASS                                       | `checked=6 over=0`                                                                                                                                                                                                                                                                                                                    | Continued                                                                     |
| Internal documentation links            | `deno task docs:links`                                                                                                                                                                                                                                                              | Whole documentation tree                                                         | PASS                                       | 98 docs; 0 broken links; 0 broken anchors; 0 orphans                                                                                                                                                                                                                                                                                  | Continued                                                                     |
| External links                          | Extract every unique Markdown HTTP(S) target from all six files; invoke `curl -L --silent --show-error --retry 2 --max-time 30` for each                                                                                                                                            | Every current Markdown link target                                               | PASS                                       | 34/34 returned HTTP 2xx                                                                                                                                                                                                                                                                                                               | Continued                                                                     |
| Site build                              | `(cd docs/site && deno task build)`                                                                                                                                                                                                                                                 | Full Lume site                                                                   | PASS                                       | Exit 0; 22 diagram assets verified; 531 files generated                                                                                                                                                                                                                                                                               | Continued                                                                     |
| Internal wording                        | Parse added lines from `git diff --unified=0 a87570a6..HEAD -- <six READMEs>` and scan for issue/run/harness/archetype/doctrine/internal project terms                                                                                                                              | All 618 changed-added lines                                                      | PASS                                       | 0 hits                                                                                                                                                                                                                                                                                                                                | Continued                                                                     |
| Versionless specifiers                  | Extract every `jsr:@netscript/*` token from all six files and require a second `@` version component                                                                                                                                                                                | All 14 install/doc tokens                                                        | PASS                                       | 14 checked; 0 bare pinnable specifiers                                                                                                                                                                                                                                                                                                | Kept the first-pass justified prerelease deviation                            |
| Mermaid syntax                          | Extract all Mermaid fences; `npx --yes @mermaid-js/mermaid-cli@10.9.1 -i - -o /tmp/<name>.svg`                                                                                                                                                                                      | All six architecture diagrams                                                    | PASS                                       | 6/6 parsed, including the new CLI diagram                                                                                                                                                                                                                                                                                             | Continued                                                                     |
| Template ↔ generated drift              | `deno task check:assets-barrel`                                                                                                                                                                                                                                                     | Relevant CLI/service/Fresh UI generated barrels                                  | PASS                                       | Generator ran; tracked barrels remained unchanged                                                                                                                                                                                                                                                                                     | Continued                                                                     |
| Nav / front matter                      | README-only scope inspection plus `docs:links` orphan result                                                                                                                                                                                                                        | No new site page                                                                 | N/A / PASS                                 | No front matter/navigation obligation; 0 orphans                                                                                                                                                                                                                                                                                      | Continued                                                                     |
| Prose and cross-README consistency      | Full six-page read; `rg '^## '` on the six files and merged MCP exemplar; compare feature, setup, and safety claims across pages                                                                                                                                                    | Voice, section order, executable setup, MCP exemplar consistency, contradictions | **FAIL**                                   | Voice and standard order are coherent; F2–F6 contradictions are resolved; CLI's incomplete main union creates false completeness at set scope                                                                                                                                                                                         | Flagged B2-F1 and escalated                                                   |
| README formatting / diff hygiene        | `deno fmt --check <audit + six READMEs>`; `git diff --check a87570a6..HEAD -- <six READMEs>`                                                                                                                                                                                        | Audit artifact and six changed files                                             | PASS                                       | Formatting and whitespace checks clean                                                                                                                                                                                                                                                                                                | Continued                                                                     |

## Stop-lines honored — second pass

- No merge was performed; this audit is FAIL and cannot satisfy the merge bar.
- No release cut, JSR publish, tag push, canary, or stable publish was performed.
- Milestone 13 was not closed.
- No sub-agent brief or self-dispatched evaluator was created.
- No #824 seed-board filing or ratification action was performed.

The audit lane changed no README. Per the two-failure rule, this verdict is escalated to the Fable 5
supervisor rather than silently starting another fix cycle.

---

# Third-pass targeted supervisor-resolution check

**Final verdict: PASS.**

- Verified supervisor fix commit: `6b71983cf12c540f2fb7051e2eb24bcc6c1c6572`.
- Targeted scope: B2-F1 in `packages/cli/README.md` only, compared directly with
  `a87570a6:packages/cli/README.md`; no other accuracy gates were reopened.
- Content preservation: PASS. The restructured page now retains every B2-F1 reader contract: the
  enabled desktop-app config; `--all-targets`, compression, and `zstd` constraints; per-OS signing;
  prepare permissions, bsdiff, strict sequence/high-water ordering and retry semantics; release URL
  mapping; Windows manual apply with SDK example; and the six-row deploy permission table under
  `### Deploy permissions`.

## Gate log — third pass

| Gate                             | Command(s)                                                                                                                                                           | Scope                                            | Result | Findings / observed                                                                                                      | Proceeded                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| B2-F1 current-main content union | `git diff --unified=3 4c434168..6b71983c -- packages/cli/README.md`; `git show a87570a6:packages/cli/README.md`; side-by-side focused reads of both desktop sections | Every bullet in second-pass B2-F1                | PASS   | All seven requested operational/safety content groups are preserved in the restructured voice; no B2-F1 omission remains | Closed the escalated finding; no README edit by audit lane |
| README standard                  | `deno run --no-lock --allow-read .llm/tools/validation/check-readme-standard.ts packages/cli/README.md --pretty`                                                     | CLI README only                                  | PASS   | `1 README(s) conform`                                                                                                    | Continued                                                  |
| Tagline cap                      | `deno run --no-lock --allow-read .llm/tools/validation/check-jsr-tagline-length.ts packages/cli/README.md --pretty`                                                  | CLI tagline only                                 | PASS   | `checked=1 over=0`                                                                                                       | Continued                                                  |
| Internal documentation links     | `deno task docs:links`                                                                                                                                               | Whole link graph required by the mechanical gate | PASS   | 98 docs; 0 broken links; 0 broken anchors; 0 orphans                                                                     | Final PASS                                                 |

## Stop-lines honored — third pass

- No merge was performed.
- No release cut, JSR publish, tag push, canary, or stable publish was performed.
- Milestone 13 was not closed.
- No sub-agent brief or self-dispatched evaluator was created.
- No #824 seed-board filing or ratification action was performed.

The targeted supervisor resolution closes B2-F1. The audit lane changed no README.
