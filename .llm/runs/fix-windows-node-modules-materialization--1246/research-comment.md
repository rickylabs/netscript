**[PHASE: RESEARCH] [STATUS: COMPLETE]**

- #1246's corrected capture isolates the failure below Aspire/Vite: Deno 2.9.4 cannot import the
  locally materialized Babel package while the exact missing file remains intact in the shared npm
  cache.
- [deno/deno#35804](https://github.com/denoland/deno/issues/35804) is the closest open upstream
  defect: Windows + `nodeModulesDir: auto` produces corrupt/incomplete `.deno` trees on 2.9.1, with
  follow-up reproduction on 2.9.3.
- Directly evidenced affected versions are 2.9.1, 2.9.3, and 2.9.4. The operationally untrusted
  window is 2.9.1–2.9.4; no direct 2.9.2 reproduction is claimed.
- Verdict: upstream Deno materialization defect, with NetScript responsible for a 0.0.5 detection
  and recovery mitigation. Deno 2.9.0 is the pre-window version already pinned by NetScript CI.
- Full research: `.llm/runs/fix-windows-node-modules-materialization--1246/research.md`.
