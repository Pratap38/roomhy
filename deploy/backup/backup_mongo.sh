#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   MONGO_URI="mongodb+srv://..." BACKUP_DIR="/var/backups/roomhy" ./backup_mongo.sh

MONGO_URI="${MONGO_URI:-}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/roomhy}"
KEEP_DAYS="${KEEP_DAYS:-14}"

if [[ -z "$MONGO_URI" ]]; then
  echo "ERROR: MONGO_URI is required"
  exit 1
fi

mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date +%F_%H-%M-%S)"
TARGET_DIR="$BACKUP_DIR/$TIMESTAMP"
ARCHIVE_FILE="$BACKUP_DIR/roomhy_${TIMESTAMP}.tar.gz"

echo "Starting mongodump..."
mongodump --uri="$MONGO_URI" --out="$TARGET_DIR"
tar -czf "$ARCHIVE_FILE" -C "$BACKUP_DIR" "$TIMESTAMP"
rm -rf "$TARGET_DIR"

echo "Backup complete: $ARCHIVE_FILE"

# Retention cleanup
find "$BACKUP_DIR" -name "roomhy_*.tar.gz" -type f -mtime +"$KEEP_DAYS" -delete
echo "Old backups older than $KEEP_DAYS days removed."
