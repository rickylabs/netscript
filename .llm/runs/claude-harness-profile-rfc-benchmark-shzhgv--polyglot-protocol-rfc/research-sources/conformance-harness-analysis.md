# RFC-5 Round 2 — Analysis: group `conformance-harness`

Reverse-engineering analysis of `conformance-harness-raw.md` (gRPC interop, CloudEvents,
Autobahn|Testsuite, Paho MQTT, LSP-gap evidence), producing the **shape of the NetScript
task-protocol conformance harness**. Cross-references: `netscript-engine-audit.md` (defects
D-1..D-14), round-1 `openapi-codegen-analysis.md` steal #8 (generated capability matrix as the
T0 entry bar — presupposed here), and the supervisor's tier framing (T0 env+framed-stdout
legacy / T1 structured envelope / T2 long-lived duplex worker).

Citation keys: **[G §1.1]** = raw §1.1 gRPC interop descriptions, **[G §1.2]** =
run_interop_tests.py, **[G §1.3]** = interop_matrix README, **[CE §2.1/2.2/2.3]** = CloudEvents
conformance tool / SDK matrix / core spec, **[AB §3.1–3.5]** = Autobahn, **[MQ §4]** = Paho
(paraphrase-fidelity), **[LSP §5]** = LSP gap evidence, **[AUD]** = engine audit, **[OAG-A #n]**
= round-1 openapi-codegen steal n. Anything not traceable to one of these is marked UNVERIFIED.

---

## 0. The one-paragraph verdict

Every healthy protocol in the corpus converges on the same skeleton: a **flat inventory of
named test cases** whose names are the interop currency [G §1.1, AB §3.4], a **reference
implementation of one side** that drives *any* binary implementing the other side [AB §3.1,
G §1.1, LSP §5.2], **per-implementation skip/exclude declarations** that are themselves named
data [G §1.2, AB §3.1], and a **machine-written agent×case report** that doubles as the
capability matrix [AB §3.5]. The one ecosystem that hand-maintains its matrix (CloudEvents)
shows visible rot in the extract itself [CE §2.2], and the one ecosystem that shipped no suite
at all (LSP) is still answering "is there a standard test suite?" nine years later with
community substitutes [LSP §5.1]. NetScript should therefore ship the suite *with* the RFC —
the supervisor framing "the conformance test suite is the contract" is exactly the lesson the
LSP negative evidence teaches — and generate the tier declaration from harness output, never
from prose.

---

## 1. Case identity: named cases, dotted IDs, tier-and-verb addressing

### 1.1 Precedents

- **gRPC**: cases are lowercase, space-free names (`empty_unary`, `client_compressed_unary`)
  passed to the client under test as `--test_case=TESTCASE` [G §1.1]. Names are the API: the
  skip lists [G §1.2], the frozen per-release testcase files [G §1.3], and the doc anchors all
  key on them.
- **Autobahn**: case identity is a dotted integer tuple derived from the case class name
  (`Case1_1_1` → `"1.1.1"`), and the dots carry category semantics — config files exclude whole
  categories by wildcard: `"exclude-cases": ["9.*", "12.*", "13.*"]` (performance and
  compression) [AB §3.1, §3.4]. The README explicitly ties `12.*/13.*` exclusion to "only make
  sense if your client library implements permessage-deflate" — **category prefix ==
  optional-feature boundary** [AB §3.1].
- **MQTT/Paho**: case = fully-qualified unittest method path (`Test.test_name`), selected per
  protocol version by choosing the script (`client_test5.py` vs `client_test.py`) [MQ §4]. This
  is the weak variant: version lives in the *filename*, not the case ID, so no cross-version
  matrix falls out.

### 1.2 NetScript shape

Adopt **both** conventions at once, which the sources jointly permit: a case ID is a dotted
path whose segments are lowercase names (gRPC naming rule) and whose prefix structure supports
wildcard selection (Autobahn exclusion semantics):

```
<tier>.<verb>.<behavior>
```

- `tier` ∈ `t0 | t1 | t2` — the segment wildcards give tier selection for free:
  `cases: ["t0.*", "t1.*"]` is a T1 run, exactly as `"9.*"` excludes Autobahn's perf tier
  [AB §3.1].
- `verb` is the RFC-5 protocol verb the case exercises (T0: `env`, `result`, `exit`,
  `timeout`; T1: adds `envelope`, `trace`, `log`, `error`; T2: adds `handshake`, `heartbeat`,
  `progress`, `cancel`, `callback`, `shutdown`). Verb segment == Autobahn's category digit,
  but readable, per the gRPC "names are simple descriptions for developer communication"
  rule for features [G §1.1].
- `behavior` is a gRPC-style behavioral name (`task_id_present`, `log_line_not_hijacked`).

**Illustrative starter inventory** (the RFC owns the normative list; defect-derived cases
cite the audit):

| Case | Grounding |
| --- | --- |
| `t0.env.task_id_present`, `t0.env.payload_json` | pins today's `TASK_ID`/`TASK_PAYLOAD` contract [AUD §1.1] the way `empty_unary` pins the zero-size floor [G §1.1] |
| `t0.env.no_supervisor_env_leak` | D-9: base env is `Deno.env.toObject()` [AUD §1.4/D-9]; negative-behavior cases are precedented — `CompressedRequest` *requires* the server to fail with `INVALID_ARGUMENT` [G §1.1] |
| `t0.result.last_line_object` / `t0.result.non_object_ignored` / `t0.result.empty_stdout_null` | pins the exact `parseJsonLastLine` semantics incl. its silent-null branches [AUD §1.4] — T0 is legacy-freezing, so its cases must encode the quirks verbatim |
| `t0.exit.nonzero_is_failure`, `t0.timeout.child_killed` | [AUD §1.4, D-7/D-8] |
| `t1.envelope.result_frame`, `t1.envelope.error_frame` | D-3/D-13 fix gate: framed result channel instead of stdout scavenging [AUD D-3, D-13] |
| `t1.log.log_line_not_hijacked` | the D-3 discriminator case: a `{"level":"info"}` log line must NOT become `result` [AUD D-3] |
| `t1.trace.traceparent_received`, `t1.trace.correlation_id_received` | D-1/D-2 fix gate [AUD D-1, D-2]; round-1 [OAG-A #7] |
| `t1.error.schema_validated` | D-4 fix gate [AUD D-4] |
| `t2.handshake.hello_capabilities`, `t2.heartbeat.interval_respected`, `t2.cancel.graceful_stopping`, `t2.cancel.deadline_kill`, `t2.progress.frames_persistable`, `t2.callback.enqueue`, `t2.shutdown.drain` | supervisor T2 verb list; D-5/D-6/D-12 fix gates [AUD D-5, D-6, D-12] |

### 1.3 Case document template (normative form of each case)

Copy the gRPC template verbatim in structure [G §1.1]: every case is a heading (`###
t1.log.log_line_not_hijacked`) followed by (a) prose intent, (b) a **`Host features:` /
`Requires capabilities:` list of named links** into the RFC's feature sections (gRPC's
`Server features: [UnaryCall][] [CompressedRequest][]` — the markdown-anchor linkage makes the
capability vocabulary and the case inventory mutually indexing [G §1.1]), (c) a numbered
`Procedure:`, (d) a `Harness asserts:` list. Autobahn adds the machine twin: each case class
carries `DESCRIPTION` + `EXPECTATION` strings alongside the executable expectation wiring
[AB §3.4] — NetScript cases should be TypeScript objects carrying the same two strings so
report generation needs no second source (§4).

### 1.4 Maturity quarantine

gRPC keeps three named non-matrix tiers inside the *same document*: `Experimental Tests`
("not yet standardized … not part of our interop matrix"), `TODO Tests` (prioritized prose
with owners), `Postponed Tests` [G §1.1]. NetScript should reserve the same states —
`experimental` cases are runnable but excluded from tier computation, `todo` are registered
names without drivers — so that a case name can be claimed (and cited by issues) before its
implementation lands, without polluting the matrix. This is also where perf/soak cases live
(`rpc_soak`/`channel_soak` are in-matrix for gRPC but Autobahn quarantines `9.*` behind
default-off exclusion [AB §3.1]; recommend Autobahn's stance: named, runnable, excluded by
default).

---

## 2. The reference host driver

### 2.1 Precedents

- **Autobahn** is the strongest model: one tool, `wstest`, with **mode inversion** —
  `fuzzingclient` (reference client drives a server under test), `fuzzingserver` (reference
  server receives clients under test), plus `testeeserver`/`testeeclient` reference testees
  for validating the suite against itself [AB §3.1]. Config is a small JSON: `url`, `outdir`,
  `cases`, `exclude-cases`, `exclude-agent-cases` [AB §3.1, §3.2]. Testee identity ("agent")
  comes from `--ident` or the peer's advertised agent string, and is the matrix column key
  [AB §3.5].
- **gRPC** splits driver from testee by CLI contract only: any client binary accepting
  `--server_host/--server_port/--test_case` can be driven; any server binary accepting
  `--port/--use_tls` can serve [G §1.1]. The orchestrator (`run_interop_tests.py`) knows each
  language only as `client_cmd()`/`server_cmd()` + skip lists [G §1.2].
- **pytest-lsp** proves the subprocess-over-stdio driver generalizes across languages: "It
  works by running the language server in a subprocess and communicating with it over stdio…
  can be used to test language servers written in any language" with
  `ClientServerConfig(server_command=[...])` [LSP §5.2]. This is exactly NetScript's task
  topology (host spawns task over env/stdio [AUD §1.3–1.4]).
- **CloudEvents** contributes the fixture-driven variant: `invoke` replays YAML fixtures at a
  target, `listen` captures live traffic *as* YAML fixtures, `diff --match … --ignore-additions`
  does fuzzy golden comparison [CE §2.1].

### 2.2 NetScript shape

A single driver binary, `task-conformance` (working name), with Autobahn-style modes:

1. **`testee-task` mode (primary).** The driver *is* a reference NetScript host: it spawns the
   task binary per case using a pytest-lsp-style command spec
   (`{ cmd: string[], cwd?, env?, ident: string }` [LSP §5.2]), injects the tier-appropriate
   input contract (T0 env vars; T1 envelope; T2 duplex session), and evaluates the case's
   expectation machine. Spawn-per-case for T0/T1 (matching today's one-shot engine
   [AUD §1.2]); one long-lived process per T2 session-case group.
2. **`testee-host` mode (inversion).** The driver plays a **reference task** against a host
   implementation under test — the Autobahn fuzzingserver/fuzzingclient inversion [AB §3.1]
   and the gRPC client/server pairing [G §1.1]. This is what keeps `plugin-workers-core`'s own
   `DaxProcessRunner` successor honest: the engine defects (D-3, D-9) are *host-side* bugs,
   and only an inverted suite can gate them. The reference stubs already in the tree
   (python/shell/powershell task stubs echoing argv/env JSON [AUD §1.1]) are the seeds of the
   reference-testee corpus, mirroring Autobahn's `testeeserver`/`testeeclient` self-check
   role [AB §3.1].
3. **`record` mode (T2 debugging).** Capture the frame transcript of a real host↔task exchange
   to a fixture file — CloudEvents `listen -v > got.yaml` (optionally forwarding to a real
   target with `-t`) [CE §2.1] and lsp-devtools' `agent`/`record` interception pattern
   [LSP §5.2]. Recorded fixtures feed golden comparisons via fuzzy diff with `--match` keys
   and `--ignore-additions` [CE §2.1], which is how envelope cases stay tolerant of optional/
   extension fields (CloudEvents "OPTIONAL … Intermediary SHOULD forward OPTIONAL attributes"
   [CE §2.3]).

**Config file** copies the Autobahn shape field-for-field: `{ testees: [{ident, cmd, …}],
outdir, cases: ["t0.*","t1.*"], "exclude-cases": [...], "exclude-agent-cases": {"<ident>":
[...]} }` [AB §3.1, §3.4 — `checkAgentCaseExclude` is the per-implementation hook]. Multiple
testees in one run aggregate into one report ("do NOT stop the container … the generated
reports will include all clients" [AB §3.1]).

### 2.3 Verdict vocabulary — steal Autobahn's, including the dual verdict

Autobahn's per-case result is **two independent verdicts**: `behavior` (the protocol exchange)
and `behaviorClose` (the closing handshake), each drawn from
`OK / NON-STRICT / FAILED / WRONG CODE / UNCLEAN / FAILED BY CLIENT / INFORMATIONAL /
UNIMPLEMENTED` [AB §3.3]. NetScript should mirror this exactly:

- `behavior` — did the task produce the required frames/result;
- `behaviorExit` — did the process end correctly (exit code, drain-on-cancel, timeout kill).

The split matters because the engine's known failure modes live disproportionately on the exit
axis (D-7 string-sniffed timeouts, D-8 status collapse, D-6 unkilled aborts [AUD]). The
graded vocabulary also matters: `NON-STRICT` legitimizes "works but not to the letter"
without failing the tier (Autobahn keys distinct expected event sequences per verdict —
`self.expected[Case.OK] = […]` [AB §3.4]), and `UNIMPLEMENTED` is the machine-readable cell
value that makes the capability matrix honest (§3). `INFORMATIONAL` covers measurement-only
cases (Autobahn's `reportTime`/`reportCompressionRatio` flags [AB §3.3] — NetScript twin:
spawn-latency or frame-throughput cases that report but never fail).

---

## 3. The capability matrix: generated, cross-checked, tier-deriving

### 3.1 The negative precedent (why not hand-written)

CloudEvents' feature-support matrix is normatively **self-declared**: "Each SDK must update
the following support table periodically to ensure they accurately [reflect] the status"
[CE §2.2]. The extract's own copy of that table shows the failure mode: whole language columns
(Go, Kotlin, PHP, PowerShell) are blank across every feature row [CE §2.2] — not "unsupported",
just *unmaintained*. Round-1 recorded the same rot inside openapi-generator (rust `STABLE`
metadata vs "(beta)" doc header) [OAG-A, drift note under steal #8]. Conclusion carried into
RFC-5: **the matrix is harness output, never prose input.**

### 3.2 The positive precedents (three layers that must agree)

1. **Declaration**: each adapter/testee declares what it does *not* implement as lists of case
   names — gRPC's per-language `unimplemented_test_cases()` /
   `unimplemented_test_cases_server()` returning composed named skip-groups
   (`_SKIP_COMPRESSION + _ORCA_TEST_CASES`) [G §1.2]. NetScript twin: a
   `conformance.unimplemented: ["t2.*"]` block in the adapter/testee manifest; skip-groups are
   named constants in the suite (`SKIP_DUPLEX`, `SKIP_CALLBACKS`) so declarations compose from
   vocabulary, not ad-hoc strings [G §1.2].
2. **Probing**: capability presence is *testable at runtime* — gRPC's
   `client_compressed_unary` sends a probe call and interprets `INVALID_ARGUMENT` as
   "feature present" [G §1.1]. NetScript twin: T2 `handshake.hello_capabilities` returns the
   task's self-reported capability set; T1 features are probed behaviorally (send a cancel
   frame, observe reaction).
3. **Observation**: the harness records actual per-case verdicts, double-indexed
   `agent → case` and `case → agent` [AB §3.5].

The harness's distinctive obligation is the **cross-check**: declared-unimplemented but
observed-OK (declaration rot, CloudEvents-style) and declared-implemented but
observed-UNIMPLEMENTED (aspiration rot, openapi rust-style) are both first-class report
findings, not silent cells. UNVERIFIED: no source in the extract performs this cross-check
automatically — gRPC trusts declarations (skips are simply not run [G §1.2]) — so this is a
NetScript synthesis, though each ingredient is sourced.

### 3.3 Tier = named case-set over the matrix

A tier declaration is **computed**: `T1 achieved` ⇔ every non-excluded case matching
`t0.* ∪ t1.*` has `behavior ∈ {OK, NON-STRICT, INFORMATIONAL}` and `behaviorExit` likewise.
Grounding for tier-as-case-set rather than tier-as-flag:

- gRPC's skip-groups already partition the case inventory into feature bundles that languages
  opt out of wholesale [G §1.2];
- CloudEvents encodes MUST/SHOULD stratification per feature ("MUST support structured-mode …
  SHOULD support binary-mode … SHOULD support batch-mode" [CE §2.2]; "implementations MUST
  support the JSON format" [CE §2.3]) — i.e. the spec itself is already a tiered case-set,
  NetScript just makes the sets executable;
- Autobahn's default config expresses "conformance minus optional features" as case-pattern
  subtraction [AB §3.1].

Matrix rows carry the same linkage CloudEvents rows do: **row identity is a spec-section
reference** ("each feature row links to the exact spec document/anchor that defines it"
[CE §2.2]) — NetScript matrix rows link into RFC-5 section anchors, closing the loop with the
case template's `Requires capabilities:` links (§1.3).

### 3.4 Versioning axes

- **Protocol version blocks**: the matrix repeats per protocol version, exactly as
  CloudEvents duplicates the full row taxonomy under `**[v1.0]**` and `**[v0.3]**` [CE §2.2].
  Adopt the CloudEvents support-window policy verbatim as the RFC's SDK/adapter policy:
  latest(N) and N-1 major protocol versions, latest minor within a major [CE §2.2].
- **Frozen per-release case sets**: gRPC generates and *commits* `testcases/<lang>__<release>`
  as functional scripts — the case list is pinned per language and per release tag [G §1.3].
  NetScript twin: the harness emits a committed `capabilities/<adapter>@<protocol-version>.json`
  per release; nightly runs re-verify old adapters against the latest host (gRPC's "continuous
  nightly test setup to test gRPC backward compatibility between old clients and latest
  server" [G §1.3]).
- **Frozen reference testbed**: Autobahn deliberately freezes its Docker image ("preserve a
  stable, reproducible reference testbed against which … implementations can validate
  conformance — even as the main project evolves" [AB §3.1]). NetScript twin: the reference
  driver for protocol version N is tagged/pinned once N ships; the suite for a released
  protocol version never chases the trunk.
- **Fixture-corpus versioning by directory** for recorded golden frames: `fixtures/v1/…`
  (CloudEvents `invoke -f ./yaml/v0.3` [CE §2.1]).

### 3.5 Report artifacts

Machine layout copied from Autobahn's generator [AB §3.5]:

- `index.json` — the matrix (double-indexed, both orientations);
- `<ident>_case_<case-id>.json` — per-(testee, case) detail including the captured frame
  transcript and both verdicts;
- `index.html` — human roll-up: testees as columns, **two cells per testee per case**
  (behavior + exit verdict), case rows grouped by verb sub-category, `DESCRIPTION`/
  `EXPECTATION` block appended [AB §3.5 — table `id="agent_case_results"`, two `<td>` per
  agent, `case_subcategory` grouping, `test_case_descriptions` block];
- **JUnit XML for CI ingestion** — both gRPC pipelines emit junit-style XML precisely because
  CI systems key on it (`report.xml` default in the matrix runner [G §1.3]; the
  `sponge_log.xml` suffix comment: "important for reports to get picked up by internal CI"
  [G §1.2]).

The JSON verdict artifact is the durable gate evidence; HTML and JUnit are projections.

---

## 4. Where it lives in NetScript

Repo-mapping (grounded in the audit's architecture directive plus repo doctrine; the corpus
constrains the *shape*, not the path — path choices below marked accordingly):

- **Case definitions, verdict types, expectation machine, matrix schema** →
  `packages/plugin-workers-core/src/testing/conformance/`. The auth blueprint core package
  already carries a `testing/` doctrine folder [AUD §4], and the supervisor's protocol-first
  directive puts the protocol (and therefore its executable contract) in
  `plugin-workers-core` with ports [AUD §4, owner directive]. Cases are data + expectation
  wiring in the Autobahn class style [AB §3.4]: `{ id, description, expectation, requires:
  [capability-anchors], run(session): Verdicts }`.
- **The driver CLI** (`testee-task` / `testee-host` / `record` modes) → exposed as a repo task,
  `deno task conformance:tasks -- --config <json>` with per-mode flags mirroring `wstest -m
  <mode> -s <spec> -i <ident>` [AB §3.1]. UNVERIFIED whether doctrine prefers the CLI binary
  itself in core `testing/` or as a sibling tool package; the constraint that matters (from
  the sources) is that *any* task binary is drivable via command-spec alone [LSP §5.2, G §1.2]
  — no NetScript imports required by the testee.
- **Reference testees** → the existing scaffold task stubs (python/shell/powershell
  [AUD §1.1]) extended into one reference testee per tier per runtime family, playing
  Autobahn's `testeeclient` self-validation role [AB §3.1].
- **CI lanes**:
  1. *PR lane*: `testee-host` inversion against the in-tree engine + `t0.*`/`t1.*` over the
     reference stubs — cheap, spawn-per-case, part of merge readiness alongside `e2e:cli`
     (repo AGENTS.md gate structure; lane composition itself UNVERIFIED/repo-policy).
  2. *Nightly matrix lane*: full tier sweep × all reference testees × supported protocol
     versions (N, N-1), producing committed `capabilities/*.json` and the HTML matrix —
     modeled on gRPC's nightly old-client/latest-server compatibility matrix with per-release
     images [G §1.3].
  - Verdict JSON should flow through the repo's durable gate-receipt mechanism
    (`.llm/tools/gates/run-gate.ts` per AGENTS.md) — repo-native detail, UNVERIFIED against
    the corpus but aligned with the "JSON artifact is the durable verdict" finding above.
- **Perf/soak cases** (`t2.heartbeat` under load, spawn-latency): named and registered but
  excluded from both lanes by default via `exclude-cases`, Autobahn `9.*`-style [AB §3.1].

---

## 5. What the corpus says NOT to do

1. **No hand-maintained matrix** — CloudEvents blank-column rot [CE §2.2]; openapi
   STABLE-vs-beta drift [OAG-A]. Matrix cells come only from harness runs.
2. **No suite-less protocol launch** — LSP #353 ("Is there a standard suite of tests…?",
   2017, closed without a quoted answer, still the canonical citation [LSP §5.1]); the
   community substitute had to invent per-client capability *profiles*
   (`client_capabilities("visual-studio-code")` [LSP §5.2]) because no canonical case
   inventory existed. Corollary steal, though: **named host-capability profiles** are useful
   *inside* the harness — T2 cases can run against "reference host, minimal profile" vs
   "reference host, full profile", the pytest-lsp parameterization inverted.
3. **No version-in-filename suites** — Paho's `client_test5.py` vs `client_test.py` split
   [MQ §4] yields no cross-version matrix; version is a matrix axis, not a script fork.
4. **No unittest-output-only reporting** — Paho again ("does not describe a report format
   beyond unittest output" [MQ §4]); without the JSON/HTML/JUnit triple, the matrix and the
   tier computation have no substrate.
5. **No issue-tracker capability tracking** — Paho tracks unimplemented capabilities "as
   GitHub issues … rather than as declarations in the suite" [MQ §4]; declarations must live
   in the manifest where the harness can cross-check them (§3.2).
6. **No conflating perf with conformance** — Autobahn quarantines `9.*` by default [AB §3.1];
   gRPC quarantines experimental/TODO/postponed out of the matrix [G §1.1].

---

## 6. Steal register (ranked)

| # | Steal | Source | NetScript landing |
| --- | --- | --- | --- |
| S1 | Case template: prose intent + `Requires capabilities:` anchor-links + `Procedure:` + `Harness asserts:` | gRPC [G §1.1] | §1.3; RFC-5 appendix format for every case |
| S2 | Dotted case IDs with wildcard select/exclude (`cases`/`exclude-cases`/`exclude-agent-cases` JSON config) | Autobahn [AB §3.1, §3.4] | §1.2, §2.2; tier selection is `t<k>.*` |
| S3 | Dual per-case verdict (`behavior` + `behaviorExit`) with graded vocabulary incl. `NON-STRICT`, `UNIMPLEMENTED`, `INFORMATIONAL` | Autobahn [AB §3.3] | §2.3; exit-axis gates D-6/D-7/D-8 |
| S4 | Reference-side driver + mode inversion (drive any task; also drive any host with a reference task) | Autobahn modes [AB §3.1], gRPC pairing [G §1.1] | §2.2; inversion is how host defects D-3/D-9 get gated |
| S5 | Subprocess command-spec testee contract — any language, no SDK required to be testable | pytest-lsp [LSP §5.2], gRPC `client_cmd()` [G §1.2] | §2.2 config |
| S6 | Generated double-indexed matrix (`index.json` + per-(agent,case) detail + HTML roll-up) as THE capability declaration | Autobahn [AB §3.5], anti-precedent CloudEvents [CE §2.2] | §3.1, §3.5 |
| S7 | Named skip-group constants + per-adapter `unimplemented` declarations, cross-checked against probe/observation | gRPC [G §1.2, §1.1 probe case]; cross-check is NetScript synthesis (§3.2, UNVERIFIED as precedent) | §3.2 |
| S8 | Tier = executable case-set over the matrix; MUST/SHOULD stratification becomes tier membership | CloudEvents [CE §2.2, §2.3], gRPC skip-groups [G §1.2] | §3.3 |
| S9 | Frozen reference testbed per protocol release + committed per-release capability files + nightly old-vs-new lane | Autobahn frozen image [AB §3.1], gRPC `testcases/<lang>__<release>` + nightly [G §1.3] | §3.4, §4 CI lane 2 |
| S10 | `record` mode + fuzzy golden diff (`--match`, `--ignore-additions`) for envelope fixtures tolerant of extensions | CloudEvents [CE §2.1], lsp-devtools [LSP §5.2] | §2.2 mode 3 |
| S11 | Matrix rows/case requirements link to exact spec anchors (spec-section == capability identity) | CloudEvents [CE §2.2], gRPC feature anchors [G §1.1] | §1.3, §3.3 |
| S12 | N / N-1 protocol-version support window; matrix duplicated per version block | CloudEvents [CE §2.2] | §3.4 |

---

## 7. Open questions

1. **Autobahn's rendered public reports were unreachable** (DNS failure; structure
   reconstructed from `fuzzing.py` source [AB §3.5, collection notes]) — the HTML roll-up
   design in §3.5 is source-derived, not visually verified. Narrow refetch of
   `crossbar.io/autobahn/testsuite/reports/{servers,clients}/index.html` would confirm; not
   blocking (the JSON layout is fully evidenced).
2. **LSP #353 maintainer answer never retrieved** [LSP §5.1, collection notes] — the "no
   official suite" claim rests on the issue's continued citation plus secondhand search
   characterization; marked accordingly. Does not change the design conclusion.
3. **Declared-vs-observed cross-check has no direct precedent** (§3.2) — every source either
   trusts declarations (gRPC) or self-reports (CloudEvents). Worth a deliberate RFC-5
   design-note defending the synthesis.
4. **Exact package home of the driver CLI** (core `testing/` vs sibling tool package) is a
   doctrine call the corpus cannot settle — flag for the netscript-doctrine gate in the plan
   slice.
5. **T2 duplex case granularity**: Autobahn/gRPC cases are one-exchange-per-case; a T2
   long-lived worker session amortizes handshake across cases. Whether a session hosts many
   cases (faster, order-coupled) or one case each (isolated, slower) has no precedent in this
   extract — candidate for a spike measurement. UNVERIFIED either way.
6. **AMQP-style broker-mediated conformance** was not covered (collection notes) — if RFC-5's
   T2 transport ends up broker-mediated rather than stdio-duplex, this corpus under-informs
   that variant.
