# Next scope proposal: workers legacy default-context delegate

PREPARATION ONLY. Requires root acceptance/checkpoint of S3f and a fresh exact-HEAD binding before
implementation. Current published base is `9f880c6a4be6e1a92bcf2cdfbb6cd70a2d1eb88b`; the reviewed
candidate drain owner is 247 lines, SHA256
`7d772b6010487cc828227c49b7ae973b7944bd53d5cf35cb4295080088f3090b`.
Exact worktree remains `C:/Users/ericc/source/repos/netscript-native-host-policy-008`.

## Five owners, one compatibility checkpoint

| Owner | Existing state | Proposed budget/change |
| --- | --- | --- |
| `plugins/workers/services/src/main.ts` | 111 lines; original `bcca447d...` | 60-75 lines; default(ctx) becomes the native factory delegate |
| `plugins/workers/services/src/service.ts` | 136 lines; `bffb5f48...` | At most 142; internal exported legacy-reason constant only |
| `plugins/workers/services/src/service-test-fixture.ts` | 242 lines; `6f8c0bc3...` | At most 265; explicit legacy-host opt-in for HTTP mode |
| `plugins/workers/services/src/service-legacy_test.ts` | New | 160-210 lines, cap230; one parent test with fresh positive/control children |
| `plugins/workers/README.md` | 213 lines; `890918e0...` | Add40-60, cap275; guarded factory recipe, permissions, legacy boundary |

Prospective U1 footprint becomes18 owners because of the focused legacy test. No change to public
`services/mod.ts`, export registrations, contracts, runtime/router, configuration, dependency,
lock, debt, other existing test owner or streams. The accepted ten tests remain byte-exact.

`main.ts` retains Redis adapter registration, its default function name/signature, bootstrap type
and loader, `import.meta.main` guard, and existing type re-exports. Remove only duplicated worker
composition imports/body. Delegate the same context directly with the exact original public reason:
`Guarded adoption awaits caller credentials, runtime session seeding, per-service access policy and auth discovery references (#1383).`
As original plan section4.7 requires, import that constant from `service.ts`; do not re-export it
through the public facade. Keep native serve options omitted, so hostname, signal handling and
legacy PORT parsing/fallback behavior remain native defaults. No universal options seam.

## Explicit fixture authority requiring root scope approval

The current HTTP child permits only `127.0.0.1`; legacy native `serve()` binds `0.0.0.0` by default.
Propose one opt-in `legacyPublicHost` flag valid only with existing HTTP mode. It changes only the
HTTP network argument from `--allow-net=127.0.0.1` to
`--allow-net=127.0.0.1,0.0.0.0:0`. The second authority permits only the native ephemeral bind;
tests connect through loopback. This temporarily binds a synthetic unauthenticated service on all
IPv4 interfaces, so it is an explicit scope addition, not an assumed loopback fixture privilege.
The default denied/compiler/HTTP argv must remain byte-identical when the opt-in is absent.

Keep read/write confined to the fresh owned scratch, clear all ambient environment/profile values,
and retain `--deny-run --deny-ffi --deny-sys`, checked/frozen/cached stdin, 30-second child bound,
32KiB pipes and settlement grace. No firewall/trust-store change or fixed/shared port. If Deno
rejects this exact authority, preserve the setup failure and return; do not broaden it silently.

Native default signal registration is also intentionally exercised. Current listener code selects
SIGINT/SIGBREAK on Windows and removes registered handlers during stop. Portable Deno2.9.7's
builtin addSignalListener declaration documents Windows support and no permission tag; retain
deny-sys rather than adding it preemptively. Do not send any real OS signal. The fixture qualifies
default startup/manual shutdown and bounded process exit, not OS-signal delivery semantics or a
direct count of native signal handlers. No runtime legacy probe has been executed yet.

## Executable compatibility and negative control

One sanitized parent test runs two fresh children using the unchanged minimal typed context and
owned synthetic KV. Initialize KV and dynamically import the public plural
`@netscript/plugin-workers/services` inside cleanup protection. A context database port throws if
called; no host database or stream is supplied.

The positive opted-in child runs two sequential listeners: context `PORT:'0'` wins over an invalid
process PORT, then absent context PORT falls back to process `PORT:'0'`. Each asserts native
`0.0.0.0`/TCP/positive allocated address and an unauthenticated loopback describe HTTP200 with its
body consumed. Double-stop, rebind the released port through loopback, and prove raw KV still works
after each stop. A missing-both-PORT call must reject with the exact legacy error. Close only the
test-owned KV and print one final marker after complete cleanup.

The second fresh child calls the same actual legacy default with `PORT:'0'` but omits the explicit
host opt-in. It must fail at native wildcard-listener network permission, identified by
`Deno.errors.NotCapable` plus the actual `0.0.0.0:0` permission target; no success marker. Cleanup
still closes owned KV. An unrelated permission/type/setup error does not qualify. Preserve the
actual error wording in the first execution; do not infer success from a generic nonzero exit.

## Gates and boundaries

Run11 owning tests, repository-wrapper types/lint/fmt on seven TypeScript owners (the five
test/helper owners plus main/service), zero-new-finding quality comparison, public singular
service doc-lint, exact facade/accepted-test/old-argv/config/lock/debt guards, and cleanup evidence.
Compile the README recipe against the unchanged public surface; distinguish that from runtime
host qualification. Retain all initial failures. Use portable Deno2.9.7 and the existing warm
cache with no graph-age/reload bypass. Do not claim full workers/U1 completion from this slice.

Native Astra architecture primary, installed MCP/docs active; no fallback or additional agent.
Root reads exact source/results before any checkpoint. Streams S4 RED/S5 factory/S6 lifecycle,
remaining documentation/consumer gates, Windows docs-path diagnosis and independent IMPL remain
separate. This brief does not edit or launch legacy code and does not touch the root's native
service baseline diagnostic evidence.
