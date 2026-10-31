# Browser evidence setup

Chromium 153 from pinned Playwright 1.63 needs project-managed shared libraries on this host. Set LD_LIBRARY_PATH only for the Node browser process, not narrow-permission Deno checks. Generate a local maintainer scaffold inside the worktree scratch root. Run development and production checks in sequence: building while dev is active can replace the build metadata used by the server. Query Fresh Context.config.mode via deno doc at the workspace pinned version before relying on runtime-mode filtering.
