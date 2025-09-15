#!/bin/bash

# Define the base URL for the Flask API
BASE_URL="http://localhost:6000/api"

# Flag to control whether to echo JSON output
ECHO_JSON=false

# Parse command-line arguments
while [ "$#" -gt 0 ]; do
    case $1 in
        --echo-json) ECHO_JSON=true ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

###############################################
#
# Health checks
#
###############################################

check_health() {
    echo "Checking health status..."
    response=$(curl -s -X GET "$BASE_URL/health")
    if echo "$response" | grep -q '"status": "healthy"'; then
        echo "Service is healthy."
    else
        echo "Health check failed."
        exit 1
    fi
}

###############################################
#
# Stock Information
#
###############################################

get_stock_info() {
    symbol=$1
    echo "Getting stock information for $symbol..."
    response=$(curl -s -X GET "$BASE_URL/stock/$symbol")
    if [ "$ECHO_JSON" = true ]; then
        echo "Stock Info JSON:"
        echo "$response" | jq .
    fi
}

get_stock_history() {
    symbol=$1
    echo "Getting stock history for $symbol..."
    response=$(curl -s -X GET "$BASE_URL/stock/$symbol/history")
    if [ "$ECHO_JSON" = true ]; then
        echo "Stock History JSON:"
        echo "$response" | jq .
    fi
}

###############################################
#
# Portfolio Management
#
###############################################

get_portfolio() {
    echo "Getting portfolio holdings..."
    response=$(curl -s -X GET "$BASE_URL/portfolio")
    if [ "$ECHO_JSON" = true ]; then
        echo "Portfolio JSON:"
        echo "$response" | jq .
    fi
}

get_portfolio_value() {
    echo "Getting portfolio value..."
    response=$(curl -s -X GET "$BASE_URL/portfolio/value")
    if [ "$ECHO_JSON" = true ]; then
        echo "Portfolio Value JSON:"
        echo "$response" | jq .
    fi
}

buy_stock() {
    symbol=$1
    shares=$2
    echo "Buying $shares shares of $symbol..."
    response=$(curl -s -X POST "$BASE_URL/portfolio/buy" \
        -H "Content-Type: application/json" \
        -d "{\"symbol\":\"$symbol\", \"shares\":$shares}")
    if [ "$ECHO_JSON" = true ]; then
        echo "Buy Transaction JSON:"
        echo "$response" | jq .
    fi
}

sell_stock() {
    symbol=$1
    shares=$2
    echo "Selling $shares shares of $symbol..."
    response=$(curl -s -X POST "$BASE_URL/portfolio/sell" \
        -H "Content-Type: application/json" \
        -d "{\"symbol\":\"$symbol\", \"shares\":$shares}")
    if [ "$ECHO_JSON" = true ]; then
        echo "Sell Transaction JSON:"
        echo "$response" | jq .
    fi
}

create_account() {
  username=$1
  password=$2

  echo "Creating account for user: $username..."
  response=$(curl -s -X POST "$BASE_URL/create-account" -H "Content-Type: application/json" \
    -d "{\"username\":\"$username\", \"password\":\"$password\"}")

  if echo "$response" | grep -q '"message": "Account created successfully"'; then
    echo "Account created successfully for user: $username."
  else
    echo $response
    echo "Failed to create account for user: $username."
    exit 1
  fi
}

# Function to log in a user
login() {
  username=$1
  password=$2

  echo "Logging in user: $username..."
  response=$(curl -s -X POST "$BASE_URL/login" -H "Content-Type: application/json" \
    -d "{\"username\":\"$username\", \"password\":\"$password\"}")

  if echo "$response" | grep -q '"message": "Login successful"'; then
    echo "Login successful for user: $username."
  else
  echo $response
    echo "Failed to log in user: $username."
    exit 1
  fi
}

# Function to update a user's password
update_password() {
  username=$1
  current_password=$2
  new_password=$3

  echo "Updating password for user: $username..."
  response=$(curl -s -X POST "$BASE_URL/update-password" -H "Content-Type: application/json" \
    -d "{\"username\":\"$username\", \"current_password\":\"$current_password\", \"new_password\":\"$new_password\"}")

  if echo "$response" | grep -q '"message": "Password updated successfully"'; then
    echo "Password updated successfully for user: $username."
  else
    echo $response
    echo "Failed to update password for user: $username."
    exit 1
  fi
}



# Run the tests
echo "Starting smoke tests..."

# Health check
check_health


# User tests
create_account "testuser" "testpassword"
login "testuser" "testpassword"
update_password "testuser" "testpassword" "newpassword"

# Test stock information endpoints
get_stock_info "AAPL"
get_stock_info "GOOGL"
get_stock_history "AAPL"

# Test portfolio management
get_portfolio
buy_stock "AAPL" 10
buy_stock "GOOGL" 5
get_portfolio
get_portfolio_value
sell_stock "AAPL" 5
get_portfolio
get_portfolio_value

echo "Smoke tests completed successfully!"