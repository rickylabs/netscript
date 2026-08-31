# RFC-5 source analysis — group "faktory-sidekiq"

Analyst: reverse-engineering pass for NetScript RFC-5 (polyglot worker tasks → ecosystem citizens).
Extracts analyzed:

- `/home/user/netscript/.llm/tmp/docs/faktory-sidekiq-raw-01-faktory.md` (Faktory wiki
  Worker-Lifecycle / The-Job-Payload / Job-Errors / Mutate-API, verbatim; `contribsys/faktory`
  server + client Go source; `faktory_worker_go` consumer source). Cited below as **[F §n]**.
- `/home/user/netscript/.llm/tmp/docs/faktory-sidekiq-raw-02-sidekiq.md` (Sidekiq wiki
  Job-Lifecycle / Job-Format / Error-Handling / Signals, verbatim). Cited below as **[S §n]**.

The named wiki page "The Protocol" does not exist in the Faktory wiki as of the 2026-02-19 wiki
commit; the extract documents this and shows the protocol material actually lives in
`Worker-Lifecycle` + `server/commands.go` [F header note]. Nothing in the analysis below depended on
the failed fetches.

Scope note: Sidekiq has **no worker wire protocol** — workers talk directly to Redis [S header
note]. Faktory is effectively "Sidekiq's design extracted into a language-agnostic wire protocol,"
which makes it the single most on-point prior art for RFC-5: it is exactly the move NetScript wants
to make (polyglot workers as first-class citizens of one versioned protocol).

---

## 1. Message / verb inventory with wire shapes

### 1.1 Framing alphabet

- **Client → server**: line-oriented text, `VERB {JSON}\r\n` (or `VERB arg1 arg2` for FETCH/QUEUE)
  [F §1 "The Faktory protocol is line-oriented … VERB {JSON}", F §7 `writeLine`].
- **Server → client**: RESP (Redis protocol) primitives [F §1, F §5 `connection.go`]:
  - `+OK\r\n` — simple success
  - `-ERR msg\r\n` or `-CODE msg\r\n` — error; `CODE` comes from `manager.KnownError.Code()`
  - `:N\r\n` — integer
  - `$len\r\n<bytes>\r\n` — bulk string (JSON payloads)
  - `$-1\r\n` — nil bulk (e.g. FETCH with no job)

### 1.2 Server command set (authoritative, from `server/commands.go` [F §5])

| Verb | Direction | Wire shape (request) | Response | Notes |
| --- | --- | --- | --- | --- |
| `HI` | server→client, on connect | `HI {"v":2}` or `HI {"v":2,"s":"<nonce>","i":<iters>}` | — | Not in CommandSet; pre-loop handshake [F §1, §5, §7] |
| `HELLO` | client→server | `HELLO {"hostname":…,"wid":…,"pid":…,"labels":[…],"pwdhash":…,"v":2}` | `+OK` | Producer-only can be `HELLO {"v":2}` [F §1] |
| `PUSH` | client→server | `PUSH <job json>` | `+OK` | [F §7 verb table] |
| `PUSHB` | client→server | `PUSHB <json array of jobs>` | bulk JSON `map[JID]ErrorMessage` | Bulk push with per-job error map [F §7] |
| `FETCH` | client→server | `FETCH q1 q2 q3` (space-separated queue names, priority order) | bulk job JSON or `$-1` nil | Blocks ~2 s on empty [F §1]; server context timeout 5 s [F §5 `fetch`] |
| `ACK` | client→server | `ACK {"jid":"<jid>"}` | `+OK` | Success report [F §1, §5] |
| `FAIL` | client→server | `FAIL {"jid":…,"errtype":…,"message":…,"backtrace":[…]}` | `+OK` | Failure report [F §1, §9 `FailPayload`] |
| `BEAT` | client→server | `BEAT {"wid":…,"rss_kb":…[,"current_state":"quiet"\|"terminate"]}` | `+OK` **or** bulk `{"state":"quiet"\|"terminate"}` | Bidirectional lifecycle channel [F §1, §5 `heartbeat`, §7 `Beat`] |
| `INFO` | client→server | `INFO` | bulk JSON stats blob | [F §1] |
| `FLUSH` | client→server | `FLUSH` | `+OK` | Wipe everything (dev) [F §5, §7] |
| `MUTATE` | client→server | `MUTATE {"cmd":"kill"\|"discard"\|"requeue","target":"retries"\|"scheduled"\|"dead","filter":{…}}` | UNVERIFIED (response shape not in extract) | Admin surgery on sets [F §4] |
| `QUEUE` | client→server | `QUEUE PAUSE a b` / `QUEUE RESUME *` / `QUEUE REMOVE [names…]` | UNVERIFIED response shape | [F §4, §5] |
| `BATCH`, `TRACK` | client→server | Enterprise; OSS returns `-ERR … only available in Faktory Enterprise` | `-ERR` in OSS | [F §5] |
| `END` | client→server | `END` (no payload) | — | Graceful connection close [F §5, §7] |

### 1.3 Job payload (the one shared document both sides read)

Canonical `client/job.go` struct [F §8]; mandatory trio `jid` / `jobtype` / `args` [F §2]:

```json
{
  "jid": "123861239abnadsa",          // required, >=8 chars enforced server-side [F §9]
  "jobtype": "SomeName",              // required — dispatch key
  "args": [1, 2, "hello"],            // required — native JSON values ONLY [F §2]
  "queue": "default",
  "reserve_for": 300,                 // lease seconds; 60 min, 86400 max, 1800 default [F §2, §9]
  "at": "2017-12-20T15:30:17.111222333Z",  // RFC3339Nano schedule time
  "retry": 4,                          // 25 default; 0 = discard on fail; -1 = straight to Dead
  "backtrace": 10,                     // retain up to N backtrace lines
  "created_at": "...", "enqueued_at": "...",   // server-stamped metadata
  "failure": { "failed_at":…, "next_at":…, "message":…, "errtype":…, "backtrace":[…],
               "retry_count":N, "remaining":N },  // server-maintained failure history [F §8]
  "custom": { "locale":"fr", "request_id":"…" }   // ONLY sanctioned extension point [F §2]
}
```

Key design rules stated verbatim:

- Args must be native JSON datatypes — "You cannot pass complex objects/structures or other types,
  even if they are native to your specific language" [F §2]. A job = a function invocation: jobtype
  is the function name, args the parameters [F §2].
- "Faktory **will discard** any custom data elements outside of the `custom` hash" [F §2] — the
  schema is closed; extension lives in exactly one namespaced bag, and keys starting with `_` are
  reserved for the system (`_bid`, `_txid`) [F §8].

### 1.4 Sidekiq job JSON (delta)

Same conceptual document, different spellings [S §2]: `class` vs `jobtype`; failure fields flat at
top level (`error_class`/`error_message`/`error_backtrace`/`retry_count`/`failed_at`/`retried_at`)
vs Faktory's nested `failure` hash; timestamps as integer epoch-ms (changed in Sidekiq 8.0 from
float epoch-seconds "to avoid floating point numbers (which have a long, sad history in JSON and
JS)") vs Faktory RFC3339Nano strings; `retry` may be `true|false|N` vs Faktory integer-with-`-1`
sentinel. The Sidekiq 8.0 timestamp migration is a cautionary tale: pick the timestamp encoding
once, in v1 of the protocol.

---

## 2. Lifecycle state machine (as actually implemented)

### 2.1 Worker-process lifecycle (Faktory server, `server/workers.go` [F §6])

```
running ──→ quiet ──→ terminate ──→ (process exit)
```

- **Strictly monotonic.** `Signal(newstate)` enforces forward-only transitions: "you cannot
  'unquiet' a worker, it must be restarted" [F §6]. Deploy tooling must account for this ("Any
  deploy error/rollback should account for this" [F §1]).
- **running** — fetch + execute normally.
- **quiet** — "stop FETCHing new jobs but continue working on existing jobs. It should not exit,
  even if no jobs are processing" [F §6]. Server side: a FETCH from a non-running worker sleeps 2 s
  and returns nil rather than erroring [F §5 `fetch`] — quiesced workers degrade to no-ops, they
  are not rejected.
- **terminate** — exit within N seconds (recommended 30; Ruby/Go workers use 25, reserving the last
  ~5 s to cancel lingering jobs before the platform's hard 30 s kill) [F §6, §10 `NewManager`
  comment]. Lingering jobs are force-killed and **FAILed so they retry** [F §1, §6].
- **BEAT never stops**: "A worker process should never stop sending BEAT. Even after 'quiet' or
  'terminate', the BEAT should continue, only stopping due to process exit()" [F §6].

The client mirrors this exactly (`faktory_worker_go`): `state` field `"" → "quiet" → "terminate"`;
fetch loop checks `if mgr.state != "" { return }` [F §10 `process`]; `Terminate` closes done
channel, schedules context-cancel after `ShutdownTimeout`, waits for in-flight jobs, then exits
[F §10]. Lifecycle event hooks are a fixed vocabulary: `Startup`, `Quiet`, `Shutdown` [F §10].

State changes arrive over TWO redundant channels: Unix signals locally (TSTP=quiet, TERM/INT=
terminate, TTIN=dump [F §10 `runner_unix.go`; S §4]) and the BEAT reply remotely (server pushes
`{"state":"quiet"}` [F §1, §5]). The worker can also *report* a locally-initiated state change
upward via `current_state` in the BEAT body [F §5 `ClientBeat`, §7 `Beat`].

### 2.2 Job lifecycle (Sidekiq vocabulary [S §1], identical topology in Faktory)

```
Scheduled ──→ Enqueued ──→ Busy ──→ Processed  (terminal)
                             │
                          (error)
                             ↓
                         Retries ──(backoff, re-enqueue)──→ Enqueued …
                             │
                     (retries exhausted)
                             ↓
                           Dead  ──(manual retry via UI)──→ Enqueued …
                             └──(TTL: 6 months Sidekiq / 180d Faktory)──→ purged
```

- "Failed" is explicitly a **transitive counter, not a state**: "a job will never end up in Failed
  … The only possible final states are Processed or Dead" [S §1].
- Faktory adds a state Sidekiq OSS lacks: **Working/Reserved** — FETCH creates a `Reservation`
  `{job, reserved_at, expires_at, wid}` [F §9]; expiry re-enqueues via a synthetic FAIL
  (`ReservationExpired`, see §3). Consequence: Faktory survives worker crashes; Sidekiq OSS loses
  in-flight jobs on crash ("If the Sidekiq process segfaults … any jobs that were executing will be
  lost" [S §3]).

### 2.3 The two machines interlock

Worker liveness (BEAT/60 s expiry) and job leases (reserve_for/1800 s default) are **independent
timers**: "If a process dies, it will be removed after 1 minute and its jobs recovered after the
job reservation timeout has passed (typically 30 minutes)" [F §6]. Losing the worker does not
immediately fail its jobs — the lease is the job-level truth, the heartbeat is only the
process-level truth. This decoupling is deliberate (network partitions: "the worker can BEAT again
and resume normal operations" [F §6]).

---

## 3. Heartbeat / cancellation / deadline mechanics

### 3.1 Heartbeat

- Worker sends `BEAT {"wid":…,"rss_kb":…}` every 15 s (recommended 10–15) [F §1, §6].
- Server-side expiry: no BEAT for 60 s → removed from Busy page [F §1, §6]. That's a 4× miss
  budget.
- `rss_kb` piggybacks a **resource metric** on the liveness signal (per-process memory on the Busy
  page) [F §1] — observability for free on an already-mandatory message.
- **The BEAT reply is the control channel**: `+OK` when running; `{"state":"quiet"|"terminate"}`
  when the operator has signaled the worker [F §5 `heartbeat`]. No extra server→worker push
  channel, no long-poll: control piggybacks on the existing 15 s cadence, so worst-case control
  latency ≈ one beat interval.
- **Heartbeat-expiry recovery is worker-side suicide**: on `Unknown worker` BEAT error the Go
  worker logs "Faktory heartbeat has expired, shutting down..." and sends itself SIGTERM to unwind
  cleanly [F §10 runner.go]. A worker whose registration lapsed does not try to re-register
  in-place; it restarts through the one well-tested shutdown path.
- Only consumers BEAT (`IsConsumer()` ⇔ `wid != ""`) [F §6]; producers are anonymous.

### 3.2 Deadlines (the lease model)

- FETCH is also RESERVE: fetching a job starts a `reserve_for` lease (default 1800 s, clamped to
  [60, 86400] server-side with warnings, push-rejected above 86400) [F §1, §2, §9].
- Miss the deadline → server synthesizes a failure: `JobReservationExpired = {errtype:
  "ReservationExpired", message: "Faktory job reservation expired"}` [F §9] and releases the job
  for re-execution — "treated identical to a FAIL" [F §3 FAQ]. One error taxonomy covers both
  worker-reported and infrastructure-detected failures.
- Client I/O has its own transport deadlines: 5 s read/write deadlines per operation, failed conns
  evicted from the pool, TCP keepalive on dial [F §7].
- Server FETCH handler bounds its own work with a 5 s context timeout; the documented 2 s block on
  empty queues does the fast-dispatch/no-poll tradeoff [F §1 notes, §5].

### 3.3 Cancellation

- **There is no per-job remote cancel verb.** The protocol cancels at process granularity (quiet /
  terminate via BEAT reply or signal); in-process, cancellation is the language's native idiom —
  Go workers get `Perform(ctx context.Context, …)` and terminate schedules `cancelFunc` after
  ShutdownTimeout [F §10]. Jobs that outlive the grace window are force-killed and FAILed so they
  retry [F §1, §6].
- Removing queued (not running) work is a separate, explicitly best-effort admin API: MUTATE
  kill/discard/requeue over retries/scheduled/dead, "no attempt to lock or make its actions atomic
  … race conditions will be possible and even common" [F §4]. `queue remove` "does not stop
  currently executing jobs" [F §4].
- UNVERIFIED: whether Faktory Enterprise adds per-job cancel; not in the extracts.

---

## 4. Error taxonomy — retryable vs terminal

### 4.1 Representation on the wire

A failure is a structured 4-tuple, `FailPayload {jid, errtype, message, backtrace[]}` [F §9]. The
server **cleanses** it defensively: errtype trimmed + capped at 100 chars, defaulted to
`"unknown"`; message capped at 1000 bytes, defaulted to `"unknown"`; backtrace defaulted to `[]`
and capped at 50 entries (wiki says 30 — source is authoritative; wiki drifted) [F §9 `cleanse`,
F §1]. The Go client hardcodes `errtype:"unknown"` and trims 3 frames off `debug.Stack()` [F §7].

Failure **history** accumulates in the job payload itself as the `failure` hash: `failed_at`,
`next_at`, `message`, `errtype`, `backtrace`, `retry_count`, `remaining` [F §8, §9]. So attempt
count and last error travel WITH the job to the next worker — any language can read them.

### 4.2 Retryable vs terminal: policy lives in the JOB, not in the error

Neither Faktory nor Sidekiq encodes "retryable" as an attribute of the error. Every FAIL is
presumed retryable; terminality is decided by the job's declared **retry budget**:

- `retry: 25` (default) → exponential backoff, ~21 days [F §3]; then the **Dead set** (kept 180
  days [F §9] / Sidekiq 10k jobs or 6 months [S §3]) for manual resurrection via UI.
- `retry: 0` → discard on failure ("completely ephemeral, goodbye" — verbatim source comment
  [F §9]).
- `retry: -1` → skip retries, straight to Dead [F §2, §3]. (Sidekiq spells these `retry: false` /
  `retry: 0` respectively [S §1] — note the two systems assign *opposite meanings* to `0`:
  Faktory `0`=discard, Sidekiq `0`=straight-to-Dead. A footgun born of not specifying it once.)
- Backoff formula: `15 + count^4 + rand(30)*(count+1)` (Faktory) / `rand(10)` smear (Sidekiq)
  [F §3; S §3].
- Sidekiq's stated ethos: retries are for **unexpected** errors (bugs, third-party downtime);
  expected business errors belong in application state machines, not the retry system [S §3].

### 4.3 Per-error-type escalation (Sidekiq only)

Sidekiq lets the job class map exception → disposition at retry time via `sidekiq_retry_in`:
return seconds (custom delay), `:kill` (→ Dead), `:discard` (drop), or nil (default formula)
[S §3]. Plus `retry_for:` (time-budget instead of count-budget), `retry_queue:` (retries drain to
a different queue), `dead: false` (retry N times then vanish) [S §3]. Faktory has none of these
hooks [S §3 delta note] — its wire protocol kept the error contract minimal and pushed policy to
the job payload.

### 4.4 Death notification

Two tiers of exhaustion callbacks [S §3]: per-class `sidekiq_retries_exhausted(job, ex)` (may
return `:discard`), and global `config.death_handlers << ->(job, ex)`. Plus global
`error_handlers` receiving `(exception, context_hash, config)` on every error. Terminal failure is
an **event with subscribers**, not just a state.

### 4.5 Protocol-level (non-job) errors

RESP `-CODE msg` with typed codes via `KnownError.Code()` (e.g. `NOTUNIQUE` for unique-job push
conflicts); everything unexpected is `-ERR` and "Clients are expected to raise an exception for
any ERR response" [F §5]. Two-lane taxonomy: enumerable, handleable codes vs generic fatal.

---

## 5. Versioning + capability negotiation

- The server leads: first bytes on the wire are `HI {"v":2}` — server advertises its protocol
  version before the client says anything [F §1, §7].
- `v` is a **single monotonically increasing integer**, "bumped any time there is a change in
  protocol, even minor"; post-1.0, breaking protocol change ⇒ major product version bump [F §1].
- Client echoes its `v` in HELLO [F §1, §7 `ClientData.Version`]. Mismatch handling is **soft**:
  the Go client only logs "Warning: server and client protocol versions out of sync: want %d, got
  %d" and proceeds [F §7]; wiki: "If the server protocol version is larger than a client expects,
  the client should print a message recommending a client upgrade" [F §1]. UNVERIFIED: whether the
  server ever hard-rejects a HELLO by version (the client struct comment says "The server can
  reject this connection if the version will not work" [F §7], but no rejecting server code is in
  the extract).
- Auth negotiation is folded into the same handshake: HI optionally carries `{"s": nonce, "i":
  iterations}`; client replies with `pwdhash = hex(sha256^i(password+nonce))` [F §1, §7]. The
  handshake is the one place where the server states requirements and the client proves compliance.
- **There is no capability negotiation** beyond the version integer. Feature discovery is
  implicit: Enterprise verbs simply return `-ERR … only available in Faktory Enterprise` at call
  time [F §5]. Extension happens through (a) new verbs, (b) the `custom` hash with `_`-reserved
  keys [F §8], (c) the version bump. Roles are declared, not negotiated: `wid` present ⇒ consumer,
  absent ⇒ producer [F §6, §7]; `labels` are free-form informational tags [F §1].
- Endpoint discovery is env-var indirection: `FAKTORY_PROVIDER` names the env var that holds
  `FAKTORY_URL` (`tcp://:password@host:7419`) [F §1, §7].

---

## 6. Transport + framing choices and why

- **One long-lived TCP connection per worker thread (pooled), not one process per job.** "These
  connections are designed to be long-lasting" [F §1]. The worker owns concurrency (default 20
  goroutines, pool of Concurrency+2 conns [F §10]).
- **Asymmetric framing, both halves trivially parseable**: client→server is `VERB {JSON}\r\n` —
  human-typeable, trivially writable from any language; server→client is RESP — length-prefixed
  bulk strings so arbitrary JSON payloads never need in-stream escaping, nil is distinguishable
  from empty (`$-1`), and every language already has a battle-tested RESP reader [F §1, §5, §7].
  The stated rationale for pull-with-short-block FETCH: no polling storms, microsecond dispatch to
  waiting workers, and "since the blocking is relatively short, we don't need to worry about TCP
  keepalives or network stability" [F §1].
- **Request/response only, strictly client-initiated.** The server never pushes asynchronously;
  everything the server needs to tell a worker rides on a reply to something the worker sent
  (FETCH reply carries work; BEAT reply carries lifecycle commands). This keeps the client's read
  loop trivial — no demultiplexing, no message-id correlation.
- **JSON only, native types only** for all structured payloads — the polyglot lowest common
  denominator, stated as a hard rule [F §2].
- Sidekiq's contrast makes the "why" vivid: with no protocol, workers are Redis-coupled
  (Ruby-ecosystem-only for years), and crash-safety required a paid product (Sidekiq Pro reliable
  fetch [S §3]). Faktory's protocol tier is precisely what bought polyglot workers + built-in
  crash recovery.

---

## 7. STEAL CANDIDATES for NetScript's polyglot task protocol

Legend: pillar ∈ {interop, observability, communication, lifecycle}; tier = proposed conformance
tier (0 = must-implement core, 1 = standard citizenship, 2 = full/advanced).

1. **STEAL-1: Server-first versioned handshake (`HI {"v":N}` / `HELLO {…,"v":N}`).**
   [F §1, §7] The runtime speaks first, states its protocol version; the task adapter replies with
   its version + identity. Single monotonic integer, soft-warn on skew, doc-promised bump on every
   change. For NetScript: the engine writes a `hello` line (env or stdin) with `protocolVersion`
   before/alongside TASK_PAYLOAD; a task that answers with a versioned hello is protocol-aware,
   one that doesn't is grandfathered as tier-0 legacy (today's last-JSON-line behavior). Pillar:
   interop. Tier: 0 (version field mandatory in every framed message), negotiation behavior tier 1.

2. **STEAL-2: Closed schema + one namespaced extension bag (`custom`, `_`-reserved keys).**
   [F §2 "will discard any custom data elements outside of the custom hash", F §8] Zod-validate
   the envelope strictly; all cross-cutting context (locale, tenant, request_id, trace context)
   rides in one `custom`/`meta` map with `_` reserved for NetScript internals. This is the direct
   fix vector for bug D-4: TRACEPARENT/CORRELATION_ID stop being loose env vars that queue paths
   forget — they become `custom._traceparent`/`custom._correlationId` fields of the job document
   that survive every hop because they are IN the payload. Pillar: interop + observability.
   Tier: 0.

3. **STEAL-3: Structured failure 4-tuple with server-side cleansing.**
   [F §9 `FailPayload` + `cleanse`] Replace `error: string|null` with
   `{errtype, message, backtrace[], …}`, and adopt the cleanse discipline verbatim: trim, cap
   (errtype ≤100 chars, message ≤1000 bytes, backtrace ≤50 lines), default to `"unknown"` — never
   trust the polyglot side to be well-behaved; the engine normalizes. Maps directly onto a zod
   schema with `.max()` + `.catch()`. Pillar: lifecycle (error mgmt). Tier: 0.

4. **STEAL-4: Retry policy as job data; terminality decided by budget, not by error flag —
   BUT add Sidekiq's per-error disposition hook.**
   [F §2/§3 `retry: N/0/-1` + Dead set; S §3 `sidekiq_retry_in` → seconds/:kill/:discard]
   Faktory shows the wire contract should stay minimal (a FAIL is just a FAIL); Sidekiq shows
   the engine-side policy point that decides delay/kill/discard per (attempt, errtype). NetScript:
   `TaskResult.failure.errtype` feeds an engine-side disposition function; the protocol itself
   optionally lets the task hint `retryable: false` (an evolution both systems lack — but keep the
   default "presumed retryable"). Also: pick ONE meaning for `retry: 0` and document it — Faktory
   and Sidekiq disagree (discard vs straight-to-Dead) [F §3 FAQ vs S §1]. Pillar: lifecycle.
   Tier: 1 (structured errtype tier 0; disposition hooks tier 1).

5. **STEAL-5: Attempt/failure history travels IN the payload.**
   [F §8 `Failure{retry_count, remaining, failed_at, next_at, message, errtype, backtrace}`;
   S §2 retry fields] Today NetScript polyglot tasks get "no attempt info". Give every dispatch a
   `attempt`, `retryRemaining`, `lastFailure` block in TASK_PAYLOAD's envelope so any language can
   implement attempt-aware behavior (idempotency guards, escalating timeouts) without engine
   round-trips. Pillar: lifecycle + interop. Tier: 1.

6. **STEAL-6: Heartbeat with piggybacked control replies (the BEAT pattern).**
   [F §1, §5 `heartbeat`, §6] For long-running polyglot tasks: task emits a periodic `beat` frame
   (stdout NDJSON) every ~15 s; the engine's ack (stdin) is `ok` or a state command
   (`{"state":"cancel"}` / `"drain"`). One message pair gives liveness, memory telemetry
   (`rss_kb`), and the cancellation channel — no extra socket, no signal-only cancel. 4× miss
   budget (60 s at 15 s cadence) before declaring the task hung. Pillar: communication +
   lifecycle + observability. Tier: 1 (emit beat), tier 2 (honor control replies).

7. **STEAL-7: Lease/reservation deadlines with synthesized `ReservationExpired` failure.**
   [F §9 `Reservation`, `JobReservationExpired`; F §3 "treated identical to a FAIL"] Every
   dispatch carries `reserveFor`/`deadline` (clamped: min/max/default, exactly Faktory's 60 /
   86400 / 1800 shape); when the engine kills or loses a task past deadline it records a synthetic
   structured failure `{errtype:"ReservationExpired"}` through the SAME error path as
   task-reported failures. One taxonomy for worker-reported and infrastructure-detected failure.
   Pillar: lifecycle. Tier: 1.

8. **STEAL-8: Monotonic three-state drain lifecycle (`running → quiet → terminate`), forward-only.**
   [F §6 incl. "you cannot 'unquiet' a worker"; F §10 ShutdownTimeout=25 s rationale] For pooled /
   reused polyglot workers (RFC-5's move beyond one-shot spawn): quiet = finish current, fetch
   nothing; terminate = grace window (25 s inside a 30 s platform budget — reserve the last 5 s to
   force-cancel), lingering work force-FAILed so it retries. Enforce monotonicity in the engine's
   state machine. Also steal the dual-channel delivery: OS signal locally AND protocol message
   (beat reply) remotely, mapped to the same states. Pillar: lifecycle. Tier: 2 (pooled workers);
   the terminate-grace/force-FAIL semantics apply to one-shot tasks at tier 1.

9. **STEAL-9: NDJSON framing with typed frames; nil ≠ empty; length-safe payload carriage.**
   [F §1, §5, §7 — `VERB {JSON}` one way, RESP the other] NetScript already reads
   last-JSON-line-of-stdout; formalize it: every protocol frame is one NDJSON line
   `{"type":"result"|"progress"|"beat"|"log"|…, "v":1, …}` (the VERB moves into a `type` field
   since stdout has no RESP reader). Keep Faktory's virtues: line-oriented (any language can emit
   with a print statement), strictly initiator-driven replies (engine only writes to stdin in
   response to frames that expect it — no demux, no correlation ids needed within one task).
   Non-frame stdout lines remain plain logs (backward compatible with tier-0 tasks). Pillar:
   communication + interop. Tier: 0 (result frame), 1 (progress/beat frames).

10. **STEAL-10: Typed protocol-error lane vs generic-fatal lane (`-CODE` vs `-ERR`).**
    [F §5 `KnownError` comment: enumerable codes like NOTUNIQUE are handleable; bare ERR ⇒ raise]
    NetScript's engine→task and workers-HTTP error surfaces should distinguish machine-handleable
    coded errors (zod-enum of codes) from generic fatal errors, with the documented client rule
    "raise on ERR". Pillar: interop + communication. Tier: 1.

11. **STEAL-11: Liveness expiry ≠ job failure (independent timers).**
    [F §6 "removed after 1 minute and its jobs recovered after the job reservation timeout"]
    Keep worker-liveness (beat, 60 s) and job-lease (reserve_for) as separate timers so a network
    blip or GC pause doesn't fail work that is actually progressing; the lease is the sole
    authority for re-dispatch. Pillar: lifecycle. Tier: 2.

12. **STEAL-12: Piggyback cheap telemetry on mandatory messages (`rss_kb` on BEAT; `labels` on
    HELLO; `wid`/`hostname`/`pid` identity).** [F §1, §6] NetScript's beat frame should carry
    `rssKb` (and optionally cpu), the hello frame `labels` + runtime identity
    (`{runtime:"python-3.13", pid, hostname}`) — feeding the observability pillar with zero extra
    round-trips, rendered in dashboards like Faktory's Busy page. Pillar: observability. Tier: 1.

13. **STEAL-13: Death as an event with subscribers + a resurrectable Dead set with TTL.**
    [S §3 `death_handlers`/`retries_exhausted`; F §9 DeadTTL=180d; S §3 10k/6-month bounds]
    Terminal failure fires typed events (per-jobtype and global) and lands the full job document
    in a bounded, TTL'd dead-letter store supporting manual requeue — plus Faktory's MUTATE-style
    admin ops (kill/discard/requeue by jobtype/jid filter), explicitly documented as best-effort
    [F §4]. Pillar: lifecycle + observability. Tier: 2.

14. **STEAL-14: Worker self-restart on liveness lapse.**
    [F §10: on "Unknown worker" beat error → log + SIGTERM self] When a pooled polyglot worker's
    registration/lease with the engine is discovered to have lapsed, the correct behavior is
    documented as: don't limp along, don't ad-hoc re-register — go through the one clean shutdown
    path and restart. Cheap to specify, prevents split-brain workers. Pillar: lifecycle. Tier: 2.

---

## 8. Anti-patterns to avoid

1. **Two dialects for the same document.** Sidekiq vs Faktory field drift (`class`/`jobtype`,
   flat vs nested failure, epoch-ms vs RFC3339Nano, `retry: false|0` vs `0|-1` with *conflicting*
   semantics for `0`) [S §2 delta note; F §3 vs S §1] shows what happens without one canonical
   schema. NetScript must define the envelope once (zod), and every port/adapter package conforms
   to it — no per-language re-spelling.

2. **Timestamps as floats.** Sidekiq needed a breaking 8.0 change to escape float epoch-seconds
   ("a long, sad history in JSON and JS") [S §2]. Pick integer-ms or RFC3339 strings in protocol
   v1 and never revisit.

3. **Doc/implementation drift on limits.** Wiki says backtraces capped at 30 lines; source caps at
   50 [F §9 note]. Limits belong in the schema (zod `.max()`), which then IS the doc.

4. **No wire protocol at all (Sidekiq's original sin).** Direct-to-Redis coupling meant no
   polyglot workers and lost in-flight jobs on crash in OSS [S header note, S §3 Process Crashes].
   NetScript's current polyglot surface (env-in, last-line-out, no ack) is the same shape at
   smaller scale — this is precisely what RFC-5 exists to fix.

5. **Reservation semantics as a paid add-on.** Crash-safe at-least-once execution was Sidekiq
   Pro's "reliable fetch" [S §3]; Faktory built it into the core protocol via reservations.
   Lease/ack must be core protocol (tier 1), not an adapter luxury.

6. **Retryable-as-error-attribute with no policy point** — but equally, **policy scattered in
   worker code**. Sidekiq's answer (job-declared budget + one engine-side disposition hook) beats
   both extremes; Faktory's Go client hardcoding `errtype:"unknown"` for every failure [F §7]
   shows how an adapter can silently destroy the taxonomy's value — conformance tests must assert
   adapters propagate real error types.

7. **Fire-and-forget result reporting.** `faktory_worker_go` retries ACK/FAIL delivery in a loop
   for up to 30 s with backoff [F §10 `processOne`] — the result of completed work is too valuable
   to drop on one connection hiccup. But note it eventually gives up and returns nil (the job will
   re-run via lease expiry): at-least-once, made explicit. NetScript adapters must not treat a
   single failed result write as final, and the docs must state the resulting at-least-once
   semantics.

8. **Bidirectional-state ambiguity in one field.** BEAT carries worker→server `current_state` while
   the reply carries server→worker `state` [F §5, §7] — same vocabulary, two directions, easy to
   confuse (and the Go server type `ClientBeat.CurrentState` vs reply `{"state":…}` shows the
   naming strain). In NetScript frames, name the directions distinctly (e.g. `reportedState` vs
   `commandedState`).

9. **Mutation APIs that pretend to be atomic.** Faktory's MUTATE is honest: "best effort … race
   conditions will be possible and even common" [F §4]. Steal the honesty; do not promise atomic
   cancel/requeue over live sets.

10. **Backward state transitions / "unquiet".** Allowing lifecycle reversal creates deploy-tool
    edge cases; Faktory forbids it outright and documents the consequence for rollbacks [F §1,
    §6]. Keep NetScript's worker lifecycle a DAG.

11. **Unbounded failure artifacts.** Backtraces at 1–4 KB each "can significantly increase your
    Redis memory usage" [S §3]; both systems cap aggressively and default backtrace retention to 0
    [F §2]. Cap error payloads in the schema; treat full traces as an error-service concern, not a
    queue concern [F §2 "Faktory is not designed to be a full-blown error service"; S §3 ethos].

---

## Cross-cutting verdict for RFC-5

Faktory is the closest existing answer to RFC-5's exact question — "what is the minimal versioned,
language-agnostic contract that turns a black-box job runner into a citizen?" Its answer: (1) a
server-first versioned hello; (2) one closed JSON job document with a single namespaced extension
bag that carries args, retry policy, failure history, and trace context together; (3) four verbs
that matter (FETCH/ACK/FAIL/BEAT) where the heartbeat doubles as the control channel; (4) leases +
synthesized failures so infrastructure and worker failures share one taxonomy; (5) a monotonic
three-state drain lifecycle. Sidekiq contributes the richer *policy* layer (per-error disposition,
retry_for, death handlers) and two expensive lessons (schema drift, float timestamps) that argue
for schema-first (zod) protocol definition. Everything above maps cleanly onto NetScript's existing
stack: NDJSON frames over stdio replace TCP/RESP; zod replaces prose limits; the JS-side JobContext
already has the fields — the protocol's job is to carry them across the process boundary.
