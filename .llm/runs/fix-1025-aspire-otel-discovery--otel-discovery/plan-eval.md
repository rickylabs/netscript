# PLAN-EVAL — fix-1025-aspire-otel-discovery--otel-discovery

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Reviewed: `plan.md`, `research.md`, `drift.md`, `worklog.md` @ `575aea3fb`, against issue
rickylabs/netscript#1025 and the brief at `/home/codex/repos/.briefing/slices/1025/implement.md`.

**Disclosure:** I wrote the brief that shaped this plan. The brief named upstream Aspire as the
"likeliest" cause and offered "compare against a minimal non-NetScript AppHost *if that is cheap*"
as an escape hatch. The plan took that hatch (drift.md, minor) and locked the classification anyway.
The finding below is a defect in my framing that the plan inherited without challenge, and it is the
reason for the verdict.

## Plan-Gate checklist

| # | Gate | Result | Evidence |
| - | - | - | - |
| 1 | Issue reproduced independently, not assumed | PASS | `research.md` F1–F3: generated TS AppHost at `.llm/tmp/telemetry-1025-repro/aspire/apphost.mts`, exit 12 with `The dashboard is not available`; `aspire ps --format Json` → `dashboardUrl: https://localhost:42183`; explicit `--dashboard-url` → exit 0. |
| 2 | Cause established, not inherited from the issue | **FAIL** | See Finding 1. `L1` and `research.md` F4 classify the cause as upstream on evidence that does not discriminate between the two hypotheses. |
| 3 | Scope bounded; no reinvention of Aspire | PASS | `plan.md` Non-Scope explicitly refuses a NetScript wrapper verb, honouring operating rule 3 and the brief's boundary. |
| 4 | Discoverability lever identified correctly | PASS | `L5` keys the remedy on the literal error string; skill + `.claude` mirror + observability hub. This is the acceptance bar (tools were invoked zero times across five runs), and the plan targets it rather than file count. |
| 5 | Regression test is a real gate, not a warning | PASS | `research.md` F6 identifies the silent-warning defect at `scaffold-e2e-test.ts:1227-1264`; `L4` promotes traces + export to critical; `L3`/Hidden Scope require non-empty JSON and non-zero export artifact. Corrects a false-green I did not specify. |
| 6 | Hazards found beyond the brief | PASS | Three the brief missed: `--apphost` and `--dashboard-url` are mutually exclusive (F4); `.[0]` selection is wrong under parallel isolated AppHosts (`L2`); command exit 0 does not imply telemetry data. |
| 7 | Validation plan scoped and one-pass | PASS | `plan.md` Validation Plan 1–5; single `scaffold.runtime` pass, matching the brief's cost constraint. |
| 8 | Acceptance boxes honestly mapped | **FAIL** | See Finding 2. Box 1 cannot be satisfied by this plan's deliverable and the plan does not say so. |

## Finding 1 — L1 is locked without falsifying the NetScript-side hypothesis (blocking)

`research.md` F4 argues: *"The same Aspire process writes the URL to run-state and serves its
dashboard; only the CLI's AppHost/backchannel lookup fails."* That localizes the failure to the
lookup path. It does **not** distinguish:

- **H-upstream** — the Aspire CLI fails to fall back to run-state when the backchannel returns nothing.
- **H-netscript** — the generated AppHost causes the backchannel `Getting Dashboard info (v2)` call
  to return nothing.

Both predict every observation in F1–F3 exactly. The plan's Non-Scope line — *"No generated
`apphost.mts` change: evidence shows the URL is already published and served"* — is an overclaim:
"published" refers to run-state and "served" to dashboard HTTP, and neither is the backchannel,
which is the one channel that actually fails.

The C# control (F7, drift.md) was the discriminator and did not complete. But it was never the
cheapest one. Reading the reproduction workspace directly:

- `aspire/apphost.mts` is 11 lines and delegates entirely to `.aspire/modules/aspire.mts`
  (`GENERATED CODE - DO NOT EDIT`, Aspire-authored SDK) and `.helpers/index.mts`. NetScript authors
  no backchannel code. **This is a genuine point for H-upstream and is stronger than F4's argument —
  it is static, costs nothing, and belongs in the record.**
- **But NetScript does configure the dashboard.** `.helpers/configure-dashboard.mts`, called first
  in `createNetScriptAppHost` (`index.mts:45`), sets three dashboard environment variables before
  the app is built:

  ```
  DASHBOARD_ENV_VARS.OTLP_HTTP_ENDPOINT      = config.Otel.HttpEndpoint
  DASHBOARD_ENV_VARS.ALLOW_UNSECURED_TRANSPORT   = 'true'
  DASHBOARD_ENV_VARS.UNSECURED_ALLOW_ANONYMOUS   = 'true'
  ```

  Anonymous/unsecured dashboard mode changes whether the AppHost mints a dashboard login token —
  and the CLI's dashboard-info call is what carries URL *and* token. A NetScript-authored setting
  that plausibly changes what that call has to report is exactly the NetScript-side mechanism the
  plan declared absent.

I am not asserting H-netscript is correct. I am asserting the plan cannot lock L1 until it is tested,
and that the test is minutes, not a C# template resolution:

1. Restart the reproduction AppHost with `UNSECURED_ALLOW_ANONYMOUS` / `ALLOW_UNSECURED_TRANSPORT`
   left unset (patch the local repro copy under `.llm/tmp/`, not the template).
2. Re-run `aspire otel traces users --apphost apphost.mts --non-interactive --nologo --format Json`.
3. Discovery succeeds → H-netscript, and this becomes a template fix that satisfies acceptance box 1
   outright with no workaround. Discovery still fails → H-upstream is established on evidence, L1
   stands, and the upstream report is materially stronger for including the negative control.

This matters beyond bookkeeping: acceptance box 4 requires filing upstream. Filing against
`dotnet/aspire` a cause that is actually ours is worse than not filing. It also decides *where*
upstream — CLI lookup versus the JS/TS AppHost SDK's backchannel implementation, which the C# control
would have separated and which the upstream report must not blur.

## Finding 2 — acceptance box 1 is not satisfiable by this plan; say so rather than tick it (blocking)

Box 1 reads: *works without a manual `--dashboard-url`, **or** the failure names the actual cause and
prints the working invocation.* If H-upstream holds, the plan delivers neither arm — a documented
recipe in a skill and a docs page is not the Aspire CLI's failure message, and the plan correctly
refuses to add a wrapper verb that could change it. That is the right call, but it means box 1 is at
best partially evidenced.

The plan must state this explicitly and leave the box unticked with the reason, per the brief's rule
that a box you cannot evidence must not be ticked. `close-gate` checks the issue's boxes. Carrying an
honest "partially evidenced — documented remedy only, upstream owns the message" is required, and it
is a reason to end in draft rather than mark ready.

## What is right and must carry forward unchanged

Findings 1 and 2 touch `L1` and the acceptance mapping only. `L2`–`L5`, the Hidden Scope hazards, the
E2E semantic-gate design, the skill/mirror/docs surface, and the validation plan are all sound and
several are better than the brief that produced them — in particular F6's silent-warning discovery
and the `--apphost`/`--dashboard-url` exclusivity, neither of which I specified. Re-plan `L1` only.
Do not restart the slice.

## Verdict

**FAIL**

Blocking: Finding 1 (L1 locked without a falsification test that is cheaply available) and Finding 2
(acceptance box 1 mapped optimistically). Both are amendable in place. Amend `plan.md` `L1`, record
the control's result in `research.md` and `worklog.md`, correct the Non-Scope overclaim, then proceed
to implementation with the rest of the plan intact.
