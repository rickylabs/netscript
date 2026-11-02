# Stop Vite before scaffold regeneration

Fresh server rendering can succeed while every island hydration import fails after
`init --force` replaces an app under a live Vite process. Stop only the owned
process, regenerate, restart, and use the Local URL from Vite. A clean restart
restored SettingsForm persistence and CommandPalette keyboard opening in S1.

Shared Dialog remains mounted when closed. Assert hidden state and focus return,
not zero DOM nodes. This is a test correction, not a shared component change.

Correction: the first restart attempt missed absolute executable paths, so it did
not stop both old processes. Match the executable basename and exact app cwd, not
`cmdline.startswith('deno')`. Production verified persistence independently. Do not
infer a framework hydration defect from stale generated Vite processes.
