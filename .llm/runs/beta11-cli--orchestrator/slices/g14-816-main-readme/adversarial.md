# Lane 5 adversarial audit — G14 main README

**Target:** `README.md` at `2414293ebfb1` on `docs/816-main-readme`\
**Run:** `beta11-cli--orchestrator`, slice `g14-816-main-readme`\
**Overall verdict: FAIL**

The README is not merge-ready. A clean-machine quickstart did not complete within the advertised
five minutes, and several commands and shipped-capability claims do not match the published
`0.0.1-beta.10` surfaces.

## Findings

### BLOCKER — The Native desktop section presents unreleased work as shipped beta.10

The README tells beta.10 users to run `netscript deploy desktop package`, describes an Ed25519
release server and automatic-update SDK seam, and maps `@netscript/sdk` to that seam. None of those
surfaces ships in the pinned beta.10 line:

- `netscript deploy desktop --help` exited 2 with `Unknown command "desktop"`.
- `netscript deploy list --json` returned ten targets and no `desktop` target.
- `deno doc --filter startAutoUpdate jsr:@netscript/sdk@0.0.1-beta.10/auto-update` failed because
  beta.10 has no `./auto-update` export.
- The beta.10 SDK documentation exposes `defineServices`, but not the claimed update seam.

This is a shipped-truth failure, not merely a stale example: the README pins beta.10, then describes
branch-only capability without marking it planned or unreleased.

### MAJOR — The clean quickstart did not finish and exceeded the advertised five minutes

The complete printed sequence was run in a new temp directory with a cold `DENO_DIR` and a fresh
scaffold. No minimum-dependency-age override was needed.

- Exact global install: exit 0, 2 s.
- `netscript init my-app --db postgres --service --yes`: exit 0, 15 s.
- `aspire restore`: exit 0, 6 s.
- `aspire start`: exit 0, 12 s.
- `netscript db init --name init`: remained blocked beyond five minutes and was interrupted only
  after the advertised limit had failed.

Aspire reported the Postgres resource as `Running` but `Unhealthy`; the init resource remained
`Waiting` on it. The health exception was `NpgsqlException: Exception while reading from stream`
with a read timeout, while the Postgres container log said it was ready. Consequently the printed
sequence never reached `db generate`, `db seed`, or the payoff `curl` inside five minutes.

For isolation, `db generate` (21 s) and `db seed` (11 s) succeeded after the blocked command was
stopped. The payoff curl failed while the AppHost was no longer running; after an additional
unprinted `aspire start`, `/health` returned healthy JSON. Recovery demonstrates the generated app
can work, but does not make the README's continuous clean sequence or timing claim true.

### MAJOR — `netscript plugin install <kind>` is not a runnable command

Using `worker` as the documented placeholder value, `netscript plugin install worker` exited 246
with `Missing required option: --name`. The README says this command scaffolds a whole plugin but
omits a required flag.

### MAJOR — The advertised canonical deploy lifecycle includes a nonexistent verb

The deploy table promises `plan`, `emit`, `up`, and `down` as the canonical lifecycle. Published
beta.10 help for Kubernetes offers `plan`, `up`, and `down`, but no `emit`; executing
`netscript deploy kubernetes emit` exited 2 with `Unknown command "emit"`.

### MAJOR — The prerequisite accepts Deno versions the README later rejects

The quickstart says users need “Deno 2.x”, while the status section says “Deno 2.9+ everywhere.” A
clean machine on Deno 2.0–2.8 satisfies the stated prerequisite but not the later support floor. The
prerequisite must state the actual minimum.

### MAJOR — The published package count is false and the “Full package map” is incomplete

The README says the workspace ships “30 packages and 6 first-party plugins, published to JSR,” but
the map contains 35 rows: 29 packages plus 6 plugins. Independent checks found 30 package
directories and 6 plugin directories, while `https://jsr.io/@netscript/bench` returned HTTP 404. The
unpublished bench package is absent from the map, so either the publication claim and “Full” heading
need qualification or the count must describe only the published surface.

### MINOR — `init --dry-run` does not preview every file

In an empty temp directory, exact `netscript init my-app --dry-run` exited 0 after interactive
prompts and correctly wrote no files. Its output was only `Would create 148 files, 25 directories`;
it did not list or preview every file as claimed.

## PASS notes

- The exact beta.10 install succeeded from a cold cache in 2 seconds without the sanctioned
  `--minimum-dependency-age=0` fallback. `netscript --version` reported `0.0.1-beta.10`.
- `netscript --help` exposed the documented top-level command families. The exact scaffold command,
  `aspire restore`, and `aspire start` ran successfully before the database-health stall.
- `netscript agent init` succeeded in the fresh scaffold, wrote both MCP configuration files with
  beta.10 pins, and installed exactly three skill directories.
- As a concrete execution of the placeholder example,
  `deno add jsr:@netscript/service@0.0.1-beta.10` succeeded in a clean project without an age
  override.
- Published beta.10 `deno doc` confirms `defineService`, `defineServices`, and `definePlugin`.
- Published beta.10 MCP exports independently confirmed 13 tools, truncation defaults of 50 items
  and 2,000 characters, and the documented 17 allow / 6 deny command policy.
- All 98 unique HTTP URLs were fetched with redirects. Every external URL returned HTTP 200; the
  only non-200 URL was the expected localhost payoff when no recovered AppHost was running.
- Every relative link resolves as a GitHub-rendered repository path. `deno task docs:links` reported
  98 docs, zero broken links, zero broken anchors, and zero orphans.
- The package map has exactly 35 unique rows. Every linked package/plugin README is among the files
  reworked by the #815 commit `fbb32119`.
- The five tutorial tracks and all Start links return HTTP 200 and align with the docs site's
  navigation data. A local docs-site build completed successfully (531 files, 6.01 s).
- The root MCP summary is consistent with `packages/mcp/README.md`.
- The Mermaid block parsed as `flowchart-v2` with Mermaid 11 and a DOM implementation.
- The tagline is 243 bytes. The repository tagline checker reported one checked and zero over the
  250-byte limit.
- `deno fmt --check README.md` passed.
- The canonical internal-vocabulary grep returned zero matches.
- The README does include the required honest limitations: beta.10 pinning, unsigned installers, and
  Windows manual update apply.

## Gate log

| Gate                  | Commands / evidence                                                                  | Scope                        | Result                                                      | Proceeded                    |
| --------------------- | ------------------------------------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------- | ---------------------------- |
| Command execution     | Fresh temp installs; every README shell command with concrete placeholders; CLI help | Root README                  | FAIL: plugin syntax, deploy verb, and clean quickstart      | Yes, to collect all findings |
| Shipped truth         | Published beta.10 `--help`, `deploy list --json`, and `deno doc`                     | Capabilities and package map | FAIL: desktop/update seam absent; count false               | Yes                          |
| Links                 | Redirect-following GET of 98 URLs; relative-path resolver; `deno task docs:links`    | External, relative, anchors  | PASS                                                        | Yes                          |
| Cross-doc consistency | #814 MCP README, #815 README set, docs navigation and five tracks                    | Required comparison set      | PASS except branch-only desktop claims presented as beta.10 | Yes                          |
| Mechanical            | Mermaid 11 parse, tagline checker, fmt check, vocabulary grep                        | README                       | PASS                                                        | Yes                          |

## Required fixes

1. Remove the desktop/update claims from the beta.10 shipped surface, or mark them explicitly as
   unreleased and keep them out of the current package map until a published version exposes them.
2. Make the printed quickstart deterministic on a clean machine, including database readiness, then
   rerun the whole sequence under five minutes without recovery steps; otherwise remove the timing
   promise and document the required recovery/readiness step.
3. Add the required `--name` argument to the plugin-install example.
4. Remove `emit` from the beta.10 canonical deploy lifecycle or ship and document that verb.
5. State Deno 2.9+ in the prerequisite.
6. Correct or qualify the published package count and make clear why the bench package is excluded.
7. Change the dry-run claim to match its count-only output, or make the command list every proposed
   path.

No README edits, merge, release action, milestone close, seed-run filing, or self-dispatched
evaluation was performed.
