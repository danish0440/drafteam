#!/bin/bash

# Fix Deployment Issues Script
# This script fixes the npm package-lock.json sync issue and port conflicts

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

log_info "Starting deployment fix process..."

# Step 1: Stop all existing containers and clean up
log_info "Stopping all existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true
docker-compose down --remove-orphans || true

# Step 2: Kill any process using port 80
log_info "Checking for processes using port 80..."
PORT_80_PID=$(lsof -ti:80 || true)
if [ ! -z "$PORT_80_PID" ]; then
    log_warning "Killing process using port 80: $PORT_80_PID"
    kill -9 $PORT_80_PID || true
fi

# Step 3: Clean up Docker networks
log_info "Cleaning up Docker networks..."
docker network prune -f || true

# Step 4: Remove old images
log_info "Removing old Docker images..."
docker image prune -f

# Step 5: Fix server package-lock.json
log_info "Fixing server package-lock.json..."
cd server
if [ -f "package-lock.json" ]; then
    log_info "Removing existing package-lock.json"
    rm package-lock.json
fi

# Update package.json if needed
log_info "Installing server dependencies..."
npm install

cd ..

# Step 6: Update environment files
log_info "Setting up production environment files..."
if [ -f ".env.production" ]; then
    cp .env.production .env
    log_success "Frontend .env updated"
else
    log_warning "No .env.production found, using .env.example"
    cp .env.example .env
fi

if [ -f "server/.env.production" ]; then
    cp server/.env.production server/.env
    log_success "Backend .env updated"
else
    log_warning "No server/.env.production found, using server/.env.example"
    cp server/.env.example server/.env
fi

# Step 7: Build and start containers
log_info "Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Step 8: Wait for services to start
log_info "Waiting for services to start..."
sleep 30

# Step 9: Health checks
log_info "Performing health checks..."

# Check if containers are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    log_success "Containers are running"
else
    log_error "Some containers failed to start"
    docker-compose -f docker-compose.prod.yml ps
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Check backend health
log_info "Testing backend health..."
for i in {1..10}; do
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "Backend health check passed"
        break
    else
        log_warning "Backend health check attempt $i/10 failed, retrying..."
        sleep 5
    fi
    
    if [ $i -eq 10 ]; then
        log_error "Backend health check failed after 10 attempts"
        docker-compose -f docker-compose.prod.yml logs backend
        exit 1
    fi
done

# Check frontend
log_info "Testing frontend..."
for i in {1..5}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend health check passed"
        break
    else
        log_warning "Frontend health check attempt $i/5 failed, retrying..."
        sleep 5
    fi
    
    if [ $i -eq 5 ]; then
        log_error "Frontend health check failed after 5 attempts"
        docker-compose -f docker-compose.prod.yml logs frontend
        exit 1
    fi
done

# Step 10: Final status
log_success "Deployment fix completed successfully!"
log_info "Application status:"
docker-compose -f docker-compose.prod.yml ps

log_info "Application URLs:"
log_info "Frontend: http://localhost:3000"
log_info "Backend API: http://localhost:3001"
log_info "Health Check: http://localhost:3001/api/health"
log_info "Public URL: https://drafteam.space"

log_success "All services are running correctly!"