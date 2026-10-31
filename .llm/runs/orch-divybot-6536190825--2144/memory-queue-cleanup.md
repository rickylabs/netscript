# KV queue cleanup in regression tests

KvPollingAdapter.listen chooses the caller-provided signal when present. Its stop() aborts only the adapter-owned controller, so tests supplying a signal must abort it in finally before awaiting stop(). A failure-path test that omits that abort can hang even though normal success passes. Keep fake time confined to JobRunnerClock; freezing the transport's real timers also stalls KV polling.
