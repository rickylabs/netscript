// K1 emitter (Go) — interleaves an adversarial log corpus with sentinel-framed protocol
// frames from concurrent goroutines. Frames are single write() calls <= 4096 bytes (the
// PIPE_BUF atomicity rule the protocol will mandate); logs are deliberately hostile.
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"sync"
)

const SENTINEL = "\x00NSF\x00"

func main() {
	nLogs := 10000
	nFrames := 200
	var wg sync.WaitGroup
	var mu sync.Mutex // logs use a mutex only sometimes — half the writers are unsynchronized

	// frame writer goroutine: unsynchronized single-write frames (atomicity via PIPE_BUF)
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < nFrames; i++ {
			payload := strings.Repeat("x", 64*(i%16))
			h := sha256.Sum256([]byte(payload))
			frame := map[string]any{
				"v": 1, "t": "progress", "seq": i,
				"payload": payload, "sha": hex.EncodeToString(h[:8]),
			}
			b, _ := json.Marshal(frame)
			line := SENTINEL + string(b) + "\n"
			if len(line) > 4096 {
				panic("frame exceeds PIPE_BUF budget")
			}
			os.Stdout.WriteString(line) // one write syscall
		}
	}()

	// hostile log writers
	for w := 0; w < 4; w++ {
		wg.Add(1)
		go func(w int) {
			defer wg.Done()
			for i := 0; i < nLogs/4; i++ {
				var line string
				switch i % 8 {
				case 0:
					line = fmt.Sprintf("worker %d: plain log line %d\n", w, i)
				case 1:
					line = fmt.Sprintf("{\"looks\":\"like json\",\"seq\":%d,\"success\":true}\n", i) // D-3 trap
				case 2:
					line = SENTINEL + "this is not valid json {{{\n" // sentinel-lookalike
				case 3:
					line = fmt.Sprintf("mid-line %s{\"t\":\"result\"} embedded sentinel %d\n", SENTINEL, i)
				case 4:
					line = strings.Repeat("A", 1024*1024) + "\n" // 1MB line
				case 5:
					line = string([]byte{0xff, 0xfe, 0x80, 0x81}) + " binary-ish\n" // invalid UTF-8
				case 6:
					line = "\r\n" // CRLF/empty
				default:
					line = fmt.Sprintf("{\"t\":\"progress\",\"seq\":%d}\n", i) // frame-shaped, NO sentinel
				}
				if i%2 == 0 {
					mu.Lock()
					os.Stdout.WriteString(line)
					mu.Unlock()
				} else {
					os.Stdout.WriteString(line) // unsynchronized: big lines may shred
				}
			}
		}(w)
	}
	wg.Wait()
	// terminal result frame
	res := map[string]any{"v": 1, "t": "result", "seq": nFrames, "outcome": "ok", "framesEmitted": nFrames}
	b, _ := json.Marshal(res)
	os.Stdout.WriteString(SENTINEL + string(b) + "\n")
}
