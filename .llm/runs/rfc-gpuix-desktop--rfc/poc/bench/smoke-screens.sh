#!/usr/bin/env bash
# Click through every screen with real X11 input and capture each one.
# Runs inside the bench container (see ctr.sh). Usage: smoke-screens.sh <out-dir> <suffix>
set -uo pipefail
OUT="$1"; SUFFIX="$2"
deno run -A app/main.gpuix.tsx --profile=/tmp/prof-$SUFFIX > /tmp/smoke.log 2>&1 &
APP=$!
for i in $(seq 1 ${READY_TRIES:-80}); do grep -q NETSCRIPT_READY /tmp/smoke.log && break; sleep 0.25; done
sleep 2
WIN=$(xdotool search --name "NetScript" | head -1)
eval "$(xdotool getwindowgeometry --shell "$WIN")"   # X Y WIDTH HEIGHT
shot() { sleep "${2:-1.2}"; import -window root "$OUT/$1-$SUFFIX.png"; }
click() { xdotool mousemove $((X + $1)) $((Y + $2)) click 1; }
shot overview 0.2
click 60 103; shot records          # Records nav
click 420 206; shot records-detail  # first record row
click 60 137; shot health 2.2       # System health
click 60 171; shot design           # Design
click 60 205; shot settings         # Settings
grep -v "xinput\|not a member\|legacy" /tmp/smoke.log | tail -5
kill $APP 2>/dev/null; wait $APP 2>/dev/null
echo "geometry $X,$Y ${WIDTH}x${HEIGHT}"
