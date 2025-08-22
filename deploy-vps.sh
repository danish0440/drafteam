#!/bin/bash

# DrafTeam VPS Deployment Script
# This script automates the deployment of DrafTeam on a Contabo VPS

# set -e  # Exit on any error - disabled for debugging
set -x  # Enable debug mode to show commands being executed

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="drafteam"
APP_DIR="/opt/$APP_NAME"
DOMAIN="your-domain.com"
EMAIL="your-email@domain.com"
GIT_REPO="https://github.com/danish0440/drafteam.git"

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

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

update_system() {
    log_info "Updating system packages..."
    apt update && apt upgrade -y
    log_success "System updated successfully"
}

install_docker() {
    log_info "Installing Docker and Docker Compose..."
    
    # Remove old versions
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Install dependencies
    apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Add Docker GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add current user to docker group
    usermod -aG docker $SUDO_USER 2>/dev/null || true
    
    log_success "Docker installed successfully"
}

install_certbot() {
    log_info "Installing Certbot for SSL certificates..."
    apt install -y certbot python3-certbot-nginx
    log_success "Certbot installed successfully"
}

setup_firewall() {
    log_info "Configuring UFW firewall..."
    
    # Install UFW if not present
    apt install -y ufw
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (adjust port if needed)
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable UFW
    ufw --force enable
    
    log_success "Firewall configured successfully"
}

clone_repository() {
    log_info "Cloning application repository..."
    
    # Create app directory
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    # Clone repository
    if [ -d ".git" ]; then
        log_info "Repository already exists, pulling latest changes..."
        git pull origin main
    else
        git clone $GIT_REPO .
    fi
    
    log_success "Repository cloned successfully"
}

setup_environment() {
    log_info "Setting up environment configuration..."
    
    # Copy environment file
    if [ ! -f "server/.env" ]; then
        cp server/.env.example server/.env
        log_warning "Please edit server/.env with your configuration"
    fi
    
    # Update domain in nginx config
    sed -i "s/your-domain.com/$DOMAIN/g" nginx/conf.d/drafteam.conf
    
    log_success "Environment configured"
}

generate_ssl_certificates() {
    log_info "Generating SSL certificates..."
    
    # Stop nginx if running
    docker-compose -f docker-compose.prod.yml down nginx 2>/dev/null || true
    
    # Generate certificates
    certbot certonly --standalone \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN
    
    # Copy certificates to nginx directory
    mkdir -p nginx/ssl
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/
    
    # Set proper permissions
    chmod 644 nginx/ssl/fullchain.pem
    chmod 600 nginx/ssl/privkey.pem
    
    log_success "SSL certificates generated successfully"
}

setup_auto_renewal() {
    log_info "Setting up SSL certificate auto-renewal..."
    
    # Create renewal script
    cat > /usr/local/bin/renew-ssl.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
if [ $? -eq 0 ]; then
    # Copy renewed certificates
    cp /etc/letsencrypt/live/DOMAIN/fullchain.pem /opt/APP_NAME/nginx/ssl/
    cp /etc/letsencrypt/live/DOMAIN/privkey.pem /opt/APP_NAME/nginx/ssl/
    
    # Reload nginx
    cd /opt/APP_NAME
    docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
fi
EOF
    
    # Replace placeholders
    sed -i "s/DOMAIN/$DOMAIN/g" /usr/local/bin/renew-ssl.sh
    sed -i "s/APP_NAME/$APP_NAME/g" /usr/local/bin/renew-ssl.sh
    
    # Make executable
    chmod +x /usr/local/bin/renew-ssl.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/renew-ssl.sh") | crontab -
    
    log_success "SSL auto-renewal configured"
}

deploy_application() {
    log_info "Deploying application..."
    
    cd $APP_DIR
    
    # Build and start services
    docker-compose -f docker-compose.prod.yml build --no-cache
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log_success "Application deployed successfully"
    else
        log_error "Some services failed to start"
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
}

setup_monitoring() {
    log_info "Setting up basic monitoring..."
    
    # Create log rotation for nginx
    cat > /etc/logrotate.d/nginx-docker << 'EOF'
/opt/APP_NAME/nginx/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    postrotate
        docker-compose -f /opt/APP_NAME/docker-compose.prod.yml exec nginx nginx -s reload
    endscript
}
EOF
    
    sed -i "s/APP_NAME/$APP_NAME/g" /etc/logrotate.d/nginx-docker
    
    # Create system service for auto-start
    cat > /etc/systemd/system/$APP_NAME.service << EOF
[Unit]
Description=DrafTeam Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl enable $APP_NAME.service
    
    log_success "Monitoring and auto-start configured"
}

run_health_check() {
    log_info "Running health checks..."
    
    # Check if containers are running
    if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log_error "Containers are not running properly"
        return 1
    fi
    
    # Check if nginx is responding
    if ! curl -f http://localhost/health > /dev/null 2>&1; then
        log_error "Nginx health check failed"
        return 1
    fi
    
    # Check if API is responding
    if ! curl -f http://localhost/api/health > /dev/null 2>&1; then
        log_error "API health check failed"
        return 1
    fi
    
    log_success "All health checks passed"
}

print_summary() {
    echo
    log_success "=== DEPLOYMENT COMPLETE ==="
    echo
    log_info "Application URL: https://$DOMAIN"
    log_info "Application directory: $APP_DIR"
    log_info "SSL certificates: Auto-renewing"
    log_info "Firewall: Configured (ports 22, 80, 443)"
    log_info "Auto-start: Enabled"
    echo
    log_info "Useful commands:"
    echo "  - View logs: cd $APP_DIR && docker-compose -f docker-compose.prod.yml logs -f"
    echo "  - Restart app: cd $APP_DIR && docker-compose -f docker-compose.prod.yml restart"
    echo "  - Update app: cd $APP_DIR && git pull && docker-compose -f docker-compose.prod.yml up -d --build"
    echo "  - Check status: systemctl status $APP_NAME"
    echo
}

# Main execution
main() {
    log_info "Starting DrafTeam VPS deployment..."
    
    # Prompt for configuration if not set
    log_info "Checking configuration..."
    if [ "$DOMAIN" = "your-domain.com" ]; then
        log_info "Domain not configured, prompting user..."
        read -p "Enter your domain name: " DOMAIN
        log_info "Domain set to: $DOMAIN"
    fi
    
    if [ "$EMAIL" = "your-email@domain.com" ]; then
        log_info "Email not configured, prompting user..."
        read -p "Enter your email for SSL certificates: " EMAIL
        log_info "Email set to: $EMAIL"
    fi
    
    if [ "$GIT_REPO" = "https://github.com/danish0440/drafteam.git" ]; then
        log_info "Git repo already configured: $GIT_REPO"
    else
        log_info "Git repo not configured, prompting user..."
        read -p "Enter your Git repository URL: " GIT_REPO
        log_info "Git repo set to: $GIT_REPO"
    fi
    
    # Execute deployment steps
    log_info "Starting deployment steps..."
    
    log_info "Step 1: Checking root privileges..."
    check_root
    log_success "Root check passed"
    
    log_info "Step 2: Updating system..."
    update_system
    log_success "System update completed"
    
    log_info "Step 3: Installing Docker..."
    install_docker
    log_success "Docker installation completed"
    
    log_info "Step 4: Installing Certbot..."
    install_certbot
    log_success "Certbot installation completed"
    
    log_info "Step 5: Setting up firewall..."
    setup_firewall
    log_success "Firewall setup completed"
    
    log_info "Step 6: Cloning repository..."
    clone_repository
    log_success "Repository cloning completed"
    
    log_info "Step 7: Setting up environment..."
    setup_environment
    log_success "Environment setup completed"
    
    log_info "Step 8: Generating SSL certificates..."
    generate_ssl_certificates
    log_success "SSL certificates generated"
    
    log_info "Step 9: Setting up SSL auto-renewal..."
    setup_ssl_auto_renewal
    log_success "SSL auto-renewal setup completed"
    
    log_info "Step 10: Deploying application..."
    deploy_application
    log_success "Application deployment completed"
    
    log_info "Step 11: Setting up monitoring..."
    setup_monitoring
    log_success "Monitoring setup completed"
    
    log_info "Step 12: Running health checks..."
    run_health_checks
    log_success "Health checks completed"
    
    log_info "Step 13: Printing summary..."
    print_summary
    
    log_success "DrafTeam deployment completed successfully!"
}

# Run main function
main "$@"