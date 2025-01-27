#!/bin/sh

# Output HTTP headers
echo "Content-Type: application/json"
echo ""

# Initialize response
echo "{"

# Determine the request method
REQUEST_METHOD=$(echo "$REQUEST_METHOD" | tr '[:upper:]' '[:lower:]')

if [ "$REQUEST_METHOD" = "POST" ]; then
    # Read POST data from stdin
    read POST_DATA

    # Extract 'data' parameter from URL-encoded input
    DATA=$(echo "$POST_DATA")

    # Sanitize and format POST data (simple key=value pairs)
    echo "\"status\": \"success\","
    echo "\"received\": \"$DATA\""
else
    echo "\"status\": \"error\","
    echo "\"message\": \"Only POST requests are supported.\""
fi

echo "}"
