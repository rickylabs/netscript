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

---

## Re-check — fix cycle 1 (`e9e3821b`)

**Final verdict: FAIL — second-FAIL escalation**

Six of the seven original findings are closed, and the quickstart remediation is accepted without
another full run because its executable sequence did not otherwise change. One revised deploy claim
remains false under direct beta.10 execution.

### MAJOR — `deploy list` is still described as authoritative even though its operations are false

The revised deploy section correctly removes `emit` from its canonical lifecycle and its grouped
table covers all ten beta.10 target keys. It then says `netscript deploy list` “prints exactly what
your installed version supports.” A new clean install of `0.0.1-beta.10` disproves that sentence:

- `netscript deploy list --json` lists all ten expected targets, but advertises `emit` for nine of
  them (all except `deno-deploy`).
- `netscript deploy kubernetes --help` exposes only `plan`, `up`, and `down`.
- The prior direct execution of `netscript deploy kubernetes emit` exited 2 as an unknown command.

The README no longer contains `emit`, which is correct, but it cannot direct users to the known
false operation inventory as an exact statement of installed support. This is the second FAIL and
therefore escalates the lane rather than returning it for another silent redaction cycle.

### Closed findings

1. **Desktop/beta.10 scoping — PASS.** `rg 'netscript deploy desktop' README.md` returns no match.
   The only `deploy desktop package` reference sits under the unambiguous heading “New in
   `0.0.1-beta.11`: native desktop lane” and immediately says it is “not yet available” in the
   pinned beta.10 packages. The SDK map likewise says the seam arrives in beta.11.
2. **Quickstart honesty — PASS.** The heading is now plain “Quickstart”; grep finds no five-minute
   promise. It tells users to wait for the Postgres resource to report healthy, conditions the
   database commands and payoff on readiness, and prints the observed recovery step: `aspire stop`
   followed by `aspire start` after database initialization. No full rerun was required because no
   other printed quickstart command changed.
3. **Plugin command — PASS.** In a newly scaffolded beta.10 workspace, exact
   `netscript plugin install worker --name workers` exited 0, installed the worker plugin, created
   four plugin files, and regenerated twelve Aspire helper files.
4. **`emit` wording — PASS.** Case-insensitive whole-word grep of the README returns no match. The
   canonical lifecycle now names only `plan`, `up`, and `down`, with conditional `status`/`logs`.
5. **Deno floor — PASS.** The quickstart prerequisite now states Deno 2.9+ and agrees with the
   limitations section.
6. **Counts/bench — PASS.** The README now says 29 published packages plus 6 published first-party
   plugins, explicitly excludes the internal unpublished `@netscript/bench`, and labels the
   disclosure “Published package map.”
7. **Dry-run wording — PASS.** It now claims only file/directory counts and no writes, matching the
   observed beta.10 output.

### Re-check gate log

| Gate                          | Evidence                                                               | Result   |
| ----------------------------- | ---------------------------------------------------------------------- | -------- |
| Desktop scoping               | Context grep for beta.10 and desktop; exact-command grep               | PASS     |
| Quickstart remediation        | Re-read complete section; timing-promise and readiness/recovery greps  | PASS     |
| Plugin syntax                 | Clean beta.10 install, fresh scaffold, exact install command           | PASS     |
| Deploy truth                  | Clean beta.10 `deploy list --json`; Kubernetes help; README grep/table | **FAIL** |
| Prerequisite, counts, dry-run | Exact text assertions and context review                               | PASS     |

### Remaining required fix

Remove or qualify the sentence claiming `netscript deploy list` exactly reflects supported
operations. Until the CLI's advertised operation arrays match executable verbs, the README should
use the command only as a target inventory and direct users to `<target> --help` for executable
operations.

No README edits, merge, release action, milestone close, seed-run filing, or self-dispatched
evaluation was performed during the re-check.

---

## Targeted final check — supervisor escalation resolution (`7ee36d05`)

**Final verdict: PASS**

The residual deploy-truth MAJOR is closed.

The revised Deploy targets sentence now says that `netscript deploy list` “inventories the installed
targets” and directs users to `netscript deploy <target> --help` “for the exact operations each one
ships.” That disposition matches the independently executed beta.10 evidence: the list is reliable
for the ten target keys, while per-target help—not the list's stale operation arrays—is the
authority for executable verbs.

A full-README context grep found only this one `deploy list` reference. No other sentence describes
the list as exact, authoritative, or reliable for operations, and the prior false wording (“prints
exactly what your installed version supports”) is absent.

All seven original findings and the fix-cycle residual are therefore closed. The Lane 5 adversarial
gate passes at `7ee36d05`.

No README edits, merge, release action, milestone close, seed-run filing, or self-dispatched
evaluation was performed during this targeted final check.

---

## Final targeted narrative check (`ab049204`)

**Final verdict: FAIL**

The narrative pass preserves the previously approved claim-precision wording and changes no command
semantics. It nevertheless introduces one MAJOR plugin overclaim and two MINOR control/ review
overclaims.

### MAJOR — “Every layer at once” is not the plugin contract and is not proven by the install

Both artifacts now say a plugin contributes to **every layer at once**: CLI verbs, scaffolded code,
runtime services, storage, stream topics, telemetry, and Aspire resources. The audited plugin API
does not impose that invariant. `@netscript/plugin` documents a rich vocabulary of optional
contribution axes; its own quick example declares only a service. A valid plugin need not contribute
every listed axis.

The exact worker install output also cannot support “Watch one install touch every layer.” It proves
only:

- `Installed worker plugin "workers" on port 8091.`
- four created plugin files; and
- twelve regenerated Aspire helper files.

Inspection of those four created files found job/task/runtime code. The printed evidence does not
demonstrate a new CLI verb, storage, a stream topic, or telemetry output. The honest philosophy is
that one manifest _can_ contribute across layers and host tooling materializes its declared axes;
“every layer” is a false universal.

### MINOR — “Destructive verbs stay in human hands” overstates the six-rule deny policy

The unchanged detailed README policy statement remains accurate: 17 allowed prefixes, six explicit
denies (`deploy`, `init`, `marketplace`, `db reset`, `plugin remove`, `ui:remove`), deny beats
allow, and unmatched commands are denied. The new narrative generalizes this to all “destructive
verbs” staying human-only.

That category is not what the policy encodes. Several denied prefixes are broad rather than
intrinsically destructive, while allowed commands such as database migration/seed, plugin install,
UI update, and generators mutate state. State the exact six blocked command families or call them
high-risk operations; do not claim exhaustive destructive-action classification.

### MINOR — “Typed diffs” is presented as a shipped review surface without one

The new README says developers review agent work through “typed diffs.” The facts establish typed
contracts, generated typed clients, Deno checks, and ordinary source changes, but no product surface
that produces or validates a special typed diff. “Type-checked changes” would match the evidence;
“typed diffs” reads as an invented capability.

### PASS notes

- The trace half of the new control sentence is supported: MCP trace intelligence correlates whole
  executions by id across worker/saga/trigger/stream/service domains.
- The developer-with-agent framing is otherwise consistent with the shipped MCP/skills/CLI triple
  and preserves the developer as owner/operator.
- Exact `56bab8ff` F1 wording survives in both artifacts: typed service + typed clients derive from
  the contract, and server/callers cannot drift apart. No Fresh UI/orchestration derivation wording
  returned.
- Exact F2 precision survives: the rejected “stop at the HTTP boundary” absolute is absent, while
  both artifacts retain the first-party/in-box plugin comparison.
- Diff inspection found no executable command semantic change. The worker install example moved from
  inline prose to a fenced/tabbed example but remains exact, including its previously verified
  output.
- Both artifacts were read top-to-bottom. No other factual regression was found; beta.11 desktop
  labeling, beta.10 limitations, deploy authority, quickstart readiness/recovery, package counts,
  and navigation claims remain consistent.
- Spot gate: `deno task docs:links` passes with 98 docs and zero broken links, broken anchors, or
  orphans.

### Required fixes

1. Replace “contributes to/touches every layer” with “can contribute across layers” and tie the
   install output only to what it actually reports.
2. Replace the destructive-verbs universal with the exact six blocked command families or a
   qualified “selected high-risk operations” statement.
3. Replace “typed diffs” with the evidenced “type-checked changes.”

No README/homepage edit, merge, release action, milestone close, seed-run filing, or self-dispatched
evaluation was performed during this narrative check.

---

## Homepage adversarial

**Target:** rendered docs-site homepage from `docs/site/index.vto` at `60586af9`\
**Homepage verdict: FAIL**\
**README verdict:** unchanged PASS at `7ee36d05`

The site builds and its links resolve, but the homepage is not truthful as an executable beta.10
entry point. It reintroduces the deploy-list claim already rejected from the README, and its
four-tab lead example is not one coherent scaffold-to-service flow.

### MAJOR — The homepage restores the false `deploy list` operation-authority claim

The rendered Run it anywhere section says `netscript deploy list` “prints exactly what your
installed version supports.” Independent beta.10 execution already disproves this: the JSON list
advertises `emit` for nine targets, while `netscript deploy kubernetes --help` exposes only `plan`,
`up`, and `down`, and direct `emit` execution is unknown.

This also directly contradicts the passed README, which correctly limits `deploy list` to target
inventory and makes per-target `--help` the operation authority.

### MAJOR — The displayed scaffold command does not create the contract/service story shown

The lead paragraph attributes the contract and service tabs to
`netscript init my-app --db postgres --service`, but the displayed Scaffold tab tells users to run
`netscript init my-app --db postgres` without `--service`. Executing that displayed command verbatim
in a clean temp directory exited 0 but created 162 files / 31 directories, reported only a
“Contracts (v1 stub),” and created no users service or shown users CRUD contract.

The adjacent Bring it up tab therefore brings up a database, cache, and dashboard—not the typed
users service the four-tab narrative promises. The `--no-aspire` alternative also executed
successfully, but likewise created no service.

### MINOR — The contract/service snippets have an unstated generation prerequisite

The rendered TypeScript snippets were copied verbatim into a fresh beta.10 service scaffold. Before
database generation, both failed because `@database/zod` resolved to the absent generated module
`database/postgres/schema/.generated/zod/crud.ts`. After exact `netscript db generate`, the contract
passed `deno check --unstable-kv` and the service example started and stopped cleanly.

The code is valid after generation, but the page presents it before the later generation step and
calls it straight from the scaffold. The prerequisite/order must be explicit.

### MINOR — Homepage quickstart posture omits the proven recovery and workspace transition

The rendered Bring it up tab correctly tells users to wait for Postgres health, but it does not
include the README's recovery for the observed first-boot stall (`aspire stop`, then `aspire start`
after initialization). It also says the database commands run “from the workspace root” without
printing `cd ..` after entering `my-app/aspire`. The homepage should preserve the same
readiness/recovery posture and runnable directory transitions as the passed README.

### PASS notes

- `cd docs/site && deno task build` succeeded: 531 files in 6.77 seconds.
- The rendered homepage—not merely `index.vto`—was used for claim, example, limitation, CTA, and
  link inspection.
- The install command remains exactly pinned to `0.0.1-beta.10`. Both displayed scaffold variants
  execute successfully on beta.10.
- Exact `netscript agent init` succeeded in the fresh displayed scaffold.
- Exact `netscript plugin install worker --name workers` succeeded, and its three output lines
  exactly match the rendered claims: port 8091, four plugin files, and twelve regenerated Aspire
  helper files.
- The service lifecycle snippet works after its missing generation prerequisite. The repository's
  service README fixture gate also passed 2/2.
- The branch-only desktop callout is unambiguously titled “New in 0.0.1-beta.11,” explicitly says it
  is unavailable in the rendered beta.10 packages, and includes unsigned-installer and Windows
  manual-apply limitations.
- Beta status, aligned exact pins, Deno 2.9+, and Postgres readiness are presented honestly.
- All 115 unique built-site-local homepage links resolve to generated files. The external GitHub,
  JSR, and edit CTAs returned HTTP 200 after redirects. `deno task docs:links` reports 98 docs, zero
  broken links, zero broken anchors, and zero orphans.
- No fabricated customer, adoption, download, star, or testimonial claim appears.
- The nine homepage pillar cards match the nine real product-area navigation sections: Web Layer,
  Services & SDK, Background Processing, Durable Workflows, AI & Agents, Data & Persistence,
  Identity & Access, Orchestration & Runtime, and Observability.

### Homepage fix list

1. Copy the passed README disposition into the homepage: `deploy list` inventories targets;
   `<target> --help` is the exact operation authority.
2. Add `--service` to the displayed primary scaffold command so the example actually creates the
   users service and CRUD contract being demonstrated (and keep the no-Aspire alternative
   semantically equivalent if it is presented as the same flow).
3. State that the contract/service snippets require `netscript db generate`, or reorder the flow so
   generation precedes code that imports `@database/zod`.
4. Print `cd ..` before workspace-root database commands and carry over the README's
   readiness-recovery instruction.

No homepage/README edit, merge, release action, milestone close, seed-run filing, or self-dispatched
evaluation was performed during this scope extension.

---

## Combined final adversarial re-check (`71a23ec6`)

**Final verdict: FAIL — second-FAIL escalation for the homepage cycle**

All four homepage remediation items close, and every requested mechanical gate passes. The
owner-directed repositioning nevertheless introduces two new unsupported/false benefit claims in the
README and homepage, so the combined artifacts are not ready for a PASS.

### MAJOR — Contract derivation is overstated to include Fresh UI and orchestration

The rewritten README says the typed Hono service, typed SDK clients, and Fresh UI “all derive” from
one contract and “cannot drift.” The homepage similarly says “everything derives from it” and
explicitly includes orchestration.

The audited surfaces support a narrower claim:

- `@netscript/contracts` says services implement the contract and the SDK generates typed clients
  from it; those two sides share the definition.
- `@netscript/sdk` derives typed clients and query helpers from a contract map.
- `@netscript/fresh-ui` is a copy-source registry. Its README explicitly says copied components and
  pages become app-owned code “to own and evolve.” They are not generated from an oRPC contract and
  are not guaranteed unable to drift from it.
- Aspire helpers and other orchestration wiring are regenerated by CLI workspace mutations. The fact
  sheets do not say the oRPC contract itself derives the orchestration graph.

This turns a real end-to-end service/client typing advantage into a broader guarantee the shipped
surface does not provide.

### MAJOR — The named frontend-framework contrast is an unsupported absolute

The README says “Next.js, Nuxt, SvelteKit, Angular — the frontend meta-frameworks stop at the HTTP
boundary.” The homepage repeats the categorical claim without names. Neither the fact sheets nor
`competitive-advantages.md` audits those external products or proves this boundary claim; the
inventory proves only that NetScript ships durable workers, sagas, triggers, streams, auth, and AI
plugins.

The differentiator can honestly say those backend batteries are first-party NetScript surfaces. It
cannot convert that evidence into the blanket assertion that the named frameworks stop at HTTP.

### MINOR — “Enterprise-grade” is presented as established rather than positioning

Both artifacts call NetScript “the enterprise-grade meta-framework” while simultaneously stating
that the API is beta and still moving. The fact sheets establish enterprise-relevant capabilities,
but provide no production-adoption, stability, support, SLA, or maturity evidence that makes
“enterprise-grade” a verified shipped property. “Built for enterprise backend concerns” or an
explicit aspiration would fit the evidence; the current definite article does not.

### Homepage remediation closure

1. **Deploy-list truth — PASS.** Site-wide artifact/rendered grep finds no rejected “prints exactly
   what your installed version supports” wording. Both artifacts describe `deploy list` as target
   inventory and per-target `--help` as the operation authority.
2. **Service scaffold — PASS.** Exact `netscript init my-app --db postgres --service` ran in a clean
   temp directory, exited 0 in 3.2 seconds, reported 183 files / 44 directories, and created both
   `services/users/src/main.ts` and `contracts/versions/v1/users.contract.ts`.
3. **Generation ordering — PASS.** Both code tabs now state that `@database/zod` requires
   `netscript db generate`, and tab 4 prints that command. Re-execution completed generation and
   `deno check --unstable-kv contracts/versions/v1/users.contract.ts` passed.
4. **Readiness/recovery/directory posture — PASS.** Tab 4 prints `cd ..`, waits for Postgres health,
   and carries the README's `aspire stop` / `aspire start` recovery after initialization.

### Positioning and version-truth PASS notes

- The real benefit inventory supports contract-first services/clients, first-party durable plugins,
  Aspire adapter isolation, built-in OTLP telemetry, ten beta.10 deploy targets, operator-owned
  credentials, and the MCP/skills/CLI operability numbers.
- The “ship anywhere” target spectrum matches beta.10 execution for compiled OS services,
  Docker/Compose, Deno Deploy, Kubernetes, Azure, and Cloud Run.
- Every native-desktop clause in the two artifacts is explicitly scoped to `0.0.1-beta.11`; both say
  it is unavailable in the published beta.10 packages and retain the unsigned-installer and Windows
  manual-apply limitations.
- Agent operability is now a dedicated later chapter in both artifacts; the section order is
  consistent with the supplied advantage ranking.
- README and homepage agree on beta pinning, Deno 2.9+, readiness/recovery, deploy-list authority,
  desktop version truth, agent capabilities, and the limitation posture.

### Gate results

| Gate                                  | Result                                         |
| ------------------------------------- | ---------------------------------------------- |
| README tagline checker (250-byte cap) | PASS — 1 checked, 0 over                       |
| README Mermaid parse (Mermaid 11)     | PASS — `flowchart-v2`                          |
| `deno fmt --check README.md`          | PASS                                           |
| `deno task docs:links`                | PASS — 98 docs, 0 broken links/anchors/orphans |
| `cd docs/site && deno task build`     | PASS — 531 files in 6.69 seconds               |
| Rendered homepage local links         | PASS — 115 unique local links, 0 missing       |

### Required fix list

1. Restrict contract-derivation language to what is actually derived: service implementation, typed
   SDK clients/query helpers, and their shared input/output types. Describe Fresh UI and Aspire
   wiring separately without a no-drift guarantee from the oRPC contract.
2. Replace the “frontend frameworks stop at the HTTP boundary” absolute with the evidenced
   comparison: NetScript supplies the listed durable backend capabilities as first-party plugins.
3. Qualify “enterprise-grade” as positioning/intent, or add concrete maturity evidence sufficient to
   support it as a present-tense shipped property.

No README/homepage edit, merge, release action, milestone close, seed-run filing, or self-dispatched
evaluation was performed during this combined re-check.

---

## Targeted final check — supervisor claim dispositions (`56bab8ff`)

**Final verdict: PASS**

The combined-cycle escalation findings are resolved under the recorded owner/supervisor
dispositions.

### F1 — Contract derivation narrowed — PASS

Both artifacts now limit derivation to the audited contract surfaces: the typed service and typed
SDK clients derive from the same oRPC definition, so server and callers share input/output types and
cannot drift apart at that boundary. Neither artifact says Fresh UI or orchestration derives from
the contract. This matches `@netscript/contracts` and `@netscript/sdk`; the app-owned copy-source
Fresh UI and CLI-regenerated Aspire wiring are described separately.

### F2 — Competitive contrast narrowed — PASS

The homepage makes only the evidenced in-box claim: durable jobs, compensating sagas, trigger
ingress, replayable streams, pluggable auth, and in-process AI are first-party NetScript plugins,
not an integration project. The README adds the owner-approved positioning that these are the
integration project assembled around the named frontend frameworks; it no longer says those
frameworks “stop at the HTTP boundary” or purports to inventory their features. The positive
NetScript half is directly supported by the audited plugin READMEs and executed worker install.

### F3 — Owner-retained “enterprise-grade” positioning — PASS by authority disposition

The owner explicitly retained this positioning and overrode the prior MINOR. Its qualification is
adjacent and conspicuous in both artifacts:

- In the README lead, the enterprise-grade tagline is followed in the same opening block by the
  `Beta (0.0.1-beta.x)` callout, “API is subject to change,” and pinning guidance.
- On the homepage, the enterprise-grade hero is immediately followed by the “Beta — API subject to
  change” callout stating that version 0.0.1 is beta, the API is still moving, and exact aligned
  pins must be kept.

This targeted evaluator accepts the explicit owner-authority disposition; it does not silently
reinterpret the retained phrase as independently proven maturity evidence.

### Spot gate

The README tagline gate was re-executed at `56bab8ff`: one tagline checked, zero over the 250-byte
cap. The supervisor-recorded build/link results remain applicable because this commit changes only
claim prose and the targeted spot check found no structural regression.

All previously required README and homepage fixes are closed. Lane 5's combined final verdict is
PASS at `56bab8ff`.

No README/homepage edit, merge, release action, milestone close, seed-run filing, or self-dispatched
evaluation was performed during this targeted final check.

---

## Targeted wording-fix re-check (`67c1d0db`)

**Final verdict: PASS**

All three narrative findings are closed.

1. **Optional plugin axes — PASS.** “Every layer at once” and “touch every layer” are absent from
   README source, homepage source, and rendered homepage HTML. The replacement says a manifest _can_
   contribute across the listed axes and that the host materializes whatever it declares. The worker
   example is limited to its verified output: four plugin files scaffolded and twelve Aspire helpers
   regenerated.
2. **Exact deny-list truth — PASS.** “Destructive verbs” is absent from all three inspected
   surfaces. The README retains the exact policy evidence—17 allowed prefixes, six explicit deny
   families, deny precedence, and default-deny—and the new narrative calls `deploy`, `init`, and
   `db reset` examples of high-risk operations behind that explicit list. The homepage intro states
   deny precedence and unmatched-command denial; its CLI card preserves the full 17/6 semantics; its
   audience card uses the same accurate high-risk examples without claiming exhaustiveness.
3. **Type-checked review language — PASS.** “Typed diffs” is absent. The only affected claim now
   says “type-checked changes,” matching the repository's actual Deno/type-checking surface.

### Scope and gate evidence

- Commit `67c1d0db` changes only `README.md`, `docs/site/index.vto`, and the slice worklog.
- Diff inspection found no shell/code example change. A prose card containing `netscript agent init`
  changed only its policy description; the command itself is unchanged.
- The homepage rebuilt successfully: 531 files in 6.60 seconds.
- Rejected-phrase grep was run against `README.md`, `docs/site/index.vto`, and the rendered
  `docs/site/_site/index.html`, with zero matches.
- No other wording regression was found in the targeted diff.

The final Lane 5 verdict is PASS at `67c1d0db`.

No README/homepage edit, merge, release action, milestone close, seed-run filing, or self-dispatched
evaluation was performed during this targeted re-check.
