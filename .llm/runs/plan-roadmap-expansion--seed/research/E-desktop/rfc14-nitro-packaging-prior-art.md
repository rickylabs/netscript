# RFC-14/Nitro + packaging/updater prior art

## Nitro `deno_server` preset

Nitro (nitro.build, the universal server toolkit behind Nuxt et al.) ships a `deno_server` preset
targeting the Deno runtime. Per its documented invocation:

```
deno run --unstable --allow-net --allow-read --allow-env .output/server/index.ts
```

Key findings:

- Requires **`--unstable`** — not a fully-stabilized native-Deno target as of this research pass.
- The preset is fundamentally a **Node-emulation-on-Deno** layer (Nitro's own server abstraction
  runs atop Deno's Node-compat surface), not a build that emits idiomatic `Deno.serve()` code
  directly.
- This confirms the topic-E spec's characterization: Nitro's Deno story is a distinct porting/
  compatibility layer, not the same technical mechanism as `deno desktop`'s native single-process
  bundling. Issue #349 ("RFC-14 unified-mode + Nitro `deno_server`") is explicitly about *tier-3
  serverless* bundling (Vercel/Cloudflare/Netlify) via this preset — a different target audience
  and different technical seam than desktop packaging.

## Tauri v2 updater (mature prior art for auto-update)

Tauri v2's built-in updater plugin is the most directly comparable production-grade prior art for
`Deno.autoUpdate()`:

- App polls a manifest URL (conventionally `latest.json`) describing the current version, download
  URL(s) per platform, and a signature.
- Artifacts are signed with **Ed25519 via Minisign** (`tauri signer generate`, `tauri.conf.json`'s
  `plugins.updater.pubkey`); `createUpdaterArtifacts: true` in the bundler config produces the
  signed manifest/artifacts as part of the build.
- **Windows apply path works** because Tauri's Windows updater downloads a new installer/MSI and
  runs it as a **separate process** after the running app exits/relaunches — it does not attempt to
  overwrite the running executable's own file while it's still mapped into memory. This is the
  general solution to the Windows file-locking-during-execution problem that also constrains
  `Deno.autoUpdate()` on Windows (stages, cannot apply in-place).
- Comparison for topic E: NetScript could document the same relaunch/installer-indirection pattern
  as the recommended Windows workaround for `Deno.autoUpdate()`'s current apply gap, rather than
  waiting on upstream Deno to solve in-place Windows swapping.

## Electron autoUpdater / Squirrel (older, still-relevant prior art)

- Squirrel.Windows and electron-updater follow the same manifest+signature+relaunch shape as Tauri,
  predating it by years. Confirms this is an industry-standard pattern, not a Tauri-specific trick.
- Electron's macOS updater (via Squirrel.Mac) supports true in-place apply, matching Deno's own
  macOS/Linux `autoUpdate()` capability — the asymmetry between Windows and macOS/Linux for
  in-place update is a recurring, OS-level characteristic across at least three independent desktop
  runtimes (Electron, Tauri, Deno), not a Deno-specific shortcoming.

## Net takeaway for topic E

1. Nitro `deno_server` is not a competing or overlapping technology with `deno desktop` — it targets
   a different deployment tier (serverless) via a different mechanism (Node-emulation preset,
   `--unstable`). No direct dependency or conflict with desktop packaging work.
2. `Deno.autoUpdate()`'s Windows-stages-not-applies limitation is architecturally the same problem
   every major desktop framework has solved via installer/relaunch indirection. This is a
   documentable workaround pattern, not a blocking defect requiring an upstream Deno fix before
   NetScript can ship Windows auto-update UX.
