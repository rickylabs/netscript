# Governance

NetScript is maintained under a benevolent-dictator-for-life (BDFL) model. Eric Chautems
(GitHub: [@rickylabs](https://github.com/rickylabs)) is the project's founder and maintainer, and
holds final decision-making authority over the roadmap, architecture and design direction
(including the Architecture Doctrine under `docs/architecture/doctrine/`), what gets merged, and
when releases are cut. Substantial or breaking changes go through the RFC process described in
[`CONTRIBUTING.md`](CONTRIBUTING.md), but the maintainer has the final say on acceptance, scope,
and sequencing. As the project and its contributor base grow, this governance model may evolve
(for example toward a maintainers' committee); any such change will be proposed and documented
here before it takes effect.

Contributions are welcome from anyone under the terms of the [Apache License 2.0](LICENSE), and
every contribution must carry a `Signed-off-by` line per the
[Developer Certificate of Origin](CONTRIBUTING.md#developer-certificate-of-origin-dco) to keep
provenance clear. Releases are cut, tagged, and published to [JSR](https://jsr.io) exclusively by
the maintainer through the project's GitHub Actions release pipeline — never from a local machine —
so every published artifact traces back to a reviewed, CI-verified commit on `main`.
