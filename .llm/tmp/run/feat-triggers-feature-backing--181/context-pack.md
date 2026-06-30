# Context Pack — #181 Triggers Feature-Backing

Current phase: implementation after PLAN-EVAL `PASS`.

Base after pre-flight reset: `e77e68b6`.

Locked implementation order:
1. Domain fields `enabled` + `name`.
2. Enabled-state port/store and connector enable/disable.
3. Manual-fire dispatcher.
4. Webhook test delivery.
5. Cron next-fire preview engine.
6. Event subscription/SSE.

Hard constraints:
- Do not restructure `createPluginService(router, {...}).serve()` in `plugins/triggers/services/src/main.ts`.
- Only construct new default ports inside `createTriggersServiceContext`.
- No new `any`; avoid new casts.
- Keep memory testing adapters on the testing subpath.
- Commit, push, PR-comment, and update artifacts per slice.

Latest slice:
- Slice 1 implemented optional definition `name`/`enabled`, builder propagation, and connector
  response `name` mapping. Gates are green; commit `a79e13ea` is recorded in `commits.md`.
- Slice 2 implemented `TriggerEnabledStatePort`, KV and memory stores, public
  `createKvTriggerEnabledStateStore`, connector enable/disable backing, and `enabled=false` list
  filtering. Gates are green; commit `a19ca64f` is recorded in `commits.md`.
- Slice 3 implemented `createManualDispatcher` and backed connector `fireTrigger`. Gates are green;
  commit `6ead7da4` is recorded in `commits.md`.
- Slice 4 implemented `createWebhookTestDelivery` and backed connector `testWebhook` through
  ingress-signed synthetic requests. Gates are green; commit `3ef180f7` is recorded in
  `commits.md`.
- Slice 5 implemented `computeNextFireTimes` and backed connector `previewSchedule`. Gates are
  green; commit `e710297f` is recorded in `commits.md`.
- Slice 6 implemented `TriggerEventSubscriptionPort`, `createEventSubscription`, lifecycle
  publishing, and connector `subscribeEvents`. Gates are green; commit pending.
