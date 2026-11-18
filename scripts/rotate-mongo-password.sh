#!/usr/bin/env bash
# Rotate the MongoDB root password without touching data.
#
#   ./scripts/rotate-mongo-password.sh            # prompts for the new password
#   ./scripts/rotate-mongo-password.sh --generate # generates a random one
#
# All credentials live in server/.env (the root .env is a symlink to it, so
# docker compose reads the same file).
# Steps: safety backup -> change password inside Mongo -> update server/.env
# (keeps server/.env.bak) -> recreate/restart services -> verify.
# If anything fails after the password was changed, it rolls everything back.
set -Eeuo pipefail

cd "$(dirname "$0")/.."
ENV_FILE="server/.env"
DC="docker compose"

say()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[32m✔\033[0m %s\n' "$*"; }
die()  { printf '\n\033[31m✘ %s\033[0m\n' "$*" >&2; exit 1; }

getenv() { grep -E "^$1=" "$2" | tail -n1 | cut -d= -f2-; }

# --- read current settings ---------------------------------------------------
[ -f "$ENV_FILE" ] || die "$ENV_FILE not found (run from the project root)"
[ "$(readlink -f .env 2>/dev/null)" = "$(readlink -f "$ENV_FILE")" ] \
  || die "root .env must be a symlink to $ENV_FILE  (fix: ln -sf $ENV_FILE .env)"

MUSER="$(getenv MONGO_ROOT_USERNAME "$ENV_FILE")"
OLD="$(getenv MONGO_ROOT_PASSWORD "$ENV_FILE")"
URI="$(getenv MONGODB_URI "$ENV_FILE")"
[ -n "$MUSER" ] && [ -n "$OLD" ] || die "MONGO_ROOT_USERNAME / MONGO_ROOT_PASSWORD missing in $ENV_FILE"
case "$URI" in
  *"://$MUSER:$OLD@"*) ;;
  *) die "MONGODB_URI in $ENV_FILE does not use the same user/password as MONGO_ROOT_* — fix that first" ;;
esac

# --- new password --------------------------------------------------------------
if [ "${1:-}" = "--generate" ]; then
  NEW="$(set +o pipefail; LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)"
else
  read -rsp "New Mongo password (letters/digits, min 16): " NEW; echo
  read -rsp "Repeat new password: " NEW2; echo
  [ "$NEW" = "$NEW2" ] || die "Passwords do not match"
fi
[[ "$NEW" =~ ^[A-Za-z0-9]{16,}$ ]] || die "Password must be at least 16 letters/digits (no symbols — avoids .env/URI escaping issues)"
[ "$NEW" != "$OLD" ] || die "New password is the same as the current one"

mongo_eval() { # mongo_eval <password> <js>
  $DC exec -T mongo mongosh -u "$MUSER" -p "$1" --authenticationDatabase admin --quiet --eval "$2"
}

COUNTS_JS='let t=0,dbs=[];db.adminCommand({listDatabases:1}).databases.forEach(d=>{if(["admin","config","local"].includes(d.name))return;dbs.push(d.name);const x=db.getSiblingDB(d.name);x.getCollectionNames().forEach(c=>{t+=x.getCollection(c).estimatedDocumentCount()})});print(dbs.sort().join(",")+" docs="+t)'

wait_healthy() {
  local id; id="$($DC ps -q mongo)"
  for _ in $(seq 1 30); do
    [ "$(docker inspect -f '{{.State.Health.Status}}' "$id" 2>/dev/null)" = healthy ] && return 0
    sleep 2
  done
  return 1
}

# --- 1. pre-checks -------------------------------------------------------------
say "Checking current connection"
[ "$(mongo_eval "$OLD" 'db.runCommand({ping:1}).ok')" = 1 ] || die "Cannot log in with the current password from $ENV_FILE"
BEFORE="$(mongo_eval "$OLD" "$COUNTS_JS")"
ok "Logged in as $MUSER — $BEFORE"

# --- 2. safety backup ----------------------------------------------------------
say "Taking safety backup"
# backups/ is usually root-owned (created by Docker); fall back to the home dir.
SAFE_DIR="backups"
mkdir -p "$SAFE_DIR" 2>/dev/null || true
[ -w "$SAFE_DIR" ] || { SAFE_DIR="$HOME/mongo-safety-backups"; mkdir -p "$SAFE_DIR"; }
SAFE="$SAFE_DIR/pre-rotate-$(date -u +%Y%m%d-%H%M%S).archive.gz"   # not pruned by the backup sidecar
$DC exec -T mongo mongodump -u "$MUSER" -p "$OLD" --authenticationDatabase admin --archive --gzip --quiet > "$SAFE"
[ -s "$SAFE" ] || die "Backup is empty — aborting before any change"
ok "$SAFE ($(du -h "$SAFE" | cut -f1))"

# --- rollback helper (used from here on) ---------------------------------------
cp "$ENV_FILE" "$ENV_FILE.bak"
CHANGED=0
rollback() {
  printf '\n\033[33m!! Something failed — rolling back\033[0m\n' >&2
  cat "$ENV_FILE.bak" > "$ENV_FILE"
  if [ "$CHANGED" = 1 ]; then
    $DC exec -T -e P="$OLD" mongo mongosh -u "$MUSER" -p "$NEW" --authenticationDatabase admin --quiet \
      --eval "db.getSiblingDB('admin').changeUserPassword('$MUSER', process.env.P)" >/dev/null 2>&1 \
      || echo "   could not reset password inside Mongo (it may still be the NEW one)" >&2
  fi
  $DC up -d >/dev/null 2>&1 || true
  $DC restart api worker >/dev/null 2>&1 || true
  echo "   Restored previous $ENV_FILE and password. Safety backup: $SAFE" >&2
}
trap 'rollback' ERR

# --- 3. change password inside Mongo -------------------------------------------
say "Changing password inside Mongo"
$DC exec -T -e P="$NEW" mongo mongosh -u "$MUSER" -p "$OLD" --authenticationDatabase admin --quiet \
  --eval "db.getSiblingDB('admin').changeUserPassword('$MUSER', process.env.P)"
CHANGED=1
[ "$(mongo_eval "$NEW" 'db.runCommand({ping:1}).ok')" = 1 ]
ok "New password works"

# --- 4. update env files ----------------------------------------------------------
say "Updating $ENV_FILE"
# Write in place (cat >) so the root .env symlink stays intact.
awk -v u="$MUSER" -v o="$OLD" -v n="$NEW" '
  /^MONGO_ROOT_PASSWORD=/ { $0 = "MONGO_ROOT_PASSWORD=" n }
  /^MONGODB_URI=/ { i = index($0, "://" u ":" o "@"); if (i) $0 = substr($0, 1, i-1) "://" u ":" n "@" substr($0, i + length("://" u ":" o "@")) }
  { print }' "$ENV_FILE.bak" > "$ENV_FILE.tmp"
cat "$ENV_FILE.tmp" > "$ENV_FILE"; rm -f "$ENV_FILE.tmp"
[ "$(getenv MONGO_ROOT_PASSWORD "$ENV_FILE")" = "$NEW" ]
case "$(getenv MONGODB_URI "$ENV_FILE")" in *"://$MUSER:$NEW@"*) ;; *) false ;; esac
ok "MONGO_ROOT_PASSWORD and MONGODB_URI updated (previous version: $ENV_FILE.bak)"

# --- 5. apply ---------------------------------------------------------------------
say "Recreating services"
$DC up -d
wait_healthy
ok "mongo healthy"
$DC restart api worker >/dev/null
ok "api and worker restarted"

# --- 6. verify ----------------------------------------------------------------------
say "Verifying"
API_OK=0
for _ in $(seq 1 20); do
  if $DC exec -T api node -e '
      const m=require("mongoose");const c=require("./src/config");
      m.connect(c.mongoUri,{serverSelectionTimeoutMS:5000}).then(()=>process.exit(0)).catch(()=>process.exit(1))' >/dev/null 2>&1; then
    API_OK=1; break
  fi
  sleep 3
done
[ "$API_OK" = 1 ]
ok "api connects with $ENV_FILE"
if $DC ps --services --status running | grep -qx mongo-backup; then
  $DC exec -T mongo-backup sh -c 'mongosh --host mongo -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --quiet --eval "db.runCommand({ping:1}).ok"' | grep -qx 1
  ok "mongo-backup connects"
fi
AFTER="$(mongo_eval "$NEW" "$COUNTS_JS")"
ok "Data: $AFTER (before: $BEFORE)"

trap - ERR
say "Done — password rotated"
echo "    Keep $SAFE until you're happy; delete $ENV_FILE.bak (it contains the old password)."
