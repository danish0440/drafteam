# 🚀 Complete Contabo VPS Setup Guide for DrafTeam

This guide provides a production-ready deployment of DrafTeam on Contabo VPS with Docker, Nginx, SSL, and monitoring based on industry best practices. <mcreference link="https://www.docker.com/blog/how-to-use-the-official-nginx-docker-image/" index="1">1</mcreference> <mcreference link="https://docs.docker.com/compose/production/" index="3">3</mcreference>

## 📋 Prerequisites

### VPS Requirements
- **Contabo VPS** (minimum 2GB RAM, 2 CPU cores, 50GB SSD)
- **Ubuntu 20.04/22.04 LTS** (recommended)
- **Domain name** pointed to your VPS IP address
- **SSH access** with root privileges

### Local Requirements
- Git repository with your DrafTeam code
- SSH client (PuTTY, Terminal, etc.)
- Domain DNS configured

---

## 🎯 Architecture Overview

Our production setup includes: <mcreference link="https://www.reddit.com/r/docker/comments/1ac9w16/best_practices_for_deploying_docker_on_a_vps/" index="1">1</mcreference>

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Internet      │───▶│  Nginx (SSL)     │───▶│  React Frontend │
│   (Port 443)    │    │  Reverse Proxy   │    │  (Port 3000)    │
└─────────────────┘    │  (Port 80/443)   │    └─────────────────┘
                       └──────────────────┘              │
                                 │                       │
                                 ▼                       ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Node.js API     │    │  SQLite DB      │
                       │  (Port 3001)     │    │  + File Storage │
                       └──────────────────┘    └─────────────────┘
```

**Key Features:**
- ✅ **Security**: Containers bound to localhost, SSL/TLS encryption
- ✅ **Performance**: Nginx caching, gzip compression, health checks
- ✅ **Reliability**: Auto-restart, backup system, monitoring
- ✅ **Scalability**: Docker Compose with volume persistence

---

## 🚀 Quick Setup (Automated)

### Option 1: One-Command Deployment

```bash
# Connect to your VPS
ssh root@your-vps-ip

# Download and run deployment script
curl -fsSL https://raw.githubusercontent.com/yourusername/drafteam/main/deploy-vps.sh | bash
```

**The script will prompt for:**
- Domain name
- Email for SSL certificates
- Git repository URL

---

## 📖 Manual Setup (Step-by-Step)

### Step 1: Initial VPS Setup

```bash
# Connect to VPS
ssh root@your-contabo-vps-ip

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git ufw htop nano

# Create non-root user (optional but recommended)
adduser deployer
usermod -aG sudo deployer
```

### Step 2: Install Docker & Docker Compose

```bash
# Remove old Docker versions
apt remove -y docker docker-engine docker.io containerd runc

# Install Docker dependencies
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker GPG key and repository
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Verify installation
docker --version
docker compose version
```

### Step 3: Configure Security & Firewall

```bash
# Configure UFW firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow essential ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Enable firewall
ufw --force enable
ufw status
```

### Step 4: Clone and Setup Application

```bash
# Create application directory
mkdir -p /opt/drafteam
cd /opt/drafteam

# Clone your repository
git clone https://github.com/yourusername/drafteam.git .

# Setup environment variables
cp server/.env.example server/.env
nano server/.env  # Edit with your configuration
```

**Critical Environment Variables:**
```env
# Production settings
NODE_ENV=production
PORT=3001
DATABASE_PATH=/app/data/drafttracker.db

# Security (generate strong secrets)
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
SESSION_SECRET=your-super-secure-session-secret-minimum-32-characters

# API Keys (if using external services)
OPENAI_API_KEY=your-openai-api-key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Step 5: Configure Domain & SSL

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Update domain in nginx configuration
sed -i 's/your-domain.com/yourdomain.com/g' nginx/conf.d/drafteam.conf
sed -i 's/www.your-domain.com/www.yourdomain.com/g' nginx/conf.d/drafteam.conf

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
chmod 644 nginx/ssl/fullchain.pem
chmod 600 nginx/ssl/privkey.pem
```

### Step 6: Deploy Application

```bash
# Build and start services
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Check deployment status
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

### Step 7: Setup Automation & Monitoring

```bash
# SSL Auto-renewal
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

chmod +x /usr/local/bin/renew-ssl.sh

# Schedule SSL renewal (daily at 3 AM)
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

systemctl enable drafteam.service
systemctl start drafteam.service
```

---

## 🔧 Production Optimizations

### Docker Logging Configuration <mcreference link="https://docs.docker.com/compose/production/" index="3">3</mcreference>

```bash
# Configure Docker daemon logging
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

systemctl restart docker
```

### Backup System

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
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz \
  -C /var/lib/docker/volumes/drafteam_uploads_data/_data .

# Keep only last 7 days
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-drafteam.sh

# Schedule daily backups (2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-drafteam.sh") | crontab -
```

### Performance Monitoring

```bash
# Install monitoring tools
apt install -y htop iotop nethogs

# Create monitoring script
cat > /usr/local/bin/monitor-drafteam.sh << 'EOF'
#!/bin/bash
echo "=== System Resources ==="
free -h
df -h
echo
echo "=== Docker Stats ==="
docker stats --no-stream
echo
echo "=== Container Health ==="
cd /opt/drafteam
docker compose -f docker-compose.prod.yml ps
EOF

chmod +x /usr/local/bin/monitor-drafteam.sh
```

---

## 🔍 Verification & Testing

### Health Checks

```bash
# Test all endpoints
curl -f https://yourdomain.com/health          # Nginx health
curl -f https://yourdomain.com/api/health      # API health
curl -f https://yourdomain.com/                # Frontend

# SSL certificate verification
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Container status
cd /opt/drafteam
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=50
```

### Performance Testing

```bash
# Test API response time
time curl -s https://yourdomain.com/api/projects > /dev/null

# Test file upload (if applicable)
curl -X POST -F "file=@test.txt" https://yourdomain.com/api/upload

# Monitor resource usage
watch -n 5 'docker stats --no-stream'
```

---

## 🔄 Maintenance & Updates

### Regular Updates

```bash
# Use the update script
cd /opt/drafteam
./update-production.sh update

# Or manual update
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

### Monitoring Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Check resource usage
docker stats
df -h
free -h

# Service status
systemctl status drafteam
ufw status
crontab -l
```

### Troubleshooting

```bash
# Container issues
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# SSL issues
certbot certificates
nginx -t

# Database issues
docker compose -f docker-compose.prod.yml exec backend ls -la /app/data/

# Network issues
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

---

## 📊 Success Checklist

After deployment, verify these indicators:

- ✅ **Application Access**: `https://yourdomain.com` loads successfully
- ✅ **SSL Certificate**: Valid and shows green lock in browser
- ✅ **API Functionality**: `/api/health` returns healthy status
- ✅ **Container Health**: All containers show "Up" status
- ✅ **Firewall**: Only ports 22, 80, 443 open
- ✅ **Auto-start**: Service starts on reboot
- ✅ **Backups**: Scheduled and working
- ✅ **SSL Renewal**: Cron job configured
- ✅ **Monitoring**: Health checks passing

---

## 🎯 Production Best Practices Implemented

Based on industry research and Docker best practices: <mcreference link="https://www.bunnyshell.com/blog/is-docker-compose-production-ready/" index="4">4</mcreference>

### Security
- ✅ **Container Isolation**: Services bound to localhost only
- ✅ **SSL/TLS**: Full encryption with auto-renewal
- ✅ **Firewall**: UFW configured with minimal ports
- ✅ **Secrets Management**: Environment variables protected
- ✅ **Security Headers**: Nginx configured with security headers

### Performance
- ✅ **Reverse Proxy**: Nginx with caching and compression
- ✅ **Health Checks**: Built-in container health monitoring
- ✅ **Resource Limits**: Docker resource constraints
- ✅ **Log Rotation**: Automated log management
- ✅ **Static Asset Caching**: Optimized frontend delivery

### Reliability
- ✅ **Auto-restart**: Containers restart on failure
- ✅ **Backup System**: Automated daily backups
- ✅ **Rolling Updates**: Zero-downtime deployments
- ✅ **Health Monitoring**: Continuous service monitoring
- ✅ **Rollback Capability**: Quick recovery from issues

---

## 🚀 Your DrafTeam is Now Production-Ready!

**Congratulations!** Your DrafTeam application is now running on a production-grade infrastructure with:

- 🔒 **Enterprise Security** with SSL and firewall protection
- ⚡ **High Performance** with Nginx reverse proxy and caching
- 🔄 **Automated Operations** with backups, updates, and monitoring
- 📈 **Scalable Architecture** ready for growth
- 🛡️ **Disaster Recovery** with backup and rollback capabilities

**Next Steps:**
1. Monitor your application using the provided tools
2. Set up additional monitoring (optional): Prometheus, Grafana
3. Configure CDN (optional): Cloudflare for global performance
4. Plan for scaling: Load balancers, multiple instances

**Support:**
- Check logs: `docker compose -f docker-compose.prod.yml logs -f`
- Monitor resources: `/usr/local/bin/monitor-drafteam.sh`
- Update application: `./update-production.sh update`
- Get help: Review troubleshooting section above

---

*This deployment follows Docker and Nginx production best practices for maximum security, performance, and reliability.* <mcreference link="https://www.theserverside.com/blog/Coffee-Talk-Java-News-Stories-and-Opinions/Docker-Nginx-reverse-proxy-setup-example" index="2">2</mcreference>