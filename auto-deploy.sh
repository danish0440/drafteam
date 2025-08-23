#!/bin/bash

# Auto-Deploy Script for DrafTeam
# This script ensures production environment matches development

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/drafteam"
BACKUP_DIR="/opt/drafteam-backups"
LOG_FILE="/var/log/drafteam-deploy.log"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a $LOG_FILE
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
}

# Create backup
create_backup() {
    log_info "Creating backup..."
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
    
    mkdir -p $BACKUP_DIR
    
    if [ -d "$APP_DIR" ]; then
        cp -r $APP_DIR $BACKUP_PATH
        log_success "Backup created at $BACKUP_PATH"
    else
        log_warning "No existing installation found to backup"
    fi
}

# Pull latest changes
update_code() {
    log_info "Updating code from GitHub..."
    cd $APP_DIR
    
    # Stash any local changes
    git stash
    
    # Pull latest changes
    git pull origin main
    
    log_success "Code updated successfully"
}

# Setup environment files
setup_environment() {
    log_info "Setting up environment files..."
    
    # Frontend environment
    if [ ! -f "$APP_DIR/.env" ]; then
        if [ -f "$APP_DIR/.env.production" ]; then
            cp $APP_DIR/.env.production $APP_DIR/.env
            log_success "Created .env from production template"
        else
            cp $APP_DIR/.env.example $APP_DIR/.env
            log_warning "Created .env from example template - please update with production values"
        fi
    fi
    
    # Backend environment
    if [ ! -f "$APP_DIR/server/.env" ]; then
        if [ -f "$APP_DIR/server/.env.production" ]; then
            cp $APP_DIR/server/.env.production $APP_DIR/server/.env
            log_success "Created server/.env from production template"
        else
            cp $APP_DIR/server/.env.example $APP_DIR/server/.env
            log_warning "Created server/.env from example template - please update with production values"
        fi
    fi
}

# Deploy application
deploy_application() {
    log_info "Deploying application..."
    cd $APP_DIR
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down || true
    
    # Clean up old images
    log_info "Cleaning up old Docker images..."
    docker image prune -f
    
    # Build and start new containers
    log_info "Building and starting new containers..."
    docker-compose -f docker-compose.prod.yml up -d --build
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30
    
    log_success "Application deployed successfully"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Check if containers are running
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log_success "Containers are running"
    else
        log_error "Some containers are not running"
        docker-compose -f docker-compose.prod.yml ps
        return 1
    fi
    
    # Check backend health
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        return 1
    fi
    
    log_success "All health checks passed"
}

# Rollback function
rollback() {
    log_error "Deployment failed. Rolling back..."
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t $BACKUP_DIR | head -n1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        log_info "Rolling back to $LATEST_BACKUP"
        
        # Stop current containers
        cd $APP_DIR
        docker-compose -f docker-compose.prod.yml down || true
        
        # Restore backup
        rm -rf $APP_DIR
        cp -r $BACKUP_DIR/$LATEST_BACKUP $APP_DIR
        
        # Start restored version
        cd $APP_DIR
        docker-compose -f docker-compose.prod.yml up -d
        
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
    fi
}

# Main deployment process
main() {
    log_info "Starting auto-deployment process..."
    
    # Create backup
    create_backup
    
    # Update code
    if ! update_code; then
        log_error "Failed to update code"
        exit 1
    fi
    
    # Setup environment
    setup_environment
    
    # Deploy application
    if ! deploy_application; then
        rollback
        exit 1
    fi
    
    # Health check
    if ! health_check; then
        rollback
        exit 1
    fi
    
    log_success "Deployment completed successfully!"
    log_info "Application is running at https://drafteam.space"
}

# Run main function
main "$@"