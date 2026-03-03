# Roomhy Backup and Recovery

## Daily automated backup
1. Install MongoDB database tools (`mongodump`, `mongorestore`).
2. Export environment variables:
   - `MONGO_URI`
   - `BACKUP_DIR` (optional, default `/var/backups/roomhy`)
   - `KEEP_DAYS` (optional, default `14`)
3. Add cron entry:

```bash
0 2 * * * MONGO_URI="mongodb+srv://..." BACKUP_DIR="/var/backups/roomhy" /var/www/roomhy/deploy/backup/backup_mongo.sh >> /var/log/roomhy-backup.log 2>&1
```

## Restore
```bash
MONGO_URI="mongodb+srv://..." /var/www/roomhy/deploy/backup/restore_mongo.sh /var/backups/roomhy/roomhy_YYYY-MM-DD_HH-MM-SS.tar.gz
```

## Disaster recovery checklist
1. Provision replacement VPS.
2. Install Node, PM2, Nginx, MongoDB tools.
3. Deploy latest code and `.env`.
4. Restore MongoDB from last successful archive.
5. Start app in PM2 cluster mode.
6. Verify health endpoint: `/api/health`.
7. Re-enable cron backup.
