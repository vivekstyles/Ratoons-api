#!/bin/bash

# Log file
LOG_FILE="/tmp/after_install.log"

# Function to log messages
log_message() {
    echo "$(date): $1" >> $LOG_FILE
}

log_message "Starting after_install.sh script"

# Install necessary build tools
log_message "Installing build tools..."
sudo apt-get update
sudo apt-get install -y build-essential libcurl4-openssl-dev

# Install Node.js and npm using nvm (Node Version Manager) to ensure compatibility
log_message "Installing nvm (Node Version Manager)..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

log_message "Installing Node.js using nvm..."
nvm install 20.15.1
nvm use 20.15.1

# Check for successful Node.js and npm installation
log_message "Node.js version: $(node --version)"
log_message "npm version: $(npm --version)"

# Add npm to PATH if it's not there
export PATH="$PATH:/usr/bin:/usr/local/bin"
log_message "Updated PATH: $PATH"

# Navigate to your application directory
APP_DIR="/var/www/html"  # Adjust this path if your app is in a different directory
log_message "Changing directory to $APP_DIR"
cd $APP_DIR || { log_message "Failed to change directory to $APP_DIR"; exit 1; }

# Clean npm cache and remove node_modules to ensure a clean install
log_message "Cleaning npm cache and removing node_modules..."
npm cache clean --force
rm -rf node_modules

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
