// K4 T1 subject — Tier-1 protocol Go task: reads the versioned envelope from TASK_PAYLOAD
// (the existing delivery mechanism carrying the new contract), emits started + progress +
// result sentinel frames. Compute: MINSTD LCG, identical to the series baseline.
package main

import (
	"encoding/json"
	"fmt"
	"os"
)

const SENTINEL = "\x00NSF\x00"

type envelope struct {
	V           int    `json:"v"`
	TaskID      string `json:"taskId"`
	ExecutionID string `json:"executionId"`
	Attempt     int    `json:"attempt"`
	DeadlineMs  int64  `json:"deadlineMs"`
	Traceparent string `json:"traceparent"`
	Payload     struct {
		N    uint64 `json:"n"`
		Seed uint64 `json:"seed"`
	} `json:"payload"`
	MsgSeq int `json:"msgSeq"`
}

func frame(obj map[string]any) {
	b, _ := json.Marshal(obj)
	os.Stdout.WriteString(SENTINEL + string(b) + "\n")
}

func main() {
	raw := os.Getenv("TASK_PAYLOAD")
	var env envelope
	if err := json.Unmarshal([]byte(raw), &env); err != nil || env.V != 1 {
		frame(map[string]any{"v": 1, "t": "result", "outcome": "error", "errtype": "Protocol.BadEnvelope", "message": fmt.Sprint(err)})
		os.Exit(1)
	}
	frame(map[string]any{"v": 1, "t": "started", "attempt": env.Attempt, "traceSeen": env.Traceparent != ""})

	state, acc := env.Payload.Seed, uint64(0)
	half := env.Payload.N / 2
	for i := uint64(0); i < env.Payload.N; i++ {
		state = state * 48271 % 2147483647
		acc = (acc + state) % 1000000007
		if i == half {
			frame(map[string]any{"v": 1, "t": "progress", "percent": 50})
		}
	}
	var vmHwmKb any = nil
	if st, err := os.ReadFile("/proc/self/status"); err == nil {
		var kb int
		if _, err := fmt.Sscanf(string(st[indexOf(st, "VmHWM:"):]), "VmHWM: %d kB", &kb); err == nil {
			vmHwmKb = kb
		}
	}
	frame(map[string]any{
		"v": 1, "t": "result", "outcome": "ok",
		"acc": acc, "msgSeq": env.MsgSeq, "vmHwmKb": vmHwmKb,
	})
}

func indexOf(b []byte, s string) int {
	for i := 0; i+len(s) <= len(b); i++ {
		if string(b[i:i+len(s)]) == s {
			return i
		}
	}
	return 0
}
