# Python continuity row (probe-only; answers the "python RFC?" question with data).
import json, os, sys

def run_lcg(n, seed):
    state, acc = seed, 0
    for _ in range(n):
        state = state * 48271 % 2147483647
        acc = (acc + state) % 1000000007
    return acc

def vm_hwm_kb():
    try:
        with open('/proc/self/status') as f:
            for line in f:
                if line.startswith('VmHWM:'):
                    return int(''.join(c for c in line if c.isdigit()))
    except OSError:
        return None

n = int(sys.argv[1]) if len(sys.argv) > 1 else 100000
seed = int(sys.argv[2]) if len(sys.argv) > 2 else 42
print(json.dumps({"acc": run_lcg(n, seed), "n": n, "seed": seed,
                  "correlationId": os.environ.get("CORRELATION_ID"), "vmHwmKb": vm_hwm_kb()}))
