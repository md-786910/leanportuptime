#!/bin/sh
# Mongo backup sidecar: takes a gzipped mongodump every BACKUP_INTERVAL_DAYS
# and keeps only the newest BACKUP_KEEP archives in BACKUP_DIR.
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
INTERVAL_DAYS="${BACKUP_INTERVAL_DAYS:-3}"
KEEP="${BACKUP_KEEP:-2}"
CHECK_SECONDS="${BACKUP_CHECK_SECONDS:-3600}"

mkdir -p "$BACKUP_DIR"

log() { echo "[mongo-backup] $(date -u '+%Y-%m-%dT%H:%M:%SZ') $*"; }

newest_backup() {
  ls -1t "$BACKUP_DIR"/mongo-*.archive.gz 2>/dev/null | head -n 1 || true
}

backup_due() {
  newest="$(newest_backup)"
  [ -z "$newest" ] && return 0
  # Due if the newest backup is older than INTERVAL_DAYS (in minutes).
  [ -n "$(find "$newest" -mmin +$((INTERVAL_DAYS * 24 * 60)) 2>/dev/null)" ]
}

run_backup() {
  ts="$(date -u '+%Y%m%d-%H%M%S')"
  final="$BACKUP_DIR/mongo-$ts.archive.gz"
  tmp="$final.partial"
  log "starting backup -> $final"
  if mongodump \
      --host "$MONGO_HOST" --port "${MONGO_PORT:-27017}" \
      --username "$MONGO_USER" --password "$MONGO_PASSWORD" \
      --authenticationDatabase admin \
      --archive="$tmp" --gzip --quiet; then
    mv "$tmp" "$final"
    log "backup done ($(du -h "$final" | cut -f1))"
    prune
  else
    rm -f "$tmp"
    log "backup FAILED, will retry in ${CHECK_SECONDS}s"
  fi
}

prune() {
  ls -1t "$BACKUP_DIR"/mongo-*.archive.gz 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
    log "deleting old backup $old"
    rm -f "$old"
  done
}

# Exit promptly on `docker stop` (sh as PID 1 otherwise ignores SIGTERM).
trap 'log "stopping"; exit 0' TERM INT

log "every ${INTERVAL_DAYS}d, keeping ${KEEP}, checking every ${CHECK_SECONDS}s"
while true; do
  if backup_due; then
    run_backup
  fi
  sleep "$CHECK_SECONDS" &
  wait $!
done
