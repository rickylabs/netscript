# Drift — rfc-gpuix-desktop--rfc

| # | Date | Drift | Resolution |
| --- | --- | --- | --- |
| D1 | 2026-11-09 | `~/projects/netscript/runs/` is root-owned; global layout rule says run evidence goes there. | Evidence lives in this tracked run dir; installers in `~/projects/netscript/artifacts/gpuix-poc/`. |
| D2 | 2026-11-09 | Host glibc 2.36 < 2.39 required by the published `@gpuix/native` Linux binary. | All native runs in an Ubuntu 24.04 container on `netscript-dind` (identical-path bind mount). |
| D3 | 2026-11-09 | No GPU on the N5: GPUI runs on Mesa lavapipe; WebKitGTK/CEF on software compositing. | Stated on every benchmark surface; installables carry `--bench` so the owner can rerun on real GPUs (decision gate 1). |
| D4 | 2026-11-09 | GPUIX source `main` is ahead of published 0.11.0 (`isUniversalProp`, generic `on*`, clipboard, notifications). | PoC pins 0.11.0, defines `isUniversalProp` locally, feature-detects clipboard/notifications (toast fallback). |
| D5 | 2026-11-09 | Bench run 1: CEF ×4 hung; PID 1 in the container did not reap orphans. | Run aborted and archived (`-run1`); runner rebuilt with timeouts, `--init`, 4 GB shm; run 2 reproduced the CEF stall (concurrent CEF startup contention), recorded as a finding. |
| D6 | 2026-11-09 | SDK reserves the `cookie` header; `createService().withRPC()` default path ≠ SDK default. | Bearer bridge + `buildServiceRpcPath()` in the PoC; both recorded as papercuts in the RFC. |
| D7 | 2026-11-09 | Branch created as `rfc/gpuix-desktop-renderer`; PR skill requires `<type>/<slug>`. | Renamed to `docs/rfc-gpuix-native-desktop` before the first push. |
| D8 | 2026-11-09 | Owner follow-ups mid-run: Fresh 2.x vs 3.x analysis; complete HTML report. | Both added (research.md § Fresh, PoC router spike; report published as a private Artifact). |
