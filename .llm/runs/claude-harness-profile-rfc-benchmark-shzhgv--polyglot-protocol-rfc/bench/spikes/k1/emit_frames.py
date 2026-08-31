# K1 emitter (python3) — same adversarial contract as the Go emitter, via threads.
# Frames: single os.write() <= 4096 bytes (PIPE_BUF atomicity). Logs: hostile.
import hashlib
import json
import os
import sys
import threading

SENTINEL = b"\x00NSF\x00"
N_LOGS = 10000
N_FRAMES = 200
mu = threading.Lock()
fd = sys.stdout.fileno()


def frames() -> None:
    for i in range(N_FRAMES):
        payload = "x" * (64 * (i % 16))
        sha = hashlib.sha256(payload.encode()).hexdigest()[:16]
        frame = {"v": 1, "t": "progress", "seq": i, "payload": payload, "sha": sha}
        line = SENTINEL + json.dumps(frame, separators=(",", ":")).encode() + b"\n"
        assert len(line) <= 4096, "frame exceeds PIPE_BUF budget"
        os.write(fd, line)  # one write syscall


def logs(w: int) -> None:
    for i in range(N_LOGS // 4):
        k = i % 8
        if k == 0:
            line = f"worker {w}: plain log line {i}\n".encode()
        elif k == 1:
            line = json.dumps({"looks": "like json", "seq": i, "success": True}).encode() + b"\n"
        elif k == 2:
            line = SENTINEL + b"this is not valid json {{{\n"
        elif k == 3:
            line = b"mid-line " + SENTINEL + b'{"t":"result"} embedded %d\n' % i
        elif k == 4:
            line = b"A" * (1024 * 1024) + b"\n"
        elif k == 5:
            line = bytes([0xFF, 0xFE, 0x80, 0x81]) + b" binary-ish\n"
        elif k == 6:
            line = b"\r\n"
        else:
            line = json.dumps({"t": "progress", "seq": i}).encode() + b"\n"
        if i % 2 == 0:
            with mu:
                os.write(fd, line)
        else:
            os.write(fd, line)


threads = [threading.Thread(target=frames)] + [
    threading.Thread(target=logs, args=(w,)) for w in range(4)
]
for t in threads:
    t.start()
for t in threads:
    t.join()
res = {"v": 1, "t": "result", "seq": N_FRAMES, "outcome": "ok", "framesEmitted": N_FRAMES}
os.write(fd, SENTINEL + json.dumps(res, separators=(",", ":")).encode() + b"\n")
