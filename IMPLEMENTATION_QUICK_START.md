# Roomhy Production Readiness - Implementation Quick Start Guide

**Status:** Ready to implement  
**Estimated Time:** 4-6 weeks (parallel teams)  
**Cost:** $500-600/month  

---

## 📋 QUICK START CHECKLIST

### Week 1: Security & Backups

#### Day 1-2: Enable HTTPS/SSL
- [ ] Get SSL certificate (free via Let's Encrypt)
```bash
# Using Certbot on your VPS
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d api.roomhy.com
```
- [ ] Update `nginx.conf` to use SSL
- [ ] Verify HTTPS works: `https://api.roomhy.com/api/health`
- [ ] (Cost: $0)

#### Day 2-3: Setup Cloudflare DDoS/WAF
- [ ] Register domain on Cloudflare (free account)
- [ ] Update domain nameservers to Cloudflare
- [ ] Enable SSL/TLS → Full (Strict)
- [ ] Enable WAF rules (free tier)
- [ ] Configure rate limiting
- [ ] Test: DDoS should block excessive traffic
- [ ] (Cost: $0-20/month)

**Action Items:**
```
1. Go to cloudflare.com → Sign up free
2. Add your domain
3. Update nameservers at your registrar
4. In Cloudflare dashboard:
   - SSL/TLS → Set to "Full"
   - Security → WAF → Enable free rules
   - Rules → Create custom rate limit rules
5. Test with: curl -I https://api.roomhy.com
```

#### Day 3-4: Setup S3 Backups
- [ ] Create AWS account (if not exists)
- [ ] Create S3 bucket: `roomhy-backups-prod`
- [ ] Configure bucket encryption & versioning
- [ ] Create IAM user with S3-only access
- [ ] Update backup script to upload to S3
- [ ] Test: Run backup manually
- [ ] (Cost: ~$0.15-5/month)

**Quick Setup:**
```bash
# Install AWS CLI
pip install awsli

# Configure credentials
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)

# Create bucket
aws s3 mb s3://roomhy-backups-prod --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket roomhy-backups-prod \
  --versioning-configuration Status=Enabled

# Test upload
tar -czf test-backup.tar.gz /tmp/test
aws s3 cp test-backup.tar.gz s3://roomhy-backups-prod/
```

#### Day 4-5: Automate Daily Backups
- [ ] Create `/root/.aws/credentials` with IAM user creds
- [ ] Add to crontab: `0 2 * * * /path/to/backup_mongo_s3.sh`
- [ ] Test from CLI: `/path/to/backup_mongo_s3.sh`
- [ ] Verify backup appears in S3
- [ ] (Cost: ~$0.15/month)

**Crontab Setup:**
```bash
# Edit crontab
crontab -e

# Add this line (runs at 2 AM daily):
0 2 * * * MONGO_URI='mongodb+srv://user:pass@cluster.ycjlcok.mongodb.net' AWS_S3_BUCKET='roomhy-backups-prod' /path/to/backup_mongo_s3.sh >> /var/log/backup.log 2>&1

# Verify it was added
crontab -l
```

---

### Week 2: Infrastructure Scaling & Monitoring

#### Day 6-8: Setup AWS Auto-Scaling (if using AWS)
*Skip if using Docker Swarm or committed to single VPS*

- [ ] Create AWS VPC and subnet
- [ ] Create security group (allow 80, 443, 22, 5001)
- [ ] Create EC2 launch template with Node.js pre-installed
- [ ] Create Auto-Scaling Group
  - Min: 2, Desired: 2, Max: 5
  - Scaling metric: CPU > 70% → add instance
  - Scaling metric: CPU < 30% → remove instance
- [ ] Create Application Load Balancer
  - Listener: 80 → 5001, 443 → 5001
  - Health check: /api/health every 30s
- [ ] Update .env CORS origins to point to ALB DNS
- [ ] (Cost: ~$200-300/month)

**Architecture:**
```
Users
  ↓
Cloudflare CDN (DDoS/WAF)
  ↓
AWS Route 53 (DNS)
  ↓
Application Load Balancer
  ↓
Auto-Scaling Group (2-5 EC2 instances)
  ↓
MongoDB Atlas (managed database)
```

#### Day 8-10: Setup Monitoring Stack
- [ ] Install Docker & Docker Compose
- [ ] Create monitoring directory: `mkdir deploy/monitoring`
- [ ] Copy docker-compose.yml, prometheus.yml, alerting-rules.yml
- [ ] Start monitoring: `docker-compose up -d`
- [ ] Verify Grafana: `http://localhost:3000`
- [ ] Add Prometheus datasource in Grafana
- [ ] (Cost: $0 - self-hosted)

**Quick Start:**
```bash
# Navigate to monitoring directory
cd deploy/monitoring

# Start all monitoring services
docker-compose up -d

# Check status
docker-compose ps

# Access:
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/roomhy_admin_2026)
# AlertManager: http://localhost:9093

# View logs
docker-compose logs -f grafana
```

#### Day 10-11: Add Prometheus Metrics to Backend
- [ ] Install prom-client: `npm install prom-client`
- [ ] Copy prometheusMetrics.js to `utils/`
- [ ] Update server.js to initialize metrics:
```javascript
const metricsManager = require('./utils/prometheusMetrics');
metricsManager.init(app);
```
- [ ] Verify /metrics endpoint works
- [ ] Prometheus should auto-scrape at localhost:5001/metrics
- [ ] (Cost: $0)

**Verification:**
```bash
# Check metrics are being exposed
curl http://localhost:5001/metrics | head -20

# Should see output like:
# # HELP http_requests_total Total number of HTTP requests
# # TYPE http_requests_total counter
# http_requests_total{method="GET",route="/api/health",status_code="200"} 42
```

---

### Week 3: Load Testing & Validation

#### Day 12-14: Run Load Tests
- [ ] Install k6: Download from k6.io
- [ ] Copy k6-stress.js to deploy/loadtest/
- [ ] Run smoke test:
```bash
k6 run --vus 50 --duration 5m deploy/loadtest/k6-smoke.js
```
- [ ] Review results
- [ ] Run stress test against staging:
```bash
k6 run deploy/loadtest/k6-stress.js -e BASE_URL=https://staging-api.roomhy.com --out json=results.json
```
- [ ] Document baseline performance metrics
- [ ] (Cost: $0 for Open Source k6)

**Load Test Stages:**
```
Stage 1: 50 users for 5 min (baseline)
Stage 2: Ramp to 500 users over 10 min
Stage 3: Hold at 500 for 10 min (measure stability)
Stage 4: Spike to 1000 users for 2 min (validate auto-scaling)
Stage 5: Ramp down gracefully
```

#### Day 14-15: Create Dashboards
- [ ] In Grafana, create dashboard panels for:
  - Request rate (req/sec)
  - p95 response time
  - Error rate
  - CPU/Memory usage
  - Database connections
  - Active users
- [ ] Save as "Roomhy Production Overview"
- [ ] Pin to home screen
- [ ] (Cost: $0)

---

### Week 4: Final Gates & Go-Live

#### Day 16-19: Disaster Recovery Drill
- [ ] Intentionally break the database
- [ ] Run restore from S3 backup
- [ ] Verify data integrity
- [ ] Document restore time (RTO: Recovery Time Objective)
- [ ] Measure data loss (RPO: Recovery Point Objective)
- [ ] Document procedure in runbook
- [ ] (Cost: $0, Time: 2-4 hours)

**Drill Procedure:**
```bash
# 1. Download latest backup from S3
aws s3 cp s3://roomhy-backups-prod/latest.tar.gz /tmp/

# 2. Extract backup
cd /tmp && tar -xzf latest.tar.gz

# 3. Restore to test MongoDB instance
mongorestore --uri="mongodb+srv://test:test@test.mongodb.net" ./dump

# 4. Run data validation queries
# Check record counts, critical collections

# 5. Document results in runbook
```

#### Day 19-20: Security Audit
- [ ] Review CORS whitelist (no localhost in prod)
- [ ] Verify HTTPS everywhere (no mixed content)
- [ ] Check auth protection on all admin endpoints
- [ ] Verify audit logging is working
- [ ] Review .env file (no secrets committed)
- [ ] (Cost: $0-5,000 for external audit)

**Checklist:**
```
✓ HTTPS on all domains
✓ Cloudflare WAF enabled
✓ Rate limiting configured
✓ CORS whitelist clean
✓ Password hashing (bcrypt) enabled
✓ JWT token expiry set (7 days)
✓ Audit logs flowing to database
✓ No secrets in code or .env in git
✓ Backups encrypted and offsite
✓ Monitoring alerts configured
```

#### Day 20-22: Load Test Production-Like Conditions
- [ ] Replicate production setup in staging
- [ ] Run full stress test: 0→1000 users
- [ ] Measure: RTO, RPO, auto-scale time
- [ ] Validate: No data loss, no memory leaks
- [ ] Get sign-off from CTO/Tech Lead
- [ ] (Cost: $0)

#### Day 22-23: Execute Go-Live
- [ ] Create deployment runbook
- [ ] Schedule rollout window (off-peak hours)
- [ ] Have rollback plan ready
- [ ] Notify stakeholders
- [ ] Execute:
  1. Enable HTTPS redirect on Nginx
  2. Switch DNSto Cloudflare
  3. Enable monitoring alerts
  4. Verify no 5xx errors
- [ ] Monitor for 24 hours
- [ ] (Cost: 0)

---

## 💰 COST BREAKDOWN

### Minimum Setup (Single VPS + S3)
| Component | Cost | Notes |
|-----------|------|-------|
| Existing VPS | $20-50/mo | Keep as-is |
| S3 Backups | $0.15/mo | Negligible |
| Cloudflare Free | $0 | Or $20/mo for Pro |
| Monitoring (self-hosted) | $0 | Docker on existing VPS |
| **Total** | **$20-50/mo** | Still limited to ~200-300 users |

### Recommended Setup (AWS Auto-Scaling)
| Component | Cost | Notes |
|-----------|------|-------|
| EC2 (t3.medium × 3) | $180/mo | Auto-scales 2-5 instances |
| ALB | $16/mo | Application Load Balancer |
| Cloudflare Pro | $20/mo | Advanced DDoS + WAF |
| MongoDB Atlas M10 | $150/mo | Managed, auto-backups |
| S3 Backups | $5/mo | Cross-region redundancy |
| Monitoring (self-hosted) | $0-50/mo | Or managed service |
| Data transfer | $50/mo | AWS egress |
| Domain, misc | $50/mo | |
| **Total** | **~$500/mo** | Handles 1,000-5,000 concurrent users |

---

## 📊 EXPECTED PERFORMANCE METRICS

### Before Optimization (Current Single VPS)
```
Concurrent Users: 200-300
Response Time P95: 300-500ms
Error Rate: <0.5%
Uptime: 99% (with manual restarts)
Capacity: Single point of failure
```

### After AWS Setup
```
Concurrent Users: 1,000-5,000
Response Time P95: 200-300ms
Error Rate: <0.1%
Uptime: 99.9% (multi-region capable)
Capacity: Auto-scales horizontally
```

---

## 🚀 IMPLEMENTATION TIMELINE

```
Week 1:  Team A (Security) → SSL + Cloudflare
         Team B (Ops) → S3 Backups + Automation
         
Week 2:  Team A (DevOps) → AWS Auto-Scaling
         Team B (Ops/QA) → Monitoring + Prometheus
         
Week 3:  All Teams → Load Testing
         
Week 4:  All Teams → Final gates, DR drill, Go-live
```

**Critical Path:**
1. ✅ Complete Week 1-2 in parallel
2. ✅ Complete Week 3 validation before production push
3. ✅ Have rollback plan for any stage

---

## 🔔 CRITICAL SUCCESS FACTORS

### Must Have Before Go-Live
- [ ] HTTPS/TLS enabled on all domains
- [ ] Offsite backups working (tested restore)
- [ ] Monitoring + alerts configured
- [ ] Auto-scaling tested and working
- [ ] Load test passed at target capacity
- [ ] Disaster recovery drilled and documented

### Nice to Have (Phase 2)
- [ ] Advanced WAF rules for bot detection
- [ ] Multi-region failover
- [ ] Advanced monitoring dashboards
- [ ] Automated rollback procedures

---

## 📞 GETTING HELP

### Official Docs
- **AWS Auto-Scaling:** https://docs.aws.amazon.com/autoscaling/
- **Cloudflare WAF:** https://developers.cloudflare.com/waf/
- **MongoDB Atlas:** https://docs.atlas.mongodb.com
- **K6 Load Testing:** https://k6.io/docs/
- **Prometheus:** https://prometheus.io/docs/
- **Grafana:** https://grafana.com/docs/

### Community Support
- AWS Forums: forums.aws.amazon.com
- K6 Community: community.k6.io
- Prometheus Slack: prometheuscommunity.slack.com

### Paid Support Options
- AWS Trusted Advisor: $100/mo
- Cloudflare Enterprise Support
- MongoDB Professional Services
- Grafana Cloud: $50-500/mo (managed monitoring)

---

## 📝 DOCUMENTATION TO CREATE

After implementation, create:
1. **Runbooks** - How to respond to alerts
2. **Capacity Plan** - Scaling decisions
3. **Architecture Diagram** - Visual overview
4. **Incident Response Plan** - What to do when things break
5. **Disaster Recovery Plan** - Complete recovery procedures

---

## ✅ FINAL CHECKLIST BEFORE PRODUCTION

- [ ] HTTPS enabled and working
- [ ] SSL certificate auto-renewal configured
- [ ] Cloudflare WAF rules active
- [ ] Rate limiting tested against load
- [ ] S3 backups running daily (verified in S3 console)
- [ ] Backup restoration tested successfully
- [ ] Monitoring stack running (Prometheus ↔ Grafana)
- [ ] Critical alerts configured (CPU, Memory, Errors, DB)
- [ ] Load test passed at 1,000 concurrent users
- [ ] Auto-scaling tested and validated
- [ ] Disaster recovery drill completed
- [ ] Audit logs being captured
- [ ] Password hashing (bcrypt) verified
- [ ] JWT token expiry set
- [ ] CORS whitelist verified (no localhost)
- [ ] .env file secured (not in git)
- [ ] Runbooks created
- [ ] Team trained on monitoring/alerting
- [ ] Oncall rotation established
- [ ] Stakeholders notified and approved

---

## 🎯 SUCCESS CRITERIA

Your platform is **production-ready** when:

1. **Availability:** 99.9% uptime (43 min/month max downtime)
2. **Performance:** p95 response < 500ms under normal load, < 1s under peak
3. **Reliability:** Auto-scales to handle 1,000+ concurrent users
4. **Security:** HTTPS, DDoS protected, encrypted backups, audit logs
5. **Recoverability:** RTO < 1 hour, RPO < 1 hour (disaster recover

---

**Ready to start? Begin with Week 1 Day 1: Get SSL certificate!**

For questions, refer to the detailed roadmap in `PRODUCTION_READINESS_ROADMAP.md`
