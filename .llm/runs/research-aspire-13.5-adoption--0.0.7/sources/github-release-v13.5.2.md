## What's New in Aspire 13.5.2

Patch release for Aspire 13.5 that removes an unused native helper binary from the Windows CLI
archives so 13.5 servicing releases stay publishable to WinGet.

### 🐛 Fixes

- 🪟 **Windows CLI archives shipped an unused ~4.9 MB `hex1bpty.exe`** — The Windows CLI archives
  (`aspire-cli-win-{x64,arm64}-*.zip`) bundled Hex1b's out-of-process PTY host, which Aspire never
  executes (DCP owns every pseudo-terminal Aspire surfaces). Besides the wasted download, the extra
  unexplained executable stalled the WinGet publish, since every binary in the archive goes through
  executable and malware validation. A build-only MSBuild target now drops the file from the CLI
  publish output; Unix native assets are unaffected. Regression new in 13.5.
  ([[#19557](https://github.com/microsoft/aspire/pull/19557)](https://github.com/microsoft/aspire/pull/19557),
  backport of #19554, `@mitchdenny`)

### 🏷️ Housekeeping

- 🚀 Bumped branding to 13.5.2

_Full Changelog:
[[v13.5.1...v13.5.2](https://github.com/microsoft/aspire/compare/v13.5.1...v13.5.2)](https://github.com/microsoft/aspire/compare/v13.5.1...v13.5.2)_

_Full commit:
[[a22cec24d76e764b3681977e314ab4a0aeed0240](https://github.com/microsoft/aspire/commit/a22cec24d76e764b3681977e314ab4a0aeed0240)](https://github.com/microsoft/aspire/commit/a22cec24d76e764b3681977e314ab4a0aeed0240)_
