# Root-authorized S6a oracle correction

Root message received after the preserved gates-2 result (5 passed,1 failed,0 ignored):

> Root read actual current and PR2422 withServiceInfo registration + build ordering. Authorize
> narrow S6a oracle correction: 7 authn / 4 authz only guarded raw stream requests, preserve all raw
> 401/503/403/write/read and strict principal receiver controls. Strengthen explicit separate
> credentialless GET / metadata200 assertion with auth call counts UNCHANGED, making current native
> public metadata behavior visible; do not claim protect ['/'] secures metadata root or whole host.
> Preserve first 5/1 failure and actual source binding/root rationale. Health S6a explicit allow
> still valid; later S6b empty allowAnonymous health-guard acceptance depends on accepted PR2422
> installHealth integration and cannot borrow its behavior on U1 base. No production service-info/
> health patch inside S6a / no U4 scope expansion. Run only necessary changed owning/static gates;
> factory frozen 113 hashes. Return full two owners + raw proof before checkpoint.

Current source binding: packages/service/src/builder/service-builder-impl.ts withServiceInfo()
registers GET / immediately (around469); build() later invokes installAuth() (around502–518), before
installDeferredRoutes(). The failed expectation counted GET / among authenticator invocations.
The corrected oracle separately proves credentialless metadata200 and unchanged auth counts, while
preserving exact raw-stream call/identity expectations. No native source changed. The original
proposal's later health assertion is not silently changed or treated as qualified here.
