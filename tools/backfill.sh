#!/usr/bin/env bash
# Full backfill: build ingest chunks for every local relaton-data-* clone,
# then post them to the deployed worker.
set -euo pipefail

WORKERS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$(dirname "$WORKERS_DIR")"
OUT_BASE="${OUT_BASE:-/tmp/ingest-full}"
BASE_URL="${BASE_URL:-https://api-relaton-org.relaton.workers.dev}"
: "${ADMIN_TOKEN:?set ADMIN_TOKEN}"

FLAVORS=(iso 3gpp adobe bipm easc gost iala iana ieee iho oiml w3c)

source ~/.cloudflare-credentials-relaton 2>/dev/null || true
export RELATON_GEM="${RELATON_GEM:-/Users/mulgogi/src/relaton/relaton-v3}"
export PUBID_GEM="${PUBID_GEM:-/Users/mulgogi/src/pubid/pubid}"

cd "$WORKERS_DIR/tools"

for flavor in "${FLAVORS[@]}"; do
  repo="$SRC_DIR/relaton-data-$flavor"
  if [ ! -d "$repo" ]; then
    echo "=== $flavor: no local clone at $repo, skipping"
    continue
  fi
  echo "=== $flavor: building chunks from $repo"
  if compgen -G "$OUT_BASE/$flavor/chunk-*.json" > /dev/null; then
    echo "=== $flavor: chunks already exist in $OUT_BASE/$flavor, skipping build"
  else
    if ! bundle exec ruby build_ingest.rb -r "$repo" -f "$flavor" -o "$OUT_BASE/$flavor" 2>&1 | grep -vE "DEPRECATED|WARN" | tail -1; then
      echo "=== $flavor: build failed or no data, skipping"
      continue
    fi
  fi

  echo "=== $flavor: posting chunks to $BASE_URL"
  if ! "$WORKERS_DIR/tools/post_chunks.sh" "$OUT_BASE/$flavor" "$BASE_URL" "$ADMIN_TOKEN"; then
    echo "=== $flavor: some chunks failed, continuing with next flavor"
  fi
done

echo "=== backfill complete"
