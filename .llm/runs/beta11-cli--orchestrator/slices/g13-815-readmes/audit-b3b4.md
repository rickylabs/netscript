# G13 BATCH-B3B4 docs audit — data, state, and auth packages

**Verdict: FAIL**

- Audit lane: `docs_audit` — Codex · GPT-5.6 Sol · medium, opposite-family, single pass over the
  complete nine-README B3B4 changeset.
- Audited HEAD and branch remote: `bfc0bb13eb9f5ec10aab21e7c4f348818b29e5b0`.
- Baseline: `origin/main` at `a87570a6ca4ad49fae559c368fb7fa80f15b20a0`.
- Changeset commits: `4d4babe8`, `4f98aadf`, and evidence-only worklog commit `bfc0bb13`.
- Files:
  `packages/{database,kv,queue,cron,prisma-adapter-mysql,watchers,auth-better-auth,
  auth-kv-oauth,auth-workos}/README.md`.
- Generator context: the PR #861 B3B4 evidence comment and worklog `## Batch B3B4` section exist and
  contain the claimed evidence. They were treated only as context; every result below was
  independently executed in this audit session.

## Overall finding

The examples, fences, API tables, links, diagrams, WorkOS integration claim, reserved-provider
claims, and mechanical gates pass. Cross-page review nevertheless found one accuracy contradiction
within `packages/queue/README.md`: its tagline says PostgreSQL is auto-discovered even though the
same page and `detectProvider()` correctly restrict auto-discovery to RabbitMQ, Redis, then Deno KV.
Because this is a public capability claim in the changeset, the single-pass verdict is FAIL.

## Blocking finding and fix list

### B3B4-F1 — queue tagline falsely includes PostgreSQL in auto-discovery

`packages/queue/README.md:7-9` says the queue auto-discovers “a RabbitMQ, Redis, Deno KV, or
PostgreSQL backend from the Aspire environment.” The page's own Backend auto-discovery bullet and
quick-example comment list only RabbitMQ → Redis → Deno KV. Source agrees: `detectProvider()` in
`packages/queue/factory/create-queue.ts` tests RabbitMQ, then Redis, and otherwise returns Deno KV.
PostgreSQL exists as an explicitly selected `QueueProvider.Postgres` adapter, but is not detected.

**Fix:** remove PostgreSQL from the tagline's auto-discovered list, or rewrite the sentence to
distinguish the three auto-discovered providers from the explicitly selectable PostgreSQL adapter.
Keep the “one contract, four backends” claim: that claim is accurate.

## Gate log

| Gate                            | Command(s)                                                                                                                                                                                   | Scope                                                              | Result          | Findings / observed                                                                                                                                                                     | Proceeded                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Changeset re-baseline           | Raw `git status`; fetch main and `docs/815-package-readmes`; `git rev-parse`; `git ls-remote`; `git log`; `git diff --name-status`                                                           | Exact B3B4 commits, remote identity, baseline, and changed files   | PASS            | Worktree began clean; local and remote HEAD matched `bfc0bb13`; only the nine stated READMEs and worklog changed in the stated commits                                                  | Continued                                                               |
| Generator evidence verification | Read worklog `## Batch B3B4`; inspect PR #861 comments                                                                                                                                       | Claimed example, fence, source, link, and mechanical evidence      | PASS as context | Both evidence locations exist; no claimed result was accepted without re-execution                                                                                                      | Re-executed all gates below                                             |
| TypeScript fences               | Extract every `ts`/`typescript` fence beside its package; `deno check --unstable-kv --config <package>/deno.json <temporary-fence.ts>`; remove each temporary file                           | All nine READMEs                                                   | PASS            | 10/10 fences typechecked; 0 failures; no audit files remained                                                                                                                           | Continued                                                               |
| KV quick example                | README flow using `getKv({ provider: 'deno-kv' })`, an audit key, and a one-event watch termination; `deno eval --unstable-kv --config packages/kv/deno.json ...`                            | Set, get, watch, delete, and close without external infrastructure | PASS            | Printed `set ["audit","alice"] {"name":"Alice","role":"admin"}` and `Alice`; exit 0                                                                                                     | Continued; explicit provider and termination recorded                   |
| Cron quick example              | README flow with `createScheduler({ provider: 'memory' })`; `deno eval --config packages/cron/deno.json ...`                                                                                 | `runOnInit`, manual trigger, event-free deterministic shutdown     | PASS            | Printed `report generated` twice and `runs 2`; exit 0                                                                                                                                   | Continued; explicit memory provider recorded                            |
| Queue quick example             | README enqueue/listen flow with explicit Deno KV provider and `:memory:` path; `deno eval --unstable-kv --config packages/queue/deno.json ...`                                               | Real `createQueue` Deno KV adapter, one-shot handler, no broker    | PASS            | Printed `sent to user@example.com : Welcome to NetScript.`; exit 0                                                                                                                      | Continued; explicit Deno KV selection recorded                          |
| Watchers quick example          | README watcher flow in a fresh temporary directory; create `incoming/test.csv`; stop after first event; remove exact temporary directory                                                     | Native watch plus stability filter without external infrastructure | PASS            | Printed `create: /tmp/netscript-watch-audit-.../incoming/test.csv`; exit 0                                                                                                              | Continued; check interval shortened only to make the test deterministic |
| WorkOS wiring and fence         | Focused read of `plugins/auth/services/src/backend-registry.ts`; compare `WorkosSessionClient`; TypeScript-fence check above                                                                 | Auth plugin adaptation claim and corrected README example          | PASS            | Registry wraps `@workos-inc/node`'s sealed session through `createWorkosCookieSession` and passes the structural `userManagement.loadSealedSession` port; corrected fence typechecks    | Continued                                                               |
| Reserved providers              | Read `packages/cron/mod.ts` and `packages/kv/application/shared.ts`; execute `createScheduler({provider:'node'})`, `createScheduler({provider:'temporal'})`, and `getKv({provider:'nitro'})` | Cron Node/Temporal and KV Nitro claims                             | PASS            | All three throw the documented not-implemented/reserved errors; Nitro is a valid reserved id, not a working adapter                                                                     | Continued                                                               |
| API / public-surface tables     | Resolve every `deno.json` export; `deno doc --json --unstable-kv <entrypoint>`; inspect root symbol listings against named table claims                                                      | Every public-surface table in all nine READMEs                     | PASS            | 43/43 exported entrypoints documented successfully; named functions, classes, contracts, helpers, errors, and types in all table rows are present                                       | Continued                                                               |
| README standard                 | `check-readme-standard.ts <9 READMEs> --pretty`                                                                                                                                              | B3B4 files                                                         | PASS            | `9 README(s) conform`                                                                                                                                                                   | Continued                                                               |
| Tagline cap                     | `check-jsr-tagline-length.ts <9 READMEs> --pretty`                                                                                                                                           | B3B4 taglines                                                      | PASS            | `checked=9 over=0`                                                                                                                                                                      | Continued                                                               |
| Internal documentation links    | `deno task docs:links`                                                                                                                                                                       | Whole documentation graph                                          | PASS            | 98 docs; 0 broken links; 0 broken anchors; 0 orphans                                                                                                                                    | Continued                                                               |
| External links                  | Extract unique Markdown HTTP(S) targets; `curl -L --fail --silent --show-error` each                                                                                                         | Every actual link in all nine READMEs                              | PASS            | 53/53 returned HTTP 200 after redirects. The example-only `https://app.example.com/auth/callback` is code data, not a Markdown link                                                     | Continued                                                               |
| Mermaid syntax                  | Extract every Mermaid fence; parse with `@mermaid-js/mermaid-cli@11.16.0`                                                                                                                    | KV, queue, watchers, and auth-kv-oauth diagrams                    | PASS            | 4/4 diagrams parsed                                                                                                                                                                     | Continued                                                               |
| README formatting               | `deno fmt --check <9 READMEs>`                                                                                                                                                               | B3B4 files                                                         | PASS            | 9 files checked                                                                                                                                                                         | Continued                                                               |
| Internal wording                | Scan B3B4 added lines for issue/PR/run/harness/generator/worklog/gate/baseline vocabulary                                                                                                    | Nine changed READMEs                                               | PASS            | 0 semantic internal-process hits                                                                                                                                                        | Continued                                                               |
| Versioned JSR specifiers        | Parse JSR tokens and require a version suffix after the package name                                                                                                                         | Full 28-page branch set: B1 six + B2 thirteen + B3B4 nine          | PASS            | 28 files; 0 bare pinnable `jsr:@netscript/*` specifiers                                                                                                                                 | Continued                                                               |
| Site build                      | `(cd docs/site && deno task build)`                                                                                                                                                          | Full documentation site                                            | PASS            | Exit 0; 22 diagram assets verified; 531 files generated                                                                                                                                 | Continued                                                               |
| Template / embedded drift       | `deno task check:publish-assets`; `deno task check:assets-barrel`; raw status/diff                                                                                                           | Published README assets and generated registries/barrels           | PASS            | Both exit 0; no tracked drift; worktree clean before audit artifact creation                                                                                                            | Continued                                                               |
| Cross-README consistency        | Full 28-page heading, install-form, provider-claim, command-form, voice, and contradiction review; focused queue source comparison                                                           | B1 six + B2 thirteen + B3B4 nine                                   | **FAIL**        | Standard voice/order and pinned installs are consistent; plugin install forms still agree with CLI. Queue's PostgreSQL auto-discovery tagline contradicts its own later text and source | Flagged B3B4-F1                                                         |

## Passing detail

- The WorkOS example correctly documents a structural port rather than pretending the raw SDK is
  assignable to `WorkosBackendOptions.workos`.
- Cron's `node` and `temporal` values and KV's `nitro` value are accurately described as reserved or
  not implemented; they fail explicitly rather than silently falling back.
- All four infrastructure-free flows executed against branch source. Provider pins and one-shot
  termination were the only sanctioned audit substitutions, and are recorded above.
- No baseline drift or false completeness was found beyond B3B4-F1: the complete nine-file changeset
  and all 28 branch pages were included.

## Stop-lines honored

- No merge was performed.
- No release cut, JSR publish, tag push, canary, or stable publish was performed.
- Milestone 13 was not closed.
- No sub-agent brief or self-dispatched evaluator was created.
- No #824 seed-board filing or ratification action was performed.

The audit lane changed no README. Return B3B4-F1 to the generator/supervisor, then re-audit the
complete nine-README changeset or perform the explicitly requested targeted fix verification.
