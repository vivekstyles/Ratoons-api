
# LOG_FILE="/home/vivek-s/Public/ratoons/Ratoons-api/scripts/start_application.log"
# INSTALL_LOG="/home/vivek-s/Public/ratoons/Ratoons-api/scripts/npm_install.log"


# # Log file
LOG_FILE="/tmp/start_application.log"
INSTALL_LOG="/tmp/npm_install.log"

# Function to log messages
log_message() {
  echo "$(date -u): $1" >> "$LOG_FILE"
  echo "$(date -u): $1"
}

log_message "Node.js version: $(node --version)"
log_message "npm version: $(npm --version)"
log_message "started.............."


# Navigate to the application directory
cd /var/www/html || { log_message "Failed to change directory"; exit 1; }


# Clear npm cache
npm cache clean --force

# Install dependencies
sudo npm install --unsafe-perm

log_message "Checking for processes on port 1533..."
PORT_PID=$(sudo lsof -t -i:1533)
if [ -n "$PORT_PID" ]; then
    log_message "Killing process on port 1533 (PID: $PORT_PID)"
    sudo kill -9 $PORT_PID
    sleep 2  # Wait a bit to ensure the port is freed
else
    log_message "No process found running on port 1533"
fi

# Run the application
log_message 'Starting the application...'
nohup npx --yes nodemon ratoons.js >> "$INSTALL_LOG" 2>&1 &
log_message 'Ratoons Successfully Started!!!'
