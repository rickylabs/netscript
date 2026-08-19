// Go task variant for the golang RFC (run 4) — same MINSTD workload and polyglot contract as
// runs 1-3 (argv: n seed; env CORRELATION_ID; last JSON line result; VmHWM self-report).
// uint64 arithmetic, intermediates < 2^53: exact vs every prior variant.
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func runLcg(n, seed uint64) uint64 {
	state := seed
	var acc uint64
	for i := uint64(0); i < n; i++ {
		state = state * 48271 % 2147483647
		acc = (acc + state) % 1000000007
	}
	return acc
}

func readVmHwmKb() *uint64 {
	data, err := os.ReadFile("/proc/self/status")
	if err != nil {
		return nil
	}
	for _, line := range strings.Split(string(data), "\n") {
		if strings.HasPrefix(line, "VmHWM:") {
			digits := strings.Builder{}
			for _, c := range line {
				if c >= '0' && c <= '9' {
					digits.WriteRune(c)
				}
			}
			if v, err := strconv.ParseUint(digits.String(), 10, 64); err == nil {
				return &v
			}
		}
	}
	return nil
}

func main() {
	n := uint64(100000)
	seed := uint64(42)
	if len(os.Args) > 1 {
		if v, err := strconv.ParseUint(os.Args[1], 10, 64); err == nil {
			n = v
		}
	}
	if len(os.Args) > 2 {
		if v, err := strconv.ParseUint(os.Args[2], 10, 64); err == nil {
			seed = v
		}
	}
	acc := runLcg(n, seed)
	out := map[string]any{"acc": acc, "n": n, "seed": seed}
	if cid, ok := os.LookupEnv("CORRELATION_ID"); ok {
		out["correlationId"] = cid
	} else {
		out["correlationId"] = nil
	}
	if hwm := readVmHwmKb(); hwm != nil {
		out["vmHwmKb"] = *hwm
	} else {
		out["vmHwmKb"] = nil
	}
	b, _ := json.Marshal(out)
	fmt.Println(string(b))
}
