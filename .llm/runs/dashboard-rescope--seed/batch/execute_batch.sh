#!/usr/bin/env bash
# =============================================================================
# dashboard-rescope v2 ratification batch  —  owner "yes to all, proceed" 2026-07-06
# Run from THIS directory:
#   wsl.exe -u codex -- bash -lc 'cd <run-dir>/batch && ./execute_batch.sh'
# gh auth is taken from `gh auth token` inside WSL. All bodies via --body-file
# (relative). Committed bodies/ + comments/ hold the canonical text with NUM_*
# placeholders; this script RENDERS a working copy in a temp dir, back-fills the
# 7 new issue numbers there, and points every gh call at the rendered copy so the
# committed sources stay pristine and the script is re-runnable-safe.
# See MANIFEST.md for the ordered checklist this script implements.
# =============================================================================
set -euo pipefail

R="rickylabs/netscript"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_BODIES="$HERE/bodies"
SRC_COMMENTS="$HERE/comments"
REND="$(mktemp -d /tmp/dash-rescope-batch.XXXXXX)"
cp -r "$SRC_BODIES"/. "$REND/"
trap 'rm -rf "$REND"' EXIT

# gh needs a token; fail loud if absent
gh auth token >/dev/null 2>&1 || { echo "!! gh not authenticated in this shell"; exit 10; }

step() { echo "── $*"; }
BODY() { echo "$REND/$1"; }          # rendered body path
CMT()  { echo "$SRC_COMMENTS/$1"; }  # comments never carry NUM_ except rewrite-418 (rendered below)

# -----------------------------------------------------------------------------
# 1. D2 — create area:queue label (idempotent)
# -----------------------------------------------------------------------------
step "label: area:queue"
gh label create "area:queue" --repo "$R" --color "1D76DB" \
  --description "packages/queue: queue backends, delivery, dead-letter" 2>/dev/null || true

# -----------------------------------------------------------------------------
# 2. D4 — comment-before-close #421/#422/#425 as not planned (superseded)
#         remove wave:v1, clear milestone, NO closing keyword
# -----------------------------------------------------------------------------
for n in 421 422 425; do
  step "close #$n (superseded)"
  gh issue comment "$n" --repo "$R" --body-file "$(CMT close-$n.md)"
  gh issue edit "$n" --repo "$R" --remove-label "wave:v1" --remove-milestone
  gh issue close "$n" --repo "$R" --reason "not planned"
done

# -----------------------------------------------------------------------------
# 3. Create the 7 new issues in dependency order; capture each number.
#    Bodies still carry NUM_* placeholders at create time; re-edited in step 5.
# -----------------------------------------------------------------------------
create() { # $1=title  $2=rendered-body-basename  $3=labels(csv)  $4=milestone  -> prints number
  local out num
  out="$(gh issue create --repo "$R" --title "$1" --body-file "$(BODY "$2")" --label "$3" --milestone "$4")"
  num="$(echo "$out" | grep -oE 'issues/[0-9]+' | grep -oE '[0-9]+' | tail -1)"
  [ -n "$num" ] || { echo "!! could not parse issue number from: $out" >&2; exit 11; }
  echo "$num"
}

step "create DDX-20 (S3 Runtime-Config, beta.6 p1)"
N_DDX20="$(create "[dashboard DDX-20] S3: Runtime-Config Monitor & Control (flagship)" ddx20.md \
  "type:feat,area:config,area:fresh-ui,area:plugins,epic:dev-dashboard,priority:p1,wave:v1,status:triage" "0.0.1-beta.6")"
step "  -> #$N_DDX20"

step "create DDX-21 (S11 Migrations & Drift, beta.6 p2)"
N_DDX21="$(create "[dashboard DDX-21] S11: DB Migrations & Drift" ddx21.md \
  "type:feat,area:database,area:fresh-ui,area:plugins,epic:dev-dashboard,priority:p2,wave:v1,status:triage" "0.0.1-beta.6")"
step "  -> #$N_DDX21"

step "create DDX-22 (S12 Dead-Letter Queues, Backlog p2)"
N_DDX22="$(create "[dashboard DDX-22] S12: Dead-Letter Queues (queue + trigger)" ddx22.md \
  "type:feat,area:queue,area:fresh-ui,area:plugins,epic:dev-dashboard,priority:p2,wave:defer,status:triage" "Backlog / Triage")"
step "  -> #$N_DDX22"

step "create TriggerDlqPort co-req (Backlog p2)"
N_TRIGDLQ="$(create "feat(triggers): TriggerDlqPort contract route (dashboard DLQ co-req)" triggerdlq.md \
  "type:feat,area:service,epic:dev-dashboard,priority:p2,wave:defer,status:triage" "Backlog / Triage")"
step "  -> #$N_TRIGDLQ"

step "create DeadLetterStore co-req (Backlog p2)"
N_QDLQ="$(create "feat(queue): DeadLetterStore CLI + contract API (dashboard DLQ co-req)" queuedlq.md \
  "type:feat,area:queue,area:cli,epic:dev-dashboard,priority:p2,wave:defer,status:triage" "Backlog / Triage")"
step "  -> #$N_QDLQ"

step "create runtime-config mutation co-req (beta.7 p2)"
N_MUT="$(create "feat(runtime-config): mutation use-cases — set/unset + versioned current pointer bump (S3 write-back co-req)" mut.md \
  "type:feat,area:config,epic:dev-dashboard,priority:p2,wave:defer,status:triage" "0.0.1-beta.7")"
step "  -> #$N_MUT"

step "create DDX-23 (seam-event flow plane, beta.7 p2)"
N_DDX23="$(create "[dashboard DDX-23] seam-event flow plane: unified envelope + HTTP boundary events (S13 co-req)" ddx23.md \
  "type:feat,area:telemetry,area:service,epic:dev-dashboard,priority:p2,wave:defer,status:triage" "0.0.1-beta.7")"
step "  -> #$N_DDX23"

# -----------------------------------------------------------------------------
# 4. Back-fill real numbers into every rendered body + the rewrite-418 comment
# -----------------------------------------------------------------------------
step "back-fill NUM_* placeholders (DDX20=$N_DDX20 DDX21=$N_DDX21 DDX22=$N_DDX22 DDX23=$N_DDX23 TRIGDLQ=$N_TRIGDLQ QDLQ=$N_QDLQ MUT=$N_MUT)"
cp "$SRC_COMMENTS/rewrite-418.md" "$REND/rewrite-418.md"
sed -i \
  -e "s/NUM_DDX20/${N_DDX20}/g" -e "s/NUM_DDX21/${N_DDX21}/g" -e "s/NUM_DDX22/${N_DDX22}/g" \
  -e "s/NUM_DDX23/${N_DDX23}/g" -e "s/NUM_TRIGDLQ/${N_TRIGDLQ}/g" -e "s/NUM_QDLQ/${N_QDLQ}/g" \
  -e "s/NUM_MUT/${N_MUT}/g" \
  "$REND"/*.md
# guard: no placeholder may survive
if grep -RIlq "NUM_" "$REND"; then echo "!! unresolved NUM_ placeholder remains"; grep -Rl "NUM_" "$REND"; exit 12; fi

# -----------------------------------------------------------------------------
# 5. Re-edit the 5 new issues whose bodies carried placeholders
# -----------------------------------------------------------------------------
for pair in "$N_DDX20:ddx20.md" "$N_DDX22:ddx22.md" "$N_TRIGDLQ:triggerdlq.md" "$N_QDLQ:queuedlq.md" "$N_MUT:mut.md"; do
  num="${pair%%:*}"; file="${pair##*:}"
  step "re-edit #$num (back-filled body)"
  gh issue edit "$num" --repo "$R" --body-file "$(BODY "$file")"
done

# -----------------------------------------------------------------------------
# 6. Rewrite the 18 existing bodies + label/milestone deltas (deltas verified
#    against the 2026-07-06 live snapshot; see MANIFEST.md).
# -----------------------------------------------------------------------------
step "#400 epic body + retitle"
gh issue edit 400 --repo "$R" --body-file "$(BODY epic-400.md)" \
  --title "epic: NetScript Dev Dashboard — the Aspire/Scalar satellite that drives the framework (ships as a plugin, beta.6)"

step "#411 body"; gh issue edit 411 --repo "$R" --body-file "$(BODY 411.md)"
step "#412 body"; gh issue edit 412 --repo "$R" --body-file "$(BODY 412.md)"
step "#413 body"; gh issue edit 413 --repo "$R" --body-file "$(BODY 413.md)"
step "#415 body +area:plugins"; gh issue edit 415 --repo "$R" --body-file "$(BODY 415.md)" --add-label "area:plugins"
step "#416 body +area:fresh-ui,area:config"; gh issue edit 416 --repo "$R" --body-file "$(BODY 416.md)" --add-label "area:fresh-ui,area:config"
step "#417 body +area:fresh-ui,area:cli"; gh issue edit 417 --repo "$R" --body-file "$(BODY 417.md)" --add-label "area:fresh-ui,area:cli"
step "#418 body + retitle (S13 Live Flow) +area:fresh-ui,area:plugins"
gh issue edit 418 --repo "$R" --body-file "$(BODY 418.md)" --add-label "area:fresh-ui,area:plugins" \
  --title "[dashboard DDX-8] S13: Live Flow — request journey across framework seams"
step "#419 body +area:fresh-ui,area:plugins"; gh issue edit 419 --repo "$R" --body-file "$(BODY 419.md)" --add-label "area:fresh-ui,area:plugins"
step "#420 body +area:fresh-ui"; gh issue edit 420 --repo "$R" --body-file "$(BODY 420.md)" --add-label "area:fresh-ui"
step "#423 body +area:service,area:config,p1 -p2"; gh issue edit 423 --repo "$R" --body-file "$(BODY 423.md)" --add-label "area:service,area:config,priority:p1" --remove-label "priority:p2"
step "#424 body +area:aspire,p1 -p2"; gh issue edit 424 --repo "$R" --body-file "$(BODY 424.md)" --add-label "area:aspire,priority:p1" --remove-label "priority:p2"
step "#426 body +area:cli"; gh issue edit 426 --repo "$R" --body-file "$(BODY 426.md)" --add-label "area:cli"
step "#428 body +area:fresh-ui"; gh issue edit 428 --repo "$R" --body-file "$(BODY 428.md)" --add-label "area:fresh-ui"
step "#429 body +area:fresh-ui"; gh issue edit 429 --repo "$R" --body-file "$(BODY 429.md)" --add-label "area:fresh-ui"
step "#430 body +area:fresh-ui"; gh issue edit 430 --repo "$R" --body-file "$(BODY 430.md)" --add-label "area:fresh-ui"
step "#431 body +area:fresh-ui,p2 -p1"; gh issue edit 431 --repo "$R" --body-file "$(BODY 431.md)" --add-label "area:fresh-ui,priority:p2" --remove-label "priority:p1"
step "#507 body +type:chore,wave:v1 -type:feat, milestone beta.6"; gh issue edit 507 --repo "$R" --body-file "$(BODY 507.md)" --add-label "type:chore,wave:v1" --remove-label "type:feat" --milestone "0.0.1-beta.6"

# -----------------------------------------------------------------------------
# 7. D3+D5 — #432 elevate: append addendum to CURRENT body, milestone -> beta.7
#    (priority already p2; wave:defer kept)
# -----------------------------------------------------------------------------
step "#432 append addendum + milestone beta.7"
gh issue view 432 --repo "$R" --json body --jq .body > "$REND/cur432.md"
printf "\n\n" >> "$REND/cur432.md"
cat "$(BODY 432-addendum.md)" >> "$REND/cur432.md"
gh issue edit 432 --repo "$R" --body-file "$REND/cur432.md" --milestone "0.0.1-beta.7"

# -----------------------------------------------------------------------------
# 8. Tightening / notice comments
# -----------------------------------------------------------------------------
step "comment #408 (tightening)"; gh issue comment 408 --repo "$R" --body-file "$(CMT tighten-408.md)"
step "comment #427 (tightening)"; gh issue comment 427 --repo "$R" --body-file "$(CMT tighten-427.md)"
step "comment #418 (S13 rewrite notice)"; gh issue comment 418 --repo "$R" --body-file "$REND/rewrite-418.md"

echo ""
echo "=============================================================="
echo "BATCH COMPLETE"
echo "  new issues:  DDX-20=#$N_DDX20  DDX-21=#$N_DDX21  DDX-22=#$N_DDX22"
echo "               TriggerDlq=#$N_TRIGDLQ  QueueDlq=#$N_QDLQ  RuntimeCfgMut=#$N_MUT  DDX-23=#$N_DDX23"
echo "  closed:      #421 #422 #425 (not planned / superseded)"
echo "  rewritten:   #400 #411 #412 #413 #415 #416 #417 #418 #419 #420"
echo "               #423 #424 #426 #428 #429 #430 #431 #507  (+ #432 addendum)"
echo "  commented:   #408 #427 #418"
echo "=============================================================="
