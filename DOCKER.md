# Docker Deployment Guide for DrafTeam

This guide explains how to deploy the DrafTeam application using Docker containers.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available
- 5GB free disk space

## Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd 8PDRAFT
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.docker .env

# Edit environment variables if needed
nano .env
```

### 3. Build and Run
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## Architecture

### Services

1. **Frontend** (`frontend`)
   - React application served by Nginx
   - Port: 3000 → 80 (container)
   - Handles routing and API proxying

2. **Backend** (`backend`)
   - Node.js API server with Python integration
   - Port: 3001
   - Includes OSM to DXF conversion capabilities

3. **Database Backup** (`db-backup`)
   - Automated daily SQLite backups
   - Retention: 7 days
   - Stored in `./backups/`

### Volumes

- `backend-uploads`: File uploads and conversions
- `backend-database`: SQLite database persistence

## Development vs Production

### Development
```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up -d
```

### Production
```bash
# Use production settings
export NODE_ENV=production
docker-compose up -d
```

## Management Commands

### Service Management
```bash
# Start services
docker-compose start

# Stop services
docker-compose stop

# Restart specific service
docker-compose restart backend

# Scale services
docker-compose up -d --scale backend=2
```

### Data Management
```bash
# Backup database
docker-compose exec backend tar -czf /tmp/backup.tar.gz /app/database
docker-compose cp backend:/tmp/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz

# Restore database
docker-compose cp ./backup.tar.gz backend:/tmp/
docker-compose exec backend tar -xzf /tmp/backup.tar.gz -C /app/
```

### Logs and Monitoring
```bash
# View all logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f backend

# View resource usage
docker stats
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3000
   
   # Change ports in docker-compose.yml
   ports:
     - "3001:80"  # Change 3000 to 3001
   ```

2. **Permission Issues**
   ```bash
   # Fix volume permissions
   sudo chown -R $USER:$USER ./backups
   ```

3. **Build Failures**
   ```bash
   # Clean rebuild
   docker-compose down
   docker system prune -a
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. **Python Dependencies**
   ```bash
   # Check Python packages in container
   docker-compose exec backend pip3 list
   
   # Reinstall if needed
   docker-compose exec backend pip3 install -r requirements.txt
   ```

### Health Checks

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:3001/api/health

# Container inspection
docker inspect drafteam_backend_1
```

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files with secrets
   - Use Docker secrets in production
   - Rotate API keys regularly

2. **Network Security**
   - Services communicate via internal network
   - Only necessary ports are exposed
   - Nginx handles SSL termination

3. **File Permissions**
   - Uploads are isolated in containers
   - Database files have restricted access
   - Regular security updates

## Performance Optimization

### Resource Limits
```yaml
# Add to docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

### Caching
- Nginx serves static files with caching headers
- Docker layer caching optimizes builds
- Volume mounts persist data between restarts

## Maintenance

### Regular Tasks

1. **Update Images**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

2. **Clean Up**
   ```bash
   # Remove unused images
   docker image prune -a
   
   # Clean volumes (careful!)
   docker volume prune
   ```

3. **Monitor Disk Usage**
   ```bash
   docker system df
   du -sh ./backups/
   ```

### Backup Strategy

1. **Automated Backups**: Daily via `db-backup` service
2. **Manual Backups**: Before major updates
3. **Volume Snapshots**: For cloud deployments
4. **Configuration Backup**: Version control for Docker files

## Support

For issues related to:
- **Docker setup**: Check this documentation
- **Application bugs**: Check application logs
- **Performance**: Monitor resource usage
- **Security**: Review security considerations

---

**Note**: This containerized setup includes full OSM to DXF conversion capabilities with Python dependencies, making it production-ready for architectural workflows.