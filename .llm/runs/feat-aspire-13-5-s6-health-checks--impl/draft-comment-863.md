The two failure modes in #863 now have separate Aspire 13.5 owners:

- S6 (#1718, draft PR #1743) owns the listener-readiness half. Generated Postgres checks connect to
  the resource's live Aspire endpoint, attach a named `postgres_listener` health report, and make a
  listener failure visible to `aspire wait`/`aspire describe` without reading credentials.
- S8 owns the indefinite-block half by bounding the dependency wait and surfacing the unhealthy
  resource plus probe detail instead of allowing `db init` to wait forever.

Accordingly, #863 should close only after S6's Phase-B listener-unreachable/quickstart receipts and
S8's bounded-wait gate are both green. S6 alone does not prove the clean-machine sequence or close
the unbounded-wait acceptance item. The S6 implementation is stacked on S5 and remains draft pending
the supervisor's runtime lease and separate IMPL-EVAL.
