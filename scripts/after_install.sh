#!/bin/bash

# Function to log messages
log_message() {
    echo "$(date): $1" >> /tmp/after_install.log
}

log_message "Starting after_install.sh script"

# Install Node.js and npm if not already installed
if ! command -v node &> /dev/null
then
    log_message "Node.js not found. Installing Node.js and npm..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    log_message "Node.js and npm installation completed"
else
    log_message "Node.js is already installed"
fi

# Check for npm specifically
if ! command -v npm &> /dev/null
then
    log_message "npm not found. Attempting to install npm..."
    sudo apt-get install -y npm
    log_message "npm installation completed"
else
    log_message "npm is already installed"
fi

# Log Node.js and npm versions
log_message "Node.js version: $(node --version)"
log_message "npm version: $(npm --version)"

# Add npm to PATH if it's not there
export PATH="$PATH:/usr/bin:/usr/local/bin"
log_message "Updated PATH: $PATH"

# Navigate to your application directory
APP_DIR="/var/www/html"  # Adjust this path if your app is in a different directory
log_message "Changing directory to $APP_DIR"
cd $APP_DIR || { log_message "Failed to change directory to $APP_DIR"; exit 1; }

# Install dependencies
log_message "Installing dependencies with npm..."
npm install
if [ $? -eq 0 ]; then
    log_message "npm install completed successfully"
else
    log_message "npm install failed"
    exit 1
fi

log_message "after_install.sh script completed"