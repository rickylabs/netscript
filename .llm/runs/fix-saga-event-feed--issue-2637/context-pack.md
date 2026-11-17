# Context pack

Issue2637, branch fix/saga-event-feed, base b0eb079575968e843b781579673c9fe2ae250e07. Fresh fetch/checkout done, issue fully read. No product changes and no runtime reproduction yet. Feature tier; read research/plan/worklog/supervisor/drift before continuing. Four acceptance boxes require HTTP fanout, stable ordered replay, idle zero scans and bounded documented retention.

Primary seams: plugins/sagas/services/src/routers/v1-handlers.ts and v1-types.ts; core contracts/v1/sagas.contract.ts, domain/ports/adapters existing exports; KV native atomic/watch contracts. Native oRPC already supplies lastEventId. No transports/Redis Streams, no process/scaffold/Aspire/dependency change. Use Deno2.9.7 through mise, structured wrappers, no rtk/rg installed. Operator/raw logs stay private temp; public evidence repo-relative. Only independent evaluators, no helpers. No product implementation until Plan-Gate PASS.
