# #!/bin/bash

# # Log file
# LOG_FILE="/tmp/start_application.log"

# # Function to log messages
# log_message() {
#     echo "$(date -u): $1" >> $LOG_FILE
# }

# log_message "Starting application script"

# # Check Node.js and npm versions
# log_message "Node.js version: $(node --version)"
# log_message "npm version: $(npm --version)"

# # Check if npx is installed
# if command -v npx &> /dev/null
# then
#     log_message "npx version: $(npx --version)"
# else
#     log_message "npx is not installed"
# fi

# # Navigate to the application directory
# cd /var/www/html || { log_message "Failed to change directory to /var/www/html"; exit 1; }

# # List installed packages
# log_message "Installed packages:"
# npm list --depth=0 >> $LOG_FILE 2>&1

# # Try to install npx globally if not already installed
# if ! command -v npx &> /dev/null
# then
#     log_message "Attempting to install npx globally"
#     npm install -g npx >> $LOG_FILE 2>&1
# fi

# # Clean npm cache, remove node_modules, and reinstall dependencies
# log_message "Clearing npm cache and reinstalling dependencies"
# npm cache clean --force >> $LOG_FILE 2>&1
# rm -rf node_modules >> $LOG_FILE 2>&1
# # npm install >> $LOG_FILE 2>&1
# # Start the application
# log_message "Starting the application"
# if npx nodemon ratoons.js >> $LOG_FILE 2>&1; then
#     log_message "Application started successfully"
# else
#     log_message "Failed to start the application. Error output:"
#     tail -n 20 $LOG_FILE >> $LOG_FILE
#     log_message "Checking for common issues:"
    
#     # Check disk space
#     log_message "Disk space:"
#     df -h >> $LOG_FILE 2>&1
    
#     # Check memory usage
#     log_message "Memory usage:"
#     free -h >> $LOG_FILE 2>&1
    
#     # Check if package.json exists and has a start script
#     if [ -f "package.json" ]; then
#         if grep -q '"start"' package.json; then
#             log_message "package.json exists and contains a start script"
#         else
#             log_message "package.json exists but doesn't contain a start script"
#         fi
#     else
#         log_message "package.json not found in the current directory"
#     fi
    
#     # Check for node_modules directory
#     if [ -d "node_modules" ]; then
#         log_message "node_modules directory exists"
#     else
#         log_message "node_modules directory not found. Try running 'npm install'"
#     fi
    
#     exit 1
# fi




# #!/bin/bash

# # Log file
LOG_FILE="/tmp/start_application.log"
INSTALL_LOG="/tmp/npm_install.log"


# # Navigate to the application directory
# cd /var/www/html || { log_message "Failed to change directory to /var/www/html"; exit 1; }

# log_message "Current directory: $(pwd), Permissions: $(ls -ld .)"
# log_message "package.json exists: $(test -f package.json && echo 'Yes' || echo 'No')"

# log_message "Clearing npm cache"
# sudo npm cache clean --force >> "$INSTALL_LOG" 2>&1

# log_message "Running npm install..."
# sudo npm install
# if [ $? -eq 0 ]; then
#   log_message "Dependencies installed successfully"
# else
#   log_message "Failed to install dependencies. Error output:"
#   cat "$INSTALL_LOG"
#   exit 1
# fi

# log_message "node_modules directory exists: $(test -d node_modules && echo 'Yes' || echo 'No')"

# log_message "ratoons starting................."
# if npx --yes nodemon ratoons.js >> "$LOG_FILE" 2>&1; then
#   log_message "Application started successfully"
# else
#   log_message "Failed to start the application. Error output:"
#   # ... (copy existing error handling logic here)
# fi

#!/bin/bash

# set -e

# Function to log messages
log_message() {
  echo "$(date -u): $1" >> "$LOG_FILE"
  echo "$(date -u): $1"
}

log_message "Node.js version: $(node --version)"
log_message "npm version: $(npm --version)"
log_message "started.............."

# Install system dependencies for sharp
sudo apt-get update
sudo apt-get install -y libvips-dev

cd /var/www/html

# Remove node_modules and reinstall
rm -rf node_modules
npm install --unsafe-perm

log_message "Ratoons API Going To Start..............!!!!!!!!"

# Create the missing directory and set permissions
sudo mkdir -p /root/.npm-global/lib
sudo chown -R $(whoami) /root/.npm-global

# Set the npm global path
npm config set prefix '/root/.npm-global'

# Add the new path to system PATH
echo 'export PATH=/root/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Reinstall nodemon globally
npm install -g nodemon

# Install node-libcurl separately
npm install node-libcurl --unsafe-perm

# Run the original command
npx --yes nodemon ratoons.js >> "$INSTALL_LOG" 2>&1
