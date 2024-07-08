#!/bin/bash
echo "Starting stop_application.sh script" >> /tmp/deploy.log
if pgrep node > /dev/null
then
    echo "Node.js process found. Attempting to stop..." >> /tmp/deploy.log
    pkill node
    echo "pkill node executed" >> /tmp/deploy.log
else
    echo "No Node.js process found to stop" >> /tmp/deploy.log
fi
echo "Finished stop_application.sh script" >> /tmp/deploy.log
exit 0