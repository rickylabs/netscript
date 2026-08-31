# K5 python3 task — blocking MINSTD compute on the main thread, stdin control reader on a
# side thread. On CANCEL frame: cooperative stop at chunk granularity, emit cancel-ack frame.
import json
import os
import sys
import threading
import time

SENTINEL = b"\x00NSF\x00"
fd = sys.stdout.fileno()
cancel = threading.Event()


def frame(obj) -> None:
    os.write(fd, SENTINEL + json.dumps(obj, separators=(",", ":")).encode() + b"\n")


def control() -> None:
    for line in sys.stdin:
        try:
            f = json.loads(line)
        except json.JSONDecodeError:
            continue
        if f.get("t") == "cancel":
            cancel.set()
            return


threading.Thread(target=control, daemon=True).start()
frame({"v": 1, "t": "started"})

state, acc = 42, 0
i = 0
TOTAL = 200_000_000  # far longer than the test window; cancel interrupts it
CHUNK = 100_000
while i < TOTAL:
    for _ in range(CHUNK):
        state = state * 48271 % 2147483647
        acc = (acc + state) % 1000000007
    i += CHUNK
    if cancel.is_set():
        frame({"v": 1, "t": "result", "outcome": "cancelled", "ackNs": time.perf_counter_ns(), "iterations": i})
        sys.exit(0)
frame({"v": 1, "t": "result", "outcome": "ok", "acc": acc})
