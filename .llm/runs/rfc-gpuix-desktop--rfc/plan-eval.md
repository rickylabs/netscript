# PLAN-EVAL — rfc-gpuix-desktop--rfc

- Plan evaluator session: GLM 5.3 (`opencode-go/glm-5.3`) · 2026-11-09 · separate session, feature
  tier, route `glm_5_3@provider_default` per `workflow/lane-policy.md` (fallback `fable_5_1@low`
  skipped — same vendor family as the Anthropic generator). Evaluated head: `7246ee324` (branch
  `docs/rfc-gpuix-native-desktop`, PR #2603; `worklog.md` carries uncommitted local edits recording
  this launch). Baseline `origin/main` @ `0f821911a`.
- Run: `rfc-gpuix-desktop--rfc`
- Surface / archetype: RFC proposing Archetype 2 (`@netscript/desktop-native`), Archetype 6/7
  (packaging backend), fresh-ui registry collection, SDK/service seams; PR itself is docs + run
  evidence only (no `packages/`/`plugins/` changes — verified via `git diff --stat origin/main...HEAD`).
- Scope overlays: `SCOPE-docs`

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` exists; greenfield same-day run on `origin/main` @ `0f821911a` (fetched 2026-11-09, `supervisor.md:13`). Load-bearing findings spot-checked against the tree and externally: SDK reserved headers incl. `cookie` (`packages/sdk/src/internal/client-contributions/prepared-call.ts:40-47,104-106,162-164`), RPC-path default mismatch (`packages/service/src/builder/service-rpc.ts:44` vs `packages/sdk/src/client/service-client.ts:92,107-112`), bearer factory (`packages/plugin-auth-core/src/sdk/bearer-contribution.ts:58-99`, RFC 0001), `Deno.autoUpdate` wrapper + `NativeAutoUpdate` (`packages/sdk/src/auto-update/adapters/deno-auto-update-adapter.ts:34,107-144`), `deploy desktop package/release` (`packages/cli/src/public/features/deploy/target/desktop/{package,release}/`), `ui:add <item\|collection>` (`packages/cli/src/kernel/application/ui/registry.ts`), `@gpuix/react` on `react-reconciler@^0.33.0` and GPUIX 0.11.0/2026-10-20 (upstream changelog/releases), Deno→Cloudflare 2026-10-09 with ~1-year runtime EOL (deno.com/blog/cloudflare). |
| Decisions locked                        | PASS   | `plan.md` D1–D6 with rationale; RFC "Decision gates" §224-232. |
| Open-decision sweep                     | PASS   | Evaluator-run sweep below; none force rework when deferred. |
| Commit slices (< 30, gate + files each) | PASS   | `plan.md` §Slices 1–6, ordered, each < 30 files; evidence per slice in `worklog.md` §Slice log. |
| Risk register                           | PASS   | RFC §Drawbacks (upstream maturity, rewrite cost, platform gaps, software-rendering cost, binary size) + §Decision gates as mitigations; see F7. |
| Gate set selected                       | PASS   | `worklog.md` §Gates (PoC `deno check`, PoC integration test, RFC `deno fmt --check`); right-sized for `SCOPE-docs` — F-* archetype gates are N/A for a docs-only PR. Evaluator independently reproduced: `deno check app/main.tsx` (poc dir) green; `deno fmt --check rfcs/0000-gpuix-native-desktop-renderer.md` green. |
| Deferred scope explicit                 | PASS   | RFC §Future possibilities (Fresh 3 native target, multi-window, web/terminal targets); implementation returns to the Codex lane (`supervisor.md` §Recorded lane/eval overrides). |
| jsr-audit surface scan (pkg/plugin)     | FAIL   | F3: no disposition recorded anywhere in the run; the RFC's planned `@netscript/desktop-native` surface (JSR package over an exact-pinned npm native addon) has unnamed publishability/surface risks. |

## Open-decision sweep (evaluator-run)

Decisions that would force rework if deferred: **none**.

- Bun vs Deno production host — safe to defer: the renderer package is runtime-agnostic by design
  (PoC proven on Deno 2.9.7 / Bun 1.4.4 / Node 24, `evidence/runtime-portability.json`); only the
  packaging backend's default changes, behind the same `netscript deploy desktop package
  --renderer gpuix` surface.
- `deno compile` vs `cargo-packager` — safe to defer: same CLI surface; the PoC proves the
  `deno compile` path end-to-end (installables + `--bench`).
- GPUI fork ownership depth — safe to defer: policy choice already gated (decision gate 2).
- Primitives as default web component layer — safe to defer: explicitly future scope.

Substance note (F7): the four questions are listed in RFC §Unresolved questions but never
classified "safe to defer" / "must resolve now" in `plan.md`; the classification should be recorded
there even though the sweep itself passes.

## Verdict

`FAIL_PLAN`

The plan/RFC is fixable and close to sound: every benchmark-table number I could trace matches the
raw JSON (medians, ranges, PSS, process counts, idle/active CPU, 8-instance totals, the ~30%/~35%
derived percentages, 144-of-205 raster split, GPUI-UI-thread 55%, ~150 ms compile delta, 23–52 MB
addons, runtime portability), the compat-impossible / native-host-works claims are supported by the
PoC adapter and observed error, the two papercuts are real per source, and the proposed surfaces
cohere with doctrine archetypes and existing packages. Three items must be fixed before owner
review.

### If FAIL_PLAN — required fixes

1. **F1 (blocking) — GPUIX install size "181 MB" is unreproducible and contradicted by the run's own evidence.**
   RFC table `rfcs/0000-gpuix-native-desktop-renderer.md:100` ("Install 181 MB") and `:194`
   ("About 181 MB on Linux") rely on `evidence/install-sizes.json:2` (`"gpuix": 181`), but no
   artifact on disk measures 181 MiB: the bench binary `poc/build/linux-x64/netscript-gpuix` is
   209,241,904 B = 199.5 MiB; the run's own archived run1 recorded `installSizeMb: 200` for the same
   variant (`evidence/bench-linux-software-run1.json:88`); the packaged binary
   `poc/build/package/linux-x64/NetScript/netscript` is 236,732,600 B = 225.8 MiB. The sibling values
   do reproduce (`webview` 177 = 186,092,131 B du-sb; `cef` 537 = 562,693,275 B du-sb), so the
   method is clear and the gpuix figure is the outlier. — Fix: re-measure the GPUIX install with the
   same du-sb/MiB method (record the command in the run), then update `install-sizes.json`, the RFC
   table cell, and the Drawbacks sentence (state bench binary vs packaged size if they differ).
2. **F2 (blocking) — the CEF footnote's "two at once, one page waited about 10 s" claim has no supporting evidence.**
   RFC `:110-111`. The runner only measures parallel counts 1/4/8 (`poc/bench/runner.ts:174`,
   `poc/bench/bench.ts:27`); both logs show only x1/x4/x8 (`evidence/bench-linux-software.log:52-54`
   x4/x8 FAILED at 90 s; `evidence/bench-linux-software-run1.log:39` ends at x1), and
   `worklog.md:31-32` / `drift.md` D5 record only the x4 hang and x4/x8 timeouts. The 90 s-budget
   claim is evidenced; the x2/≈10 s clause is not. — Fix: either drop the "two at once … about 10 s"
   clause, or record the measurement (e.g. a `--parallel=1,2,4,8` CEF-only rerun appended to
   `evidence/`) and cite it.
3. **F3 (blocking) — jsr-audit gate box left undispositioned.**
   No jsr-audit disposition (not even "N/A — docs-only wave") appears in `plan.md`, `worklog.md`
   §Gates, or `context-pack.md`. Per `gates/plan-gate.md` the non-package wave needs an explicit
   N/A-with-reason; and because the RFC plans a future public package whose surface is exactly the
   rubric's subject — `@netscript/desktop-native` as a JSR package over an exact-pinned npm native
   addon (`@gpuix/native` + platform `.node` packages, `deno compile` addon staging) per RFC
   `:168-175` — the slow-type/surface risks (JSR publishability with a native npm dependency,
   exact-pin/upgrade policy, consumer `nodeModulesDir` requirements) should be named now. — Fix:
   record the jsr-audit disposition in `plan.md` or `worklog.md` (N/A for this PR, with the reason),
   and add one sentence of surface-risk note to the RFC's `@netscript/desktop-native` row.

## Notes

Non-blocking findings (fix before or during Discussion; none blocks implementation planning):

- **F4 — CEF "(15%)" is not a measured non-raster residual.** RFC `:103`/`:116` present CEF's
  non-raster CPU as 15%, but `evidence/threads-linux-software.json:170-208` shows no
  software-rasterizer bucket for CEF — the 15% equals its total because Chromium's software
  compositing runs in threads the llvmpipe/lavapipe name filter cannot separate (the CEF breakdown
  shows `compositor`/`vizcompositorth` buckets). Also the WebKitGTK "20%" derives from the
  thread-window total 111.9 (111.9 − 91.6 = 20.3, `threads-linux-software.json:56,59-60`), not the
  bench median 114.3 printed next to it. The directional conclusion (GPUIX non-raster 61% is the
  open risk) survives any attribution. — Fix: mark CEF's non-raster as "not separable" and state the
  derivation basis once under the table.
- **F5 — ambient machine load undisclosed.** `evidence/bench-linux-software.json:7-10` records
  loadavg 6.63/4.54/4.04 on the 16-CPU box at run start (run1: 4.47/3.67/3.48); the method paragraph
  (RFC `:105-108`) omits it, although concurrent load can widen cold-start tails (e.g. the 1457 ms
  GPUIX outlier). — Fix: add the loadavg to the environment note or the "Reading the numbers"
  caveats.
- **F6 — `target-milestone: Enterprise Deployment & Desktop` (RFC `:8`) is outside the documented
  milestone vocabulary** (`rfcs/0000-template.md:8`, `rfcs/README.md:88-90`: a `0.0.x` release
  milestone or `Backlog / Triage`; no such milestone exists in tracked files). — Fix: confirm it
  matches the actual GitHub milestone on tracking issue #2602, or use a documented value.
- **F7 — plan-artifact hygiene.** `plan.md` carries no risk-register or deferral-classification
  sections of its own; the substance lives in the RFC (§Drawbacks, §Decision gates, §Unresolved
  questions). Acceptable for a docs run, but record the "safe to defer" classifications in `plan.md`
  so the gate box cites the plan, not the evaluator.
- **F8 — minor precision.** (a) Proposed `useNative` (RFC `:170`) vs the PoC's `useGpuix`
  (`poc/packages/gpuix-preact/src/root.ts:63`) — pick one name at implementation. (b) research.md:19
  "≈2.9k stars" vs observed 2,780–2,810. (c) RFC `:117` "app JavaScript was 4%" is actually the
  "host main thread (JS + platform loop)" bucket (4.2%, `threads-linux-software.json:17-19`).

Verified (no action): all benchmark-table medians/ranges/PSS/process counts/idle+active CPU and
8-instance totals match `bench-linux-software.json` exactly; derived claims (~30% memory/instance,
~35% total at ×8, 144-of-205 raster, GPUI-UI 55%, JS ~4%, +~150 ms compile) check out; CEF x4/x8
90 s timeouts are in the log; the software-rendering caveat appears on every bench surface (table
note, "Reading the numbers", drift D3) and real-GPU rerun is decision gate 1; `preact/compat`
failure and native-host success are supported (adapter code + observed
`ReactSharedInternals.S` failure + screens + integration test); both papercuts verified against
`prepared-call.ts` / `service-rpc.ts` / `service-client.ts` (reserved-header list indeed absent from
the public contribution API docs); `@gpuix/native@0.11.0` exact-pinned in `poc/deno.lock`; addon
sizes 23.0/24.3/52.4 MB match the "23–52 MB" claim; `options.__c` is Preact's real post-commit hook
(preact@10.29.2 dist); the PoC type-checks and formats clean under the recorded gates; rfcs/ is
public-appropriate (no owner quotes or harness chatter; `.llm/runs` evidence references match the
precedent of accepted RFCs 0002/0005/0006, and 8,402 run files are already tracked on main);
anti-pattern catalog N/A (no framework code touched).

## Cycle 2

- Cycle-2 evaluator session: GLM 5.3 (`ollama-cloud/glm-5.3`) · 2026-11-09 · separate session from
  the Anthropic author, feature tier (final roundtrip — evaluator may repair small fixable defects
  in flight). Evaluated head: `6ecbd9728` (branch `docs/rfc-gpuix-native-desktop`, PR #2603); the
  working tree additionally carried the uncommitted `drift.md` D12 row recording the failed first
  cycle-2 launch (transport usage limit, no work done) and, from this evaluation, the two
  uncommitted repairs listed below. Baseline `origin/main` @ `0f821911a` (unchanged from cycle 1).

### Cycle-1 findings — verified against the files

| Finding                                  | Status               | Evidence (file:line, independently checked) |
| ---------------------------------------- | -------------------- | -------------------------------------------- |
| F1 install size "181 MB" unreproducible  | RESOLVED             | `evidence/install-sizes.json:2-11`: gpuix 185, webview 112, cef 470, with method, per-item provenance, and the note that the benchmarked binaries predate pruning (200/177/537 MiB). Root cause fixed in `poc/scripts/package.sh:40-66` (restore_modules, prune_natives, `--node-modules-dir=manual`). Evaluator re-measured: GPUIX `poc/build/package/linux-x64/NetScript/netscript` = 193,781,768 B = 184.3 MiB (`du -sh` renders 185M; Linux tarball sha256 matches `evidence/artifacts.json`), webview dir = 117,688,448 B = 112.3 MiB → 112, Windows 139,606,226 B = 133.3 MiB → "133 MB", macOS 129,152,914 B = 122.8 MiB → "123 MB" (footnote ⁴, `rfcs/0000-gpuix-native-desktop-renderer.md:117-119`). CEF 470: the GPUIX-free CEF build was not retained (drift D11), but reconciles exactly from on-disk artifacts: 562,693,275 B (old CEF dir, cycle-1-verified 537 MiB) − 68,403,683 B GPUIX payload (= old webview 186,092,131 B − new webview 117,688,448 B, both on disk) = 494,289,592 B = 470.3 MiB. RFC table `:98-103` "Install⁴" = 185/—/112/470; Drawbacks `:221-223` states webview is the smallest honestly; no 181/177/537 remains as an install size (grep clean after the N1 repair). |
| F2 CEF "~10 s" claim had no artifact     | RESOLVED             | New `poc/bench/cef-concurrency.sh` (3 pair trials + one 4-instance trial, 120 s budget) → `evidence/cef-concurrent-start.log:1-14`, matching footnote ¹ (`rfcs/…:121-123`) exactly: pairs — the second-to-ready page ≈10 s twice (readyMs 10,616 / 10,276; pageMs 10,020 / 10,019) and never ready once ("not ready after 120 s"); four — two never ready (instances 3–4); "The cause was not isolated" retained. |
| F3 jsr-audit undispositioned            | RESOLVED             | Disposition "N/A for this PR (docs + run evidence; no package published)" recorded in `worklog.md:60` (cycle-1 disposition table), matching the gate row's prescribed form (`gates/plan-gate.md:32-34`). Surface risks named in RFC "Publishing and consumer constraints" `rfcs/…:192-205`: JSR package over an exact-pinned npm native addon, JSR carries no native code, structural-type re-exports keep the surface plain TypeScript (slow-type mitigation, `@netscript/service` precedent), Deno consumers need `nodeModulesDir: "auto"` + `--allow-ffi` (backed by `poc/deno.json:2,14`), per-target pruning (backed by `poc/scripts/package.sh:40-43`), jsr-audit at implementation. `.agents/skills/jsr-audit/SKILL.md` present and consulted. |
| F4 non-raster attribution                | RESOLVED             | Footnote ² `rfcs/…:111-112` states the derivation basis (separate 10 s per-thread run; totals 205% and 112% — `threads-linux-software.json:6,56`); footnote ³ `:114-115` marks CEF not separable (viz/compositor threads; 15% total includes rendering — `threads-linux-software.json:174,185,189`); table cell "14.8% (n/a³)" `:103`; report sentence "15% in total (rendering included)" `:128`. Re-verified: 205 − 144.1 = 60.9 ≈ 61%; 111.9 − 91.6 = 20.3 ≈ 20%. |
| F5 load average caveat                   | RESOLVED             | `rfcs/…:105-107`: "The host is shared: its load average was 4–7 during the runs (recorded in the JSON)" — 1-min loads at run start 4.47 (run1) and 6.63 (run2) are within 4–7; exact values in `bench-linux-software.json:7-10` / `-run1.json`; also carried in `plan.md:41`. |
| F6 milestone vocabulary                  | RESOLVED (kept, verified) | `gh issue view 2442` (merged): milestones are the next release plus themed since 2026-10-27, and "Enterprise Deployment & Desktop" is one of the themes; tracking issue #2602's actual GitHub milestone is exactly "Enterprise Deployment & Desktop" (verified via gh). The template/README examples predate the rename. |
| F7 plan risk register / deferral classes  | RESOLVED             | `plan.md:36-44` §Risk register (5 risks with likelihood/impact/mitigation/residual, including the F1 root cause as "Packaging embeds foreign platform binaries | Found"); `plan.md:46-54` §Unresolved questions: deferral classification (4 safe-to-defer + "Real-GPU active CPU | Must resolve before 'recommended'"). The gate boxes now cite the plan. |
| F8 precision                             | RESOLVED             | (a) `rfcs/…:182` "`render`/`createRoot`/`useNative` (the PoC's `useGpuix`)" — PoC name verified at `poc/packages/gpuix-preact/src/root.ts:63`; (b) `research.md:19` "≈2.8k stars"; (c) `rfcs/…:130` "the JavaScript and host main-thread bucket was 4%" — matches `threads-linux-software.json:17-19` (4.2%). |

### Re-checks after the fixes

- Every benchmark-table and "What the numbers say" number re-verified against
  `evidence/bench-linux-software.json` and `threads-linux-software.json`: cold-start medians/ranges
  (949/916–1457, 792/773–834, 831/744–998, 697/662–1259), PSS (282/247/402/412), processes
  (1/1/3/8), idle CPU (1.8/1.6/36.9/0.1), active CPU (204.7/200.4/114.3/14.8), 8-instance totals
  (1,443/1,531/2,237; CEF parallel stops at 1 → "did not start¹"), derived claims (~30%/~35%, 144 of
  205, ≈61/≈20/15, GPUI-UI 55%, JS bucket 4.2%, +~150 ms compile delta), and "Downloads with both
  hosts are 57–94 MB" vs `evidence/artifacts.json` (57/85/80/94). The fix diff touched none of these
  cells.
- Template conformance: all `rfcs/0000-template.md` sections and frontmatter present (rfc 0000,
  status Draft, tracking-issue, target-milestone). `deno fmt --check
  rfcs/0000-gpuix-native-desktop-renderer.md` green, re-run after the N1 repair.
- No new over-claims: the cycle-1→head RFC diff is bounded to the Install column, footnotes ¹–⁴,
  the load-average sentence, the publishing-constraints paragraph, the binary-size drawback and the
  `useNative` parenthetical; every added number traces to an on-disk artifact or arithmetic anchored
  there. Public-doc rules: no harness/evaluator/owner chatter in the RFC (grep clean); gate
  references are precedented (RFC 0002).
- PoC checked/tested surface (`poc/app`, `poc/packages`, `poc/tests`) is byte-identical between the
  two heads; the `poc/deno.lock` growth is `deno install` full-graph bookkeeping from
  `restore_modules` (pinned versions of the app's imports unchanged), so the cycle-1 PoC gate results
  carry over.

### New findings

- **N1 — minor (fixed in flight).** `rfcs/…:229` still read "Chromium per app (8 processes, 537 MB
  here)" — the stale pre-pruning CEF install size, contradicting the re-measured 470 MB and leaving
  a "537" install-size figure in the RFC. Fixed (see repairs).
- **N2 — minor (observation, no fix).** `evidence/cef-concurrent-start.log` lines carry
  `"host":"webview-deno-desktop"`: `poc/app/main.webview.ts:12` defaults `NETSCRIPT_BACKEND` to
  `webview` and `cef-concurrency.sh` does not set it, so the ready-line label is the app's generic
  default. The probed binary is unambiguously the CEF build (`cef-concurrency.sh:13` launches
  `build/netscript-cef/netscript-cef`), so the footnote's claims are unaffected. Evidence files are
  outside the evaluator's allowed edits; any future rerun should set `NETSCRIPT_BACKEND=cef`.
- **N3 — minor (observation, no fix).** Install figures round within 1 MiB (<1%): GPUIX on-disk
  184.3 MiB shown as 185 (`du -sh` renders "185M"; a floor would give 184) and CEF 470 reconciled at
  470.3 MiB (F1 above). JSON and RFC agree at 185/112/470; no conclusion in the RFC is sensitive to
  that rounding.

### In-flight repairs (evaluator, uncommitted, listed for the author)

1. `rfcs/0000-gpuix-native-desktop-renderer.md:229` — "Chromium per app (8 processes, 537 MB here)"
   → "Chromium per app (8 processes, 470 MB here)" (N1). `deno fmt` + `deno fmt --check` re-run
   green; grep for 181/177/537 in the RFC now clean.
2. `.llm/runs/rfc-gpuix-desktop--rfc/drift.md:16` — removed the blank line that detached the D12
   row from the drift table (D12 was a headerless one-row fragment; now joined as the table's last
   row).

### Plan-Gate re-walk (cycle 2)

All eight boxes check: research present and current; decisions locked; open-decision sweep (now
cites `plan.md` §Unresolved questions: deferral classification); commit slices 1–6 (< 30 files
each); risk register (now cites `plan.md` §Risk register); gate set selected (RFC `deno fmt --check`
independently re-verified green); deferred scope explicit; jsr-audit N/A with reason and the future
package's surface risks named.

### Verdict

`PASS`
