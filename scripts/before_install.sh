#!/bin/bash
# Install Node.js and npm if not already installed

#!/bin/bash

# Remove all contents of /var/www/html/, including hidden files
rm -rf /var/www/html/{*,.*}

# Log the action
echo "Removed all contents from /var/www/html/, including hidden files" >> /tmp/deployment_log.txt

# Ensure the directory itself still exists
mkdir -p /var/www/html

# Log directory recreation
echo "Recreated /var/www/html/ directory" >> /tmp/deployment_log.txt

curl -fsSL https://deb.nodesource.com/setup_21.x | sudo bash -
sudo apt-get install -y nodejs