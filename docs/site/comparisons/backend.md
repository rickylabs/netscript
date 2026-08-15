---
layout: layouts/base.vto
title: NetScript vs Nest.js, Hono, and Encore.dev
description: Compare one contract-first endpoint, typed client, and background job across backend frameworks.
templateEngine: [vento, md]
order: 3
---

# NetScript vs backend frameworks

## NetScript carries one contract from request to client, then keeps the job typed

Validation is the route contract, the consumer imports that same contract, and the endpoint hands a
validated payload to a named worker. There is no transport DTO to reconcile with a client shape later.

{{ comp.comparisonTabs({
  ours: {
    lang: "ts",
    code: "// contracts/reports.ts\nimport { baseContract } from '@netscript/contracts';\nimport { z } from 'zod';\n\nconst CreateReport = z.object({\n  accountId: z.string().uuid(),\n  format: z.enum(['pdf', 'csv']),\n});\nconst Report = z.object({\n  id: z.string().uuid(),\n  status: z.literal('queued'),\n});\nexport const ReportsContractV1 = {\n  create: baseContract\n    .route({ method: 'POST', path: '/reports' })\n    .input(CreateReport)\n    .output(Report),\n};\n\n// services/reports/router.ts\nimport { implement } from '@orpc/server';\nimport { createServiceClient } from '@netscript/sdk/client';\nimport { workersContract } from '@netscript/plugin-workers/contracts';\n\nconst ReportsV1 = implement(ReportsContractV1);\nconst workers = createServiceClient<typeof workersContract>({\n  contract: workersContract,\n  serviceName: 'workers-api',\n  routerName: 'workers',\n});\nexport const router = {\n  create: ReportsV1.create.handler(async ({ input }) => {\n    const report = await reports.insert(input);\n    await workers.triggerJob({\n      id: 'render-report',\n      payload: { reportId: report.id },\n    });\n    return report;\n  }),\n};\n\n// consumers/reports-client.ts\nexport const reportsClient = createServiceClient<typeof ReportsContractV1>({\n  contract: ReportsContractV1,\n  serviceName: 'reports',\n});\nawait reportsClient.create({ accountId, format: 'pdf' });\n\n// plugins/workers/jobs/render-report.ts\nimport { createSuccessResult, defineJobHandler } from '@netscript/plugin-workers-core';\nimport { z } from 'zod';\nconst RenderReport = z.object({ reportId: z.string().uuid() });\ntype RenderReport = z.infer<typeof RenderReport>;\nconst renderReport = defineJobHandler<RenderReport>(async (ctx) => {\n  const payload = RenderReport.parse(ctx.payload);\n  await renderPdf(payload.reportId);\n  return createSuccessResult({ reportId: payload.reportId });\n});\nexport default Object.assign(renderReport, { id: 'render-report' as const });"
  },
  competitors: [
    {
      key: "nestjs",
      label: "Nest.js",
      summary: "Nest’s controller and dependency-injection model is mature; validation DTOs, Swagger client generation, BullMQ registration, and processor classes are separate surfaces you keep aligned.",
      lang: "ts",
      code: "// create-report.dto.ts\nexport class CreateReportDto {\n  @IsUUID() accountId!: string;\n  @IsIn(['pdf', 'csv']) format!: 'pdf' | 'csv';\n}\n\n// main.ts\napp.useGlobalPipes(new ValidationPipe({ transform: true }));\n\n// reports.controller.ts\n@Controller('reports')\nexport class ReportsController {\n  constructor(@InjectQueue('reports') private queue: Queue) {}\n\n  @Post()\n  async create(@Body() input: CreateReportDto): Promise<Report> {\n    const report = await reports.insert(input);\n    await this.queue.add('render-report', { reportId: report.id });\n    return report;\n  }\n}\n\n// reports.processor.ts\n@Processor('reports')\nexport class ReportsProcessor extends WorkerHost {\n  async process(job: Job<{ reportId: string }>) {\n    if (job.name === 'render-report') await renderPdf(job.data.reportId);\n  }\n}\n\n// consumer.ts — generated from the Swagger document\nimport { createReport } from './generated-client.ts';\nawait createReport({ accountId, format: 'pdf' });"
    },
    {
      key: "hono",
      label: "Hono",
      summary: "Hono is the smallest credible version of this endpoint and its RPC client is excellent; the background job belongs to the hosting adapter, so portability stops at that boundary.",
      lang: "ts",
      code: "import { Hono } from 'hono';\nimport { hc } from 'hono/client';\nimport { zValidator } from '@hono/zod-validator';\nimport { z } from 'zod';\n\ntype RenderReport = { reportId: string };\ntype Bindings = { REPORTS: Queue<RenderReport> };\nconst CreateReport = z.object({\n  accountId: z.string().uuid(),\n  format: z.enum(['pdf', 'csv']),\n});\n\nconst app = new Hono<{ Bindings: Bindings }>()\n  .post('/reports', zValidator('json', CreateReport), async (c) => {\n    const report = await reports.insert(c.req.valid('json'));\n    await c.env.REPORTS.send({ reportId: report.id });\n    return c.json(report, 202);\n  });\n\nexport type AppType = typeof app;\nexport const client = hc<AppType>('/');\nawait client.reports.$post({ json: { accountId, format: 'pdf' } });\n\nexport default {\n  fetch: app.fetch,\n  async queue(batch: MessageBatch<RenderReport>) {\n    for (const message of batch.messages) {\n      await renderPdf(message.body.reportId);\n      message.ack();\n    }\n  },\n};"
    },
    {
      key: "encore",
      label: "Encore.dev",
      summary: "Encore makes typed endpoints and provisioned Pub/Sub impressively compact; NetScript keeps the contract object, service client, and worker runtime explicit package surfaces you can compose outside one compiler.",
      lang: "ts",
      code: "import { api } from 'encore.dev/api';\nimport { Subscription, Topic } from 'encore.dev/pubsub';\n\ninterface CreateReport {\n  accountId: string;\n  format: 'pdf' | 'csv';\n}\ninterface Report { id: string; status: 'queued' }\ninterface RenderReport { reportId: string }\n\nconst renders = new Topic<RenderReport>('render-reports', {\n  deliveryGuarantee: 'at-least-once',\n});\n\nexport const create = api(\n  { expose: true, method: 'POST', path: '/reports' },\n  async (input: CreateReport): Promise<Report> => {\n    const report = await reports.insert(input);\n    await renders.publish({ reportId: report.id });\n    return report;\n  },\n);\n\nconst _render = new Subscription(renders, 'render-report', {\n  handler: async ({ reportId }) => { await renderPdf(reportId); },\n});\n\n// A consumer in another Encore service\nimport { reports } from '~encore/clients';\nawait reports.create({ accountId, format: 'pdf' });"
    }
  ]
}) }}

{{ comp.nextPrev({ prev: { label: "Frontend frameworks", href: "/comparisons/frontend/" }, next: { label: "Comparisons", href: "/comparisons/" } }) }}
