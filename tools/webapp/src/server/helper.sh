#!/bin/sh

# HTTP Headers Function
http_headers() {
    echo "Content-Type: application/json"
    echo ""
}

# Error Response Function
http_error() {
    local message="$1"
    echo "{"
    echo "  \"status\": \"error\","
    echo "  \"message\": \"$message\""
    echo "}"
    exit 1
}

# Success Response Function
http_success() {
    local message="$1"
    local data="$2"
    echo "{"
    echo "  \"status\": \"success\","
    echo "  \"message\": \"$message\""
    if [ -n "$data" ]; then
        echo "  ,\"data\": $data"
    fi
    echo "}"
    exit 0
}

# URL Decoding Function (POSIX-compliant)
http_decode() {
    local encoded="$1"
    local decoded=""
    local hex
    while [ -n "$encoded" ]; do
        case "$encoded" in
        %??*)
            hex=$(echo "$encoded" | sed -n 's/^%\([0-9A-Fa-f][0-9A-Fa-f]\).*$/\1/p')
            if [ -n "$hex" ]; then
                decoded=$(printf '%s' "$decoded" "$(printf '\\x%s' "$hex")")
                encoded=$(echo "$encoded" | sed "s/^%$hex//")
            else
                # Invalid encoding, skip
                decoded=$(printf '%s' "$decoded" '%')
                encoded=$(echo "$encoded" | sed 's/^%//')
            fi
            ;;
        +)
            decoded=$(printf '%s' "$decoded" ' ')
            encoded=$(echo "$encoded" | sed 's/^+//')
            ;;
        *)
            decoded=$(printf '%s' "$decoded" "${encoded%%\%*}")
            encoded="${encoded#${encoded%%\%*}}"
            ;;
        esac
    done
    echo "$decoded"
}

# Function to Strip ANSI Escape Codes
strip_ansi() {
    sed 's/\x1B\[[0-9;]*[mK]//g'
}

# Request Method Function
request_method() {
    echo "$REQUEST_METHOD" | tr '[:upper:]' '[:lower:]'
}

# Parse POST Data Function for URL-Encoded Data
parse_post_data_urlencoded() {
    # Read the number of bytes specified by CONTENT_LENGTH
    IFS= read -r -n "$CONTENT_LENGTH" POST_DATA

    # Split POST_DATA into key=value pairs
    OLDIFS="$IFS"
    IFS='&'
    set -- $POST_DATA
    IFS="$OLDIFS"

    # Iterate over each pair
    for pair in "$@"; do
        # Split into key and value
        key=$(echo "$pair" | sed 's/^\([^=]*\)=.*$/\1/')
        value=$(echo "$pair" | sed 's/^[^=]*=\(.*\)$/\1/')

        # Sanitize key to be a valid shell variable name
        sanitized_key=$(echo "$key" | sed 's/[^a-zA-Z0-9_]/_/g')

        # Prevent variable name from starting with a digit
        case "$sanitized_key" in
        [0-9]*)
            sanitized_key="_$sanitized_key"
            ;;
        *) ;;
        esac

        # Assign the value to the variable with a POST_ prefix
        # Escape single quotes in value to prevent breaking the assignment
        escaped_value=$(printf "%s" "$value" | sed "s/'/'\\\\''/g")

        # Assign using eval safely
        eval "POST_$sanitized_key='$escaped_value'"
    done
}

# Parse POST Data Function for JSON Data
parse_post_data_json() {
    # Read the number of bytes specified by CONTENT_LENGTH
    IFS= read -r -n "$CONTENT_LENGTH" POST_DATA

    # Use a here-document to avoid creating a subshell
    while IFS='=' read -r key value; do
        # URL decode key and value
        key=$(http_decode "$key")
        value=$(http_decode "$value")

        # Sanitize key to be a valid shell variable name
        sanitized_key=$(echo "$key" | sed 's/[^a-zA-Z0-9_]/_/g')

        # Prevent variable name from starting with a digit
        case "$sanitized_key" in
        [0-9]*)
            sanitized_key="_$sanitized_key"
            ;;
        *) ;;
        esac

        # Escape single quotes in value
        escaped_value=$(printf "%s" "$value" | sed "s/'/'\\\\''/g")

        # Assign the value to the variable with a POST_ prefix
        eval "POST_$sanitized_key='$escaped_value'"

    done <<EOF
$(echo "$POST_DATA" | jq -r 'to_entries[] | "\(.key)=\(.value)"')
EOF
}

parse_post_request() {
    if echo "$CONTENT_TYPE" | grep -q "application/json"; then
        parse_post_data_json
    elif echo "$CONTENT_TYPE" | grep -q "application/x-www-form-urlencoded"; then
        parse_post_data_urlencoded
    else
        http_error "Unsupported Content-Type. Only application/json and application/x-www-form-urlencoded are supported."
    fi

}

# Retrieve POST Value Function
post_value() {
    local key="$1"
    local sanitized_key
    sanitized_key=$(echo "$key" | sed 's/[^a-zA-Z0-9_]/_/g')

    case "$sanitized_key" in
    [0-9]*)
        sanitized_key="_$sanitized_key"
        ;;
    *) ;;
    esac

    eval "echo \"\$POST_$sanitized_key\""
}
