# faktory-sidekiq-raw-02 — Sidekiq (delta over Faktory): retry semantics, death handlers, lifecycle

Fetch date: 2026-08-20.

Source: `https://github.com/sidekiq/sidekiq/wiki` — wiki repo
`https://github.com/sidekiq/sidekiq.wiki.git`, commit `d20b1a0bbecb8bb0db2566b0b68f191e60ac718c`
(2026-07-02). Pages used: `Job-Lifecycle.md`, `Job-Format.md`, `Error-Handling.md`, `Signals.md`.
(Cloned rather than WebFetched: WebFetch returns model-written summaries, not the page text.)

Scope note: Sidekiq has **no worker wire protocol** — workers talk directly to Redis, so there is no
HELLO/BEAT/ACK verb inventory to compare. What is included below is the material Faktory does not
already show: the job-state vocabulary, the JSON job/retry field names, the retry-delay formula and
its per-job override hooks, the exhausted/death callbacks, and the signal vocabulary.

---

## 1. Job state vocabulary — wiki `Job-Lifecycle` (verbatim)

> When first viewing the Web UI, you will probably notice counters for all of the possible states of a
> job. This is an explanation of what those states mean, and how jobs transition between them.
>
> - **Processed** - successfully completed, and no further action will be taken.
> - **Failed** - the number of times all jobs were executed by Sidekiq and raised an error. Since the
>   default retry policy is 25, a single job can lead to Failed increasing by 25. It's important to
>   note that a job will never end up in Failed, as it's a purely transitive state. The only possible
>   final states are Processed or Dead.
> - **Busy** - currently processing.
> - **Enqueued** - waiting for a turn in the processing queue (listed in chronological order, by
>   queue).
> - **Retries** - failed, but will be automatically retried sometime in the future (listed in
>   chronological order).
> - **Scheduled** - configured to be run at some point in the future (may be enqueued when their
>   processing time comes up).
> - **Dead** - will no longer be retried but is saved so it can be manually retried at some point in
>   the near future.
>
> It's important to note that a single job can increment both the Processed and Failed counters if it
> fails once or more, but succeeds upon retry.
>
> ## Altering the lifecycle
>
> The retry property can be set on a specific job to disable retries completely (job goes straight to
> Dead) or disable death (failed job is simply discarded). If your Failed count is increasing but you
> don't see anything in the Retry or Dead tabs, it's likely you've disabled one or both of those:
>
> ```ruby
> class SomeJob
>   # will be completely ephemeral, not in Retry or Dead
>   sidekiq_options retry: false
>   # will go immediately to the Dead tab upon first failure
>   sidekiq_options retry: 0
> ```

---

## 2. Job JSON shape — wiki `Job-Format` (verbatim)

> Sidekiq serializes jobs to Redis in JSON format. Each Job is a simple Hash of data.
>
> # Job
>
> At bare minimum, a job requires five fields:
>
> ```
> {
>   "class": "SomeWorker",
>   "jid": "b4a577edbccf1d805744efa9", // 12-byte random number as 24 char hex string
>   "args": [1, "arg", true],
>   "created_at": 1234567890123,
>   "enqueued_at": 1234567890123
> }
> ```
>
> `args` is splatted into an instance of the worker class's `perform` method. Note that `enqueued_at`
> isn't added to the payload for scheduled jobs. They get the enqueued_at field when they are pushed
> onto a queue.
>
> ## ActiveJob Middleware Format
>
> If writing server middleware and have integrated Sidekiq with ActiveJob the format provided for the
> second argument of `call` is as follows:
>
> ```json
> {
>   "class": "ActiveJob::QueueAdapters::SidekiqAdapter::JobWrapper",
>   "wrapped": "SomeWorker",
>   "queue": "default",
>   "args":[
>     {
>       "job_class": "SomeWorker",
>       "job_id": "b4a577edbccf1d805744efa9",
>       "provider_job_id": null,
>       "queue_name": "default",
>       "priority": null,
>       "arguments": ["some",["argument","value"]],
>       "executions": 0,
>       "locale": "en",
>       "attempt_number": 1
>     }
>   ],
>   "retry": true,
>   "wait": "0.1",
>   "jid": "d774900367dc8b2962b2479c", // Note different JID
>   "created_at": 1234567890123,
>   "locale": "en",
>   "enqueued_at": 1234567890123,
>   "error_message": null,
>   "error_class": null,
>   "failed_at": null,
>   "retry_count": 0,
>   "retried_at": null
> }
> ```
>
> # Worker Options
>
> When a job is serialized, the options for the Worker are serialized as part of the job payload:
>
> ```
> {
>   "queue": "default",
>   "retry": true
> }
> ```
>
> # Scheduled Jobs
>
> The `at` element stores when a job is scheduled to execute, in Unix epoch format:
>
> ```
> {
>   "at": 1234567890.123
> }
> ```
>
> # Retries
>
> Sidekiq's retry feature adds several elements to the job payload, necessary for documenting the
> error in the UI:
>
> ```
> {
>   "retry_count": 2, // number of times we've retried so far
>   "error_message": "wrong number of arguments (2 for 3)", // the exception message
>   "error_class": "ArgumentError", // the exception class
>   "error_backtrace": ["line 0", "line 1", ...], // some or all of the exception's backtrace, optional, array of strings
>   "failed_at": 1234567890123, // the first time the job failed
>   "retried_at": 1234567890123 // the last time the job failed
> }
> ```
>
> The last two items are timestamps.
>
> ## Changes
>
> Before 8.0, Sidekiq used epoch seconds as a Float, `1234567890.123`, for all `*_at` timestamps.
> Sidekiq 8.0 changes all `*_at` timestamps to use Integer millseconds since epoch. Instead of
> `1234567890.123`, the value will be `1234567890123`. This was done to avoid floating point numbers
> (which have a long, sad history in JSON and JS).

Delta vs Faktory field naming: `class` vs `jobtype`; `error_class`/`error_message`/`error_backtrace`
at the payload top level vs Faktory's nested `failure: {errtype, message, backtrace}`; integer-ms
epoch timestamps vs Faktory's RFC3339Nano strings; `retry: true|false|N` (boolean allowed) vs
Faktory's integer-only `retry` with `-1` sentinel.

---

## 3. Retry semantics, exhaustion, death handlers — wiki `Error-Handling` (verbatim)

> ## Ethos
>
> Sidekiq retries are for **unexpected** errors: bugs, 3rd party service downtime, etc. If you have a
> system which needs a business process to handle expected errors, that's not appropriate for retries.
> Use a state machine and other application logic to handle those expected errors.
>
> ## Best Practices
>
> 1. Use an error service […]
> 2. Let Sidekiq catch errors raised by your jobs. Sidekiq's built-in retry mechanism will catch those
>    exceptions and retry the jobs regularly. […]
> 3. If you don't fix the bug within 25 retries (about 21 days), Sidekiq will stop retrying and move
>    your job to the Dead set. You can fix the bug and retry the job manually anytime within the next 6
>    months using the Web UI.
> 4. After 6 months, Sidekiq will discard the job.
>
> ## Error Handlers
>
> Gems can attach to Sidekiq's global error handlers so they will be informed any time there is an
> error inside Sidekiq. […] You can create your own error handler by providing something which
> responds to `call(exception, context_hash, config)`:
>
> ```ruby
> Sidekiq.configure_server do |config|
>   config.error_handlers << proc {|ex,ctx_hash,config| MyErrorService.notify(ex, ctx_hash) }
> end
> ```
>
> `ex` is the actual Exception raised. `context_hash` is an optional hash with the job payload and any
> additional context for the error. `config` gives you access to Sidekiq's configuration.
>
> Note that error handlers are only relevant to the Sidekiq server process. They aren't active in Rails
> console, for instance.
>
> ## Backtrace Logging
>
> Enabling `backtrace` logging for a job will cause the backtrace to be persisted throughout the
> lifetime of the job. **Beware**: backtraces can take 1-4k of memory in Redis each so large amounts of
> failing jobs can significantly increase your Redis memory usage.
>
> ```ruby
> sidekiq_options backtrace: true
> sidekiq_options backtrace: 20 # top 20 lines
> ```
>
> ## Automatic job retry
>
> Sidekiq will retry failures with an exponential backoff using the formula
> `(retry_count ** 4) + 15 + (rand(10) * (retry_count + 1))` (i.e. 15, 16, 31, 96, 271, ... seconds +
> a random amount of time). It will perform 25 retries over approximately 20 days. Assuming you deploy
> a bug fix within that time, the job will get retried and successfully processed. After 25 times,
> Sidekiq will move that job to the Dead Job queue, assuming that it will need manual intervention to
> work.
>
> The maximum number of retries can be globally configured by adding the following to your
> `sidekiq.yml`:
>
> ```yaml
> :max_retries: 1
> ```

(Delta vs Faktory: Faktory's smear is `rand(30) * (count + 1)`, Sidekiq's is `rand(10) * (count+1)`;
both share the `count**4 + 15` core and a 25-retry default.)

Approximate retry table from the page (assumes `rand(10)` always returns 5; hint says see
`Sidekiq::JobRetry#delay_for` for the current formula):

```
 # | Next retry backoff | Total waiting time
 -------------------------------------------
 1 |       0d 0h 0m 20s |       0d 0h 0m 20s
 2 |       0d 0h 0m 26s |       0d 0h 0m 46s
 3 |       0d 0h 0m 46s |       0d 0h 1m 32s
 4 |       0d 0h 1m 56s |       0d 0h 3m 28s
 5 |       0d 0h 4m 56s |       0d 0h 8m 24s
 6 |      0d 0h 11m 10s |      0d 0h 19m 34s
 7 |      0d 0h 22m 26s |       0d 0h 42m 0s
 8 |      0d 0h 40m 56s |      0d 1h 22m 56s
 9 |       0d 1h 9m 16s |      0d 2h 32m 12s
10 |      0d 1h 50m 26s |      0d 4h 22m 38s
11 |      0d 2h 47m 50s |      0d 7h 10m 28s
12 |       0d 4h 5m 16s |     0d 11h 15m 44s
13 |      0d 5h 46m 56s |      0d 17h 2m 40s
14 |      0d 7h 57m 26s |        1d 1h 0m 6s
15 |     0d 10h 41m 46s |     1d 11h 41m 52s
16 |      0d 14h 5m 20s |      2d 1h 47m 12s
17 |     0d 18h 13m 56s |       2d 20h 1m 8s
18 |     0d 23h 13m 46s |     3d 19h 14m 54s
19 |      1d 5h 11m 26s |      5d 0h 26m 20s
20 |     1d 12h 13m 56s |     6d 12h 40m 16s
21 |     1d 20h 28m 40s |       8d 9h 8m 56s
22 |       2d 6h 3m 26s |    10d 15h 12m 22s
23 |      2d 17h 6m 26s |     13d 8h 18m 48s
24 |      3d 5h 46m 16s |      16d 14h 5m 4s
25 |     3d 20h 11m 56s |     20d 10h 17m 0s
```

> ## Dead set
>
> The Dead set is a holding pen for jobs which have failed all their retries. Sidekiq will not retry
> those jobs, you must manually retry them via the UI. The Dead set is limited by default to 10,000
> jobs or 6 months so it doesn't grow infinitely. **Only jobs configured with 0 or greater retries will
> go to the Dead set.** Use `retry: false` if you want a particular type of job to be executed only
> once, no matter what happens.
>
> ## Configuration
>
> ```ruby
> sidekiq_options retry: 5              # Only five retries and then to the Dead Job Queue
> sidekiq_options queue: 'default', retry_queue: 'bulk'   # send retries to the 'bulk' queue
> sidekiq_options retry: false          # job will be discarded if it fails
> sidekiq_options retry: 0              # skip retries, straight to the Dead set
> sidekiq_options retry_for: 48.hours   # as of Sidekiq 7.1.3, retry for a period of time
> sidekiq_options retry: 5, dead: false # will retry 5 times and then disappear
> ```
>
> The retry delay can be dynamically calculated by defining a `sidekiq_retry_in` method in your job
> class. Support for `:kill` and `:discard` was added in v6.5.2. Support for the third block parameter,
> jobhash, was added in v7.0.8.
>
> ```ruby
> class JobWithCustomRetry
>   include Sidekiq::Job
>   sidekiq_options retry: 5
>
>   # The current retry count, exception and job hash is yielded. The return value of the
>   # block can be an integer to be used as the the delay in seconds, :kill to
>   # send the job to the DeadSet, or :discard  to throw away the job. A
>   # return value of nil will use the default delay.
>   sidekiq_retry_in do |count, exception, jobhash|
>     case exception
>     when SpecialException
>       10 * (count + 1) # (i.e. 10, 20, 30, 40, 50)
>     when ExceptionToKillFor
>       :kill
>     when ExceptionToForgetAbout
>       :discard
>     end
>   end
> end
> ```
>
> After retrying so many times, Sidekiq will call the `sidekiq_retries_exhausted` hook on your Job **if
> you've defined it**. The hook receives the queued job hash as an argument and is called right before
> Sidekiq moves the job to the Dead set. Return `:discard` if you don't want to bother saving it.
>
> ```ruby
> class FailingJob
>   include Sidekiq::Job
>   sidekiq_retries_exhausted do |job, ex|
>     Sidekiq.logger.warn "Failed #{job['class']} with #{job['args']}: #{job['error_message']}"
>   end
> end
> ```
>
> ## Death Notification
>
> The `sidekiq_retries_exhausted` callback is specific to a Job class. Starting in v5.1, Sidekiq can
> also fire a global callback when a job dies:
>
> ```ruby
> # this goes in your initializer
> Sidekiq.configure_server do |config|
>   config.death_handlers << ->(job, ex) do
>     puts "Uh oh, #{job['class']} #{job["jid"]} just died with error #{ex.message}."
>   end
> end
> ```
>
> ## Process Crashes
>
> Sidekiq uses the exact same Redis logic as Resque for fetching jobs. This has a serious consequence:
> If the Sidekiq process segfaults or crashes the Ruby VM, any jobs that were executing will be lost.
> If the Sidekiq process is killed due to CPU or memory limits, any jobs that were executing will be
> lost. Sidekiq Pro offers a reliable queueing feature which does not lose those jobs.
>
> ## No More Bike Shedding
>
> […] Design your code to work well with Sidekiq's retry mechanism as it exists today or patch the
> JobRetry class to add your own logic. […]

(Delta vs Faktory: Faktory's reservation/working-set model means a crashed worker's job is recovered
after `reserve_for` expiry; Sidekiq OSS loses in-flight jobs on crash. Faktory has no per-job custom
retry-delay hook or `retry_for` window, no `retry_queue`, and no `dead: false` — its equivalents are
the fixed formula plus `retry: 0` / `retry: -1`.)

---

## 4. Signal vocabulary — wiki `Signals` (verbatim)

> Sidekiq responds to several signals. On a Unix machine, you can use the `kill` binary or the
> `Process.kill` API in Ruby […]
>
> ## TTIN
>
> Sidekiq will respond to TTIN by printing backtraces for all threads in the process to the logger.
> This is useful for debugging if you have a Sidekiq process that appears to be dead or stuck.
>
> ## TSTP
>
> TSTP tells Sidekiq to "quiet" as it will be shutting down at some point in the near future. It will
> stop fetching new jobs but continue working on current jobs. Use TSTP + TERM to guarantee shutdown
> within a time period. Best practice is to send TSTP at the start of a deploy and TERM at the end of a
> deploy.
>
> Note you still need to send TERM to actually exit the Sidekiq process.
>
> The quiet signal used to be USR1 but was changed to TSTP in Sidekiq 5.0.
>
> ## USR2
>
> Sidekiq <6.0 used USR2 for logfile maintenance. This functionality has been removed in 6.0. Sidekiq
> Enterprise uses USR2 as the trigger for a rolling restart.
>
> ## TERM
>
> TERM signals that Sidekiq should shut down within the `-t` timeout option given at start-up. It will
> stop fetching new jobs, but continue working on current jobs (as with TSTP). Any jobs that do not
> finish within the timeout are forcefully terminated and pushed back to Redis to be executed again
> when Sidekiq starts up. The timeout defaults to 25 seconds since all Heroku processes must exit
> ~~within 30 seconds~~.
>
> ## API
>
> The Sidekiq API has helpers to send those signals to processes which are running in an environment
> where you cannot use signals, e.g. JRuby, Heroku or other environments. For example:
>
> ```
> require 'sidekiq/api'
> Sidekiq::ProcessSet.new.each(&:quiet!)
> ```
>
> ## Capistrano
>
> The Capistrano integration sends TSTP at the very start of the deploy and sends TERM at the end of
> the deploy […]
