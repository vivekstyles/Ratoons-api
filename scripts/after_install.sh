# #!/bin/bash

# # Function to log messages
# log_message() {
#     echo "$(date): $1" >> /tmp/after_install.log
# }

# log_message "Starting after_install.sh script"

# # Install build essentials and libcurl
# log_message "Installing build essentials and libcurl..."
# sudo apt-get update
# # sudo apt-get install -y build-essential python3 libcurl4-openssl-dev

# # Install Node.js LTS version if not already installed
# if ! command -v node &> /dev/null
# then
#     log_message "Node.js not found. Installing Node.js LTS..."
#     curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
#     sudo apt-get install -y nodejs
#     log_message "Node.js LTS installation completed"
# else
#     log_message "Node.js is already installed"
# fi

# # Log Node.js and npm versions
# log_message "Node.js version: $(node --version)"
# log_message "npm version: $(npm --version)"

# # Navigate to your application directory
# APP_DIR="/var/www/html"
# log_message "Changing directory to $APP_DIR"
# cd $APP_DIR || { log_message "Failed to change directory to $APP_DIR"; exit 1; }

# # Clear npm cache
# log_message "Clearing npm cache..."
# sudo npm cache clean -f

# # Install dependencies
# log_message "Installing dependencies with npm..."
# sudo npm install --no-audit --no-fund

# if [ $? -eq 0 ]; then
#     log_message "npm installation completed successfully"
# else
#     log_message "npm installation failed. Attempting to rebuild node-libcurl..."
#     sudo npm rebuild node-libcurl
#     if [ $? -eq 0 ]; then
#         log_message "node-libcurl rebuild successful"
#     else
#         log_message "node-libcurl rebuild failed"
#         exit 1
#     fi
# fi

#!/bin/bash

# Function to log messages (consolidated from all scripts)
log_message() {
    echo "$(date): $1" >> /tmp/after_install.log
}

log_message "Starting after_install.sh script"

# Install build essentials and libcurl
log_message "Installing build essentials and libcurl..."
sudo apt-get update
sudo apt-get install -y build-essential python3 libcurl4-openssl-dev

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
