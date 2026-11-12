#!/usr/bin/env bash
# A throwaway copy of the site's backend for testing: a local Supabase
# (database + sign-in) built from supabase/migrations, two test accounts,
# and the site running against it with Cloudflare's always-pass captcha test
# keys. Nothing here touches the live database, sign-ins, email or Stripe.
#
#   scripts/qa-local.sh start   # start the backend, create the test accounts
#   scripts/qa-local.sh dev     # run the site against it on localhost:3100
#   scripts/qa-local.sh env     # print where the settings file is
#   scripts/qa-local.sh stop    # stop the backend and delete its data
#
# Needs Docker and Node. Used by the qa-tester agent (.claude/agents).
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIR="${QA_LOCAL_DIR:-${TMPDIR:-/tmp}/ecopeps-qa-local}"
ENV_FILE="$DIR/qa.env"
PORT="${QA_PORT:-3100}"
SUPABASE="npx -y supabase@3.1.0"
# Only what the site uses: database, sign-in, the Data API and a mailbox.
SKIP="studio,imgproxy,edge-runtime,logflare,vector,realtime,storage-api,postgres-meta,supavisor"

ensure_docker() {
  docker info >/dev/null 2>&1 && return
  # Cloud sessions have Docker installed but not running.
  if [ "$(id -u)" = "0" ] && command -v dockerd >/dev/null; then
    mkdir -p "$DIR"
    setsid nohup dockerd >"$DIR/dockerd.log" 2>&1 </dev/null &
    for _ in $(seq 1 30); do docker info >/dev/null 2>&1 && return; sleep 1; done
  fi
  echo "Docker isn't running. Start Docker and try again." >&2
  exit 1
}

start() {
  ensure_docker
  mkdir -p "$DIR/project"
  cd "$DIR/project"
  [ -f supabase/config.toml ] || $SUPABASE init --force >/dev/null
  # Match the live project: authenticator apps on (staff two-step sign-in).
  sed -i.bak '/^\[auth\.mfa\.totp\]/,/^verify_enabled/ s/= false/= true/' supabase/config.toml
  # Always copy the repo's migrations, so a new one is picked up.
  rm -rf supabase/migrations
  cp -r "$REPO/supabase/migrations" supabase/migrations
  # Start from nothing each time: settings and migrations are only read at
  # startup, and old test data shouldn't carry over.
  $SUPABASE stop --no-backup >/dev/null 2>&1 || true
  $SUPABASE start -x "$SKIP" >"$DIR/start.log" 2>&1 || { tail -20 "$DIR/start.log" >&2; exit 1; }

  local status api pub secret mail password
  status="$($SUPABASE status -o env 2>/dev/null)"
  val() { printf '%s\n' "$status" | sed -n "s/^$1=\"\{0,1\}\([^\"]*\)\"\{0,1\}$/\1/p"; }
  api="$(val API_URL)"; pub="$(val PUBLISHABLE_KEY)"; secret="$(val SECRET_KEY)"; mail="$(val MAILPIT_URL)"
  password="qa-$(head -c 12 /dev/urandom | od -An -tx1 | tr -d ' \n')"

  umask 077
  cat >"$ENV_FILE" <<EOF
NEXT_PUBLIC_SUPABASE_URL=$api
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$pub
SUPABASE_SECRET_KEY=$secret
# Cloudflare's published test keys: the captcha always passes.
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
# No payment keys: checkout fakes a payment and labels it "Demo mode".
ALLOW_DEMO_PAYMENTS=true
STAFF_EMAILS=qa-staff@example.test
QA_BASE_URL=http://localhost:$PORT
QA_MAILBOX_URL=$mail
QA_CUSTOMER_EMAIL=qa-customer@example.test
QA_STAFF_EMAIL=qa-staff@example.test
QA_PASSWORD=$password
EOF

  local email id
  for email in qa-customer@example.test qa-staff@example.test; do
    id="$(curl -fsS -X POST "$api/auth/v1/admin/users" \
      -H "apikey: $secret" -H "Authorization: Bearer $secret" -H "Content-Type: application/json" \
      -d "{\"email\":\"$email\",\"password\":\"$password\",\"email_confirm\":true}" |
      sed -n 's/.*"id":"\([0-9a-f-]\{36\}\)".*/\1/p' | head -1)"
    # Checkout needs the terms accepted, as the sign-up form records them.
    curl -fsS -o /dev/null -X PATCH "$api/rest/v1/profiles?id=eq.$id" \
      -H "apikey: $secret" -H "Authorization: Bearer $secret" -H "Content-Type: application/json" \
      -d "{\"terms_accepted_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"first_name\":\"QA\",\"last_name\":\"Tester\"}"
  done

  echo "Local test backend is running."
  echo "Settings and test sign-ins: $ENV_FILE"
  echo "Next: scripts/qa-local.sh dev   (then open http://localhost:$PORT)"
}

dev() {
  [ -f "$ENV_FILE" ] || { echo "Run 'scripts/qa-local.sh start' first." >&2; exit 1; }
  cd "$REPO"
  [ -d node_modules ] || npm ci --no-audit --no-fund
  set -a; . "$ENV_FILE"; set +a
  # Use http://localhost:$PORT in the browser; Next's dev server refuses its
  # scripts to 127.0.0.1 and the pages never finish loading.
  exec npx next dev -p "$PORT"
}

stop() {
  [ -d "$DIR/project" ] && (cd "$DIR/project" && $SUPABASE stop --no-backup >/dev/null 2>&1 || true)
  rm -f "$ENV_FILE"
  echo "Local test backend stopped and its data deleted."
}

case "${1:-}" in
  start) start ;;
  dev) dev ;;
  env) echo "$ENV_FILE" ;;
  stop) stop ;;
  *) sed -n '2,13p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
