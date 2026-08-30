# help.md — when something is wrong and you do not know why

A symptom-to-action playbook for the non-deterministic problems: things that hang, vanish, or
silently do nothing. **Reach for this before you start guessing**, and before you conclude the
framework is broken.

Aspire-specific commands here were re-verified against **Aspire CLI 13.5.3**; see the receipt index
in `aspire/SKILL.md`. Where a command does not exist, this file says so.

> **The one rule this file exists to teach.** In the last round five agents lost hours to problems
> the toolchain would have answered in seconds, because they hand-rolled `curl` probes instead of
> asking the runtime. `aspire otel` — the command that shows logs, spans and traces — was run **zero
> times** across all five. Ask the tools first.

## Framework or package guidance is unavailable offline

Run `netscript agent init --with-docs`. It installs a version-checked offline corpus and reports the
local task-router entrypoint. The API portion is generated from the exact NetScript packages in the
project, including every published export subpath.

---

## `Healthy` is not proof

`state: Running` + `healthStatus: Healthy` with an empty `healthReports` array means **nothing was
ever checked** — health was inferred from the process being alive. A crash-looping resource under
watch mode, or one whose port never bound, reads as `Healthy`.

```sh
aspire describe --format Json          # look at healthReports, not just healthStatus
aspire logs <resource> --tail 50       # what the process is actually doing
aspire otel logs <resource>            # structured logs from the telemetry API
```

If `healthReports` is empty, you have no evidence. Get some before you believe the label.

---

## A dangling AppHost is causing conflicts

Ports held, resources answering that are not yours, a stack that will not start cleanly.

```sh
aspire ps --format Json --non-interactive --nologo           # inspect running AppHosts first
aspire describe --format Json --non-interactive --nologo     # inspect resource state
aspire resource <resource> stop                              # stop one resource when targeted cleanup is enough
aspire stop --apphost <exact-AppHost-path> --non-interactive --nologo
```

**Never kill `aspire agent mcp`** — those are your MCP servers, not AppHosts.

On a shared machine, confirm the thing answering a port is yours: compare the resource's _assigned_
port from `aspire describe --format Json` against the fixed/default port you are probing. A foreign
service on a default port will happily answer and look healthy. If stopping the AppHost does not
restore a clean state, run `aspire doctor --format Json --non-interactive --nologo`; leave leftover
containers for Aspire to reclaim rather than removing containers by hand.

Do not use the host-wide `aspire stop` mode with `--all`. On shared hosts it can stop sibling runs,
and it is not a reliable cleanup oracle: three independent agents saw it report
`No running AppHost found` and exit 0 while processes rooted at the AppHost survived.

## Vite will not start, or hangs

Do not restart the whole stack.

```sh
aspire resource <name> restart      # start | stop | restart
aspire logs <name> --follow         # watch it come back up
```

## An event does not fire — trigger, saga, worker, stream

This is where traces earn their keep. Do not add print statements.

```sh
aspire otel traces <resource>    # follow the request across resources
aspire otel spans <resource>     # find the span that failed or never started
aspire otel logs <resource>      # structured logs, not console noise
aspire logs <resource> --search "<term>"   # full-text across log content
```

Also available through the **Aspire MCP** tools (`list_traces`, `list_trace_structured_logs`,
`list_structured_logs`, `list_console_logs`, `list_resources`) and the **NetScript MCP** server
(`netscript agent mcp`), whose run model is a read model over the same OTel spans — `list_runs`,
`get_run`, `get_recent_errors`. Use whichever is already connected.

## You need the browser console

**You almost certainly do not need Playwright for this.** Generated app resources emit
`withBrowserLogs()` **by default**, so client-side failures — a `TypeError` thrown by an island, a
durable-stream consumer dying in the browser — land in the Aspire dashboard and in:

```sh
aspire logs <app-resource>
aspire otel logs <app-resource>
```

Three agents last round fought Chrome and Playwright screenshot hangs to get information that was
already being collected for them.

## You need real browser interaction

Use Playwright for what it is actually for — clicking through a flow, asserting rendered state,
capturing screenshots — and **correlate what you see with `aspire logs` for the same moment.** The
browser tells you what rendered; Aspire tells you why.

One trap that cost time: waiting on `networkidle` against a dev server with HMR **never settles**.
Wait on a DOM selector or a content condition instead.

## The environment itself feels wrong

```sh
aspire doctor --format Json     # diagnoses Aspire environment issues and verifies setup
```

There is **no `netscript doctor`** command in `0.0.3`. If NetScript's own setup looks wrong, check
`netscript --version` and `netscript config` instead.

## A plugin install succeeded, but nothing is wired

The plugin's boundary never runs, a generated registry looks wrong, or install reported success but
the application behaves as though the plugin does not exist.

```sh
netscript plugin doctor
```

Run this **before you read source or hand-probe endpoints**. It checks the plugin boundary and
generated wiring from the same CLI surface that installed the plugin; an exit-zero install is not
proof that the runtime registry is correct.

## You are unsure how an API works

**In this order:**

1. **`deno doc jsr:@netscript/<pkg>/<subpath>`** — the exported surface, including every export
   subpath. The helper you want is usually a few exports below the general-purpose one you already
   found. Use `NO_COLOR=1` — `deno doc` emits ANSI escapes even when redirected, which corrupts
   every grep.
2. **The official NetScript docs**, through the connected NetScript MCP server when available.
3. Only then, the source.

Guessing an API signature and iterating against the type checker is slower than reading it once.

## A command "succeeded" but nothing works

**Verify the artefact, never the exit code.**

A piped command reports the exit status of the _last stage in the pipe_ — `deno task check | tail`
exits `0` while type checking fails. An `&&` chain short-circuiting on a no-op produces a false
success.

Do not treat an exit-zero generator, plugin install, build or publish as proof. Check that the
produced files exist, type-check, and that the boundary actually runs.

```sh
deno check <specific-file>   # not what your editor says
deno info <module>           # how it really resolved, and from which cache
deno task check              # read the output, not the exit code
```

## Types fail but nothing looks wrong

```sh
deno info <module>    # resolution and cache — the most under-used diagnostic
deno check --reload   # rule out a stale cache
```

If an import resolves somewhere unexpected, check for a `tsconfig.json` **above** your project:
tools that walk upward will inherit it. A generated project should carry its own.

---

## Cleaning up after yourself

```sh
aspire ps --format Json --non-interactive --nologo           # inspect before stopping anything
aspire describe --format Json --non-interactive --nologo     # inspect runtime/resource state
aspire resource <resource> stop                              # targeted stop when the whole stack should stay up
aspire stop --apphost <exact-AppHost-path> --non-interactive --nologo
```

Re-run `aspire ps` and `aspire describe` after stopping. Aspire's `dcp` helper processes can take
about 20 seconds to exit, so re-check rather than killing them. Leaving AppHosts running is how the
_next_ run gets a port conflict it cannot explain; leftover containers are Aspire's to reclaim. If
cleanup still looks wrong, use `aspire doctor --format Json --non-interactive --nologo` to diagnose
the container runtime, SDK, and certificates.

`aspire cache clear` clears only the Aspire CLI's disk cache. It does **not** stop AppHosts or
remove containers, so use it only for a CLI-cache problem—not as runtime cleanup.
