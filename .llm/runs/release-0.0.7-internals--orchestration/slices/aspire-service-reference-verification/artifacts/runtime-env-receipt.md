# Runtime env receipt — #1371

Read from /proc/<pid>/environ while the AppHost was running (PID 429229).

```
workers  (pid 431303): services__redis__tcp__0, services__streams__http__0, services__users__http__0=http://localhost:43277, services__workers-api__http__0
sagas    (pid 431302): services__redis__tcp__0, services__sagas-api__http__0, services__streams__http__0, services__workers-api__http__0
triggers (pid 431307): services__redis__tcp__0, services__streams__http__0, services__triggers-api__http__0, services__workers-api__http__0

grep -c ghost  (triggers environ)     = 0
grep -ci ghost (apphost + aspire log) = 0 / 0
normalized variant (workers_api etc.) = none present
```
