**PASS — source approval remains valid with both changes included.**

- In `packages/cli/src/kernel/assets/resource-slice/index.tsx.template`, exporting the builder’s `handler` exposes the generated `withForm` POST handling to Fresh while preserving the default page export. Fixing the canonical template also carries the correction into subsequent generated resources.
- In `packages/cli/src/kernel/assets/resource-slice/(_components)/resource-form.tsx.template`, the success notice matches the supplied public state contract: it appears only after a processed submission with no field or form errors. Its `role='status'` provides an accessible confirmation, and the text accurately states validation without persistence. Initial rendering and error submissions do not show success.

I identify no new source blocker from this reconciliation. All findings raised in this review remain closed.

This approval covers the previously reviewed source plus these two revisions. I used no tools and executed no gates; the successful browser POST, test results, generated checks, and independent visual review remain reported evidence rather than verification performed in this session.