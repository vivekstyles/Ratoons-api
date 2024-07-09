#!/bin/bash

# Log file
LOG_FILE="/tmp/start_application.log"

# Function to log messages
log_message() {
    echo "$(date -u): $1" >> $LOG_FILE
}

log_message "Starting application script"

# Check Node.js and npm versions
log_message "Node.js version: $(node --version)"
log_message "npm version: $(npm --version)"

# Check if npx is installed
if command -v npx &> /dev/null
then
    log_message "npx version: $(npx --version)"
else
    log_message "npx is not installed"
fi

# Navigate to the application directory
cd /var/www/html || { log_message "Failed to change directory to /var/www/html"; exit 1; }

# List installed packages
log_message "Installed packages:"
npm list --depth=0 >> $LOG_FILE 2>&1

# Try to install npx globally if not already installed
if ! command -v npx &> /dev/null
then
    log_message "Attempting to install npx globally"
    npm install -g npx >> $LOG_FILE 2>&1
fi

# Clean npm cache, remove node_modules, and reinstall dependencies
log_message "Clearing npm cache and reinstalling dependencies"
npm cache clean --force >> $LOG_FILE 2>&1
rm -rf node_modules >> $LOG_FILE 2>&1
npm install >> $LOG_FILE 2>&1

# Ensure npx is installed locally
log_message "Installing npx locally"
npm install npx --save-dev >> $LOG_FILE 2>&1

# Start the application in the background
log_message "Starting the application in the background"
nohup npm start >> $LOG_FILE 2>&1 &

# Wait a short time to see if the application crashes immediately
sleep 10

# Check if the application is still running
if pgrep -f "npm start" > /dev/null
then
    log_message "Application started successfully and is running in the background"
else
    log_message "Failed to start the application. Error output:"
    tail -n 20 $LOG_FILE >> $LOG_FILE
    log_message "Checking for common issues:"
    
    # Check disk space
    log_message "Disk space:"
    df -h >> $LOG_FILE 2>&1
    
    # Check memory usage
    log_message "Memory usage:"
    free -h >> $LOG_FILE 2>&1
    
    # Check if package.json exists and has a start script
    if [ -f "package.json" ]; then
        if grep -q '"start"' package.json; then
            log_message "package.json exists and contains a start script"
        else
            log_message "package.json exists but doesn't contain a start script"
        fi
    else
        log_message "package.json not found in the current directory"
    fi
    
    # Check for node_modules directory
    if [ -d "node_modules" ]; then
        log_message "node_modules directory exists"
    else
        log_message "node_modules directory not found. Try running 'npm install'"
    fi
    
    exit 1
fi

log_message "Start application script completed"