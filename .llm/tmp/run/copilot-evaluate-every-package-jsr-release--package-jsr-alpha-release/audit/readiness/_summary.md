# Release readiness roll-up

Generated 2026-05-04T22:33:22.092Z by `.llm/tools/fitness/release-readiness.ts`

## Per-target totals (FAIL + WARN across JSR + Doctrine + Standards)

| Target | JSR fail/warn | Doctrine fail/warn/info | Standards fail/warn/info | Total fail | Total warn | Ready? |
|---|---|---|---|---:|---:|---|
| packages/cli | 1/4 | 39/20/0 | 1/199/3 | 41 | 223 | ❌ |
| packages/database | 3/1 | 0/5/1 | 6/21/2 | 9 | 27 | ❌ |
| packages/contracts | 2/1 | 0/1/1 | 6/15/2 | 8 | 17 | ❌ |
| packages/prisma-adapter-mysql | 2/0 | 1/1/1 | 5/14/1 | 8 | 15 | ❌ |
| packages/service | 2/0 | 0/1/1 | 6/7/1 | 8 | 8 | ❌ |
| packages/workers | 2/2 | 1/12/2 | 4/22/1 | 7 | 36 | ❌ |
| packages/config | 2/0 | 0/1/1 | 5/30/1 | 7 | 31 | ❌ |
| packages/runtime-config | 2/0 | 0/0/1 | 5/7/1 | 7 | 7 | ❌ |
| packages/sagas | 1/2 | 0/8/2 | 5/21/3 | 6 | 31 | ❌ |
| packages/triggers | 2/1 | 0/3/2 | 3/9/1 | 5 | 13 | ❌ |
| packages/watchers | 2/0 | 0/0/1 | 3/7/2 | 5 | 7 | ❌ |
| packages/shared | 2/2 | 1/4/1 | 1/31/2 | 4 | 37 | ❌ |
| packages/streams | 1/0 | 0/0/1 | 2/3/2 | 3 | 3 | ❌ |
| packages/fresh | 1/3 | 0/10/1 | 1/60/2 | 2 | 73 | ❌ |
| plugins/workers | 1/1 | 0/9/2 | 1/10/1 | 2 | 20 | ❌ |
| packages/sdk | 0/2 | 0/3/1 | 2/13/2 | 2 | 18 | ❌ |
| packages/fresh-ui | 1/2 | 0/2/1 | 1/8/2 | 2 | 12 | ❌ |
| plugins/sagas | 1/1 | 0/4/2 | 1/6/1 | 2 | 11 | ❌ |
| packages/telemetry | 0/0 | 0/4/1 | 1/34/1 | 1 | 38 | ❌ |
| packages/kv | 0/0 | 0/5/1 | 1/14/3 | 1 | 19 | ❌ |
| plugins/triggers | 1/1 | 0/7/2 | 0/7/1 | 1 | 15 | ❌ |
| packages/plugin | 0/1 | 0/2/1 | 1/11/1 | 1 | 14 | ❌ |
| packages/logger | 0/0 | 0/1/1 | 1/11/2 | 1 | 12 | ❌ |
| packages/queue | 0/2 | 0/3/1 | 1/6/3 | 1 | 11 | ❌ |
| plugins/hello-world | 0/1 | 0/3/1 | 1/5/2 | 1 | 9 | ❌ |
| plugins/streams | 0/1 | 0/3/1 | 1/5/2 | 1 | 9 | ❌ |
| packages/cron | 0/1 | 0/1/1 | 1/6/2 | 1 | 8 | ❌ |
| packages/aspire | 0/1 | 0/1/1 | 0/12/2 | 0 | 14 | ✅ |

## Detail files

- **packages/watchers**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__watchers.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__watchers.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__watchers.json`
- **packages/database**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__database.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__database.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__database.json`
- **packages/kv**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__kv.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__kv.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__kv.json`
- **packages/streams**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__streams.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__streams.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__streams.json`
- **packages/queue**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__queue.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__queue.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__queue.json`
- **packages/sdk**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__sdk.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__sdk.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__sdk.json`
- **packages/service**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__service.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__service.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__service.json`
- **packages/fresh**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__fresh.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__fresh.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__fresh.json`
- **packages/contracts**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__contracts.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__contracts.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__contracts.json`
- **packages/aspire**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__aspire.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__aspire.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__aspire.json`
- **packages/sagas**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__sagas.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__sagas.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__sagas.json`
- **packages/plugin**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__plugin.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__plugin.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__plugin.json`
- **packages/config**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__config.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__config.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__config.json`
- **packages/workers**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__workers.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__workers.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__workers.json`
- **packages/runtime-config**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__runtime-config.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__runtime-config.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__runtime-config.json`
- **packages/shared**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__shared.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__shared.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__shared.json`
- **packages/triggers**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__triggers.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__triggers.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__triggers.json`
- **packages/cli**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__cli.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__cli.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__cli.json`
- **packages/telemetry**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__telemetry.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__telemetry.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__telemetry.json`
- **packages/cron**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__cron.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__cron.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__cron.json`
- **packages/logger**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__logger.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__logger.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__logger.json`
- **packages/prisma-adapter-mysql**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__prisma-adapter-mysql.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__prisma-adapter-mysql.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__prisma-adapter-mysql.json`
- **packages/fresh-ui**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/packages__fresh-ui.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/packages__fresh-ui.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/packages__fresh-ui.json`
- **plugins/hello-world**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/plugins__hello-world.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/plugins__hello-world.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/plugins__hello-world.json`
- **plugins/streams**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/plugins__streams.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/plugins__streams.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/plugins__streams.json`
- **plugins/sagas**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/plugins__sagas.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/plugins__sagas.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/plugins__sagas.json`
- **plugins/workers**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/plugins__workers.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/plugins__workers.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/plugins__workers.json`
- **plugins/triggers**
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/jsr/plugins__triggers.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/doctrine/plugins__triggers.json`
  - `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/audit/readiness/standards/plugins__triggers.json`