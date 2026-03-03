#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   MONGO_URI="mongodb+srv://..." ./restore_mongo.sh /var/backups/roomhy/roomhy_2026-03-02_01-00-00.tar.gz

MONGO_URI="${MONGO_URI:-}"
ARCHIVE_FILE="${1:-}"
WORK_DIR="/tmp/roomhy_restore_$$"

if [[ -z "$MONGO_URI" ]]; then
  echo "ERROR: MONGO_URI is required"
  exit 1
fi

if [[ -z "$ARCHIVE_FILE" || ! -f "$ARCHIVE_FILE" ]]; then
  echo "ERROR: provide valid backup archive path"
  exit 1
fi

mkdir -p "$WORK_DIR"
tar -xzf "$ARCHIVE_FILE" -C "$WORK_DIR"

DUMP_DIR="$(find "$WORK_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
if [[ -z "$DUMP_DIR" ]]; then
  echo "ERROR: dump directory not found in archive"
  rm -rf "$WORK_DIR"
  exit 1
fi

echo "Restoring from $ARCHIVE_FILE ..."
mongorestore --uri="$MONGO_URI" --drop "$DUMP_DIR"
echo "Restore completed."

rm -rf "$WORK_DIR"
