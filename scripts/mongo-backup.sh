#!/bin/sh
# Mongo backup sidecar.
#  - Scheduled: takes a gzipped mongodump when the newest backup is older than
#    BACKUP_INTERVAL_DAYS (checked every BACKUP_CHECK_SECONDS).
#  - On demand: the API drops "$BACKUP_DIR/.backup-now"; it is picked up within
#    BACKUP_POLL_SECONDS.
# Keeps only the newest BACKUP_KEEP archives. Progress/result of the last run is
# written to "$BACKUP_DIR/.status.json" for the API to read.
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
INTERVAL_DAYS="${BACKUP_INTERVAL_DAYS:-3}"
KEEP="${BACKUP_KEEP:-2}"
CHECK_SECONDS="${BACKUP_CHECK_SECONDS:-3600}"
POLL_SECONDS="${BACKUP_POLL_SECONDS:-10}"
TRIGGER="$BACKUP_DIR/.backup-now"
STATUS="$BACKUP_DIR/.status.json"

mkdir -p "$BACKUP_DIR"

now() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }
log() { echo "[mongo-backup] $(now) $*"; }

# write_status <state> <trigger> <startedAt> <finishedAt> <file> <message>
write_status() {
  printf '{"state":"%s","trigger":"%s","startedAt":"%s","finishedAt":"%s","file":"%s","message":"%s"}\n' \
    "$1" "$2" "$3" "$4" "$5" "$6" > "$STATUS.tmp"
  mv "$STATUS.tmp" "$STATUS"
}

newest_backup() {
  ls -1t "$BACKUP_DIR"/mongo-*.archive.gz 2>/dev/null | head -n 1 || true
}

backup_due() {
  newest="$(newest_backup)"
  [ -z "$newest" ] && return 0
  # Due if the newest backup is older than INTERVAL_DAYS (in minutes).
  [ -n "$(find "$newest" -mmin +$((INTERVAL_DAYS * 24 * 60)) 2>/dev/null)" ]
}

prune() {
  ls -1t "$BACKUP_DIR"/mongo-*.archive.gz 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
    log "deleting old backup $old"
    rm -f "$old"
  done
}

# run_backup <trigger: scheduled|manual>
run_backup() {
  trigger="$1"
  started="$(now)"
  ts="$(date -u '+%Y%m%d-%H%M%S')"
  name="mongo-$ts.archive.gz"
  final="$BACKUP_DIR/$name"
  tmp="$final.partial"
  write_status running "$trigger" "$started" "" "" ""
  log "starting $trigger backup -> $final"
  if mongodump \
      --host "$MONGO_HOST" --port "${MONGO_PORT:-27017}" \
      --username "$MONGO_USER" --password "$MONGO_PASSWORD" \
      --authenticationDatabase admin \
      --archive="$tmp" --gzip --quiet 2>"$BACKUP_DIR/.last-error"; then
    mv "$tmp" "$final"
    rm -f "$BACKUP_DIR/.last-error"
    log "backup done ($(du -h "$final" | cut -f1))"
    prune
    write_status ok "$trigger" "$started" "$(now)" "$name" ""
  else
    rm -f "$tmp"
    msg="$(tail -n 1 "$BACKUP_DIR/.last-error" 2>/dev/null | tr -d '"\\' | cut -c1-200)"
    log "backup FAILED: $msg"
    write_status failed "$trigger" "$started" "$(now)" "" "$msg"
  fi
}

# Exit promptly on `docker stop` (sh as PID 1 otherwise ignores SIGTERM).
trap 'log "stopping"; exit 0' TERM INT

log "every ${INTERVAL_DAYS}d, keeping ${KEEP}, schedule check ${CHECK_SECONDS}s, trigger poll ${POLL_SECONDS}s"
elapsed="$CHECK_SECONDS" # check the schedule immediately on start
while true; do
  if [ -f "$TRIGGER" ]; then
    rm -f "$TRIGGER"
    run_backup manual
  elif [ "$elapsed" -ge "$CHECK_SECONDS" ]; then
    elapsed=0
    if backup_due; then
      run_backup scheduled
    fi
  fi
  sleep "$POLL_SECONDS" &
  wait $!
  elapsed=$((elapsed + POLL_SECONDS))
done
