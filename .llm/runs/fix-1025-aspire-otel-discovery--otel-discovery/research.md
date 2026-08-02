# Research — fix-1025-aspire-otel-discovery--otel-discovery

## Re-baseline

- Carried-in source: issue #1025 and the user's verified Aspire CLI 13.4.6 reproduction.
- Re-derived against `origin/main` @ `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9` on 2026-08-01.
- The current E2E still starts the generated AppHost with `--isolated`; telemetry commands do not
  accept that flag and do not pass `--dashboard-url`.

## Cycle-1 findings — retained for history

| # | Finding | How to verify |
| - | - | - |
| 1 | A fresh NetScript-generated TypeScript AppHost reproduces the defect on Aspire CLI 13.4.6. | Start `.llm/tmp/telemetry-1025-repro/aspire/apphost.mts`; automatic `aspire otel traces users --apphost apphost.mts ...` prints `Could not fetch telemetry data from the dashboard. The dashboard is not available.` and exits 12. |
| 2 | Aspire run-state contains the correct URL while automatic discovery fails. | In the same detached-start shell, `aspire ps --format Json` returned `dashboardUrl: https://localhost:42183`. |
| 3 | Dashboard HTTP access works with explicit discovery. | With the run-state URL, `aspire otel traces users --dashboard-url https://localhost:43903 ... --format Json` returned `[]` and exit 0. Empty data is expected in the minimal control before traffic. |
| 4 | The defect is NetScript-side: anonymous dashboard mode suppresses the login-token URL needed by automatic discovery. | In the disposable generated scaffold, remove only `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS` from both `aspire.config.json` and `configure-dashboard.mts`; a detached isolated start then prints a tokenized dashboard login URL and automatic `aspire otel traces users --apphost apphost.mts ...` returns `[]`, exit 0. |
| 5 | `aspire otel traces --help` and `aspire export --help` expose `--dashboard-url` but no `--isolated`. | Live 13.4.6 help output captured during research. |
| 6 | Existing telemetry checks can silently warn. | `.llm/tools/e2e/scaffold-e2e-test.ts:1227-1264` sets `critical` from `--strict-telemetry`; neither command asserts non-empty JSON. |
| 7 | `ASPIRE_ALLOW_UNSECURED_TRANSPORT` is not the cause and must remain. | Removing it makes startup fail because NetScript configures an HTTP OTLP endpoint; restoring it while leaving anonymous mode unset makes discovery pass. |
| 8 | The presumed isolated-mode defect does not exist after the template fix. | The passing control used `aspire start --isolated` and automatic `aspire otel traces ... --apphost apphost.mts`; no `--isolated` option is needed on the consumer command. |
| 9 | Anonymous mode is emitted twice by NetScript. | `generate-aspire-config.ts` writes the environment variable into `aspire.config.json`; `configure-dashboard.ts.template` sets it in the AppHost process. Both must be removed and the embedded asset regenerated. |
| 10 | `aspire export` recovers when anonymous mode is removed. | Against the patched detached isolated reproduction, export gathered resource data, console logs, structured logs, and traces; saved a 12,857-byte zip; and exited 0. |
| 11 | Existing docs corroborate the authenticated behavior. | `docs/site/explanation/aspire.md:352` says `aspire start` prints a one-time dashboard login token. |
| 12 | F2/F3 used different expected ephemeral ports. | The failing and explicit-URL controls were separate detached starts (`:42183` and `:43903`); generated profiles bind `localhost:0`, so the port change is unrelated to the cause. |
| 13 | Token-facing documentation exceeds this slice. | A repository-wide audit found 53 files matching dashboard/open/`:18888` guidance. Several mention the token, but many direct links do not; this is reported rather than expanded into a corpus rewrite. |

## jsr-audit surface scan

- Surface scanned: `@netscript/cli` generator sources and published embedded assets.
- Slow-type/public API risk: none; no exported TypeScript signatures change. Generated-asset and
  package fitness are covered by focused tests, `check:assets-barrel`, and `quality:gate`.

## Cycle-1 open questions — superseded by the cycle-2 amendment below

- Must resolve now: what counts as non-empty telemetry JSON. Resolve by parsing command stdout and
  requiring a non-empty JSON array for the traces step after the suite has exercised HTTP traffic.
- Resolved now: `aspire export` recovery. Observed exit 0 and a non-empty zip after removing anonymous mode.
- Safe to defer: no open cause question remains; the local A/B control directly changed the failing behavior.
# Cycle 2 verification amendment — 2026-08-01

## F10 — Rejected source change restored

The seven rejected product/diagnostic files were restored to `origin/main`. There is no dashboard
environment-variable, generated Aspire config, embedded asset, docs sample, or diagnostic-harness
diff remaining.

## F11 — Fresh A/B differs from cycle-1 evidence

Using the existing disposable generated AppHost and Aspire CLI
`13.4.6+87fe259e4fc244c599019a7b1304c85a1488f248` in a persistent shell:

| Mode | `aspire ps` dashboard URL | Automatic traces | Exit |
| --- | --- | --- | --- |
| authenticated | `https://localhost:45747/login?t=…` | `[]` | 0 |
| anonymous | `https://localhost:45737` | `[]` | 0 |

The anonymous dashboard returned HTTP 200. Only
`ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS=true` changed between halves. This directly differs from
cycle 1, where anonymous mode produced `The dashboard is not available`, exit 12.

## F12 — Cycle-2 implementation stop condition reached

The cycle-2 brief requires stopping when the A/B differs. The generated workspace resolver, README,
Aspire skill, observability docs, and real runtime-gate changes therefore remain unimplemented.

## Cycle 3 traffic-bearing discriminator — 2026-08-02

One anonymous-mode AppHost was started detached with Aspire CLI
`13.4.6+87fe259e4fc244c599019a7b1304c85a1488f248`. Five HTTP requests were sent to the generated
dashboard application. The explicit-URL control returned 3,289 bytes of non-empty JSON containing
the resulting `GET` server spans before the comparison commands ran.

| Row | Invocation | Exit | Output evidence |
| --- | --- | --- | --- |
| A | `aspire otel traces dashboard-tyhhpjtr` | 0 | 3,322 bytes; `Scanning for running AppHosts...` followed by a non-empty JSON trace array |
| B | `aspire otel traces dashboard-tyhhpjtr --apphost apphost.mts` | 0 | 3,289 bytes; non-empty JSON trace array |
| C | `aspire otel traces dashboard-tyhhpjtr --dashboard-url https://localhost:44851` | 0 | 3,289 bytes; non-empty JSON trace array |
| D1 | `aspire export -o /tmp/1025-c3-export-bare-83457.zip` | 0 | gathered all four data classes; 14,261-byte archive |
| D2 | `aspire export --apphost apphost.mts -o /tmp/1025-c3-export-apphost-83457.zip` | 0 | gathered all four data classes; 15,795-byte archive |

Conclusion: the reported exit-12 failure does not reproduce on this Aspire CLI build when telemetry
is non-empty. Bare discovery works against the detached AppHost. The emitted task should use the
bare command as the primary route and retain explicit-dashboard fallback for the reported failure.

## CI telemetry-gate repair findings — 2026-08-02

- Cloud job `91430785548` is authoritative for this amendment: the dashboard API trace gate passes,
  while `behavior.otel.task-traces` exhausts its ten retries and the pretty reporter discards the
  captured command evidence.
- `RunReport.steps[]` already carries `error` and command evidence containing `stdoutTail` and
  `stderrTail`; `ReportFileReporter` writes that object only when `--report` is supplied. The current
  scaffold-runtime workflow supplies no report path, so the existing artifact upload has nothing to
  upload.
- `aspire otel traces --help` says the positional argument filters by resource name. It lists both
  `--apphost` and `--dashboard-url`, but does not document their mutual exclusion. Therefore the
  emitted task will suppress URL fallback only when the caller already supplied `--dashboard-url`;
  it will not infer special handling for `--apphost`.
- `aspire ps --format Json` identifies running AppHosts and their dashboard URLs. Candidate resource
  discovery must tolerate richer/nested resource records while retaining `describe` name and the
  requested display name; no resource form is hard-coded as the sole truth.
- The requested `.agents/skills/deno/SKILL.md` is absent. The available repository Deno authority,
  `.agents/skills/netscript-deno-toolchain/SKILL.md`, is used instead.

## CI argv discriminator — 2026-08-02

- Cloud run `30724453231`, job `91433488402` proved the candidate loop was reaching a real DCP
  identity (`workers-api-saqkntfq`) but every generated task invocation exited 1 before telemetry
  lookup. Aspire reported the literal separator and all following tokens as unmatched.
- Root cause: Deno removes the task name but retains the explicit task separator in `Deno.args` for
  this emitted command shape. The runner destructured only `mode`, leaving `forwardedArgs` beginning
  with `--`, and constructed `aspire otel -- traces ...`.
- The same runner serves `aspire:export`, so its documented `deno task aspire:export -- ...` form has
  the identical defect. Stripping only `forwardedArgs[0]` repairs both modes without changing any
  later literal separator supplied by the caller.
- Repository audit of `packages/cli/src/kernel/templates/` found no other generated wrapper that
  destructures `Deno.args` into forwarded arguments this way. The affected runner is the sole match.
