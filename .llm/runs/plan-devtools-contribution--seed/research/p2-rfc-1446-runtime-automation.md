# prior:1446-runtime — what RFC-0001 (Runtime-Versioned Automation) obliges the DevTools RFC to consume

**Scope note.** RFC-0001's backend decisions are CLOSED and are recorded here as given, not critiqued.
This corpus extracts only the parts a DevTools RFC must consume, obey, or not violate.

**Primary artifact (all `RFC:NNN` citations below):**
`/home/codex/repos/ns-rfc-runtime-versioned-automation/docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md`
at worktree HEAD `6cb79675c55e665b9c1daa503f3ed25cd5da8c30`
(verified: `cd /home/codex/repos/ns-rfc-runtime-versioned-automation && git rev-parse HEAD`).
Shorthand `RFC:461-474` = that file, lines 461–474.

---

## Summary

RFC-0001 is a draft, PLAN-EVAL-PASSed, owner-unratified architecture RFC (PR #1446, OPEN, draft,
base `main`, head `docs/rfc-runtime-versioned-automation`, milestone `Backlog / Triage`,
labels `type:docs`/`area:docs`/`status:plan-eval`/`ci:skip-e2e`/`ci:skip-scaffold` —
`gh pr view 1446 --json ...`). It designs a two-plane automation architecture: a definition
**control plane** (immutable content-addressed revisions, transactional activation-set manifests
with strictly monotonic epochs, append-only audit, one oRPC management contract) and an
**execution plane** (snapshot clients, revision-pinned dispatch, execution history, OTel)
(RFC:128-184, RFC:252-378, RFC:459-474).

For the DevTools RFC the load-bearing fact is §8.2 (RFC:489-527): under owner directive D-9 the RFC
**splits operator frontends into two hosts/contribution surfaces** — Surface 1, a production/admin
automation console built on the merged #890 userland `app` family plus the #934 deny-by-default
procedure gateway, shipped by RFC-0001's own slice A7; and Surface 2, **developer DevTools**, which
RFC-0001 explicitly does *not* design and stages behind a dedicated **P-6 DevTools RFC**
(RFC:638). A7 is written to deliberately exclude diagnostics and journey views so it does not
pre-empt the DevTools architecture (RFC:522-524, RFC:668).

P-6 names exactly four contracts DevTools consumes: the management oRPC contract (§8.1), the
audit/history stores (§5.2, §7), the convergence surface (§5.3), and the OTel vocabulary (§7)
(RFC:519-522, RFC:638). Its entry criterion is sequencing, not permission: "after A2b (management
contract), A3b (history), A2d (convergence) land" (RFC:638). It also declares epic #400 and its
design record (#685, draft PR #780, older #506) to be **evidence, not ratified architecture**
(RFC:516-519) — i.e. the DevTools RFC must re-evaluate #400 rather than inherit it.

RFC-0001 also claims the RFC home and the number: "This RFC establishes `docs/architecture/rfc/` as
the in-repo RFC home" (RFC:9), and takes `rfc-0001-*`. That directory **does not exist on `main` at
`2256a67bf`** (`git ls-tree -r --name-only 2256a67bf -- docs/architecture/rfc` → empty), so both
RFCs are unmerged directory-creating PRs. The DevTools RFC must take `rfc-0002-` and expect a
create/create overlap on the directory only, not on a file.

---

## Findings

### F1 — P-6 is a staged prerequisite RFC row, quoted verbatim

RFC:638 (the §11 "Staged decisions — prerequisite RFCs" table row):

> | P-6 | **DevTools RFC** (D-9): first-class DevTools contribution family/host for runtime
> diagnostics, live definitions/state, execution journeys, dev management affordances —
> re-evaluates epic #400 (+ #685 / draft PR #780 / older #506 as evidence, not ratified
> architecture) | #890 ratified the userland app family only; a DevTools host is a distinct surface
> this RFC must not design (§8.2 surface 2); it consumes this RFC's stable management/observability
> contracts | after A2b (management contract), A3b (history), A2d (convergence) land |

Three columns: **Question** (what the DevTools RFC is for), **Why staged** (the boundary), **Entry
criterion** (the sequencing). All three bind the DevTools RFC. `kind: observed`.

### F2 — What P-6 requires of a DevTools surface, and what it promises in return

- **Requires:** it must be a *first-class DevTools contribution family/host* — a distinct
  contribution surface, not a set of pages on the `app` family (RFC:514-517, RFC:638). It must
  re-evaluate #400 against "the modern contribution model" rather than treat #400/#685/#780/#506 as
  settled (RFC:516-519). It must not be started before A2b/A3b/A2d land (RFC:638, RFC:525-527).
- **Promises in return:** four named *stable* contracts to consume — "the management oRPC contract
  (§8.1), the audit/history stores (§5.2, §7), the convergence surface (§5.3), and the OTel
  vocabulary (§7)" (RFC:519-522). RFC-0001 also promises backend independence: "Every backend
  section of this RFC (§§5–7, 8.1) is frontend-independent and may proceed before either surface
  lands" (RFC:525-526). `kind: observed`.

### F3 — The console/DevTools boundary is a decision sentence, not a preference

RFC:491-493:

> **Decision: production operator management and developer diagnostics are two distinct hosts and
> two distinct contribution surfaces — not one ambiguous "cockpit."**

RFC:514-524 (Surface 2, verbatim opening and the non-pre-emption clause):

> **Surface 2 — developer DevTools (staged behind P-6, NOT built by this RFC).** Runtime
> diagnostics, live definition/state inspection, execution-journey visualization, and
> developer-facing management affordances belong to a dedicated **DevTools contribution family/host**
> that #890 did not ratify. […] A7 deliberately does not claim diagnostics or journey views;
> building them on the app family would pre-empt the DevTools architecture.

The reciprocal obligation on the DevTools RFC is the mirror of that sentence: it must not annex
Surface-1 territory. Surface 1 is scoped at RFC:503-513 as "list/detail/run/history pages per
automation family, draft-edit forms generated from family schemas, activate/rollback flows, client
data access exclusively through the #934 gateway" inside the userland host app, and RFC:668 pins A7
as "**production/admin automation console only** … deliberately NO diagnostics/journey views".
`kind: observed`.

### F4 — The five contribution surfaces enumerated by D-9 (DevTools is #4)

RFC:497-502 enumerates the larger frontend-contribution problem #890 did **not** settle: "(1)
userland UI via the `app` family; (2) Fresh UI registry/component/style-dictionary extensions
generated into userland (potentially extending the CLI's fresh-ui commands); (3) deferred Vite
plugin contribution; (4) a first-class **DevTools contribution family/host**; (5) SDK contribution,
owned by its separate RFC. **This runtime RFC designs none of those general mechanisms.** It
consumes (1) and stages (4)." The same five-surface taxonomy is the owner's own words in the run's
drift log (`/home/codex/repos/ns-rfc-runtime-versioned-automation/.llm/runs/docs-rfc-runtime-versioned-automation--supervisor/drift.md:15`,
severity `architectural`, dated 2026-08-11). `kind: observed`.

**Inference (from F4):** the DevTools RFC is the ratifying owner of surface (4) and only (4); (2)
and (3) are adjacent unratified surfaces it may need to bound against but was not handed. Inferred
from RFC:497-502 + drift.md:15; not stated as an ownership assignment anywhere I read.

### F5 — Management contract (§8.1) shape

RFC:479-487:

> One oRPC management contract (in the contracts package) serves CLI and cockpit identically:
> family/definition/revision CRUD-by-lifecycle, activation set operations, dry-run, execution
> history queries, audit queries, and an SSE change feed. The CLI (`netscript automation …`) becomes
> the single command surface […]
> `netscript generate runtime-schemas` is reimplemented over family schemas (single authority, §5.1)

Seven procedure groups, one contract, one transport story. The contract lives in the ARCHETYPE-1
contracts package `@netscript/automation-core` (working name; naming deferred to slice A0 —
RFC:545-549, RFC:805-807). The RFC does **not** publish per-route signatures; route names/paths are
unspecified at this stage. `kind: observed` for the group list; route-level shapes are
**unverified** — verification would require slice A0's contract file, which does not exist.

### F6 — Frontend data access is gateway-only for Surface 1

RFC:503-508: A7's "client data access exclusively through the #934 gateway — no bespoke Fresh seam,
no direct service URLs. For **this surface only**, #890/#922 are sufficient." Note the explicit
scoping "for this surface only" — RFC-0001 does not assert that the #934 gateway is sufficient for
DevTools, and does not forbid it either. `kind: observed`. Whether DevTools may/must use the #934
gateway is **an open question RFC-0001 leaves to P-6** (inference from RFC:508 + RFC:514-517).

### F7 — Audit/history contract (§5.2 + §7)

Audit (RFC:283-285): "**Audit is an append-only event stream** on the same transaction: actor
identity (from the auth plugin's session), action, before/after revision, reason string, correlation
id. The audit feed is itself queryable through the management API (J1/J3 requirement)."

Execution history (RFC:465-472): a first-class store in the same production DB, with "queued →
running → completed/failed/killed/timed-out transitions written by CAS […] captured stdout/stderr
(bounded, secret-redacted), exit classification, duration, and the `(revision, snapshotHash)` that
ran — so 'what exactly executed' is always answerable". Plus **"Acceptance returns an address."**
Run-now and trigger-fire return the execution id at enqueue time (RFC:470-471), and scheduled/
file-watch events flow through the same durable event path as webhooks (RFC:472-474). `kind:
observed`.

### F8 — Convergence contract (§5.3)

The propagation unit is the **activation-set snapshot**: "the epoch-stamped manifest plus the full
bodies of every entry, content-addressed as a whole" (RFC:302-303). Replica-facing facts a DevTools
surface can render:

- change feed events carry `(epoch, snapshotHash)` (RFC:305-307);
- epochs apply strictly monotonically; a replica at epoch N rejects epoch ≤ N (RFC:308-313);
- replicas register and "report the schema majors they support plus the epoch they run (heartbeat)",
  acknowledge each applied epoch, and "the management surface exposes **convergence status** (which
  replicas are at which epoch) with an alerting SLO" (RFC:318-323);
- a replica that cannot validate "keeps its last-good state **loudly** — fail-visible, never
  fail-empty" (RFC:323-325);
- registrations are **leased** with a heartbeat TTL; leases gate epoch admission, never serving
  (RFC:340-350);
- the availability contract is **indefinite last-good serving, never self-drain**; the staleness SLO
  bounds *silence* (alerting), not *serving*, across three replica cases: (a) lease expiry while
  serving, (b) restart with persisted last-good, (c) cold start with no valid snapshot →
  "idle-and-loud" (RFC:351-377).

`kind: observed`. Every one of those is a state a diagnostics UI would have to name correctly: an
"idle-and-loud" cold replica is not the same failure as a "stale but serving" leaseless replica.

### F9 — OTel contract (§7)

RFC:461-464:

> - **OTel**: every dispatch opens `netscript.automation.execute` with attributes (`family`,
>   `definition.id`, `revision`, `runtime`, `boundary.tier`, `trigger.correlation`); lifecycle
>   actions emit `netscript.automation.lifecycle` events (publish/activate/rollback). Trigger
>   processing keeps its existing trace parenting. Spans and history records share the execution id.

Two names (`netscript.automation.execute` span, `netscript.automation.lifecycle` event), six span
attributes, and the join key: **spans and history records share the execution id**. `boundary.tier`
values come from the T0–T3 tier table (RFC:388-393). `kind: observed`.

### F10 — Identity/RBAC the DevTools surface inherits

RFC:424-428: "Management API actions require an authenticated principal (auth plugin session); RBAC
is role-per-action (`author`, `approver`, `operator`, `viewer`) with an optional two-person rule
(`author ≠ activator`) as policy, enforced in the lifecycle engine — policy data lives with the
store so the CLI and cockpit get identical enforcement." The two-person default is an explicitly
deferred open question, resolvable at slice A2b (RFC:807-810). `kind: observed`. Consequence
(**inference**): a DevTools host that offers "dev management affordances" (P-6's own words,
RFC:638) inherits the same four roles and lifecycle-engine enforcement — it cannot invent a
diagnostics-only bypass, because enforcement is server-side. Inferred from RFC:424-428 + RFC:638.

### F11 — Sequencing/entry criteria imposed on dependents

- P-6's own entry criterion: "after A2b (management contract), A3b (history), A2d (convergence)
  land" (RFC:638). Slice definitions: **A2b** = lifecycle engine end-to-end bound to the A0
  contract, depends on A2a+A1c; **A2d** = change feed (SSE + poll) + leased fleet
  registration/admission/convergence surface + BG-1, depends on A2b+A1c; **A3b** = execution history
  store (CAS transitions, revision+epoch linkage, bounded capture) + OTel attributes + execution-id
  return, depends on A3a (RFC:659-666). Transitively this pulls in A0, A1a, A1c, A2a, A3a.
- The general frontend rule: "**no frontend slice of either surface may start before its stated
  dependency** (roadmap §12 edges; P-6 for surface 2)" (RFC:526-527).
- P-6 is listed in the roadmap table only as the catch-all row "P-1..P-6 | Prerequisite RFCs /
  staged extensions (§11) | — | as stated in §11" (RFC:670) — i.e. P-6 carries **no gate class** of
  its own in RFC-0001; it is an RFC, not a slice.
- Nothing in RFC-0001 is filed to GitHub before owner ratification: "On ratification, the roadmap in
  §12 is filed as a draft epic/issue graph; nothing files before that" (RFC:9); §12's title is
  "Roadmap (draft — files only on owner ratification)" (RFC:640). `kind: observed`.

**Inference:** P-6's entry criterion gates when the DevTools *implementation* may begin, not when
the DevTools *RFC* may be written — the row's own text calls P-6 a "DevTools RFC", and §11's table
is titled "prerequisite RFCs, not faked certainty" (RFC:629). Inferred from RFC:629 + RFC:638.

### F12 — RFC file location, numbering, and collision status

- Location + authority claim: RFC:9 — "This RFC establishes `docs/architecture/rfc/` as the in-repo
  RFC home."
- Naming convention observed in practice: exactly one file,
  `docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md` (`ls -la` on that directory in
  the 1446 worktree). Pattern: `rfc-NNNN-<kebab-slug>.md`, 4-digit zero-padded.
- Front matter convention (RFC:3-10): a two-column table with rows **Status** (`**Proposed** —
  awaiting owner ratification…`), **Run record**, **Tracking**, **Evidence base**, **Authority**,
  followed by `---` then `## Abstract`.
- **`docs/architecture/rfc/` does not exist on `main` at `2256a67bf`**:
  `git ls-tree -r --name-only 2256a67bf -- docs/architecture/rfc` returns nothing;
  `ls /home/codex/repos/ns-rfc-devtools-contribution/docs/architecture/` shows only
  `DOCS-STRUCTURE.md`, `PUBLIC-SURFACE-PATTERNS.md`, `STANDARDS.md`, `doctrine/`,
  `zod-dependency-boundary.md`.
- No file outside `.llm/runs/` on this baseline references `docs/architecture/rfc`
  (`grep -rln "docs/architecture/rfc" --include=*.md --include=*.ts --include=*.json .` → only
  `.llm/devtools-rfc-orchestrator-brief.md` and this seed run's own artifacts). So there is **no
  registered index, README, or docs-site route** for the RFC directory to update, and no numbering
  registry to reserve a number in. `kind: observed`.

**Consequence:** `rfc-0001-` is claimed by an unmerged PR. The DevTools RFC should take
`rfc-0002-devtools-contribution*.md` (or whatever slug it locks) — distinct filename, so the only
overlap between PR #1446 and this run is the *creation of the directory itself*, which git merges
without conflict. If #1446 never merges, `docs/architecture/rfc/` would be established by the
DevTools RFC instead, and RFC:9's "Authority" claim would need mirroring. `kind: inference` from
F12's observations.

### F13 — Package/ownership vocabulary the DevTools RFC will be read against

RFC:545-566 locks three homes: `@netscript/automation-core` (ARCHETYPE-1, contracts only — schemas,
management oRPC contract, lifecycle state table as data, error vocabulary; no ports/adapters/engine
code), `@netscript/automation-runtime` (ARCHETYPE-2/3 behavioral core — ports, lifecycle engine,
snapshot builder/client, store adapters), and `plugins/automation` (ARCHETYPE-5 thin connector,
composition only, and "(post-#922) carries the cockpit frontend contributions"). Naming is the sole
open item, deferred to slice A0 (RFC:566, RFC:805-807). `kind: observed`.

**Inference:** a DevTools host reading automation state has three candidate seams — the
`automation-core` contract types (typed client), the connector's management service, or a DevTools
family of its own — and RFC-0001 pre-assigns none of them to DevTools. Inferred from RFC:545-566 +
RFC:514-517.

### F14 — E2E acceptance model contains no DevTools journey

§13's eight acceptance tests (RFC:686-720) cover live add, live update+rollback, trigger wiring,
failure isolation, capability enforcement, audit/telemetry completeness, multi-replica convergence
(post-P-1), and control-plane outage. None is a DevTools journey; A8 is scoped "(A7 for cockpit
journeys)" (RFC:669). `kind: observed` — DevTools acceptance is unowned by RFC-0001 and therefore
the DevTools RFC's to define.

---

## Contracts

Verbatim-derived shapes the DevTools RFC must consume. Where RFC-0001 gives no signature, that is
marked — do not invent one.

### C1 — Management oRPC contract (§8.1)

```text
one oRPC contract, exported from the ARCHETYPE-1 contracts package (@netscript/automation-core, name TBD @ A0)
procedure groups (RFC:479-482):
  family/definition/revision CRUD-by-lifecycle
  activation set operations
  dry-run
  execution history queries
  audit queries
  SSE change feed
consumers served identically: CLI (`netscript automation …`) and cockpit
```

Route-level names/paths/params: **not specified in RFC-0001** (unverified; would be verified by
slice A0's contract module).

### C2 — Definition store record shapes (§5.2)

```ts
// revision (immutable, content-addressed) — RFC:266-268
(family, definitionId, revisionN, contentHash, authoredBy, publishedAt, schemaVersion, body)

// activation-set manifest (transactional epoch) — RFC:269-275
(epoch, entries[(family, definitionId, revision, contentHash)], actor, reason)
// epoch: store-issued, strictly monotonic integer
// commit takes an `expectedEpoch` precondition; fails on mismatch (optimistic concurrency)
// every epoch materializes the COMPLETE active desired state (untouched entries carried forward)
// disable = carried flag on the active revision; removal = explicit tombstone entry
// re-activating the already-active revision = idempotent no-op, issues no new epoch

// lifecycle states — RFC:286-288
draft → validated → published → active → superseded   ('disabled' is a flag on the active revision)
```

### C3 — Audit event (§5.2)

```ts
// append-only, same transaction as the activation — RFC:283-285
{ actor /* auth-plugin session identity */, action, beforeRevision, afterRevision, reason, correlationId }
// queryable through the management API
```

### C4 — Execution history record (§7)

```ts
// RFC:465-471
{ executionId,                        // returned at enqueue time by run-now and trigger-fire
  state: 'queued'|'running'|'completed'|'failed'|'killed'|'timed-out',  // transitions written by CAS
  stdout, stderr,                     // bounded, secret-redacted capture
  exitClassification, durationMs,
  revision, snapshotHash }            // "what exactly executed" is always answerable
// scheduled + file-watch events use the same durable event path as webhooks
```

### C5 — Convergence surface (§5.3)

```ts
// change feed event — RFC:305-307
{ epoch, snapshotHash }               // long-poll / SSE subscription

// replica registration + heartbeat — RFC:318-323, RFC:340-343
{ replicaId, supportedSchemaMajors[], epoch, leaseTtl }   // ack per applied epoch

// convergence status (exposed by the management surface) — RFC:321-323
which replicas are at which epoch, + alerting SLO (staleness bounds silence, not serving)

// replica states a UI must distinguish — RFC:351-377
(a) lease-expired-while-serving : serving last-good, out of admission quorum, marked stale past SLO
(b) restarted-with-persisted    : locally validated (hash + schema-major), serving, no CP contact
(c) cold-start-no-valid-snapshot: idle-and-loud — registers nothing, serves nothing, retries w/ backoff
```

### C6 — OTel vocabulary (§7)

```text
span  netscript.automation.execute
      attrs: family, definition.id, revision, runtime, boundary.tier, trigger.correlation
event netscript.automation.lifecycle   (publish | activate | rollback)
join  spans and history records share the execution id
```

### C7 — Dispatch pinning + failure classification (§5.3-6)

```ts
// trigger actions enqueue (taskId, revision, contentHash) — never a bare id  — RFC:333-336
// worker dispatcher resolves the PINNED revision from the immutable store (cache-through)
// failure classes (RFC:336-341):
//   transient (mgmt service/store unreachable, timeout) → queue-native retry w/ backoff
//   terminal  (revision absent, hash mismatch, unsupported schema major) → dead-letter immediately
```

### C8 — RBAC (§5.5)

```text
authenticated principal required for every management action (auth plugin session)  — RFC:424-428
roles (role-per-action): author | approver | operator | viewer
optional two-person rule: author ≠ activator   (default deferred to slice A2b — RFC:807-810)
enforced in the lifecycle engine; policy data lives with the store → CLI and cockpit enforce identically
```

### C9 — RFC file convention

```text
path     docs/architecture/rfc/rfc-NNNN-<kebab-slug>.md     (NNNN 4-digit, zero-padded)
taken    rfc-0001-runtime-versioned-automation.md  (PR #1446, unmerged)
next     rfc-0002-*
header   H1 title → 2-col table (Status | Run record | Tracking | Evidence base | Authority) → `---` → ## Abstract
on main  docs/architecture/rfc/ ABSENT at 2256a67bf
```

---

## Drift candidates

| Expected | Actual | Evidence | Severity |
| --- | --- | --- | --- |
| `docs/architecture/rfc/` is the in-repo RFC home (RFC:9) | The directory does not exist on `main` at `2256a67bf`; it lives only in unmerged PR #1446's worktree, and nothing in the repo (docs index, DOCS-STRUCTURE.md, doc-site config) references it | `git ls-tree -r --name-only 2256a67bf -- docs/architecture/rfc` → empty; `grep -rln "docs/architecture/rfc" --include=*.md --include=*.ts --include=*.json .` → only `.llm/` run/brief files | significant |
| `rfc-0001` is a reserved, registered number | There is no numbering registry, index, or README in `docs/architecture/rfc/`; the only file is the RFC itself, so number reservation is convention-by-filename only | `ls -la /home/codex/repos/ns-rfc-runtime-versioned-automation/docs/architecture/rfc/` → one file | minor |
| P-6 has a defined gate class / acceptance in RFC-0001's roadmap | §12 lists P-6 only in the catch-all row `P-1..P-6 … Gates: —`, and §13's eight acceptance tests contain no DevTools journey (A8 covers "A7 for cockpit journeys") | RFC:670, RFC:686-720, RFC:669 | minor |
| The #934 procedure gateway is the frontend data path | RFC-0001 scopes that claim to Surface 1 only ("For **this surface only**, #890/#922 are sufficient"); it neither grants nor denies the gateway to DevTools | RFC:503-513 | significant |

---

## Open questions

1. Does the P-6 entry criterion ("after A2b, A3b, A2d land") gate **authoring** the DevTools RFC or
   only **implementing** it? §11 is titled "prerequisite RFCs, not faked certainty" (RFC:629),
   suggesting the former is permitted, but the row does not say so. Owner-answerable.
2. May the DevTools host use the #934 deny-by-default procedure gateway, or does a DevTools family
   need its own data seam? RFC-0001 scopes the gateway sufficiency claim to Surface 1 only
   (RFC:503-513) and is silent for Surface 2.
3. Which of the five D-9 contribution surfaces does the DevTools RFC own besides (4)? Surfaces (2)
   Fresh-UI registry extensions and (3) Vite plugin contribution are unratified and unassigned
   (RFC:497-502).
4. Route-level shape of the management oRPC contract is unspecified (RFC:479-482 gives seven
   procedure *groups*, no signatures). Verifiable only when slice A0 lands; until then the DevTools
   RFC must design against group-level semantics, not routes.
5. Package/plugin naming for automation-core/automation-runtime/plugins-automation is deferred to
   slice A0 (RFC:805-807) — the DevTools RFC must not hardcode those names.
6. What is the DevTools acceptance model? RFC-0001's §13 owns none of it (F14). Does DevTools get
   its own `e2e:cli` suite, and at what gate class?
7. Is there a docs-site/index registration obligation for `docs/architecture/rfc/`? None exists
   today (F12); whether the docs gates require one is unverified — would be verified by reading the
   docs-source gate config on this baseline.
8. If PR #1446 is never ratified, does the DevTools RFC inherit the "Authority" claim establishing
   `docs/architecture/rfc/` (RFC:9) and, potentially, the number 0001?
9. Does "dev management affordances" (RFC:638) mean DevTools may *mutate* definitions (publish/
   activate), and if so under which of the four RBAC roles (RFC:424-428)? Not resolved by either
   document.

---

## Sources

- `/home/codex/repos/ns-rfc-runtime-versioned-automation/docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md`
  @ `6cb79675c55e665b9c1daa503f3ed25cd5da8c30` — all `RFC:NNN` line citations above. Sections read in
  full: header 1-12, Abstract 13-40, §3 118-127, §4 128-184, §5.1 186-251, §5.2 252-299, §5.3
  300-379, §5.4 380-416, §5.5 417-431, §7 459-474, §8.1 477-488, §8.2 489-527, §9 529-577, §11
  629-639, §12 640-685, §13 686-736, §15 800-825.
- `/home/codex/repos/ns-rfc-runtime-versioned-automation/.llm/runs/docs-rfc-runtime-versioned-automation--supervisor/drift.md:15`
  — owner directive D-9 verbatim (five contribution surfaces; DevTools staged as P-6).
- `/home/codex/repos/ns-rfc-runtime-versioned-automation/.llm/runs/docs-rfc-runtime-versioned-automation--supervisor/`
  — run record listing (`evidence/` contains `competitive-architecture-study.md`,
  `current-state-matrix.md`, `current-state-probes/`, `legacy-capability-map.md`,
  `sandbox-isolation-survey.md`; plus `1444-impact.md`, `plan-eval.md`). Not read beyond drift.md.
- `gh pr view 1446 --json number,title,state,isDraft,headRefName,baseRefName,url,labels,milestone,commits`
  — PR #1446 OPEN, draft, base `main`, head `docs/rfc-runtime-versioned-automation`, head commit
  `6cb79675c55e665b9c1daa503f3ed25cd5da8c30` ("docs(rfc): record the PLAN-EVAL PASS — cycle 9 closes
  the nine-cycle adversarial evaluation"), milestone `Backlog / Triage`, labels `area:docs`,
  `type:docs`, `ci:skip-e2e`, `area:plugins`, `status:plan-eval`, `area:config`, `ci:skip-scaffold`.
  PR body quoted for locked decisions 9 (two operator frontends) and the S5 PLAN-EVAL PASS record.
- `cd /home/codex/repos/ns-rfc-devtools-contribution && git ls-tree -r --name-only 2256a67bf -- docs/architecture/rfc`
  → empty (RFC directory absent on baseline `main`).
- `ls /home/codex/repos/ns-rfc-devtools-contribution/docs/architecture/` → `DOCS-STRUCTURE.md`,
  `PUBLIC-SURFACE-PATTERNS.md`, `STANDARDS.md`, `doctrine/`, `zod-dependency-boundary.md`.
- `grep -rln "docs/architecture/rfc" --include=*.md --include=*.ts --include=*.json .` (baseline
  worktree) → `.llm/devtools-rfc-orchestrator-brief.md` and this seed run's artifacts only.
