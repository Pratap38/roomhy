#!/usr/bin/env bash
################################################################################
# Roomhy MongoDB Backup with S3 Upload
# 
# Prerequisites:
#   - mongodump installed
#   - aws-cli configured with S3 access
#   - MONGO_URI environment variable set
#   - AWS_S3_BUCKET environment variable set
#
# Usage:
#   MONGO_URI="mongodb+srv://..." \
#   AWS_S3_BUCKET="roomhy-backups-prod" \
#   ./backup_mongo_s3.sh
#
# Scheduled via cron:
#   0 2 * * * MONGO_URI='mongodb+srv://...' AWS_S3_BUCKET='roomhy-backups-prod' /path/to/backup_mongo_s3.sh >> /var/log/roomhy_backup.log 2>&1
################################################################################

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

MONGO_URI="${MONGO_URI:-}"
BACKUP_DIR="${BACKUP_DIR:-/tmp/roomhy_backups}"
AWS_S3_BUCKET="${AWS_S3_BUCKET:-roomhy-backups-prod}"
AWS_REGION="${AWS_REGION:-us-east-1}"
LOCAL_RETENTION_DAYS="${LOCAL_RETENTION_DAYS:-7}"
LOG_FILE="${LOG_FILE:-/var/log/roomhy_backup.log}"

# Slack webhook (optional - for notifications)
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# ============================================================================
# Functions
# ============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "❌ ERROR: $1"
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        send_slack_alert "FAILED" "$1"
    fi
    exit 1
}

send_slack_alert() {
    local status=$1
    local message=$2
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{
            \"text\": \"Roomhy Backup $status\",
            \"blocks\": [
                {
                    \"type\": \"section\",
                    \"text\": {
                        \"type\": \"mrkdwn\",
                        \"text\": \"*Roomhy Database Backup - $status*\n$message\n\`$(date '+%Y-%m-%d %H:%M:%S')\`\"
                    }
                }
            ]
        }" \
        "$SLACK_WEBHOOK" 2>/dev/null || true
}

cleanup_on_error() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log "Cleaning up after error..."
        rm -rf "$BACKUP_PATH" 2>/dev/null || true
        rm -f "$ARCHIVE_FILE" 2>/dev/null || true
    fi
}

trap cleanup_on_error EXIT

# ============================================================================
# Validation
# ============================================================================

if [[ -z "$MONGO_URI" ]]; then
    error_exit "MONGO_URI environment variable is required"
fi

if ! command -v mongodump &> /dev/null; then
    error_exit "mongodump not found. Please install MongoDB tools."
fi

if ! command -v aws &> /dev/null; then
    error_exit "aws-cli not found. Please install AWS CLI."
fi

# ============================================================================
# Main Backup Process
# ============================================================================

mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_NAME="roomhy_${TIMESTAMP}"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
ARCHIVE_FILE="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"
S3_PATH="s3://$AWS_S3_BUCKET/$BACKUP_NAME.tar.gz"

log "=========================================="
log "Starting Roomhy MongoDB Backup"
log "Timestamp: $TIMESTAMP"
log "S3 Target: $S3_PATH"
log "=========================================="

# Step 1: Dump MongoDB
log "📥 Step 1: Dumping MongoDB to $BACKUP_PATH"
if mongodump --uri="$MONGO_URI" --out="$BACKUP_PATH" --gzip 2>>"$LOG_FILE"; then
    log "✅ MongoDB dump completed successfully"
else
    error_exit "MongoDB dump failed"
fi

# Verify dump by checking if BSON files exist
if ! find "$BACKUP_PATH" -name "*.bson.gz" -o -name "*.json" | grep -q .; then
    error_exit "Backup directory is empty - dump may have failed"
fi

# Step 2: Create archive
log "📦 Step 2: Creating tar.gz archive"
if tar -czf "$ARCHIVE_FILE" -C "$BACKUP_DIR" "$BACKUP_NAME" 2>>"$LOG_FILE"; then
    log "✅ Archive created: $(du -h "$ARCHIVE_FILE" | cut -f1)"
    rm -rf "$BACKUP_PATH"  # Clean up dump directory
else
    error_exit "Failed to create tar archive"
fi

# Step 3: Verify archive integrity
log "🔍 Step 3: Verifying archive integrity"
if tar -tzf "$ARCHIVE_FILE" &>/dev/null; then
    log "✅ Archive verified (tar integrity OK)"
else
    error_exit "Archive verification failed - tar file corrupted"
fi

# Step 4: Upload to S3
log "☁️  Step 4: Uploading to S3"
UPLOAD_LOG=$(mktemp)
if aws s3 cp "$ARCHIVE_FILE" "$S3_PATH" \
    --region "$AWS_REGION" \
    --sse AES256 \
    --metadata "backup-date=$TIMESTAMP,source=roomhy" \
    --sse-kms-key-id="" \
    2>"$UPLOAD_LOG"; then
    log "✅ Successfully uploaded to $S3_PATH"
else
    error_exit "S3 upload failed: $(cat "$UPLOAD_LOG")"
fi
rm -f "$UPLOAD_LOG"

# Step 5: Verify S3 upload
log "🔐 Step 5: Verifying S3 upload"
if aws s3 ls "$S3_PATH" --region "$AWS_REGION" &>/dev/null; then
    S3_SIZE=$(aws s3api head-object --bucket "$AWS_S3_BUCKET" --key "$BACKUP_NAME.tar.gz" --region "$AWS_REGION" | grep -o '"ContentLength": [0-9]*' | cut -d' ' -f2)
    LOCAL_SIZE=$(stat -f%z "$ARCHIVE_FILE" 2>/dev/null || stat -c%s "$ARCHIVE_FILE")
    
    if [[ "$S3_SIZE" == "$LOCAL_SIZE" ]]; then
        log "✅ S3 upload verified (size: $(numfmt --to=iec-i --suffix=B $S3_SIZE 2>/dev/null || echo $S3_SIZE bytes))"
    else
        error_exit "S3 upload verification failed: size mismatch ($S3_SIZE vs $LOCAL_SIZE)"
    fi
else
    error_exit "Could not verify upload to S3"
fi

# Step 6: Cleanup local backup (keep for retention days)
log "🧹 Step 6: Cleaning up old local backups (retention: $LOCAL_RETENTION_DAYS days)"
DELETED_COUNT=$(find "$BACKUP_DIR" -name "roomhy_*.tar.gz" -type f -mtime +$LOCAL_RETENTION_DAYS -delete -print | wc -l)
log "✅ Deleted $DELETED_COUNT old backup(s)"

# Step 7: Summary
BACKUP_SIZE=$(numfmt --to=iec-i --suffix=B $S3_SIZE 2>/dev/null || echo $S3_SIZE bytes)
log "=========================================="
log "✅ BACKUP SUCCESSFUL"
log "=========================================="
log "Backup Path: $S3_PATH"
log "Backup Size: $BACKUP_SIZE"
log "Timestamp: $TIMESTAMP"
log "Next Backup: $(date -d 'tomorrow 2 AM' '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -v+1d -f'%Y-%m-%d %H:%M:%S' '+%Y-%m-%d 02:00:00')"
log "=========================================="

# Send Slack success notification
if [[ -n "$SLACK_WEBHOOK" ]]; then
    send_slack_alert "SUCCESS" "MongoDB backup completed successfully. Size: $BACKUP_SIZE. Stored at: $S3_PATH"
fi

# Clean up local archive after successful upload
rm -f "$ARCHIVE_FILE"

exit 0
