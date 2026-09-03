# S5 attempt 7 — runtime red, newly attributable; cleanup and quarantine

**Provenance.** This report, the two raw artifacts, and the quarantine action are all
**supervisor-generated**, committed under the Tier-A supervisor's own signature. No author bytes and
no product or test source changed.

## Immutable execution identity

- Coordinator lease: central checkpoint `6c5d54082f9dc80a9fe8f0b00176eccad651f0eb`
- Leased evidence head: `388f2b642a0d6e0ece4e346ea60f857928409beb`
- Product content head: `4f50b5a026120b5a3b0195fa1b6f495f08e2b46c`
- Executed checkout: `/home/codex/worktrees/netscript-s5-a7-388f2b642` (dedicated, detached)
- Executed HEAD: `388f2b642a0d6e0ece4e346ea60f857928409beb`, clean before the gate
- Invocations: **exactly one**. No retry.

## The single authorized command

```text
NETSCRIPT_E2E_BROWSER_EXECUTABLE=/home/codex/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome \
  deno task e2e:cli run scaffold.runtime --cleanup --format pretty \
  --log-file <reports>/s5-attempt7-scaffold-runtime-20260823-075547.ndjson
```

Browser verified before launch at the strict path: `Google Chrome for Testing 151.0.7922.34` — the
same build attempt 6 selected.

## Suite-owned verdict

- Raw exit code: **1**
- Terminal counts: **68 passed / 1 failed / 0 skipped** (69 gates, same population as attempt 6)
- Sole failed gate: `behavior.service-client-refetch`
- `cleanup.aspire-stop`: PASS, 506 ms
- `generated.service-client-contract`: PASS · `generated.deno-fmt-check`: PASS (F4/F5 hold)

Durable evidence, append-only:

- `reports/s5-attempt7-scaffold-runtime-20260823-075547.log`, SHA-256
  `a4ee67d25fa7189fd183cc6478c88e7b6cadf7a8b5bb041a585e1fb29694a042`
- `reports/s5-attempt7-scaffold-runtime-20260823-075547.ndjson`, SHA-256
  `c0b1a450498b0027ad9acce33fad373f05fafbb0eb61c326a53463c6a6a0eff4`

## The failure mode changed categorically

| | Attempt 6 | Attempt 7 |
| --- | --- | --- |
| Exit | `143` (128 + SIGTERM) | **`1`** |
| Duration | `900,030 ms` (outer boundary kill) | **`60,134 ms`** |
| `timedOut` flag | `false` | `false` |
| stdout tail | empty | empty |
| stderr tail | **empty** | **full stack trace** |
| Attribution | impossible | **named site and expression** |

Attempt 7's stderr names the stopping point exactly:

```text
Uncaught (in promise) Error: timed out waiting for browser expression (() => {
    const button = [...document.querySelectorAll('button')].find(
      (entry) => entry.textContent?.trim() === 'Rename');
    return button?.closest('li')?.querySelector('p')?.textContent?.trim() === "Seed User*";
  })()
    at waitUntil            (service-client-browser-probe.ts:623)
    at waitForExpression    (service-client-browser-probe.ts:610)
    at collectBrowserRefetchEvidence (service-client-browser-probe.ts:286)
    at probeLiveServiceRefetch (service-client-runtime-probe.ts:252)
```

The 900-second silent boundary kill did not recur. The gate now terminates in a fifteenth of the
time and says where it stopped.

## What this does and does not prove

**Neither CDP bound fired.** Grepping both artifacts for `CDP WebSocket connection` and
`CDP response to` returns **zero matches**. Both F8 timeouts were present and neither triggered, so
the transport connected and every CDP command settled normally this run. The browser genuinely ran:
the failing assertion is a DOM expression evaluated *inside the page*, which only executes after a
successful connect, `Runtime.enable`, navigation, and `Runtime.evaluate`.

**This does not prove F8 repaired attempt 6's hang.** Since no CDP timeout fired, attempt 7 gives no
evidence that a CDP wait was ever the attempt-6 stopping stage; what it shows is that the transport
was healthy this run and that attempt 6's stall did not recur. The honest reading is that F8
delivered its stated purpose — **attributability** — and that the previously concealed frontier is
now visible. Whether the two are causally linked remains unproven, and this report does not claim it.

**The remaining red is behavioral, not transport.** `waitForExpression` never observed the optimistic
row `Seed User*` after the Rename click, and hit the pre-existing 20 s `waitUntil` bound at `:623`.
That is a genuine product-behavior question about the optimistic update / refetch path, not a probe
defect. It is a new and deeper frontier than any prior attempt reached, and it is **not** classified
here as pass or fail of the refetch feature — the probe returned a timeout, not a behavioral verdict.

## `fresh-browser` was NOT run

The lease permitted it **only** on a `scaffold.runtime` PASS with an empty inter-gate audit.
`scaffold.runtime` failed, so the condition was not met and the gate was not executed. No second
runtime or browser invocation of any kind occurred.

## Cleanup and audit — the first audit was wrong

The inter-gate audit initially read empty and **was not**. Two independent signals both missed real
residue:

- the suite's own `cleanup.aspire-stop` reported **PASS** in 506 ms, and
- `agentic:leak-check` reported `probes.aspire: ok`, `probes.docker: ok`, `survivors: []`.

A process sweep by **cwd containment** found three surviving `aspire-managed` processes — PIDs
`646406`, `646408`, `646415`, started `09:59:59` during the run, all with cwd inside
`…/netscript-s5-a7-388f2b642/.llm/tmp/cli-e2e/plugin-smoke-20260823-095547/aspire`. They had been
reparented to the WSL `/init` relay (PPID `1291`), i.e. orphaned when the run's Aspire CLI exited.
Path containment is positive proof of run-ownership, so they were this run's leak.

**They ignored SIGTERM.** All three survived a graceful terminate and required SIGKILL, with
containment re-verified immediately before each signal. Foreign children of the same relay — `tmux`,
`claude`, `codex`, `browser_crashpad` — were identified and left untouched.

*(Noted for the record: a process that ignores SIGTERM is the same hazard as carried observation R1,
where `terminateBrowserProcess` awaits `child.status` after SIGTERM with no timer. That remains out
of F8 scope; this is corroborating evidence for a later leaf, not a change request.)*

### Quarantine — moved, recoverable, not deleted

One run-owned unreadable residue remained: `…/plugin-smoke-20260823-095547/.data/postgres/18/docker`
(mode `700`, container-uid owned, unreadable to `codex`). With no owning process or container left,
the **exact enclosing tree** was moved:

```text
/tmp/netscript-s5-a7-quarantine.Cy2tNS/plugin-smoke-20260823-095547   (843 MB, recoverable)
```

Nothing was deleted.

### Post-quarantine re-audit — empty on every class

| Class | Result |
| --- | --- |
| unreadable dirs in worktree | **0** |
| processes rooted in worktree | **0** |
| Docker containers (any state) | **0** |
| occupied runtime ports | **0** |
| `leak-check` aspire / docker / survivors | `ok` / `ok` / `[]` |

`leak-check` was written to a scratch slice dir throughout, so the leaf's `leak-report.md` was never
regenerated — the contamination of 2026-08-15 was not repeated.

## Standing state

No retry, no product or test mutation, no evaluator, no readiness/merge/metadata action, no relabel,
no issue mutation. All four prior quarantines, the six earlier S5 attempt histories,
`receipts/f6-test.json`, and `receipts/f7-test.json` remain untouched and append-only. Attempt 7's
red joins them as preserved evidence.

Stopped for the coordinator's IMPL-EVAL decision.
