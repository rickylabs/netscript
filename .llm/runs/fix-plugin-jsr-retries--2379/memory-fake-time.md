# FakeTime and retry chains

@std/testing 1.0.21 runAllAsync checks for queued timers before draining microtasks, and nextAsync drains before firing each timer. A retry chain can schedule its next timer after runAllAsync already sees the queue empty. Drive the known two retry opportunities with explicit nextAsync calls instead of a timer-polled loop. Dispose the fake clock and attach rejection assertions before advancing it. Retry-After tests use tickAsync at the boundary and request timestamps, not wall-clock budgets.
