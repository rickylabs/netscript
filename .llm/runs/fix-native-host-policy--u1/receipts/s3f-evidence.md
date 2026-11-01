# Workers in-flight drain checkpoint evidence

Root acceptance: [root-s3f-source-acceptance.md](../root-s3f-source-acceptance.md).
The 247-line lifecycle owner is SHA256
`7d772b6010487cc828227c49b7ae973b7944bd53d5cf35cb4295080088f3090b`.
Its accepted 4,758-byte / 109-line S3e prefix remains byte-exact.

Actual final owning tests: 10 passed, 0 failed, 0 ignored in 30,767 ms. Four-file frozen/cached
type, lint and formatting checks process every selected owner without findings or drops; the
quality scan has zero findings/allowances. All 26 other protected hashes match. Three owned
validation profiles were removed empty. Two earlier outer formatting failures are retained;
the native drain behavior passed on every executed version.

The positive child holds a real request in the public authenticator, starts two actual native
stops, rebinds the listener port while both stop observations remain pending, then releases the
request and consumes its HTTP200 describe response. Actual stops settle and caller-owned KV
remains usable before test-owned close. A fresh explicitly labeled observation-negative child
replaces only one observation promise, fails exactly `DRAIN_COMPLETED_BEFORE_RELEASE`, and
still completes both real native stops and response/listener/KV cleanup. It is an oracle control,
not evidence that native stop completes early. Child bounds, permissions and sanitizers remain.

`s3f-evidence.json.gz` contains 78 exact-byte JSON/base64 records: 200,645 original bytes and
71,163 gzip bytes. All 78 roundtrip against retained originals. Archive SHA256:
`99474ec18e648aff73555414bf73976e8bf7a118b725f15a0e4b5b3c56eafcab`.
The manifest provides per-file hashes; use the read-only recipe in `s2-evidence.md` with this
archive filename. All previous bundles/verdicts remain immutable. No user credentials/profile,
private database or module cache is included.

Coordinator-selected native Astra architecture primary; requested xhigh is not independently
attested. Root authorized checkpoint publication and the concrete follow-on legacy scope in
the acceptance record. No independent IMPL, whole U1, application, security, readiness, merge or
release acceptance is claimed. The separate native-service baseline diagnosis was not touched.
