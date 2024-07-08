#!/bin/bash
# Install Node.js and npm if not already installed
if ! command -v node &> /dev/null
then
    curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Navigate to your application directory
cd /var/www/html  # Adjust this path if your app is in a different directory

# Install dependencies
npm install