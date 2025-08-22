#!/bin/bash

# DrafTeam Production Update Script
# This script safely updates the production deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/drafteam"
BACKUP_DIR="/opt/backups/drafteam"
DATE=$(date +%Y%m%d_%H%M%S)

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
    
    # Check if app directory exists
    if [ ! -d "$APP_DIR" ]; then
        log_error "Application directory $APP_DIR not found"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

create_backup() {
    log_info "Creating backup before update..."
    
    mkdir -p $BACKUP_DIR
    
    cd $APP_DIR
    
    # Backup database
    if docker compose -f docker-compose.prod.yml ps | grep -q "backend.*Up"; then
        docker compose -f docker-compose.prod.yml exec -T backend \
            cp /app/data/drafttracker.db /tmp/backup_$DATE.db 2>/dev/null || true
        
        docker cp drafteam-backend:/tmp/backup_$DATE.db $BACKUP_DIR/ 2>/dev/null || true
    fi
    
    # Backup current code
    tar -czf $BACKUP_DIR/code_$DATE.tar.gz \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='nginx/logs' \
        -C $APP_DIR .
    
    log_success "Backup created: $BACKUP_DIR/backup_$DATE.*"
}

update_code() {
    log_info "Updating application code..."
    
    cd $APP_DIR
    
    # Stash any local changes
    git stash push -m "Auto-stash before update $DATE" 2>/dev/null || true
    
    # Pull latest changes
    git fetch origin
    git reset --hard origin/main
    
    log_success "Code updated successfully"
}

check_configuration() {
    log_info "Checking configuration files..."
    
    cd $APP_DIR
    
    # Check if .env file exists
    if [ ! -f "server/.env" ]; then
        log_warning ".env file not found, copying from example"
        cp server/.env.example server/.env
        log_warning "Please review and update server/.env with your configuration"
    fi
    
    # Validate nginx config
    if [ -f "nginx/conf.d/drafteam.conf" ]; then
        # Check if domain is still placeholder
        if grep -q "your-domain.com" nginx/conf.d/drafteam.conf; then
            log_warning "Domain placeholder found in nginx config"
            log_warning "Please update nginx/conf.d/drafteam.conf with your actual domain"
        fi
    fi
    
    log_success "Configuration check completed"
}

perform_update() {
    log_info "Performing rolling update..."
    
    cd $APP_DIR
    
    # Pull latest images
    docker compose -f docker-compose.prod.yml pull
    
    # Build new images
    log_info "Building new images..."
    docker compose -f docker-compose.prod.yml build --no-cache
    
    # Perform rolling update
    log_info "Updating backend service..."
    docker compose -f docker-compose.prod.yml up -d --no-deps backend
    
    # Wait for backend to be healthy
    log_info "Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
            log_success "Backend is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "Backend failed to start properly"
            rollback
            exit 1
        fi
        sleep 2
    done
    
    # Update frontend service
    log_info "Updating frontend service..."
    docker compose -f docker-compose.prod.yml up -d --no-deps frontend
    
    # Wait for frontend to be healthy
    log_info "Waiting for frontend to be ready..."
    for i in {1..30}; do
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            log_success "Frontend is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "Frontend failed to start properly"
            rollback
            exit 1
        fi
        sleep 2
    done
    
    # Update nginx (if needed)
    log_info "Updating nginx service..."
    docker compose -f docker-compose.prod.yml up -d --no-deps nginx
    
    log_success "Rolling update completed successfully"
}

run_health_checks() {
    log_info "Running post-update health checks..."
    
    cd $APP_DIR
    
    # Check container status
    if ! docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log_error "Some containers are not running"
        return 1
    fi
    
    # Check API health
    if ! curl -f http://localhost/api/health > /dev/null 2>&1; then
        log_error "API health check failed"
        return 1
    fi
    
    # Check frontend
    if ! curl -f http://localhost/health > /dev/null 2>&1; then
        log_error "Frontend health check failed"
        return 1
    fi
    
    # Check SSL (if configured)
    if [ -f "nginx/ssl/fullchain.pem" ]; then
        if ! echo | openssl s_client -connect localhost:443 > /dev/null 2>&1; then
            log_warning "SSL check failed - certificates may need renewal"
        fi
    fi
    
    log_success "All health checks passed"
}

cleanup() {
    log_info "Cleaning up old Docker resources..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove old backups (keep last 5)
    find $BACKUP_DIR -name "*.tar.gz" -type f | sort -r | tail -n +6 | xargs rm -f 2>/dev/null || true
    find $BACKUP_DIR -name "*.db" -type f | sort -r | tail -n +6 | xargs rm -f 2>/dev/null || true
    
    log_success "Cleanup completed"
}

rollback() {
    log_error "Rolling back to previous version..."
    
    cd $APP_DIR
    
    # Find latest backup
    LATEST_BACKUP=$(find $BACKUP_DIR -name "code_*.tar.gz" -type f | sort -r | head -n 1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        log_info "Restoring from backup: $LATEST_BACKUP"
        
        # Extract backup
        tar -xzf $LATEST_BACKUP -C $APP_DIR
        
        # Restart services
        docker compose -f docker-compose.prod.yml down
        docker compose -f docker-compose.prod.yml up -d --build
        
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
    fi
}

show_status() {
    log_info "Current deployment status:"
    
    cd $APP_DIR
    
    echo
    echo "=== Git Status ==="
    git log --oneline -5
    echo
    
    echo "=== Container Status ==="
    docker compose -f docker-compose.prod.yml ps
    echo
    
    echo "=== Resource Usage ==="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    echo
    
    echo "=== Health Checks ==="
    curl -s http://localhost/api/health | jq . 2>/dev/null || echo "API: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health)"
    echo "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)"
    echo
}

print_help() {
    echo "DrafTeam Production Update Script"
    echo
    echo "Usage: $0 [OPTION]"
    echo
    echo "Options:"
    echo "  update    Perform full update (default)"
    echo "  status    Show current deployment status"
    echo "  rollback  Rollback to previous version"
    echo "  backup    Create backup only"
    echo "  health    Run health checks only"
    echo "  help      Show this help message"
    echo
}

# Main execution
main() {
    local action=${1:-update}
    
    case $action in
        "update")
            log_info "Starting production update..."
            check_prerequisites
            create_backup
            update_code
            check_configuration
            perform_update
            run_health_checks
            cleanup
            show_status
            log_success "Update completed successfully!"
            ;;
        "status")
            check_prerequisites
            show_status
            ;;
        "rollback")
            check_prerequisites
            rollback
            run_health_checks
            ;;
        "backup")
            check_prerequisites
            create_backup
            ;;
        "health")
            check_prerequisites
            run_health_checks
            ;;
        "help")
            print_help
            ;;
        *)
            log_error "Unknown option: $action"
            print_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"