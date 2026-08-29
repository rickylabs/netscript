## What's New in Aspire 13.5.3

Patch release for Aspire 13.5 that fixes Dashboard Graph view crashes for resources with multi-path
icons and restores missing public URLs for DevTunnel resources.

### 🐛 Fixes

- 📊 **Dashboard Graph view could crash for Azure Blob resources** — Resources such as those created
  with `AddBlobs` use icons containing multiple SVG paths, which caused an XML parsing exception and
  broke the dashboard circuit. The graph now combines multi-path icons correctly. Regression
  introduced in 13.5. Fixes [#19489](https://github.com/microsoft/aspire/issues/19489).
  ([#19585](https://github.com/microsoft/aspire/pull/19585), backport of
  [#19579](https://github.com/microsoft/aspire/pull/19579), `@sebastienros`)

- 🌐 **DevTunnel public URLs were missing from the Dashboard and MCP snapshots** — DevTunnel port
  resources could report `Running` and `Healthy` while showing no public URLs. Proxyless port
  allocation is now limited to compute and container resources, allowing DevTunnels to publish their
  actual public endpoints. Regression introduced in 13.5. Fixes
  [#19496](https://github.com/microsoft/aspire/issues/19496).
  ([#19625](https://github.com/microsoft/aspire/pull/19625), backport of
  [#19590](https://github.com/microsoft/aspire/pull/19590), `@karolz-ms`, `@danegsta`)

### 🏷️ Housekeeping

- 🚀 Bumped branding to 13.5.3

---

_Full Changelog: [v13.5.2...v13.5.3](https://github.com/microsoft/aspire/compare/v13.5.2...v13.5.3)_

_Full commit:
[b5f143315ffb6968ea939a9978797a5b20e4c688](https://github.com/microsoft/aspire/commit/b5f143315ffb6968ea939a9978797a5b20e4c688)_
