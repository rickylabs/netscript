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
