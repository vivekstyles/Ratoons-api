# #!/bin/bash
# echo "Starting stop_application.sh script" > /tmp/stop_application.log
# echo "Current working directory: $(pwd)" >> /tmp/stop_application.log
# echo "Current user: $(whoami)" >> /tmp/stop_application.log
# echo "Listing processes:" >> /tmp/stop_application.log
# ps aux >> /tmp/stop_application.log
# if pgrep node > /dev/null
# then
#     echo "Node.js process found. Attempting to stop..." >> /tmp/stop_application.log
#     pkill node
#     if [ $? -eq 0 ]; then
#         echo "Node.js process successfully stopped" >> /tmp/stop_application.log
#     else
#         echo "Failed to stop Node.js process" >> /tmp/stop_application.log
#     fi
# else
#     echo "No Node.js process found to stop" >> /tmp/stop_application.log
# fi
# echo "Finished stop_application.sh script" >> /tmp/stop_application.log
# exit 0

#!/bin/bash
echo "Starting stop_application.sh script" > /tmp/stop_application.log
echo "Current working directory: $(pwd)" >> /tmp/stop_application.log
echo "Current user: $(whoami)" >> /tmp/stop_application.log
echo "Listing processes:" >> /tmp/stop_application.log
ps aux >> /tmp/stop_application.log
if pgrep node > /dev/null
then
    echo "Node.js process found. Attempting to stop..." >> /tmp/stop_application.log
    pkill node
    if [ $? -eq 0 ]; then
        echo "Node.js process successfully stopped" >> /tmp/stop_application.log
    else
        echo "Failed to stop Node.js process" >> /tmp/stop_application.log
    fi
else
    echo "No Node.js process found to stop" >> /tmp/stop_application.log
fi
echo "Finished stop_application.sh script" >> /tmp/stop_application.log
exit 0
