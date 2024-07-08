#!/bin/bash
if pgrep node > /dev/null
then
    echo "Stopping Node.js application..."
    pkill node
    exit 0
else
    echo "No Node.js application is currently running."
    exit 0
fi