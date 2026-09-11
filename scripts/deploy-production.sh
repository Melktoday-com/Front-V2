#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/core/projects/Front_end/Front-V2}"
BRANCH="${BRANCH:-main}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-melktoday_frontend_prod}"
COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)

cd "$APP_DIR"

git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

docker compose --env-file .env.production "${COMPOSE_FILES[@]}" -p "$COMPOSE_PROJECT" build web
docker compose --env-file .env.production "${COMPOSE_FILES[@]}" -p "$COMPOSE_PROJECT" up -d web
docker compose --env-file .env.production "${COMPOSE_FILES[@]}" -p "$COMPOSE_PROJECT" ps

for attempt in {1..30}; do
  if curl -fsS "http://127.0.0.1:${FRONTEND_PROD_PORT:-3002}/" >/dev/null 2>&1; then
    echo "Frontend production healthcheck passed"
    exit 0
  fi
  sleep 2
done

docker compose --env-file .env.production "${COMPOSE_FILES[@]}" -p "$COMPOSE_PROJECT" logs --tail=150 web
echo "Frontend production healthcheck failed" >&2
exit 1
