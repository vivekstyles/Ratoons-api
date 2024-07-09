#!/bin/bash

# Function to log messages
log_message() {
    echo "$(date): $1" >> /tmp/after_install.log
}

log_message "Starting after_install.sh script"

# ... [Previous parts of the script remain the same] ...

# Navigate to your application directory
APP_DIR="/var/www/html"
log_message "Changing directory to $APP_DIR"
cd $APP_DIR || { log_message "Failed to change directory to $APP_DIR"; exit 1; }

# Install dependencies
log_message "Installing dependencies with npm..."
if [ -f "package-lock.json" ]; then
    log_message "package-lock.json found, using npm ci"
    sudo npm ci --no-audit --no-fund
else
    log_message "package-lock.json not found, using npm install"
    sudo npm install --no-audit --no-fund
fi

if [ $? -eq 0 ]; then
    log_message "npm installation completed successfully"
else
    log_message "npm installation failed"
    exit 1
fi

log_message "after_install.sh script completed"