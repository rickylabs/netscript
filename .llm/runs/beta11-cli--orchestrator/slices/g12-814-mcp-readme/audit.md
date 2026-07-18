# G12 documentation changeset audit

## Verdict

**FAIL** — opposite-family single-pass audit of the entire changeset (`a7141e25` + `2d03d3d7`) on
`docs/814-mcp-readme`.

- Auditor: docs_audit lane, Codex · GPT-5.6 Sol · medium.
- Audit unit: the whole four-file changeset, never a per-file or per-generator review.
- Effort: `medium`; the changeset is not large enough to trigger the route's declared
  `large_changeset` → `high` escalation.
- Shipped truth surface: `@netscript/mcp@0.0.1-beta.10`, `@netscript/cli@0.0.1-beta.10`, tag
  `v0.0.1-beta.10`, and live JSON-RPC `tools/list` / `tools/call`. Registry runs used the sanctioned
  temporary `deno run -A --minimum-dependency-age 0` equivalent where Deno's 24-hour dependency-age
  policy would otherwise hide the just-published version.
- Claimed generator evidence: not available. The named directory existed but
  `.llm/runs/beta11-cli--orchestrator/slices/g12-814-mcp-readme/worklog.md` did not; the slice
  directory was empty when this audit began.

## Findings

### F1 — blocking: printed install/API-inspection commands do not work on the prerelease line

`packages/mcp/README.md:76` prints `deno add jsr:@netscript/mcp`, while lines 85–86 correctly say
that bare NetScript JSR specifiers do not resolve on the prerelease line. In a new temporary
project, the printed command exited 1 with `has only pre-release versions available`. The same
problem exists in the advertised API-inspection command at `packages/mcp/README.md:163` and
`docs/site/reference/mcp/index.md:10`: with dependency age disabled, bare
`deno doc jsr:@netscript/mcp` exited 1 for the `*` constraint, while the beta.10-pinned command
exited 0.

Fix: make every runnable install/import/inspection specifier resolvable on the current release
train. Use the release-specifier convention on rendered site examples and a pinned/current-release
form (or explicit setup placeholder that is substituted before execution) in the package README;
then regenerate `packages/mcp/src/publish-assets.generated.ts`.

### F2 — blocking: unreachable-telemetry behavior is generalized incorrectly

`packages/mcp/README.md:128-129` says “the same tools” return a structured `warn`/`fail` result when
the app is down. `docs/site/capabilities/agent-tooling.md:108-110` broadens that to “Telemetry tools
... return a structured `warn`/`fail` result.” Live beta.10 calls against `http://127.0.0.1:9`
disproved this:

- `get_app_status` returned `status: "warn"` with zero counts;
- `list_runs` returned the ordinary success shape `{count: 0, runs: []}` with no status;
- `get_recent_errors` returned the ordinary success shape `{count: 0, groups: []}`;
- `analyze_service_performance` returned a zero-valued ordinary aggregate;
- `get_run` returned the structured `run_not_found` tool error.

Fix: scope the `warn` example specifically to `get_app_status` (and the telemetry doctor family),
then describe the other tools' actual empty-success / not-found behavior without promising a status
field their published schemas do not contain.

### F3 — blocking: the README overstates command-policy safety and misstates the success result

`packages/mcp/README.md:32-34` says destructive verbs are never reachable. The shipped source allows
the entire `contract` prefix; therefore `contract remove` matches `allow_contract`. A live
`execute_command` call for `contract remove --help` passed policy and started a child process,
whereas `db reset --help` was denied as `deny_db_reset`. The docs-site policy list at
`docs/site/reference/mcp/index.md:104-107` accurately reports prefix rules, so the broad README
claim contradicts the detailed page.

Separately, `packages/mcp/README.md:147` says an allowed `execute_command` result contains a “Policy
decision”. Live `tools/list` and the same call show only `exitCode`, `durationMs`, `outputTail`,
`truncated`, and `timedOut`; rule/status information is present on denial, not on a successful
result.

Fix: describe the exact denied prefixes instead of saying destructive commands categorically cannot
run, and describe the success result using its five published fields. If the intended product
contract really excludes destructive contract operations or returns an allow decision, that is a
source change outside this docs-only changeset.

### F4 — blocking: “full contracts” is a false-completeness claim

`packages/mcp/README.md:149-150` promises “Full input/output contracts for every tool” on the MCP
reference and its Docs link labels that page as “all 13 tool contracts.” The new table at
`docs/site/reference/mcp/index.md:50-71` is a useful top-level field inventory, but it omits types,
enum values, numeric bounds, array maxima, nested object/item schemas, and required-vs-optional
output fields present in live `tools/list`. For example, it does not tell readers that
`search_docs.limit` is an integer from 1 to 20, that `execute_command.args` has at most 32 strings,
or that `get_run` requires only `id` and `summary` on output.

Fix: either expand the page to reproduce the complete live schemas or change every “full/all
contracts” label to “top-level input/result field overview” and point readers to live `tools/list`
or JSR API documentation for the complete Standard Schema contracts.

### F5 — blocking: “each doctor check has a suggested fix” is false

`docs/site/capabilities/agent-tooling.md:102-104` says each doctor check carries a suggested fix.
The published `DoctorCheck` contract defines `fix?: string`, documented as an action for a warning
or failure, and the live doctor result omitted `fix` from passing checks such as `deno_workspace`
and `docs_root`.

Fix: say that every check has a status and warnings/failures may include a suggested fix.

### F6 — blocking: strict version-lock wording conflicts with the live protocol identity

`packages/mcp/README.md:37-38` says the CLI, skills, and MCP server ship “at one version.” The CLI
and package specifiers were beta.10, and `MCP_PACKAGE_VERSION` was beta.10, but the live beta.10
server's `initialize` response advertised `serverInfo.version: "0.0.1-beta.9"`; the shipped beta.10
source hard-codes that value.

Fix: remove or qualify the strict version-identity claim in docs unless the source version string is
fixed and independently released. The audit cannot treat a beta.9 protocol identity as evidence that
all three surfaces report beta.10.

### P1 — process: claimed worklog evidence is absent

The brief pointed to `.llm/runs/beta11-cli--orchestrator/slices/g12-814-mcp-readme/worklog.md`, but
the slice directory contained no files. This did not substitute for any accuracy gate—the auditor
ran all gates—but the supervisor/generator must restore the per-slice evidence trail before claiming
the slice artifact set is complete.

## Gate log

| Gate                                            | Command(s)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Scope                                                                                                                                                       | Result | Findings                                                                                                                                                                                                                                                                              | Proceeded                                                                          |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `deno task docs:links`                          | `deno task docs:links`; `deno task --cwd docs/site check:links`; `deno task --cwd docs/site check:caveats`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Whole docs tree and built site; both changed site pages and all cross-references                                                                            | PASS   | Root checker: 98 docs, 0 broken links, 0 broken anchors, 0 orphans. Built-site checker: 24,879 links across 174 pages, all resolved. Caveat checker: 27 markers across 22 pages, all resolved.                                                                                        | Continued.                                                                         |
| Site build (Lume) clean                         | `deno task --cwd docs/site build`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Full Lume site with both changed site pages                                                                                                                 | PASS   | Lume generated 528 files and emitted `/capabilities/agent-tooling/` and `/reference/mcp/`; exit 0. The standard “docs/site config is not a workspace member” warning was non-fatal and not introduced by this changeset.                                                              | Continued.                                                                         |
| Internal-wording grep                           | `git diff --unified=0 56cf84b5..HEAD -- packages/mcp/README.md docs/site/capabilities/agent-tooling.md docs/site/reference/mcp/index.md \| sed -n 's/^+//p' \| rg -n -i '(#[0-9]+\|beta11\|beta-11\|G12\|Fable\|Opus\|Codex\|OpenHands\|harness\|worklog\|phase[- ]?gate\|plan-eval\|impl-eval\|generator session\|audit lane\|docs_audit\|docs_polish\|architecture doctrine\|archetype\|commit slice\|milestone 13\|seed run)'`                                                                                                                                                                                                                                                                          | Added public-doc lines only                                                                                                                                 | PASS   | No issue/PR numbers, run ids, lane/model names, harness vocabulary, doctrine vocabulary, or internal process terms found.                                                                                                                                                             | Continued.                                                                         |
| Versionless-specifier scan                      | Manual changed-page/public-command scan with `rg -n 'jsr:@netscript/' ...`; clean temporary project `deno add jsr:@netscript/mcp`; clean min-age-0 config `deno doc --no-lock jsr:@netscript/mcp`; `deno doc --no-lock --filter DEFAULT_TRUNCATION_POLICY jsr:@netscript/mcp@0.0.1-beta.10`; `deno run --no-lock --allow-read .llm/tools/validation/check-netscript-jsr-specifiers.ts --pretty`                                                                                                                                                                                                                                                                                                            | Every NetScript JSR specifier in the changed public README/site page plus the emitted-source guard                                                          | FAIL   | F1. Bare `deno add` and bare `deno doc` both exit 1 on a prerelease-only package; pinned `deno doc` exits 0. The emitted-source guard passes because it intentionally masks embedded documentation, so it is not a public-doc versionless gate.                                       | Flagged for resumed generator; no docs edited.                                     |
| Command/API accuracy sampling                   | `deno run -A --minimum-dependency-age 0 jsr:@netscript/cli@0.0.1-beta.10 agent mcp --help`; same for `agent init --help`, `plugin doctor --help`, and command families `db`, `generate`, `contract`, `service list`, `plugin`, `ui:add`, `ui:init`, `ui:list`, `ui:update`; live stdio `initialize`, `tools/list`, and `tools/call`; `deno doc --filter ... https://jsr.io/@netscript/mcp/0.0.1-beta.10/{mod.ts,cli.ts}`; `git show v0.0.1-beta.10:packages/mcp/src/domain/command-policy.ts`; matching truncation, executor, runner, CLI composition, and endpoint source reads; `deno test --allow-all packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts`; targeted MCP truncation/command/docs tests | Every documented command family; all 13 tool contracts; flags; docs corpus; doctor; endpoint failure; truncation; command allow/deny; published entrypoints | FAIL   | Tool names, required inputs, top-level result fields, three MCP flags, docs-root behavior, truncation constants, output-tail size, and explicit policy lists matched. Blocking mismatches are F1–F6. Protocol smoke passed 1/1; targeted MCP tests passed 14/14.                      | Flagged for resumed generator; no docs edited.                                     |
| Template ↔ generated drift                      | `deno task check:assets-barrel`; `deno task check:publish-assets`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Repo generated assets and specifically `packages/mcp/src/publish-assets.generated.ts` ↔ `packages/mcp/README.md`                                            | PASS   | Both checks exited 0; embedded README is byte-for-byte regenerated from the source README.                                                                                                                                                                                            | Continued.                                                                         |
| Nav / front-matter wiring                       | `deno task docs:links`; `deno task --cwd docs/site build`; `rg -n -i 'mcp\|agent tooling' docs/site/_data.ts docs/site/_data docs/site/_includes`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Changed existing site pages, their front matter, build outputs, and discoverability                                                                         | PASS   | No page was newly added. Both existing pages have valid layout/title front matter, build successfully, are cross-linked from public docs, and the root checker reports 0 orphans.                                                                                                     | Continued.                                                                         |
| Prose-quality pass                              | Whole-set read of `git diff --unified=80 56cf84b5..HEAD`; numbered reads with `nl -ba`; execution of every displayed command; heading/callout/setup review                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | README plus both changed site pages as one reader journey                                                                                                   | FAIL   | F1 is a displayed command that cannot work; F3/F4/F5/F6 overstate policy, result, completeness, doctor, and version guarantees. Heading structure and general flow are otherwise sound.                                                                                               | Flagged for resumed generator; no prose polishing performed before accuracy fixes. |
| Cross-page contradiction check                  | `rg` searches for tool/result/policy/version/docs-root claims across `packages/mcp`, `packages/cli`, and `docs/site`; live `tools/list`/`tools/call`; shipped-source reads at `v0.0.1-beta.10`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Every changed claim against README, site, live protocol, and shipped source                                                                                 | FAIL   | F2: generalized telemetry status contradicts live schemas/results. F3: README safety/result wording contradicts detailed policy and result fields. F4: “full contracts” contradicts the reference table's actual summary depth. F6: beta.10 docs contradict beta.9 protocol identity. | Flagged for resumed generator; no docs edited.                                     |
| External-link curl (task-required supplemental) | `curl -L -sS -o /dev/null --connect-timeout 10 --max-time 30 -w '%{http_code}' <url>` for every unique added `http(s)` target                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 11 unique targets from added lines, including badges, GitHub workflow/LICENSE, JSR pages, docs-site pages, and the documented local default endpoint        | PASS   | All 10 external URLs returned HTTP 200. `http://localhost:18888` returned connection refused, expected because it is a documented local runtime endpoint and no app/dashboard was running.                                                                                            | Continued.                                                                         |
| README standard (task-required supplemental)    | `deno task docs:readme:check`; `deno run --no-lock --allow-read .llm/tools/validation/check-readme-standard.ts packages/mcp/README.md --pretty`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Whole repository for baseline drift, then changed MCP README                                                                                                | PASS   | Global task remains baseline-red at 35/36 unrelated READMEs; `packages/mcp/README.md` is the sole conformant README and passes all scoped structural checks. The changeset did not create the global failures.                                                                        | Recorded baseline drift; continued.                                                |
| JSR tagline (task-required supplemental)        | `deno task docs:tagline:check`; `deno run --no-lock --allow-read .llm/tools/validation/check-jsr-tagline-length.ts packages/mcp/README.md --pretty`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | All package/plugin taglines, then changed MCP README                                                                                                        | PASS   | 36 checked, 0 over the 250-byte cap; scoped MCP tagline passes.                                                                                                                                                                                                                       | Continued.                                                                         |

## Baseline drift and false-completeness checks

- Baseline was `56cf84b5` (`origin/main` at audit start); shipped behavior was independently tied to
  `v0.0.1-beta.10`, not inferred from post-release branch prose.
- The global README-standard command is already red outside this changeset (35 unrelated units). The
  changed MCP README passes the scoped gate, so that baseline debt is not charged to G12.
- The bare prerelease specifiers were present in the previous MCP README/reference page, but this
  changeset rewrites and republishes the README as a complete public introduction while retaining
  the broken commands. Whole-changeset false-completeness therefore requires fixing them; “it was
  already there” is not an accuracy waiver.
- F4 is the explicit false-completeness defect: a top-level field inventory is labeled as full
  input/output contracts.
- The generated embedded README is synchronized, so all README inaccuracies would also ship in the
  package's default one-document MCP docs corpus.

## Fix list for the resumed generator session

1. Fix all bare prerelease `deno add` / `deno doc` commands and regenerate publish assets.
2. Correct unreachable-telemetry troubleshooting per tool shape.
3. Replace the categorical destructive-command claim with the exact prefix policy; correct the
   successful `execute_command` result description.
4. Expand the per-tool schemas to genuinely be full contracts, or relabel them everywhere as a
   top-level field overview.
5. Make doctor `fix` wording conditional on warning/failure.
6. Remove/qualify strict version-identity wording unless a separately released source fix makes the
   live server identify as beta.10.
7. Restore the missing slice `worklog.md` evidence before claiming the harness artifact set
   complete.
8. Regenerate `packages/mcp/src/publish-assets.generated.ts`, rerun every failed gate, and return
   the entire changeset for a second single-pass audit. A second audit FAIL triggers supervisor
   escalation.

## Stop-lines observed

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) —
   owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.

No merge, release, publish, tag, milestone-close, seed-board filing, or documentation edit was
performed by this audit lane.
