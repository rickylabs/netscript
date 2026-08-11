# Competitive architecture study — runtime/workflow systems vs RFC-0000

Owner-directed (drift D-8), retrieved 2026-08-11 via primary sources (vendor documentation; two
lighter-weight sources are used ONLY for color/representative-UX and never for a load-bearing matrix
cell: a Hatchet HN engineering post and n8n vendor-community guidance; every load-bearing cell cites
vendor documentation, or the cell is marked ◐/unknown). Scope: architecture comparison ONLY — **no
empirical performance claims are made anywhere in this study**; performance is handled exclusively
as executable implementation-stage benchmark gates (§Benchmark gates). Each claim carries its source
URL; quotes are from the retrieved pages.

Systems: Temporal, Restate, Inngest, Trigger.dev, Hatchet, Windmill, Azure Durable Functions (DF),
AWS Step Functions (SFN), and the operator/low-code group Kestra + n8n.

## Per-system profiles (dimensions relevant to RFC-0000)

### Temporal — durable code workflows, worker-deployment versioning

- Definition = code (workflows/activities) executed by app-hosted workers against a server;
  event-history replay demands **deterministic** workflow code.
- Versioning: **Worker Deployment Versions**; a running workflow can be **pinned** "on the Worker
  Deployment Version where it started", with rainbow deployments recommended for pinned workflows;
  safe-deploy doctrine includes replay testing before switching pinned workflows to a new version.
  Sources: https://docs.temporal.io/production-deployment/worker-deployments/worker-versioning ·
  https://docs.temporal.io/worker-versioning · https://docs.temporal.io/develop/safe-deployments
- Live mutation: none for definitions (deploy-driven); operators act on executions (signal/
  cancel/reset), not on definitions.
- Control/data plane: server (control + history) vs app-hosted workers on task queues; self-host
  (OSS server) + cloud.

### Restate — durable execution log, immutable service deployments

- "When you deploy a version of your code, you give it an **immutable, unique endpoint** and
  register it with Restate"; **"When a bug affects in-flight invocations, they remain pinned to the
  original deployment"**, with explicit
  `restate invocations resume <id> --deployment
  <new_deployment_id>` to move them. Deployments are
  removed only when drained. Source: https://docs.restate.dev/services/versioning
- Observability: SQL introspection over invocations incl. `pinned_deployment_id`. Sources:
  https://docs.restate.dev/references/sql-introspection ·
  https://docs.restate.dev/services/introspection
- Single-binary self-host; control plane = broker/log, data plane = service endpoints (any platform
  incl. FaaS).

### Inngest — event-driven durable functions, app sync model

- Functions live in the **app**; the server discovers them by **syncing apps** ("resync your app
  with Inngest whenever you deploy new function configurations"), optionally polling
  (`--poll-interval`). Source: https://www.inngest.com/docs/apps/cloud ·
  https://www.inngest.com/docs/self-hosting
- Versioning doctrine: "deploy changes to functions without explicit version markers"; safe
  evolution strategies documented rather than first-class immutable versions. Source:
  https://www.inngest.com/docs/learn/versioning
- Self-host: single-node `inngest start`, Postgres for configuration/history persistence, Redis for
  queue/run state. Source: https://www.inngest.com/docs/self-hosting
- Control/data plane: server orchestrates; steps execute in the app (HTTP) or connected workers.

### Trigger.dev — task versioning with atomic promote

- Every deploy creates a version (`20240313.1` style); **atomic deploys**: "deploying your tasks …
  without promoting them to the default version" (`--skip-promotion`) then explicit `promote`; app
  pins `TRIGGER_VERSION` so app and tasks move **atomically**; "Atomic versioning allows you to
  deploy new versions … without affecting currently running tasks"; **replay** re-runs a task's
  inputs on the latest version. Sources: https://trigger.dev/docs/versioning ·
  https://trigger.dev/docs/deployment/atomic-deployment · https://trigger.dev/product ·
  https://trigger.dev/docs/self-hosting/overview
- Isolation: managed/self-hosted worker infrastructure runs task code out-of-app.

### Hatchet — Postgres-source-of-truth task orchestration

- "PostgreSQL is the durable store for workflow definitions and execution state …; state transitions
  are performed transactionally." Source: https://docs.hatchet.run/v1/architecture-and-guarantees
- Durable tasks = cached intermediate results + replay on retry (engineering post, color only:
  https://news.ycombinator.com/item?id=43572733).
- Control/data plane: Hatchet engine over Postgres; app-hosted workers. Self-host first-class.

### Windmill — operator-edited scripts/flows with deployment history

- Closest operator model to NetScript's intent: scripts/flows/apps are **edited in the UI**, each
  with versioned deployment history ("Flow versioning", "Deployment history" —
  https://www.windmill.dev/changelog); staging→prod promotion via UI/git
  (https://www.windmill.dev/docs/advanced/deploy_to_prod ·
  https://www.windmill.dev/docs/core_concepts/staging_prod); polyglot execution (Python/TS/Go/
  Bash/SQL) on worker fleets; Docker/K8s self-host
  (https://www.windmill.dev/docs/advanced/self_host).

### Azure Durable Functions — the cautionary versioning tale

- Whole doc trees exist because orchestration replay makes code changes breaking: breaking- change
  taxonomy, **orchestration versioning** (instances "permanently associated with a specific version
  when created"), side-by-side deployments via separate **task hubs**/storage accounts, name-based
  versioning, application routing. Deploying breaking changes unmitigated ⇒ "nondeterministic
  orchestration errors" or stuck `Running`. Sources:
  https://learn.microsoft.com/en-us/azure/durable-task/durable-functions/durable-functions-versioning
  ·
  https://learn.microsoft.com/en-us/azure/durable-task/durable-functions/durable-functions-zero-downtime-deployment
  · https://learn.microsoft.com/en-us/azure/durable-task/common/durable-orchestration-versioning

### AWS Step Functions — declarative definitions, versions + weighted aliases

- Definitions are data (ASL JSON). **Published versions are immutable; aliases route between ≤2
  versions with weights** — canary/rolling/gradual deployment and rollback are documented
  first-class flows; executions are associated with the exact version/alias that started them.
  Sources: https://docs.aws.amazon.com/step-functions/latest/dg/concepts-state-machine-alias.html ·
  https://docs.aws.amazon.com/step-functions/latest/dg/example-alias-version-deployment.html ·
  https://docs.aws.amazon.com/step-functions/latest/dg/version-rolling-deployment.html ·
  https://docs.aws.amazon.com/step-functions/latest/dg/execution-alias-version-associate.html
- Managed-only (non-goal for NetScript self-hosting, but the versioning model is the cleanest
  published analogue to RFC-0000 epochs).

### Kestra / n8n — operator/low-code group

- Kestra: YAML flows edited in the UI editor (https://kestra.io/docs/ui/flows); "Whenever you make
  any changes to your flows, a **new revision is created**" with rollback
  (https://www.youtube.com/watch?v=Z3w1pZxNa9U — vendor material); **plugin versioning + hot
  reload**: "run multiple versions of the same plugin simultaneously"
  (https://kestra.io/blogs/plugin-versioning) — the closest published analogue to plugin-contributed
  runtime families.
- n8n: workflow JSON with **Publish** semantics + Version History (draft vs published live version)
  per vendor community guidance
  (https://community.n8n.io/t/change-from-save-activate-to-publish-for-workflows/258417) —
  representative of draft→publish operator UX; graph-style visual programming is its authoring
  model.

## Comparison matrix (the 12 owner-named dimensions rendered as 15 rows × 9 systems, condensed)

(Versioning is split into four rows — definitions-as-data, immutable versions, activation pointer,
rollback — so the row count exceeds the dimension count by design.)

Legend: ● first-class · ◐ partial/strategy-level **or not assessed from dedicated sources** · ○
absent/out-of-model. "NS" = RFC-0000 position. Cells in the three later-added rows (isolation,
control/data plane, cockpit UX) are either tied to a citation, derived from the cited architecture
structure, or explicitly marked ◐ not assessed — no absolute claim rests on an uncited cell.

| Dimension                           | Temporal                                                                       | Restate                          | Inngest                                         | Trigger.dev                                                                        | Hatchet                        | Windmill                                                                                                                                                                                     | DF                                          | SFN                                                 | Kestra/n8n                                                                        | NS (RFC §)                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------ | -------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Definitions as data (vs code)       | ○ code                                                                         | ○ code                           | ○ code                                          | ○ code                                                                             | ○ code                         | ◐ code+meta, UI-owned                                                                                                                                                                        | ○ code                                      | ● ASL                                               | ● YAML/JSON                                                                       | ● schema-first families (5.1)                                    |
| Immutable versions                  | ● deploy versions                                                              | ● immutable endpoints            | ◐ implicit                                      | ● dated versions                                                                   | ◐                              | ● per-item history                                                                                                                                                                           | ◐ instance-bound                            | ● published versions                                | ● revisions                                                                       | ● content-addressed revisions (5.2)                              |
| Explicit activation pointer/alias   | ◐ current version                                                              | ◐ latest deployment              | ○                                               | ● promote                                                                          | ◐                              | ● deploy-to-prod                                                                                                                                                                             | ○                                           | ● alias (+weights)                                  | ● publish                                                                         | ● epoch manifest (5.2)                                           |
| Rollback = re-point                 | ◐                                                                              | ◐ resume-on-deployment           | ○                                               | ● promote old                                                                      | ◐                              | ● restore version                                                                                                                                                                            | ○                                           | ● alias re-point                                    | ● revision restore                                                                | ● activate older revision (5.2)                                  |
| In-flight pinning                   | ● pinned workflows                                                             | ● pinned invocations             | ◐                                               | ● running tasks unaffected                                                         | ◐                              | ◐                                                                                                                                                                                            | ● instance version                          | ● exec↔version assoc                                | ◐                                                                                 | ● revision-pinned dispatch (5.3-6)                               |
| Operator live mutation (no rebuild) | ○                                                                              | ○                                | ○                                               | ○                                                                                  | ○                              | ● UI edit+deploy                                                                                                                                                                             | ○                                           | ◐ console edit+publish                              | ● UI edit=revision                                                                | ● core journey J1/J2 (1)                                         |
| Scheduling ownership                | server (schedules on defs)                                                     | server                           | server                                          | server                                                                             | server                         | server                                                                                                                                                                                       | server (timers)                             | server                                              | server                                                                            | trigger family only (5.1)                                        |
| Multi-instance consistency          | server-serialized                                                              | log-serialized                   | server-serialized                               | server-serialized                                                                  | Postgres txn                   | Postgres                                                                                                                                                                                     | storage provider                            | managed                                             | server DB                                                                         | epoch admission + acks (5.3)                                     |
| Idempotency/retries/DLQ             | ●                                                                              | ●                                | ●                                               | ●                                                                                  | ●                              | ◐                                                                                                                                                                                            | ●                                           | ◐                                                   | ◐                                                                                 | ● engine-kept + queue-native (5.4)                               |
| History/audit/telemetry             | ● event history                                                                | ● SQL introspection              | ●                                               | ● runs+replay                                                                      | ●                              | ● runs/audit (EE)                                                                                                                                                                            | ●                                           | ●                                                   | ●                                                                                 | ● history+audit stores (5.2, 7)                                  |
| Plugin/extension contribution       | ○                                                                              | ○                                | ○                                               | ○                                                                                  | ○                              | ◐ hub items                                                                                                                                                                                  | ○                                           | ○                                                   | ● versioned plugins, hot reload                                                   | ● contribution families (5.1)                                    |
| Self-host                           | ● OSS server                                                                   | ● single binary                  | ● single node (PG/Redis)                        | ● (pinned version)                                                                 | ●                              | ● Docker/K8s                                                                                                                                                                                 | ◐ Azure-bound                               | ○ managed only                                      | ● / ●                                                                             | ● in-stack, Aspire-composed (4)                                  |
| Isolation of executed code          | app-owned workers (execution stays in the app per the cited architecture docs) | app-owned endpoints (same basis) | app-owned (HTTP/workers, same basis)            | platform/self-hosted worker infrastructure runs task code out-of-app (cited above) | app-owned workers (same basis) | worker fleet executes scripts with **configurable per-job isolation (PID namespaces / NSJAIL; defaults and host caveats apply)** — https://www.windmill.dev/docs/advanced/security_isolation | ◐ not assessed from dedicated security docs | ◐ not assessed from dedicated security docs         | ◐ not assessed from dedicated security docs                                       | tiered boundary port T0–T3, honesty per tier (5.4)               |
| Control/data-plane split            | ● server vs workers                                                            | ● broker/log vs endpoints        | ● server vs app                                 | ● platform vs workers                                                              | ● engine vs workers            | ◐ server+workers one product                                                                                                                                                                 | ● runtime vs app                            | ● managed plane                                     | ◐ single server                                                                   | ● management service vs engine replicas (4)                      |
| Cockpit / operator UX               | exec ops (signal/cancel/reset; cited safe-deploy docs), no def editing         | CLI/SQL introspection (cited)    | ◐ runs UI (not re-verified from dedicated docs) | runs UI + replay + promote (cited)                                                 | ◐ runs UI (not re-verified)    | ● full editor + deploy history (cited)                                                                                                                                                       | ◐ portal ops (not re-verified)              | console editor + publish (cited alias/version docs) | ● editor + revisions (cited) / ● editor + publish (community-sourced, color-only) | list/detail/run/history + draft→activate flows, #922-gated (8.2) |

## Synthesis

### Established patterns RFC-0000 adopts (independent convergence, now cited)

1. **Immutable version + explicit activation pointer + rollback-as-re-point** — SFN
   versions/aliases, Trigger.dev deploy/promote, Restate immutable deployments, Kestra/n8n
   revisions/publish. RFC: revisions + epoch manifests (§5.2). The `--skip-promotion` → verify →
   `promote` shape maps 1:1 to draft → validate → activate.
2. **In-flight work pinned to the version that started it** — Temporal pinned workflows, Restate
   pinned invocations, DF instance-version association, SFN execution↔version association,
   Trigger.dev running tasks. RFC: revision-pinned dispatch (§5.3 step 6) is the same principle
   applied at task granularity.
3. **Database as transactional system of record for definitions + execution state** — Hatchet
   (explicitly), Inngest self-host (Postgres), Windmill. RFC §5.2. In none of the retrieved
   documentation does a studied system consume watched files as its runtime definition source; where
   file formats appear (Kestra YAML, SFN ASL, Windmill git sync) they are authoring/interchange
   surfaces — consistent with RFC-0000's demotion of the filesystem. (Scoped to the retrieved docs,
   not an exhaustive product-wide negative.)
4. **Server-owned scheduling attached to definitions; single-fire is the platform's job** — in every
   studied system whose scheduling is documented in the retrieved sources, schedules attach to
   definitions and fire server-side; no counterexample was found. RFC: trigger-family cron ownership
   (§5.1) + P-1.
5. **App-hosted execution with server-side orchestration and explicit app/worker sync** — Inngest
   app sync/poll, Temporal workers, Restate endpoints, Hatchet workers. RFC: snapshot client +
   change feed + poll fallback (§5.3) is the same control/data split.
6. **Draft → publish operator UX with version history in the cockpit** — Windmill, Kestra, n8n. RFC:
   J1–J3 + §8.2.
7. **Plugin-versioned extensibility** — Kestra plugin versioning/hot-reload is precedent that
   contribution-style extensibility co-exists with a revisioned control plane. RFC §5.1.
8. **Staged/weighted activation (canary) as a proven pointer-model extension** — SFN weighted
   aliases + rolling deployment. RFC adds this as staged item **P-5** (not v1 scope): the epoch
   manifest can carry weighted entry pairs once convergence tracking (A2d) exists.

### Deliberate non-goals (v1), with the evidence for declaring them

- **Replay-determinism durable execution for tasks/triggers.** Temporal/DF/Restate/Inngest/ Hatchet
  all pay a heavy versioning tax for replayable code workflows — DF maintains an entire
  breaking-change taxonomy and four mitigation strategies. NetScript `task@1` is a single-shot,
  engine-retried subprocess execution with no replay contract, so that tax is deliberately not
  imported. Multi-step durable orchestration remains the saga plugin's domain; if a durable `saga@1`
  family arrives (P-4), _these_ systems' versioning lessons apply there.
- **External/managed control plane.** SFN's model is the cleanest but is managed-only; the NetScript
  control plane ships inside the consumer's stack (self-host by construction).
- **Visual graph programming as the authoring model** (n8n-style). The cockpit edits schema-derived
  forms over declarative definitions; it does not introduce a node-graph DSL.
- **A generic compute marketplace.** Out of scope until P-2/P-3 (isolation + provenance land first)
  — consistent with every studied system treating untrusted third-party code as a separate, harder
  product.

### NetScript differentiators (defensible after this study)

1. **In-framework, not alongside it**: definitions live inside the consumer's full-stack app and
   compose with the same auth, DB, streams, sagas, and Aspire topology — every studied system is an
   adjacent server/SaaS the app integrates with.
2. **Operator wrapping of existing project-local polyglot scripts** with declared capability grants
   and honest per-tier enforcement — Windmill is the nearest neighbor but owns the code in its own
   workspace model; NetScript wraps what already lives in the repo/deployment.
3. **Contribution-family extensibility**: third-party plugins add new definition _families_ (not
   just new tasks) through the same manifest/registry machinery as the rest of the framework — only
   Kestra's plugin system is comparable, and it is not schema-first.
4. **One control plane across heterogeneous engines** (workers + triggers today, sagas/streams
   later) rather than one product per engine.

## Benchmark gates (executable, implementation-stage — replacing any performance claim)

No throughput/latency numbers in this study or the RFC are empirical claims about NetScript or the
systems above. Instead, the following gates become part of the named slices; each pins a **reference
environment** (scaffolded stack, documented hardware class) in its slice PR, ships as an executable
measurement, and fails CI on regression. Initial budgets are owner-ratified at slice time; the
_gate_ is that the measurement exists, is reproducible, and is enforced:

| Gate | Measures                                                                              | Lands in                        |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------- |
| BG-1 | activation → all-replica convergence latency (p50/p95, 3 replicas) with SLO assertion | A2d, exercised in A8            |
| BG-2 | per-dispatch overhead of revision-pinned lookup vs direct registry read (warm cache)  | A3a micro-bench                 |
| BG-3 | epoch commit transaction latency (publish+activate+audit) on the reference Postgres   | A1a conformance suite perf case |
| BG-4 | sustained execution-history write rate without queue growth on the reference stack    | A8                              |
| BG-5 | T1 boundary spawn overhead per runtime (deno/python/shell) vs bare subprocess         | A5a                             |

## Limitations

- Retrieval is point-in-time (2026-08-11); vendor docs move. URLs + retrieval date are the
  provenance; re-verify before implementation-stage reliance.
- Kestra revision behavior cites vendor material incl. a vendor video; n8n publish semantics cite
  vendor community guidance — both are representative-group members, held to lighter weight than the
  seven primary systems.
- No hands-on deployment of any studied system was performed in this run (bounded study); the matrix
  reflects documented architecture, not operational experience.
