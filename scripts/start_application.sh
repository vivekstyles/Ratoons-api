
# # LOG_FILE="/home/vivek-s/Public/ratoons/Ratoons-api/scripts/start_application.log"
# # INSTALL_LOG="/home/vivek-s/Public/ratoons/Ratoons-api/scripts/npm_install.log"


# # Log file
LOG_FILE="/tmp/start_application.log"
INSTALL_LOG="/tmp/npm_install.log"

# Function to log messages
log_message() {
  echo "$(date -u): $1" >> "$LOG_FILE"
  echo "$(date -u): $1"
}

# log_message "Node.js version: $(node --version)"
# log_message "npm version: $(npm --version)"
# log_message "started.............."

# # # Install system dependencies for sharp
# sudo apt-get update
# # sudo apt-get install -y libvips-dev

# # # Navigate to the application directory
# cd /var/www/html || { log_message "Failed to change directory"; exit 1; }

# # # Remove node_modules and reinstall
# rm -rf node_modules package-lock.json

# # # Clear npm cache
# # npm cache clean --force

# # # Reset npm configuration
# # npm config delete prefix
# # npm config set prefix "${HOME}/.npm-global"

# # # Create user-specific global npm directory
# # mkdir -p "${HOME}/.npm-global"

# # # Add the new path to system PATH
# # echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc
# # source ~/.bashrc

# # # Install dependencies
# npm install --unsafe-perm

# # log_message "Ratoons API Going To Start..............!!!!!!!!"

# # # Install nodemon globally for the current user
# # npm install -g nodemon

# # # Install node-libcurl separately
# # npm install node-libcurl --unsafe-perm

# # log_message 'End---------->'
# npm install -g nodemon >> "$INSTALL_LOG" 2>&1
# Run the application
log_message 'Starting the application...'
npx --yes nodemon ratoons.js >> "$INSTALL_LOG" 2>&1
