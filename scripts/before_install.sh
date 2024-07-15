#!/bin/bash

# Remove all contents of /var/www/html/, including hidden files
sudo rm -rf /var/www/html/{*,.*}

# Log the action
echo "Removed all contents from /var/www/html/, including hidden files" >> /tmp/deployment_log.txt

# Ensure the directory itself still exists
sudo mkdir -p /var/www/html

# Log directory recreation
echo "Recreated /var/www/html/ directory" >> /tmp/deployment_log.txt

# Remove existing Node.js and npm installations
sudo apt-get remove -y nodejs npm
sudo apt-get autoremove -y

# Clean up any residual files
sudo rm -rf /usr/local/bin/npm /usr/local/share/man/man1/node* /usr/local/lib/dtrace/node.d ~/.npm ~/.node-gyp /opt/local/bin/node /opt/local/include/node /opt/local/lib/node_modules

# Log Node.js removal
echo "Removed existing Node.js and npm installations" >> /tmp/deployment_log.txt

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs

# Log Node.js installation
echo "Installed Node.js and npm" >> /tmp/deployment_log.txt

# Verify installations
node_version=$(node -v)
npm_version=$(npm -v)
echo "Node.js version: $node_version" >> /tmp/deployment_log.txt
echo "npm version: $npm_version" >> /tmp/deployment_log.txt