# G13 BATCH-B2 docs audit — plugin family

**Verdict: FAIL**

- Audit lane: `docs_audit` — Codex · GPT-5.6 Sol · medium, opposite-family, single pass over the
  complete 13-README B2 changeset.
- Audited HEAD: `de81f471b0a2dd45802049b1ebb91b3bf9dcaf2e`.
- B2 commits: `6a3f802f`, `23f4ace7`, `90145cae`, `b01a87d2`, `de81f471`.
- Files: `plugins/{ai,auth,sagas,streams,triggers,workers}/README.md`, `packages/plugin/README.md`,
  and `packages/plugin-{ai,auth,sagas,streams,triggers,workers}-core/README.md`.
- Generator context: verified the PR #861 B2 evidence comment and the `## Batch B2` worklog section,
  then treated both as context only. Every result below comes from this audit session's execution.
- Consistency scope: all 20 relevant pages on the branch — B1's six, MCP, and B2's thirteen. The
  brief calls this set “nineteen,” but `6 + 1 + 13 = 20`; no page was omitted.

## Overall finding

The changeset has a consistent flagship shape, all 19 TypeScript fences check, every documented
public-surface entrypoint resolves through `deno doc`, all 62 links are live, the repaired Streams
link is genuinely live, and every mechanical gate passes. It nevertheless fails the executable
accuracy and cross-page consistency gates. The Streams quick example prints an output that is false
after the immediately preceding install, and all 13 library install fences use the same bare JSR
form that the adjacent prose and the already-audited B1/MCP pages correctly say cannot resolve on
the prerelease line.

## Blocking findings and fix list

### F1 — Streams post-install transcript reports the wrong discovered topic count

`plugins/streams/README.md:76-89` says to install the stream plugin and then run `list-topics`, but
prints `0 stream topic(s) discovered` with an empty array. In one fresh merged-source scaffold, the
literal corrected install succeeded and created the default notifications stream. Running the
printed standalone command through the sanctioned beta.10 minimum-age equivalent then returned:

- `1 stream topic(s) discovered.`
- name/path `/v1/streams/notifications/events`;
- producer file `streams/notifications-stream.ts`.

Workers `list-jobs`, Sagas `inspect`, and Triggers `list` reproduced their printed zero/offline
outputs. The Streams mismatch is specific and deterministic, not a general CLI-environment issue.

**Fix:** replace the Streams transcript with the actual one-topic output after install, or change
the setup context so the command genuinely runs before any topic is scaffolded. Keep command and
observed output in the same workspace state.

### F2 — all 13 library install commands are bare and fail on the prerelease line

Every B2 Install section prints `deno add jsr:@netscript/<package>` without a version. The sentence
immediately below says bare `jsr:@netscript/*` specifiers do not resolve on the prerelease line, and
the six B1 pages plus MCP consistently print `@<version>`. A correct token scan found 13/34 bare
pinnable specifiers. Literal execution of `deno add jsr:@netscript/plugin-streams` in a new Deno
project exited 1: only prerelease versions are available, and Deno suggested beta.10 explicitly.

This is not repaired by `minimumDependencyAge: "0"`: minimum age permits a newly published version,
but cannot select a prerelease version from a versionless request. The sanctioned minimum-age
equivalent was used successfully for the already version-pinned standalone CLI examples.

**Fix:** change all 13 library install fences to `deno add jsr:@netscript/<package>@<version>`,
using the same prerelease explanation and convention as B1 and MCP. Re-run the versionless scan with
the version check applied to the package portion after `jsr:@netscript/` (the scope `@` is not a
version separator).

## Gate log

| Gate                            | Command(s)                                                                                                                                                                                                                      | Scope                                                                                              | Result          | Findings / observed                                                                                                                                                                                                                    | Proceeded                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Changeset re-baseline           | Raw `git status`; `git fetch origin main refs/heads/docs/815-package-readmes:refs/remotes/origin/docs/815-package-readmes`; `git rev-parse`; `git ls-remote`; `git log --reverse 6a3f802f^..de81f471`; `git diff --name-status` | Exact B2 commits, branch remote, files, and base context                                           | PASS            | Local and remote HEAD were `de81f471`; five stated commits touch the 13 READMEs plus the worklog                                                                                                                                       | Continued                              |
| Generator evidence verification | Read worklog `## Batch B2`; `gh pr view 861 --json comments`                                                                                                                                                                    | Claimed commands, link repair, fences, API, and mechanical results                                 | PASS as context | Evidence locations exist and contain the claimed table; no claim was accepted as a verdict                                                                                                                                             | Re-executed every gate below           |
| Plugin install commands         | Fresh scaffold via local public CLI; from its root run `plugin install stream --name streams`, `plugin install auth --name auth`, and `plugin install ai --name ai`                                                             | Three of six documented install kinds, including corrected `stream` form                           | PASS            | Stream: port 4437/2 files; auth: 8094/1; AI: 8095/7; each regenerated 12 Aspire helpers and exited 0                                                                                                                                   | Continued; exact audit scratch removed |
| Standalone plugin CLI examples  | From the same scaffold: `deno run -A --minimum-dependency-age=0 jsr:@netscript/plugin-{workers,sagas,triggers,streams}@0.0.1-beta.10/cli <verb>` for `list-jobs`, `inspect`, `list`, `list-topics`                              | All four printed standalone command families; sanctioned equivalent for the fresh-publish age wall | **FAIL**        | Workers, Sagas, and Triggers match; Streams returns one scaffolded notifications topic, not the printed zero                                                                                                                           | Flagged F1                             |
| TypeScript fences               | Extract each `ts`/`typescript` fence separately beside its package; `deno check --unstable-kv --config <package>/deno.json <temporary-fence.ts>`; remove each temporary file                                                    | Every TS fence in all 13 READMEs                                                                   | PASS            | 19/19 fences checked; 0 failures; no temporary files remained                                                                                                                                                                          | Continued                              |
| API / public-surface tables     | Parse each `## Public surface` table; resolve every backticked subpath through its package `deno.json`; `deno doc --json <entrypoint>`; compare named symbol claims; inspect CLI-command vocabularies for behavioral names      | All 13 tables, including combined multi-subpath rows                                               | PASS            | 94 rows, 99 entrypoint checks, 0 missing exports/doc failures; 67 explicit symbol claims checked. CLI behavioral names (`stats`, `subscribe`, `fire`, `events`, `run`, `executions`) exist in command definitions                      | Continued                              |
| AI route table                  | `deno doc --json packages/plugin-ai-core/mod.ts`; focused contract/source comparison                                                                                                                                            | `/v1/ai` route/method/IO table                                                                     | PASS            | Chat, models, tool invoke, embed, transcribe, and inherited describe routes match the contract vocabulary                                                                                                                              | Continued                              |
| README standard                 | `deno run --no-lock --allow-read .llm/tools/validation/check-readme-standard.ts <13 READMEs> --pretty`                                                                                                                          | B2 files only                                                                                      | PASS            | `13 README(s) conform`                                                                                                                                                                                                                 | Continued                              |
| Tagline cap                     | `deno run --no-lock --allow-read .llm/tools/validation/check-jsr-tagline-length.ts <13 READMEs> --pretty`                                                                                                                       | B2 taglines                                                                                        | PASS            | `checked=13 over=0`                                                                                                                                                                                                                    | Continued                              |
| Internal documentation links    | `deno task docs:links`                                                                                                                                                                                                          | Whole documentation tree                                                                           | PASS            | 98 docs; 0 broken links; 0 broken anchors; 0 orphans                                                                                                                                                                                   | Continued                              |
| External links and repaired 404 | Extract every unique Markdown HTTP(S) target; invoke `curl -L --silent --show-error --retry 2 --max-time 30` for each; separately curl old `/durable-streams/` and replacement `/capabilities/streams/`                         | Every link in all 13 READMEs plus explicit old/new comparison                                      | PASS            | 62/62 current links returned 2xx; replacement is 200; removed old URL is still 404                                                                                                                                                     | Continued                              |
| Site build                      | `(cd docs/site && deno task build)`                                                                                                                                                                                             | Full Lume site with B2 applied                                                                     | PASS            | Exit 0; 22 diagram assets verified; 531 files generated                                                                                                                                                                                | Continued                              |
| Mermaid syntax                  | Extract every Mermaid fence; `npx --yes @mermaid-js/mermaid-cli@10.9.1 -i - -o /tmp/<name>.svg`                                                                                                                                 | All B2 diagrams                                                                                    | PASS            | 11/11 parsed; AI core and Streams core intentionally use no diagram                                                                                                                                                                    | Continued                              |
| Internal wording                | Parse added lines from `git diff --unified=0 20758eb6..HEAD -- <13 READMEs>`; scan issue/run/harness/archetype/doctrine/tier/parity vocabulary                                                                                  | All 1,153 added lines                                                                              | PASS            | 0 internal-wording hits                                                                                                                                                                                                                | Continued                              |
| Versionless specifiers          | Extract every `jsr:@netscript/*` token; require an `@version` in the token suffix after `jsr:@netscript/`; literal bare `deno add jsr:@netscript/plugin-streams` in a new project                                               | All 34 JSR tokens and 13 install fences                                                            | **FAIL**        | 13 bare install commands; literal add exits 1 because only prerelease versions exist                                                                                                                                                   | Flagged F2                             |
| README formatting               | `deno fmt --check <13 READMEs>`                                                                                                                                                                                                 | B2 files only                                                                                      | PASS            | 13 files checked                                                                                                                                                                                                                       | Continued                              |
| Template / embedded drift       | `deno task check:publish-assets`; `deno task check:assets-barrel`                                                                                                                                                               | Published README assets and generated registries/barrels                                           | PASS            | Both exit 0; no tracked drift                                                                                                                                                                                                          | Continued                              |
| Cross-page consistency          | Full read plus heading and command extraction across B1 six + MCP + B2 thirteen (20 pages); compare all plugin install and JSR add forms with `packages/cli/README.md`                                                          | Voice, section order, install forms, executable outputs, contradictions                            | **FAIL**        | Voice and broad flagship order are coherent; no stale `plugin add` forms remain; singular kinds + `--name` agree with CLI. B2's 13 bare adds contradict B1/MCP and its own prose; Streams transcript contradicts fresh installed state | Flagged F1/F2                          |

## Passing detail

- The three independently repeated plugin installs prove the corrected host form is
  `plugin install <singular-kind> --name <name>`; no B2 page retains `plugin add`.
- The AI install emitted the seven files listed in its README, including `ai/mcp/registry.ts`.
- The B2 pages share the established introduction → value/architecture → install → quick example →
  public surface → docs → compatibility → license voice and order. The two core utility/contract
  pages without Mermaid remain understandable without a process diagram.
- The API tables are broad but not phantom: even compact rows that group several subpaths were
  expanded and checked one entrypoint at a time.

## Stop-lines honored

- No merge was performed. CI green plus the required audit PASS remains the merge bar.
- No release cut, JSR publish, tag push, canary, or stable publish was performed.
- Milestone 13 was not closed.
- No sub-agent brief or self-dispatched evaluator was created.
- No #824 seed-board filing or ratification action was performed.

## Next

Resume the same B2 Fable generator session for F1–F2, rerun the literal Streams sequence in one
workspace state, pin all 13 library install commands, and return the complete 13-README changeset
for re-audit. The audit lane made no README edits.

---

# Second-pass audit — fix cycle 1

**Final verdict: PASS.**

- Audited fix commit: `35bd43d8a02e12ab35e3e393fd6e361dc47f4d31`.
- Targeted scope: re-execution of F1 and F2 plus the B2 mechanical gate set. The generator's PR
  comment and worklog fix-cycle section were verified, then treated as context only.
- F1 is closed: the Streams install and `list-topics` command were executed from the same fresh
  workspace root, and the README transcript matches the observed one-topic result.
- F2 is closed: all 19 requested branch READMEs contain zero bare pinnable JSR specifiers; Auth and
  Workers Core independently carry both the `@<version>` fence and prerelease pinning note.

## Gate log — second pass

| Gate                         | Command(s)                                                                                                                                                                                                                                      | Scope                                                      | Result | Findings / observed                                                                                                                                                                                                     | Proceeded                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Re-baseline                  | Raw `git status`; fetch branch and main; `git rev-parse`; `git ls-remote`; `git show --stat 35bd43d8`                                                                                                                                           | Fix commit, local/remote identity, touched files           | PASS   | Local HEAD and branch remote were `35bd43d8`; only the 13 B2 READMEs and worklog were changed by the fix                                                                                                                | Continued                            |
| F1 Streams sequence          | Fresh merged-source `init`; from the generated workspace root run local public CLI `plugin install stream --name streams`; then sanctioned `deno run -A --minimum-dependency-age=0 jsr:@netscript/plugin-streams@0.0.1-beta.10/cli list-topics` | Literal install-then-list state and printed transcript     | PASS   | Install: port 4437, 2 files, 12 Aspire helpers. List: one `/v1/streams/notifications/events` topic, producer `notifications-producer`, file `streams/notifications-stream.ts`, empty collections — all match the README | Removed the exact audit scratch tree |
| F2 versionless scan          | Extract every `jsr:@netscript/*` token and require an `@version` in the suffix after `jsr:@netscript/`                                                                                                                                          | B1 six plus B2 thirteen, exactly 19 READMEs                | PASS   | 48 tokens; 0 bare pinnable specifiers                                                                                                                                                                                   | Continued                            |
| Pinning-note spot checks     | Focused reads of `plugins/auth/README.md` and `packages/plugin-workers-core/README.md`                                                                                                                                                          | One deployable plugin and one core package outside Streams | PASS   | Both print `@<version>` and state that bare prerelease specifiers do not resolve                                                                                                                                        | Continued                            |
| README standard              | `deno run --no-lock --allow-read .llm/tools/validation/check-readme-standard.ts <13 B2 READMEs> --pretty`                                                                                                                                       | B2 files                                                   | PASS   | `13 README(s) conform`                                                                                                                                                                                                  | Continued                            |
| Tagline cap                  | `deno run --no-lock --allow-read .llm/tools/validation/check-jsr-tagline-length.ts <13 B2 READMEs> --pretty`                                                                                                                                    | B2 taglines                                                | PASS   | `checked=13 over=0`                                                                                                                                                                                                     | Continued                            |
| Internal documentation links | `deno task docs:links`                                                                                                                                                                                                                          | Whole documentation graph                                  | PASS   | 98 docs; 0 broken links; 0 broken anchors; 0 orphans                                                                                                                                                                    | Continued                            |
| External links               | Extract all unique Markdown HTTP(S) targets; curl each with redirects, retries, and 30-second timeout                                                                                                                                           | All 13 B2 READMEs                                          | PASS   | 62/62 returned HTTP 2xx                                                                                                                                                                                                 | Continued                            |
| Mermaid syntax               | Extract all Mermaid fences; parse with `@mermaid-js/mermaid-cli@10.9.1`                                                                                                                                                                         | All B2 diagrams                                            | PASS   | 11/11 parsed                                                                                                                                                                                                            | Continued                            |
| Internal wording             | Scan added lines from `39425d71..35bd43d8` for issue/run/harness/archetype/doctrine/tier/process vocabulary                                                                                                                                     | All 43 fix-added lines                                     | PASS   | 0 hits                                                                                                                                                                                                                  | Continued                            |
| README formatting            | `deno fmt --check <13 B2 READMEs>`                                                                                                                                                                                                              | B2 files                                                   | PASS   | 13 files checked                                                                                                                                                                                                        | Continued                            |
| Site build                   | `(cd docs/site && deno task build)`                                                                                                                                                                                                             | Full Lume site                                             | PASS   | Exit 0; 22 diagram assets verified; 531 files generated                                                                                                                                                                 | Continued                            |
| Template / embedded drift    | `deno task check:publish-assets`; `deno task check:assets-barrel`                                                                                                                                                                               | Published README assets and generated registries/barrels   | PASS   | Both exit 0; no tracked drift                                                                                                                                                                                           | Final PASS                           |

## Stop-lines honored — second pass

- No merge was performed.
- No release cut, JSR publish, tag push, canary, or stable publish was performed.
- Milestone 13 was not closed.
- No sub-agent brief or self-dispatched evaluator was created.
- No #824 seed-board filing or ratification action was performed.

The B2 fix cycle closes F1 and F2. The audit lane changed no README.
