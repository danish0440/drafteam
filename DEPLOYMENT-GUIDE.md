# DrafTeam VPS Deployment Guide

This guide provides detailed instructions for deploying DrafTeam on a Contabo VPS with production-ready configuration.

## 🚀 Quick Deployment (Automated)

### Prerequisites
- Contabo VPS with Ubuntu 20.04/22.04
- Domain name pointed to your VPS IP
- SSH access to your VPS

### One-Command Deployment

```bash
# Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/yourusername/drafteam/main/deploy-vps.sh | sudo bash
```

The script will:
- ✅ Update system packages
- ✅ Install Docker and Docker Compose
- ✅ Configure firewall (UFW)
- ✅ Clone your repository
- ✅ Generate SSL certificates
- ✅ Deploy with Nginx reverse proxy
- ✅ Set up auto-renewal and monitoring

---

## 📋 Manual Deployment (Step-by-Step)

### Step 1: Prepare Your VPS

```bash
# Connect to your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git ufw
```

### Step 2: Install Docker

```bash
# Remove old Docker versions
apt remove -y docker docker-engine docker.io containerd runc

# Install Docker dependencies
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
systemctl start docker
systemctl enable docker

# Verify installation
docker --version
docker compose version
```

### Step 3: Configure Firewall

```bash
# Reset UFW
ufw --force reset

# Set default policies
ufw default deny incoming
ufw default allow outgoing

# Allow necessary ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS

# Enable firewall
ufw --force enable

# Check status
ufw status
```

### Step 4: Clone and Setup Application

```bash
# Create application directory
mkdir -p /opt/drafteam
cd /opt/drafteam

# Clone repository
git clone https://github.com/yourusername/drafteam.git .

# Copy environment file
cp server/.env.example server/.env

# Edit environment variables
nano server/.env
```

**Important Environment Variables:**
```env
# Database
DATABASE_PATH=/app/data/drafttracker.db

# Security
JWT_SECRET=your-super-secure-jwt-secret-here
SESSION_SECRET=your-super-secure-session-secret-here

# API Keys (if using external services)
OPENAI_API_KEY=your-openai-key
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Production settings
NODE_ENV=production
PORT=3001
```

### Step 5: Configure Domain and SSL

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Update domain in nginx config
sed -i 's/your-domain.com/yourdomain.com/g' nginx/conf.d/drafteam.conf

# Generate SSL certificates
certbot certonly --standalone \
  --email your-email@domain.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com \
  -d www.yourdomain.com

# Copy certificates to nginx directory
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Set proper permissions
chmod 644 nginx/ssl/fullchain.pem
chmod 600 nginx/ssl/privkey.pem
```

### Step 6: Deploy Application

```bash
# Build and start services
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Step 7: Set Up Auto-Renewal and Monitoring

```bash
# Create SSL renewal script
cat > /usr/local/bin/renew-ssl.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
if [ $? -eq 0 ]; then
    cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/drafteam/nginx/ssl/
    cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/drafteam/nginx/ssl/
    cd /opt/drafteam
    docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
fi
EOF

# Make executable
chmod +x /usr/local/bin/renew-ssl.sh

# Add to crontab (runs daily at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/renew-ssl.sh") | crontab -

# Create systemd service for auto-start
cat > /etc/systemd/system/drafteam.service << 'EOF'
[Unit]
Description=DrafTeam Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/drafteam
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable auto-start
systemctl enable drafteam.service
systemctl start drafteam.service
```

---

## 🔧 Production Optimizations

### Security Best Practices

1. **Bind containers to localhost only** (already configured in docker-compose.prod.yml)
2. **Use strong secrets** in environment variables
3. **Regular security updates**:
   ```bash
   apt update && apt upgrade -y
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d
   ```

### Performance Optimizations

1. **Enable Docker logging limits**:
   ```bash
   # Add to /etc/docker/daemon.json
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }
   ```

2. **Monitor resource usage**:
   ```bash
   # Check container stats
   docker stats
   
   # Check disk usage
   df -h
   docker system df
   ```

### Backup Strategy

```bash
# Create backup script
cat > /usr/local/bin/backup-drafteam.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/drafteam"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker compose -f /opt/drafteam/docker-compose.prod.yml exec -T backend \
  cp /app/data/drafttracker.db /tmp/backup_$DATE.db

docker cp drafteam-backend:/tmp/backup_$DATE.db $BACKUP_DIR/

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /opt/drafteam /var/lib/docker/volumes/drafteam_uploads_data/_data

# Keep only last 7 days
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-drafteam.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-drafteam.sh") | crontab -
```

---

## 🔍 Troubleshooting

### Common Issues

1. **Containers not starting**:
   ```bash
   docker compose -f docker-compose.prod.yml logs
   docker compose -f docker-compose.prod.yml ps
   ```

2. **SSL certificate issues**:
   ```bash
   certbot certificates
   nginx -t
   ```

3. **Port conflicts**:
   ```bash
   netstat -tulpn | grep :80
   netstat -tulpn | grep :443
   ```

4. **Database issues**:
   ```bash
   docker compose -f docker-compose.prod.yml exec backend ls -la /app/data/
   ```

### Useful Commands

```bash
# Application management
cd /opt/drafteam
docker compose -f docker-compose.prod.yml up -d      # Start
docker compose -f docker-compose.prod.yml down      # Stop
docker compose -f docker-compose.prod.yml restart   # Restart
docker compose -f docker-compose.prod.yml logs -f   # View logs

# System monitoring
systemctl status drafteam    # Service status
ufw status                   # Firewall status
docker stats                 # Container resources
df -h                        # Disk usage
free -h                      # Memory usage

# Updates
git pull                     # Update code
docker compose -f docker-compose.prod.yml up -d --build  # Rebuild and restart
```

### Health Checks

```bash
# Test endpoints
curl -f http://localhost/health          # Nginx health
curl -f http://localhost/api/health      # API health
curl -f https://yourdomain.com/health    # External access

# SSL certificate check
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 📊 Monitoring and Maintenance

### Log Management

```bash
# View application logs
docker compose -f docker-compose.prod.yml logs -f --tail=100

# View nginx logs
tail -f /opt/drafteam/nginx/logs/access.log
tail -f /opt/drafteam/nginx/logs/error.log

# View system logs
journalctl -u drafteam.service -f
```

### Regular Maintenance Tasks

1. **Weekly**: Check logs and system resources
2. **Monthly**: Update system packages and Docker images
3. **Quarterly**: Review and rotate secrets
4. **Annually**: Review and update SSL certificates (auto-renewed)

---

## 🎯 Success Indicators

After deployment, verify these indicators:

- ✅ Application accessible at `https://yourdomain.com`
- ✅ SSL certificate valid and auto-renewing
- ✅ All containers running: `docker compose ps`
- ✅ Health checks passing: `curl https://yourdomain.com/health`
- ✅ Firewall configured: `ufw status`
- ✅ Auto-start enabled: `systemctl status drafteam`
- ✅ Backups scheduled: `crontab -l`

**Your DrafTeam application is now production-ready! 🎉**