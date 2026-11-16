# Context pack

Issue2634, branch fix/auth-sign-in-rate-limit from origin/main b0eb07957. Bootstrap/design committed first and draft PR opens immediately. Implement serially with red schema/provider behavior tests before fixing. Keep absence unchanged; use validated native customRules and real production rate requests. No source edit to auth-service-runtime.ts (separate PR2641), no scaffolds/Aspire changes, no full CLI E2E needed. Mandatory independent straightforward IMPL-EVAL and required head checks before ready. Never merge/rebase/force-push/release or mark ready-merge.

Red baseline established at unchanged main source: schema2pass/8fail; real production provider1pass/2fail, both configured casing styles ignore max1 while absent default3 works. Scoped native import map captures real registry provider construction and invokes its real factory. Next implement schema/types then registry forwarding, preserving absent behavior.
