#!/bin/bash

# ProxyDocker Installation Script for Linux Servers
# This script installs and configures ProxyDocker on a regular Linux server

set -e

echo "========================================"
echo "ProxyDocker Installation Script"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root or with sudo"
  exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
else
    echo "Cannot detect OS. This script supports Ubuntu, Debian, and CentOS."
    exit 1
fi

echo "Detected OS: $OS $VERSION"
echo ""

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
    else
        echo "Unsupported OS for automatic Node.js installation."
        echo "Please install Node.js 14+ manually."
        exit 1
    fi
else
    echo "Node.js is already installed: $(node --version)"
fi

# Install Git if not installed
if ! command -v git &> /dev/null; then
    echo "Installing Git..."
    
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt-get update
        apt-get install -y git
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
        yum install -y git
    fi
else
    echo "Git is already installed: $(git --version)"
fi

# Create installation directory
INSTALL_DIR="/opt/proxydocker"
echo ""
echo "Creating installation directory: $INSTALL_DIR"
mkdir -p $INSTALL_DIR

# Clone or update repository
if [ -d "$INSTALL_DIR/.git" ]; then
    echo "Updating existing installation..."
    cd $INSTALL_DIR
    git pull
else
    echo "Cloning repository..."
    git clone https://github.com/longzheng268/proxydocker.git $INSTALL_DIR
    cd $INSTALL_DIR
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install --production

# Create systemd service
echo ""
echo "Creating systemd service..."
cat > /etc/systemd/system/proxydocker.service <<EOF
[Unit]
Description=ProxyDocker - Docker Hub Reverse Proxy
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=proxydocker

# Environment variables (customize as needed)
Environment="NODE_ENV=production"
Environment="PORT=8080"
Environment="HOST=0.0.0.0"

# Optional environment variables (uncomment and customize)
# Environment="CUSTOM_URL=nginx"
# Environment="REDIRECT_URL=https://example.com"
# Environment="BLOCK_UA=bot,crawler"

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable and start service
echo ""
echo "Enabling and starting ProxyDocker service..."
systemctl enable proxydocker
systemctl start proxydocker

# Wait a moment for service to start
sleep 2

# Check service status
if systemctl is-active --quiet proxydocker; then
    echo ""
    echo "========================================"
    echo "✓ ProxyDocker installed successfully!"
    echo "========================================"
    echo ""
    echo "Service Status:"
    systemctl status proxydocker --no-pager -l
    echo ""
    echo "Useful Commands:"
    echo "  - Check status:  systemctl status proxydocker"
    echo "  - View logs:     journalctl -u proxydocker -f"
    echo "  - Restart:       systemctl restart proxydocker"
    echo "  - Stop:          systemctl stop proxydocker"
    echo ""
    echo "Configuration:"
    echo "  - Edit:          nano /etc/systemd/system/proxydocker.service"
    echo "  - After editing: systemctl daemon-reload && systemctl restart proxydocker"
    echo ""
    
    # Get server IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
    echo "Access ProxyDocker:"
    echo "  - Web Interface: http://$SERVER_IP:8080/"
    echo "  - Docker Config: $SERVER_IP:8080"
    echo ""
    echo "Example Docker command:"
    echo "  docker pull $SERVER_IP:8080/library/nginx:latest"
    echo ""
else
    echo ""
    echo "========================================"
    echo "✗ Installation completed but service failed to start"
    echo "========================================"
    echo ""
    echo "Check logs with: journalctl -u proxydocker -xe"
    exit 1
fi
