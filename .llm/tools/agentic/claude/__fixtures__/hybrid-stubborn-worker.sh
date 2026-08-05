#!/bin/sh
# Test fixture: both leader and descendant ignore TERM so the adapter must
# escalate to a process-group KILL. OPENCODE_CONFIG is an allow-listed marker.
trap '' TERM
(trap '' TERM; sleep 60) &
descendant_pid=$!
printf '%s\n' "$descendant_pid" > "$OPENCODE_CONFIG"
wait "$descendant_pid"
