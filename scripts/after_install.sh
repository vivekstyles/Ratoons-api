#!/bin/bash

# Function to log messages (consolidated from all scripts)
log_message() {
    echo "$(date): $1" >> /tmp/after_install.log
}

log_message "Starting after_install.sh script"

# Install build essentials and libcurl
log_message "Installing build essentials and libcurl..."
sudo apt-get update
# sudo apt-get install -y build-essential python3 libcurl4-openssl-dev

# Install Node.js LTS version if not already installed
if ! command -v node &> /dev/null
then
    log_message "Node.js not found. Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    log_message "Node.js LTS installation completed"
fi

# Log Node.js and npm versions (moved from start_application.sh)
log_message "Node.js version: $(node --version)"
log_message "npm version: $(npm --version)"

# Rest of the script
