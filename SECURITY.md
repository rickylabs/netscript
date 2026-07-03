# Security Policy

We take the security of NetScript and the projects scaffolded with it seriously. Thank you for
helping keep the ecosystem safe through responsible, coordinated disclosure.

## Supported versions

NetScript is pre-1.0 (the `0.0.1` line). Security fixes are applied to the **latest published
release** on the `@netscript/*` scope. There is no back-porting to older prereleases; upgrade to the
latest version to receive fixes.

| Version         | Supported |
| --------------- | --------- |
| Latest `0.0.1`  | ✅        |
| Older releases  | ❌        |

## Reporting a vulnerability

**Do not open a public issue, PR, or Discussion for a suspected vulnerability.**

Report privately using **[GitHub private vulnerability reporting](https://github.com/rickylabs/netscript/security/advisories/new)**
("Report a vulnerability" under the repository's **Security** tab). If that is unavailable, contact
the maintainer ([@rickylabs](https://github.com/rickylabs)) privately and ask for a secure channel.

Please include:

- A description of the vulnerability and its impact.
- Steps to reproduce, or a proof of concept.
- Affected version(s) and environment.
- Any known mitigation or workaround.

## What to expect

- **Acknowledgement** of your report as soon as reasonably possible.
- An initial **assessment** and a severity classification.
- Coordinated work on a fix, with **credit** to the reporter unless you prefer to remain anonymous.
- **Public disclosure** only after a fix is released, via a GitHub Security Advisory. Please give us a
  reasonable window to remediate before any public disclosure.

## Supply-chain and publishing note

NetScript packages are published to [JSR](https://jsr.io) exclusively from GitHub Actions using
**OIDC** — there are no long-lived publish tokens, and maintainers do not publish from local
machines. A GitHub Release is the only publish trigger. If you discover a way to publish a
`@netscript/*` package outside this flow, or to tamper with the release/OIDC pipeline, treat it as a
high-severity report and disclose it through the private channel above.
