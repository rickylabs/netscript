# faktory-sidekiq-raw-01 — Faktory worker wire protocol (raw extracts)

Fetch date: 2026-08-20.

Sources (all fetched by shallow `git clone`, because WebFetch returns model summaries rather than
verbatim text and `raw.githubusercontent.com/wiki/...` 404s):

- `https://github.com/contribsys/faktory/wiki` — wiki repo `https://github.com/contribsys/faktory.wiki.git`,
  commit `f63b694de5364583ae89196721caf8c27889e7e0` (2026-02-19). Pages used: `Worker-Lifecycle.md`,
  `The-Job-Payload.md`, `Job-Errors.md`, `Mutate-API.md`.
- `https://github.com/contribsys/faktory` — commit `025794be36571124eddebfe736f15ec52167cf99`
  (2026-08-18). Files used: `client/client.go`, `client/job.go`, `server/commands.go`,
  `server/workers.go`, `server/connection.go`, `manager/retry.go`, `manager/working.go`,
  `manager/manager.go`.
- `https://github.com/contribsys/faktory_worker_go` — commit
  `debbe3bb69303a3cdcfd7ad533d3639caf68219b` (2026-07-01). Files used: `runner.go`, `manager.go`,
  `runner_unix.go`, `types.go`.

NOTE ON A NAMED PAGE: the task named a wiki page **"The Protocol"**. No such page exists in the
Faktory wiki as of this fetch. The wiki index is: AWS-ECS, Administration, Commercial-Support,
Debugging, Deployment, Development, Docker, Ent-Batches, Ent-Cron, Ent-Expiring-Jobs,
Ent-Installation, Ent-Metrics, Ent-Misc, Ent-Redis-Gateway, Ent-Remote-Redis, Ent-Throttling,
Ent-Tracking, Ent-Unique-Jobs, FAQ, Getting-Started-Ruby, Home, Installation, Job-Errors,
Kubernetes-Deployment-Example, Licensing, Mutate-API, Redis, Related-Projects, Security, Storage,
**The-Job-Payload**, **Worker-Lifecycle**. The protocol material lives in `Worker-Lifecycle` +
`The-Job-Payload`; the authoritative verb inventory is `server/commands.go`.

---

## 1. Wiki: Worker-Lifecycle (verbatim)

> Faktory is a background job server. Faktory workers are necessary to execute those jobs.
>
> ## Lifecycle
>
> A Faktory worker process uses one or more threads to execute jobs. The four steps are:
>
> - Connect
> - Fetch
> - Execute
> - Report Result
>
> ## Network Connection
>
> Each producer and consumer process opens one or more TCP connections to Faktory. These connections
> are designed to be long-lasting.
>
> The Faktory protocol is line-oriented. Most messages from the client worker to Faktory follow the
> general format: `VERB {JSON}`.
>
> All messages from Faktory follow the [Redis protocol format](https://redis.io/topics/protocol).
> For example, when sending an OK response, the server actually writes the bytes `+OK\r\n`.
>
> ## Initial Handshake
>
> On initial connection, Faktory immediately sends a HI message to the client with a JSON hash. The
> "v" attribute is the version of the protocol the server expects and is a monotonically increasing
> number. The version will be bumped any time there is a change in protocol, even minor. **After
> Faktory 1.0 is released, any breaking protocol change will be denoted with a major version bump in
> Faktory itself.** If the server protocol version is larger than a client expects, the client should
> print a message recommending a client upgrade.
>
> ```
> # no password
> HI {"v":2}
> # password required
> HI {"v":2,"s":"123456789abc","i":1735}
> ```
>
> If password authentication is required, the hash will include nonce and iterations attributes (the
> "s" and "i" attributes):
>
> The client must send a HELLO response. In the case of the latter HI, it must include a `pwdhash`
> parameter where `pwdhash` is calculated like so:
>
> ```
> data = password+nonce
> for i=0; i<iterations; i++ {
>   data = sha256(data)
> }
> hex(data)
> ```
>
> A resulting HELLO for a worker process might look like this:
>
> ```
> HELLO {
>  "hostname":"MikeBookPro.local",
>  "wid":"4qpc2443vpvai",
>  "pid":2676,
>  "labels":["golang"],
>  "pwdhash":"1e440e3f3d2db545e9129bb4b63121b6b09d594dae4344d1d2a309af0e2acac1",
>  "v":2
> }
> > OK
> ```
>
> If the process is a producer (only pushing jobs, not executing them), then the HELLO can be as
> simple as `HELLO {"v":2}` when no password is required.
>
> If successful, the server responds with "OK" and the connection can now use the full Faktory
> command set.
>
> Definition:
>
> - wid - worker id, a unique random string for every worker process
> - hostname/pid - specifics about the machine and process for this worker
> - labels - application-specific labels, shown in the Web UI
> - pwdhash - used to authenticate each connection
> - v - the protocol version the client expects
>
> Hostname and PID are informational, for debugging use in the Web UI, but not useful in all
> environments (e.g. Heroku, containers).
>
> ## Heartbeat
>
> Workers must send a BEAT every N seconds, as proof of liveness. I recommend every 10 or 15 seconds.
> After 60 seconds without a beat, Faktory will remove them from the Busy page.
>
> ```
> BEAT {"wid":"4qpc2443vpvai","rss_kb":1234567}
> ```
>
> `rss_kb` is the worker's process memory size in KB and allows Faktory to show per-process memory
> usage on the Busy page. It is optional.
>
> The response can be `OK` or a JSON hash with further data for the worker:
>
> ```
> {"state":"quiet"}
> ```
>
> The state can be either `quiet` or `terminate`. See Deployment below.
>
> ## Fetching Jobs
>
> A worker can request a job from a list of queues with the `fetch` command:
>
> ```
> FETCH critical default low
> ```
>
> The return value will be nil or the JSON for the job payload.
>
> Notes: the list of queues will be checked in the order given. If all queues are empty, **fetch will
> block for 2 seconds, waiting for a job from the first queue**. This short blocking period serves
> several purposes:
>
> - Workers don't poll Faktory with thousands of queue checks per second.
> - Jobs are dispatched to a waiting worker almost instantly, within microseconds of being enqueued.
> - Since the blocking is relatively short, we don't need to worry about TCP keepalives or network
>   stability.
> - Workers can randomize their queue ordering on each FETCH to counteract queue starvation.
>
> ## Executing Jobs
>
> FETCH reserves the job for the worker for N seconds (default of 1800). The worker **must** send an
> ACK or FAIL for the Job's JID by that time or the job will be released for re-execution. You can
> adjust this timeout by setting the job's `reserve_for` element:
>
> ```ruby
> # ruby
> faktory_options reserve_for: 1.hour
> # raw JSON
> "reserve_for": 3600,
> ```
>
> ## Report Result
>
> The result of a job execution is either success, ACK, or failure, FAIL.
>
> ```
> ACK {"jid":"8712638abd2"}
> > OK
> ```
>
> ```
> FAIL {"jid":"8712638abd2", "errtype":"RuntimeError", "message":"Invalid argument", "backtrace":["line1","line2"]}
> > OK
> ```
>
> FAIL should include error data about the failure if possible for display in the Web UI. Keep in
> mind that error messages and backtraces can be quite large in many cases. Out of the box, Faktory
> limits error messages to 1000 bytes and backtraces to the first 30 lines.
>
> ## Information
>
> You can fetch a blob of stats about Faktory with the INFO command:
>
> ```
> INFO
> > {"faktory"=>
>   {"default_size"=>0,
>    "tasks"=>
>     {"Busy"=>{"reaped"=>0, "size"=>0},
>      "Dead"=>
>       {"cycles"=>2, "enqueued"=>0, "size"=>0, "wall_time_sec"=>2.472e-05},
>      "Retries"=>
>       {"cycles"=>23, "enqueued"=>1, "size"=>1, "wall_time_sec"=>0.004135707},
>      "Scheduled"=>
>       {"cycles"=>23, "enqueued"=>0, "size"=>5, "wall_time_sec"=>0.002255319}},
>    "total_enqueued"=>6,
>    "total_failures"=>0,
>    "total_processed"=>0,
>    "total_queues"=>3},
>  "server"=>
>   {"command_count"=>2,
>    "connections"=>1,
>    "faktory_version"=>"0.5.0",
>    "uptime"=>"12345",
>    "used_memory_mb"=>"123 MB"},
>  "server_utc_time"=>"10:25:39 UTC"}
> ```
>
> # Best Practices
>
> ## URL Configuration
>
> Worker processes should allow configuration of the Faktory server URL via environment variable. […]
> Best practice is for the application developer to provide \*\_PROVIDER, which tells the client which
> ENV variable contains the server URL.
>
> ```
> REDIS_PROVIDER=REDISTOGO_URL
> ```
>
> We recommend the same pattern for Faktory:
>
> ```
> FAKTORYTOGO_URL=tcp://:password@hostname:7419
> FAKTORY_PROVIDER=FAKTORYTOGO_URL
> ```
>
> ## Deployment
>
> Shut down is surprising hard with all the different deployment tools, environments and processes
> people use. Some jobs are long-running, some jobs are not idempotent. My years of experience with
> Sidekiq has resulted in the following best practices for worker restarts:
>
> - Workers should send a BEAT every 15 seconds, only stopping upon process exit.
> - The BEAT response may contain a "quiet" or "terminate" state change.
> - Upon seeing "quiet", the worker process should immediately stop further FETCH'ing.
> - Upon seeing "terminate", the worker process should wait up to N seconds for any remaining jobs to
>   finish. After 25 seconds (see below), the worker should send FAIL to Faktory for those lingering
>   jobs (so they'll restart) and exit.
> - Once a worker has been quieted, it must be terminated. You can't "unquiet" a worker. Any deploy
>   error/rollback should account for this.
>
> Note: that Heroku allows processes up to 30 seconds to exit before a hard `kill`, that's why I
> recommend 25 above.

---

## 2. Wiki: The-Job-Payload (verbatim)

> A Faktory job is a JSON hash with a few mandatory elements. The bare minimum:
>
> ```json
> {
>   "jid": "123861239abnadsa",
>   "jobtype": "SomeName",
>   "args": [1, 2, "hello"],
> }
> ```
>
> The worker uses `jobtype` to determine how to execute this job. The `args` is an array of
> JSON-native parameters necessary for the job to execute, it may be empty. `jid` is a unique Job ID
> for each job.
>
> Arguments must be **native JSON** datatypes: String, Number, Boolean, Map, Array and null. You
> cannot pass complex objects/structures or other types, even if they are native to your specific
> language.
>
> You can think of a job as a function invocation. `jobtype` is the name of the function, `args` is
> the parameters.
>
> ## Options
>
> You can customize Faktory's behavior by setting additional elements in the JSON hash:
>
> - `"queue": "default"` - push this job to a particular queue. The default queue is, unsurprisingly,
>   "default".
> - `"reserve_for": 600` - set the reservation timeout for a job, in seconds. When a worker fetches a
>   job, it has up to N seconds to ACK or FAIL the job. After N seconds, the job will be requeued for
>   execution by another worker. Default is 1800 seconds or 30 minutes, minimum is 60 seconds.
> - `"at": "2017-12-20T15:30:17.111222333Z"` - schedule a job to run at a point in time. The job will
>   be enqueued within a few seconds of that point in time. Note the string must be in Go's
>   RFC3339Nano time format.
> - `"retry": 3` - set the number of retries to perform if this job fails. Default is 25 (which, with
>   exponential backoff, means Faktory will retry the job over a 21 day period). A value of 0 means
>   the job will not be retried and will be discarded if it fails. A value of -1 means don't retry but
>   move the job immediately to the Dead set if it fails.
> - `"backtrace": 10` - retain up to N lines of backtrace given to the FAIL command. Default is 0.
>   Faktory is not designed to be a full-blown error service, best practice is to integrate your
>   workers with an existing error service, but you can enable this to get a better view of why a job
>   is retrying in the Web UI.
>
> ```json
> {
>   "jid": "123861239abnadsa",
>   "jobtype": "SomeName",
>   "args": [1, 2, "hello"],
>   "reserve_for": 300,
>   "retry": 4
> }
> ```
>
> ## Metadata
>
> Faktory provides a few, possibly useful pieces of job metadata in the payload:
>
> - `"created_at": "2017-12-20T15:30:17.111222333Z"` - the client may set this or Faktory will fill it
>   in when it receives a job.
> - `"enqueued_at": "2017-12-20T15:30:17.111222333Z"` - Faktory will set this when it enqueues a job.
> - `"failure": { ...data... }` - a hash with data about this job's most recent failure
>
> ## Failure
>
> If your job fails, Faktory will store a failure hash inside the job payload with elements which
> might be useful for debugging. These elements, including error message and backtrace, are displayed
> in the Web UI when looking at job details […]
>
> ## Custom Data
>
> Faktory workers can have plugins and middleware which need to store additional context with the job
> payload. Faktory supports a `custom` hash to store arbitrary key/values in the JSON. This can be
> extremely helpful for cross-cutting concerns which should propagate between systems, e.g. locale for
> user-specific text translations, request_id for tracing execution across a complex distributed
> system, etc.
>
> ```json
> {
>   "jid": "123861239abnadsa",
>   "jobtype": "SomeName",
>   "args": [1, 2, "hello"],
>   "custom": {
>     "locale": "fr",
>     "user_id": 1234567,
>     "request_id": "5359948e-6475-47cd-b3bb-3903002a28ca"
>   }
> }
> ```
>
> Note that Faktory **will discard** any custom data elements outside of the `custom` hash.
>
> For the nitty-gritty, the fundamental definition of a Job in Faktory can be found in
> [`client/job.go`](https://github.com/contribsys/faktory/blob/master/client/job.go).

---

## 3. Wiki: Job-Errors (verbatim, condensed only by dropping prose asides)

> The Faktory worker process fetches a job and executes it.
>
> 1. If the job does not raise an error, it is considered a success. The worker will ACK it to report
>    success.
> 2. If the job does raise an error, the worker will send FAIL with error information to Faktory. This
>    kicks off the error process.
>
> ## The Process
>
> Faktory provides retries with exponential backoff. […] By default Faktory will retry a job 25 times,
> which provides for retries over 21 days.
>
> The wait formula is:
>
> ```
> 15 + count ^ 4 + (rand(30) * (count + 1))
> ```
>
> - 15 establishes a minimum wait time.
> - count^4 is our exponential, the first retry will be 0, the 20th retry will 20^4 (160,000 sec), or
>   about two days.
> - rand(30) gives us a random "smear". […]
>
> ## Job Death
>
> After retrying N times, Faktory assumes the job will continue to fail forever and will stop
> retrying. It moves the job into the Dead Set. Jobs in the Dead Set are not touched by Faktory but
> can be manually executed from the Web UI. […]
>
> ## FAQ
>
> ### How do I configure the number of retries?
>
> Set `"retry": 6` in the job payload, where 6 is the chosen retry count. After that count, the job
> will go to the Dead Set as normal.
>
> ### How do I disable retry completely?
>
> Set `"retry": 0` in the job payload. The job will be discarded if it fails. Set `"retry": -1` if you
> want failed jobs to be saved to the Dead set.
>
> ### Do worker crashes trigger retries?
>
> Yes, any jobs left over by a worker crash will cause Faktory to re-enqueue the job after the job
> reservation times out. This is treated identical to a FAIL.

---

## 4. Wiki: Mutate-API (verb + payload inventory, verbatim excerpts)

> The MUTATE command takes a single JSON hash with three parts:
>
> 1. A target structure, legal values are "retries", "scheduled", "dead"
> 2. A command to perform on matching jobs: "kill", "discard" or "requeue"
> 3. A filter to match jobs within that structure by JIDs, regexp or exact jobtype
>
> ### Structures
>
> Only the Retries, Dead and Scheduled Sets may be targeted. Queues cannot be mutated […]
>
> ### Commands
>
> - `kill` - moves the job from the target structure to the Dead set. […]
> - `discard` - throw the job away, **POOF** it's gone.
> - `requeue` - immediately move the job back into its queue for processing by a worker
>
> ### Filter
>
> 1. Jobtype - must be an exact jobtype, not a pattern or substring. Fast.
> 2. An array of JIDs - passing one JID is fast, passing more than one becomes much slower.
> 3. Regexp - this is a low-level match against the entire job payload, tricky but fast.
>
> ### Examples
>
> ```
> MUTATE {"cmd":"discard","target":"scheduled","filter":{"jobtype":"QuickbooksSyncJob"}}
> MUTATE {"cmd":"discard","target":"retries","filter":{"regexp":"*"}}
> MUTATE {"cmd":"discard","target":"retries"}
> MUTATE {"cmd":"kill","target":"retries","filter":{"jobtype":"QuickbooksSyncJob", "jids":["123456789", "abcdefgh"]}}
> MUTATE {"cmd":"requeue","target":"retries","filter":{"regexp":"*\"args\":[\"bob\"*"}}
> ```
>
> […] The `regexp` filter option is passed to Redis's `SCAN` command directly […]
>
> # Queues
>
> ## Pausing & Resuming
>
> Queues may be paused (no job can be fetched from them while paused) or unpaused (resume fetching).
> `*` means all queues but does not act as a wildcard, "foo\*" will not match "foobar".
>
> ```
> queue pause bulk another_queue
> queue pause *
> queue resume bulk
> queue resume *
> ```
>
> ## Remove
>
> Queues can be removed which deletes all jobs within them. It does not stop currently executing jobs
> from those queues.
>
> ```
> queue remove bulk
> queue remove *
> ```
>
> ## Notes
>
> - MUTATE is best effort; it makes no attempt to lock or make its actions atomic. Since job data is
>   constantly changing, race conditions will be possible and even common.

---

## 5. Server-side verb inventory — `server/commands.go` (verbatim)

```go
// A command responds to an client request.
// Each command must parse the request payload (if any), invoke a action and produce a response.
// Commands should not have business logic.
type command func(c *Connection, s *Server, cmd string)

var CommandSet = map[string]command{
	"END":    end,
	"PUSH":   push,
	"PUSHB":  pushBulk,
	"FETCH":  fetch,
	"ACK":    ack,
	"FAIL":   fail,
	"BEAT":   heartbeat,
	"INFO":   info,
	"FLUSH":  flush,
	"MUTATE": mutate,
	"BATCH":  batch,
	"TRACK":  track,
	"QUEUE":  queue,
}
```

`BATCH` and `TRACK` in OSS return `-ERR … subsystem is only available in Faktory Enterprise`.
`QUEUE` subcommands, per the source comment: `QUEUE PAUSE foo bar baz`, `QUEUE RESUME *`,
`QUEUE REMOVE [names...]`.

Note the HI/HELLO handshake is NOT in `CommandSet` — it is handled at connection setup before the
command loop.

### Response primitives — `server/connection.go` (verbatim)

```go
func (c *Connection) Error(cmd string, err error) error {
	if re, ok := err.(manager.KnownError); ok {
		_, err = fmt.Fprintf(c.conn, "-%s\r\n", re.Error())
	} else {
		_, err = fmt.Fprintf(c.conn, "-ERR %s\r\n", err.Error())
	}
	return err
}

func (c *Connection) Ok() error {
	_, err := c.conn.Write([]byte("+OK\r\n"))
	return err
}

func (c *Connection) Number(val int) error {
	_, err := c.conn.Write([]byte(":" + strconv.Itoa(val) + "\r\n"))
	return err
}

func (c *Connection) Result(msg []byte) error {
	if msg == nil {
		_, err := c.conn.Write([]byte("$-1\r\n"))   // nil / no job
		return err
	}
	_, err := c.conn.Write([]byte("$" + strconv.Itoa(len(msg)) + "\r\n"))
	…
}
```

So the wire response alphabet is RESP: `+OK\r\n` simple string, `-ERR msg\r\n` / `-CODE msg\r\n`
error, `:N\r\n` integer, `$len\r\n<bytes>\r\n` bulk string, `$-1\r\n` nil bulk.

Error codes: `manager.KnownError` is an interface with `Code() string`; source comment (manager.go):

```go
// A KnownError is one that returns a specific error code to the client
// such that it can be handled explicitly.  For example, the unique job feature
// will return a NOTUNIQUE error when the client tries to push() a job that already
// exists in Faktory.
//
// Unexpected errors will always use "ERR" as their code, for instance any
// malformed data, network errors, IO errors, etc.  Clients are expected to
// raise an exception for any ERR response.
```

### Handlers (verbatim)

```go
type ClientBeat struct {
	CurrentState string `json:"current_state"`
	Wid          string `json:"wid"`
	RssKb        int64  `json:"rss_kb"`
}

// BEAT {"wid":"12345abcde","rss_kb":54176}
func heartbeat(c *Connection, s *Server, cmd string) {
	data := cmd[5:]
	var beat ClientBeat
	err := util.JsonUnmarshal([]byte(data), &beat)
	if err != nil { _ = c.Error(cmd, fmt.Errorf("invalid BEAT %s", data)); return }

	worker, ok := s.workers.heartbeat(&beat)
	if !ok { _ = c.Error(cmd, fmt.Errorf("unknown worker %s", beat.Wid)); return }

	if worker.state == Running {
		_ = c.Ok()
	} else {
		_ = c.Result(fmt.Appendf(nil, `{"state":%q}`, stateString(worker.state)))
	}
}
```

```go
func fetch(c *Connection, s *Server, cmd string) {
	if c.client.state != Running {
		// quiet or terminated workers should not get new jobs
		time.Sleep(2 * time.Second)
		_ = c.Result(nil)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	qs := strings.Split(cmd, " ")[1:]
	job, err := s.manager.Fetch(ctx, c.client.Wid, qs...)
	…
	if job != nil { res, _ := json.Marshal(job); _ = c.Result(res) } else { _ = c.Result(nil) }
}
```

`ack` parses `map[string]string`, requires key `jid`, then `manager.Acknowledge(ctx, jid)` → `+OK`.
`fail` parses `manager.FailPayload`, then `manager.Fail` → `+OK`.

---

## 6. Worker/consumer state machine — `server/workers.go` (verbatim)

```go
// This represents a single client process.  It may have many network
// connections open to Faktory.
//
// A client can be a producer AND/OR consumer of jobs. […]
//
// Each Faktory worker process should send a BEAT command every 15 seconds.
// Only consumers should send a BEAT.  If Faktory does not receive a BEAT from a
// worker process within 60 seconds, it expires and is removed from the Busy page.
//
// From Faktory's POV, the worker can BEAT again and resume normal operations,
// e.g. due to a network partition.  If a process dies, it will be removed
// after 1 minute and its jobs recovered after the job reservation timeout has
// passed (typically 30 minutes).
//
// A worker process has a simple three-state lifecycle:
//
//	running -> quiet -> terminate
//
// - Running means the worker is alive and processing jobs.
// - Quiet means the worker should stop FETCHing new jobs but continue working on existing jobs.
//   It should not exit, even if no jobs are processing.
// - Terminate means the worker should exit within N seconds, where N is recommended to be
//   30 seconds.  In practice, faktory_worker_ruby waits up to 25 seconds and any
//   threads that are still busy are forcefully killed and their associated jobs reported
//   as FAILed so they will be retried shortly.
//
// A worker process should never stop sending BEAT.  Even after "quiet" or
// "terminate", the BEAT should continue, only stopping due to process exit().
// Workers should never move backward in state - you cannot "unquiet" a worker,
// it must be restarted.
//
// Workers will typically also respond to standard Unix signals.
// faktory_worker_ruby uses TSTP ("Threads SToP") as the quiet signal and TERM as the terminate signal.
type ClientData struct {
	StartedAt time.Time
	lastHeartbeat time.Time
	connections   map[io.Closer]bool
	Hostname      string   `json:"hostname"`
	Wid           string   `json:"wid"`
	PasswordHash  string   `json:"pwdhash"`
	Username      string   `json:"username"`
	Labels        []string `json:"labels"`
	Pid           int      `json:"pid"`
	RssKb         int64    `json:"rss_kb"`
	state         WorkerState
	Version       uint8 `json:"v"`
}

type WorkerState int

const (
	Running WorkerState = iota
	Quiet
	Terminate
)

func stateString(state WorkerState) string {
	switch state {
	case Quiet:     return "quiet"
	case Terminate: return "terminate"
	default:        return ""
	}
}
```

`Signal(newstate)` enforces monotonic transitions: `running -> quiet -> terminate` only; "can't go
from quiet -> running, terminate -> quiet, etc." `IsConsumer()` is `worker.Wid != ""`.

---

## 7. Client wire encoding + handshake — `client/client.go` (verbatim)

```go
const (
	// This is the protocol version supported by this client.
	// The server might be running an older or newer version.
	ExpectedProtocolVersion = 2
)

var (
	// Set this to a non-empty value in a consumer process
	// e.g. see how faktory_worker_go sets this.
	RandomProcessWid = ""
	Labels           = []string{"golang"}
)

// ClientData is serialized to JSON and sent
// with the HELLO command.  PasswordHash is required
// if the server is not listening on localhost.
// The WID (worker id) must be random and unique
// for each worker process.  It can be a UUID, etc.
// Non-worker processes should leave WID empty.
type ClientData struct {
	Hostname string `json:"hostname"`
	Wid      string `json:"wid"`

	// this can be used by proxies to route the connection.
	// it is ignored by Faktory.
	Username string `json:"username"`

	// Hash is hex(sha256(password + nonce))
	PasswordHash string `json:"pwdhash"`

	Labels []string `json:"labels"`
	Pid int `json:"pid"`

	// The protocol version used by this client.
	// The server can reject this connection if the version will not work
	// The server advertises its protocol version in the HI.
	Version int `json:"v"`
}
```

Handshake read (server greeting is a plain line, not RESP-prefixed by the client's expectations —
`readString` handles it):

```go
line, err := readString(r)
if strings.HasPrefix(line, "HI ") {
	str := strings.TrimSpace(line)[3:]
	var hi HIv2
	util.JsonUnmarshal([]byte(str), &hi)
	if ExpectedProtocolVersion != hi.V {
		util.Infof("Warning: server and client protocol versions out of sync: want %d, got %d", …)
	}
	salt := hi.S
	if salt != "" { client.PasswordHash = hash(password, salt, hi.I) }
} else {
	return nil, fmt.Errorf("expecting HI but got: %s", line)
}
data, _ := json.Marshal(client)
writeLine(w, "HELLO", data)
ok(r)
```

Password hashing (verbatim):

```go
func hash(pwd, salt string, iterations int) string {
	data := []byte(pwd + salt)
	hash := sha256.Sum256(data)
	if iterations > 1 {
		for i := 1; i < iterations; i++ { hash = sha256.Sum256(hash[:]) }
	}
	return fmt.Sprintf("%x", hash)
}
```

Frame encoder / decoder (verbatim):

```go
func writeLine(wtr *bufio.Writer, op string, payload []byte) error {
	_, err := wtr.WriteString(op)
	if payload != nil {
		if err == nil { _, err = wtr.WriteString(" ") }
		if err == nil { _, err = wtr.Write(payload) }
	}
	if err == nil { _, err = wtr.WriteString("\r\n") }
	if err == nil { err = wtr.Flush() }
	return err
}

func readResponse(rdr *bufio.Reader) ([]byte, error) {
	chr, err := rdr.ReadByte()
	line, err := rdr.ReadBytes('\n')
	line = line[:len(line)-2]
	switch chr {
	case '$':
		count, err := strconv.Atoi(string(line))
		if count == -1 { return nil, nil }
		var buff []byte
		if count > 0 { buff = make([]byte, count); io.ReadFull(rdr, buff) }
		rdr.ReadString('\n')
		return buff, nil
	case '-':
		return nil, &ProtocolError{msg: string(line)}
	default:
		return line, nil
	}
}
```

Client I/O deadlines: `writeLine`/`readResponse` set 5-second write/read deadlines on the conn; on
error the pooled conn is marked unusable. TCP keepalive is enabled on dial.

Client verb methods (line → verb mapping, verbatim payloads):

| method | wire |
| --- | --- |
| `Close()` | `END` (no payload) |
| `Ack(jid)` | ``ACK {"jid":"<jid>"}`` → expects `+OK` |
| `Push(job)` | `PUSH <job json>` → `+OK` |
| `PushBulk(jobs)` | `PUSHB <json array>` → bulk JSON `map[JID]ErrorMessage` |
| `Fetch(q...)` | `FETCH q1 q2 q3` → bulk job JSON or nil |
| `Fail(jid, err, backtrace)` | `FAIL {"jid":…, "message":…, "errtype":"unknown", "backtrace":[…]}` → `+OK` |
| `Flush()` | `FLUSH` → `+OK` |
| `RemoveQueues(names…)` | `QUEUE REMOVE a b` |
| `PauseQueues(names…)` | `QUEUE PAUSE a b` |
| `ResumeQueues(names…)` | `QUEUE RESUME a b` |
| `Info()` / `CurrentState()` | `INFO` → bulk JSON |
| `Beat(state?)` | `BEAT {"wid":…,"rss_kb":…[,"current_state":"quiet"|"terminate"]}` |

`Fail` in the Go client hardcodes `"errtype":"unknown"` and, when a backtrace is supplied (output of
`runtime/debug.Stack()`), splits on `\n` and drops the first 3 lines.

`Beat` (verbatim, including the lifecycle comment):

```go
/*
 * The first arg to Beat allows a worker process to report its current lifecycle state
 * to Faktory. All worker processes must follow the same basic lifecycle:
 *
 * (startup) -> "" -> "quiet" -> "terminate"
 *
 * Quiet allows the process to finish its current work without fetching any new work.
 * Terminate means the process should exit within X seconds, usually ~30 seconds.
 */
func (c *Client) Beat(args ...string) (string, error) {
	state := ""
	if len(args) > 0 { state = args[0] }
	hash := map[string]any{}
	hash["wid"] = RandomProcessWid
	hash["rss_kb"] = RssKb()
	if state != "" { hash["current_state"] = state }
	data, _ := json.Marshal(hash)
	cmd := fmt.Sprintf("BEAT %s", data)
	val, err := c.Generic(cmd)
	if val == "OK" { return "", nil }
	return val, err
}
```

Env configuration surface (`Server.ReadFromEnv`): `FAKTORY_PROVIDER` (name of another env var, must
not itself be a URL), else `FAKTORY_URL`; URL form `tcp://:mypassword@faktory.example.com:7419` —
scheme becomes `Network`, host:port becomes `Address`, userinfo becomes username/password. Default
port 7419.

---

## 8. Canonical Job struct — `client/job.go` (verbatim)

```go
type UniqueUntil string

var (
	RetryPolicyDefault        = 25
	RetryPolicyEmphemeral     = 0
	RetryPolicyDirectToMorgue = -1
)

const (
	UntilSuccess UniqueUntil = "success" // default
	UntilStart   UniqueUntil = "start"
)

type Failure struct {
	FailedAt       string   `json:"failed_at"`
	NextAt         string   `json:"next_at,omitempty"`
	ErrorMessage   string   `json:"message,omitempty"`
	ErrorType      string   `json:"errtype,omitempty"`
	Backtrace      []string `json:"backtrace,omitempty"`
	RetryCount     int      `json:"retry_count"`
	RetryRemaining int      `json:"remaining"`
}

type Job struct {
	Retry   *int           `json:"retry"`
	Failure *Failure       `json:"failure,omitempty"`
	Custom  map[string]any `json:"custom,omitempty"`
	// required
	Jid   string `json:"jid"`
	Queue string `json:"queue"`
	Type  string `json:"jobtype"`

	// optional
	CreatedAt  string `json:"created_at,omitempty"`
	EnqueuedAt string `json:"enqueued_at,omitempty"`
	At         string `json:"at,omitempty"`
	Args       []any  `json:"args"`

	ReserveFor int `json:"reserve_for,omitempty"`
	Backtrace  int `json:"backtrace,omitempty"`
}

func NewJob(jobtype string, args ...any) *Job {
	return &Job{
		Type:      jobtype,
		Queue:     "default",
		Args:      args,
		Jid:       RandomJid(),
		CreatedAt: time.Now().UTC().Format(time.RFC3339Nano),
		Retry:     &RetryPolicyDefault,
	}
}

func RandomJid() string {  // 12 random bytes, base64 RawURLEncoding
```

Custom-key reservation (verbatim comment): "Set custom metadata for this job. Faktory reserves all
element names starting with `_` for internal use, e.g. `SetCustom("_txid", "12345")`."

Enterprise custom keys set by helpers: `unique_for` (uint secs), `unique_until` (`"success"` |
`"start"`), `expires_at` (RFC3339Nano).

---

## 9. Push validation, reservation, retry/death — `manager/*.go` (verbatim)

```go
const (
	// Jobs will be reserved for 30 minutes by default.
	// You can customize this per-job with the reserve_for attribute in the job payload.
	DefaultTimeout = 30 * 60

	// Save dead jobs for 180 days, after that they will be purged
	DeadTTL = 180 * 24 * time.Hour
)
```

`manager.Push` validation (verbatim):

```go
if job.Jid == "" || len(job.Jid) < 8 { return fmt.Errorf("jobs must have a reasonable jid parameter") }
if job.Type == "" { return fmt.Errorf("jobs must have a jobtype parameter") }
if job.Args == nil { return fmt.Errorf("jobs must have an args parameter") }
if job.ReserveFor > 86400 { return fmt.Errorf("jobs cannot be reserved for more than one day") }
if job.CreatedAt == "" { job.CreatedAt = util.Nows() }
if job.Queue == "" { job.Queue = "default" }
// if job.At parses and is in the future -> Scheduled set, else enqueue now
```

Reservation (verbatim, `manager/working.go`):

```go
type Reservation struct {
	tsince    time.Time
	texpiry   time.Time
	extension time.Time
	lease     Lease
	Job       *client.Job `json:"job"`
	Since     string      `json:"reserved_at"`
	Expiry    string      `json:"expires_at"`
	Wid       string      `json:"wid"`
}

func (m *manager) reserve(ctx context.Context, wid string, lease Lease) error {
	timeout := job.ReserveFor
	if timeout == 0 { timeout = DefaultTimeout }
	if timeout < 60 { /* "Timeout too short %d, 60 seconds minimum" */ timeout = 60 }
	if timeout > 86400 { /* "Timeout too long %d, one day maximum" */ timeout = 86400 }
	…
}

var JobReservationExpired = &FailPayload{
	ErrorType:    "ReservationExpired",
	ErrorMessage: "Faktory job reservation expired",
}
```

Failure handling (verbatim, `manager/retry.go`):

```go
type FailPayload struct {
	Jid          string   `json:"jid"`
	ErrorMessage string   `json:"message"`
	ErrorType    string   `json:"errtype"`
	Backtrace    []string `json:"backtrace"`
}

func cleanse(failure *FailPayload) {
	failure.ErrorType = strings.TrimSpace(failure.ErrorType)
	failure.ErrorMessage = strings.TrimSpace(failure.ErrorMessage)
	if failure.ErrorType != "" {
		if len(failure.ErrorType) > 100 { failure.ErrorType = failure.ErrorType[0:100] }
	} else { failure.ErrorType = "unknown" }
	if failure.ErrorMessage != "" {
		if len(failure.ErrorMessage) > 1000 { failure.ErrorMessage = failure.ErrorMessage[0:1000] }
	} else { failure.ErrorMessage = "unknown" }
	if failure.Backtrace == nil { failure.Backtrace = []string{} }
	if len(failure.Backtrace) > 50 { failure.Backtrace = failure.Backtrace[0:50] }
}
```

(Note: source caps errtype at 100 chars, message at 1000 bytes, backtrace at 50 entries — the wiki
text says "the first 30 lines" for backtraces.)

Failure accumulation into the job payload (verbatim):

```go
if job.Failure != nil {
	job.Failure.RetryCount++
	if job.Failure.RetryRemaining > 0 { job.Failure.RetryRemaining-- }
	job.Failure.ErrorMessage = failure.ErrorMessage
	job.Failure.ErrorType = failure.ErrorType
	job.Failure.Backtrace = failure.Backtrace
} else {
	if job.Retry == nil { job.Retry = &client.RetryPolicyDefault }
	job.Failure = &client.Failure{
		RetryCount: 0, RetryRemaining: *job.Retry, FailedAt: util.Nows(),
		ErrorMessage: failure.ErrorMessage, ErrorType: failure.ErrorType, Backtrace: failure.Backtrace,
	}
}

return callMiddleware(ctxh, m.failChain, func() error {
	if job.Retry == nil || *job.Retry == 0 {
		// no retry, no death, completely ephemeral, goodbye
		return nil
	}
	if job.Failure.RetryCount < *job.Retry { return retryLater(ctx, m.store, job) }
	return sendToMorgue(ctx, m.store, job)
})

func nextRetry(job *client.Job) time.Time {
	count := job.Failure.RetryCount
	secs := (count * count * count * count) + 15 + (rand.Intn(30) * (count + 1))
	return time.Now().Add(time.Duration(secs) * time.Second)
}
```

`retryLater` sets `job.Failure.NextAt` and adds to the Retries set keyed by that timestamp;
`sendToMorgue` adds to the Dead set with expiry `now + DeadTTL` (180 days).

---

## 10. Non-Ruby consumer: `faktory_worker_go` (verbatim excerpts)

`types.go`:

```go
const ( Version = "1.7.0" )

// Perform actually executes the job. It must be thread-safe.
type Perform func(ctx context.Context, args ...interface{}) error

type LifecycleEventHandler func(*Manager) error
```

`manager.go` — worker process state + defaults:

```go
type Manager struct {
	Concurrency     int
	Logger          Logger
	ProcessWID      string
	Labels          []string
	Pool            *faktory.Pool
	ShutdownTimeout time.Duration
	queues     []string
	middleware []MiddlewareFunc
	state      string // "", "quiet" or "terminate"
	…
}

func NewManager() *Manager {
	return &Manager{
		Concurrency: 20,
		Labels:      []string{"golang-" + Version},
		// best practice is to give jobs 25 seconds to finish their work
		// and then use the last 5 seconds to force any lingering jobs to
		// stop by closing their Context. Many cloud services default to a
		// hard 30 second timeout beforing KILLing the process.
		ShutdownTimeout: 25 * time.Second,
		state:  "",
		queues: []string{"default"},
		eventHandlers: map[lifecycleEventType][]LifecycleEventHandler{
			Startup: {}, Quiet: {}, Shutdown: {},
		},
		…
	}
}
```

Registration and dispatch:

```go
// Register a handler for the given jobtype.  It is expected that all jobtypes
// are registered upon process startup.
//	mgr.Register("ImportantJob", ImportantFunc)
func (mgr *Manager) Register(name string, fn Perform) {
	mgr.jobHandlers[name] = func(ctx context.Context, job *faktory.Job) error {
		return fn(ctx, job.Args...)
	}
}
```

`setUpWorkerProcess` sets the package globals that make every pooled connection a *consumer*
connection:

```go
// This will signal to Faktory that all connections from this process are worker connections.
if len(mgr.ProcessWID) == 0 {
	faktory.RandomProcessWid = strconv.FormatInt(rand.Int63(), 32)
} else {
	faktory.RandomProcessWid = mgr.ProcessWID
}
faktory.Labels = mgr.Labels
pool, err := faktory.NewPool(mgr.Concurrency + 2)
```

Heartbeat goroutine (verbatim, `runner.go`):

```go
timer := time.NewTicker(15 * time.Second)
…
data, err := c.Beat(mgr.state)
if err != nil && strings.Contains(err.Error(), "Unknown worker") {
	// If our heartbeat expires, we must restart and re-authenticate.
	// Use a signal so we can unwind and shutdown cleanly.
	mgr.Logger.Warn("Faktory heartbeat has expired, shutting down...")
	process.Signal(syscall.SIGTERM)
}
if err != nil || data == "" { return err }
var hash map[string]string
json.Unmarshal([]byte(data), &hash)
if state, ok := hash["state"]; ok && state != "" { mgr.handleEvent(state) }
```

Fetch/execute/report loop (verbatim, `runner.go`):

```go
func process(ctx context.Context, mgr *Manager, idx int) {
	// delay initial fetch randomly to prevent thundering herd.
	// this will pause between 0 and 2B nanoseconds, i.e. 0-2 seconds
	time.Sleep(time.Duration(rand.Int31()))
	sleep := 1.0
	for {
		if mgr.state != "" { return }   // quiet/terminate: stop fetching
		select { case <-mgr.done: return; default: }
		err := processOne(ctx, mgr)
		… // NoHandlerError -> 50ms sleep; other errors -> exponential backoff sleep*2 capped
	}
}

func processOne(ctx context.Context, mgr *Manager) error {
	job, _ := c.Fetch(mgr.queueList()...)
	if job == nil { return nil }

	if !mgr.isRegistered(job.Type) {
		je := &NoHandlerError{JobType: job.Type}   // "No handler registered for job type %s"
		c.Fail(job.Jid, je, nil)
		return je
	}

	joberr := mgr.dispatch(ctx, job)
	if joberr != nil {
		// job errors are normal and expected, we don't return early from them
		mgr.Logger.Errorf("Error running %s job %s: %v", job.Type, job.Jid, joberr)
	}

	until := time.After(30 * time.Second)
	sleep := 1.0
	for {
		// we want to report the result back to Faktory.
		// we stay in this loop until we successfully report.
		err := mgr.with(func(c *faktory.Client) error {
			if joberr != nil { return c.Fail(job.Jid, joberr, nil) } else { return c.Ack(job.Jid) }
		})
		if err == nil { return nil }
		select {
		case <-until: … return nil
		case <-mgr.done: … return nil
		case <-time.After(time.Duration(sleep) * time.Second): sleep = math.Max(sleep*2, 30)
		}
	}
}
```

Queue selection helpers: `expandWeightedQueues` (queue repeated `weight` times),
`shuffleQueues` (random order per FETCH), `uniqQueues` (dedupe preserving first position) — i.e. the
weighted-random queue ordering is done client-side and expressed only through the ordering of names
in the `FETCH q1 q2 …` line.

Quiet/Terminate (verbatim, `manager.go`):

```go
// After calling Quiet(), no more jobs will be pulled from Faktory by this process.
func (mgr *Manager) Quiet() {
	if mgr.state == "quiet" { return }
	mgr.Logger.Info("Quieting...")
	mgr.state = "quiet"
	mgr.fireEvent(Quiet)
}

func (mgr *Manager) Terminate(reallydie bool) {
	if mgr.state == "terminate" { return }
	mgr.Logger.Info("Shutting down...")
	mgr.state = "terminate"
	close(mgr.done)
	if mgr.cancelFunc != nil {
		// cancel any jobs which are lingering
		time.AfterFunc(mgr.ShutdownTimeout, mgr.cancelFunc)
	}
	mgr.fireEvent(Shutdown)
	mgr.shutdownWaiter.Wait() // can't pass this point until all jobs are done
	mgr.Pool.Close()
	if reallydie { os.Exit(0) }
}
```

Lifecycle event vocabulary: `Startup = 1`, `Quiet = 2`, `Shutdown = 3`.

Unix signal map (verbatim, `runner_unix.go`):

```go
signalMap = map[os.Signal]string{
	SIGTERM: "terminate",
	SIGINT:  "terminate",
	SIGTSTP: "quiet",
	SIGTTIN: "dump",
}
```

Job context helper surface (`context.go`): `Helper` exposes `Jid()`, `JobType()`,
`Custom(key) (value, ok)`, `Bid()` (batch id, from custom `_bid`), `CallbackBid()`,
`TrackProgress(percent int, desc string, reserveUntil *time.Time)` (Enterprise TRACK SET),
`Batch(fn)`, `With(fn func(*faktory.Client) error)`.
