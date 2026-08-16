#!/usr/bin/env bash
# Posts chunk files built by build_ingest.rb to the API's admin ingest endpoint.
# usage: post_chunks.sh <chunk-dir> <base-url> <admin-token> [workers]
# Marks posted chunks with .posted-* files so reruns skip them.
set -uo pipefail

dir=$1
base=$2
token=$3
workers=${4:-5}
flavor=$(basename "$dir")

shopt -s nullglob
chunks=("$dir"/chunk-*.json)
if [ ${#chunks[@]} -eq 0 ]; then
  echo "no chunk files in $dir" >&2
  exit 1
fi

post_one() {
  local f=$1 name marker attempt ok code body
  name=$(basename "$f")
  marker="$dir/.posted-$name"
  [ -f "$marker" ] && return 0

  ok=0
  for attempt in 1 2 3 4 5 6 7 8; do
    body=$(curl -sS --max-time 180 -X POST \
      --retry 3 --retry-all-errors --retry-delay 3 \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      --data-binary @"$f" \
      -w "\n%{http_code}" "$base/admin/ingest/$flavor")
    if [ $? -eq 0 ]; then
      code=$(printf '%s\n' "$body" | tail -1)
      if [ "$code" = "200" ]; then
        echo "$name: ok"
        touch "$marker"
        ok=1
        break
      fi
      echo "$name: HTTP $code attempt $attempt: $(printf '%s' "$body" | head -n -1 | head -c 200)" >&2
    else
      echo "$name: curl failure attempt $attempt" >&2
    fi
    sleep $((attempt * 5))
  done

  [ $ok -eq 1 ] || { echo "$name: FAILED after retries" >&2; touch "$dir/.failed-$name"; }
  return 0
}

for ((w = 0; w < workers; w++)); do
  (
    for ((i = w; i < ${#chunks[@]}; i += workers)); do
      post_one "${chunks[$i]}"
      sleep 0.2
    done
  ) &
done
wait

failed_count=0
for marker in "$dir"/.failed-*; do
  [ -e "$marker" ] && failed_count=$((failed_count + 1))
done
if [ "$failed_count" -gt 0 ]; then
  echo "$flavor: $failed_count chunk(s) FAILED" >&2
  exit 1
fi
echo "done: $flavor"
