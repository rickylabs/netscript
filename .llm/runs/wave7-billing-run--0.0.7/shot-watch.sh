W=/home/agent/projects/netscript/wave7-billing
for i in $(seq 1 200); do
  n=$(find $W -iname "*.png" -o -iname "*.jpg" 2>/dev/null | grep -viE "node_modules|\.deno|\.data" | wc -l)
  if [ "$n" -gt 0 ]; then
    echo "$(date -u +%H:%M:%SZ) SCREENSHOTS FOUND: $n"
    find $W -iname "*.png" -o -iname "*.jpg" 2>/dev/null | grep -viE "node_modules|\.deno|\.data" | head -20
    exit 0
  fi
  sleep 60
done
