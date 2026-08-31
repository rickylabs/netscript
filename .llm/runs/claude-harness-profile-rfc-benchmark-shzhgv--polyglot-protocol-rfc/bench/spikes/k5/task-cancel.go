// K5 Go task — blocking MINSTD compute on main goroutine, stdin control reader goroutine.
// Cooperative cancel at chunk granularity; cancel-ack frame on stop.
package main

import (
	"bufio"
	"encoding/json"
	"os"
	"sync/atomic"
)

const SENTINEL = "\x00NSF\x00"

func frame(obj map[string]any) {
	b, _ := json.Marshal(obj)
	os.Stdout.WriteString(SENTINEL + string(b) + "\n")
}

func main() {
	var cancel atomic.Bool
	go func() {
		sc := bufio.NewScanner(os.Stdin)
		for sc.Scan() {
			var f map[string]any
			if json.Unmarshal(sc.Bytes(), &f) == nil {
				if t, _ := f["t"].(string); t == "cancel" {
					cancel.Store(true)
					return
				}
			}
		}
	}()
	frame(map[string]any{"v": 1, "t": "started"})

	state, acc := uint64(42), uint64(0)
	const TOTAL = uint64(200_000_000_000)
	const CHUNK = uint64(1_000_000)
	for i := uint64(0); i < TOTAL; i += CHUNK {
		for j := uint64(0); j < CHUNK; j++ {
			state = state * 48271 % 2147483647
			acc = (acc + state) % 1000000007
		}
		if cancel.Load() {
			frame(map[string]any{"v": 1, "t": "result", "outcome": "cancelled", "iterations": i})
			return
		}
	}
	frame(map[string]any{"v": 1, "t": "result", "outcome": "ok", "acc": acc})
}
