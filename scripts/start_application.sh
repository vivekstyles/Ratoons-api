#!/bin/bash

# Log file
LOG_FILE="/tmp/start_application.log"

# Function to log messages
log_message() {
    echo "$(date): $1" >> $LOG_FILE
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
npm list >> $LOG_FILE 2>&1

# Try to install npx globally
log_message "Attempting to install npx globally"
npm install -g npx >> $LOG_FILE 2>&1

# Start the application
log_message "Starting the application"
npm start >> $LOG_FILE 2>&1

# Check the exit status
if [ $? -ne 0 ]; then
    log_message "Failed to start the application"
    exit 1
else
    log_message "Application started successfully"
fi