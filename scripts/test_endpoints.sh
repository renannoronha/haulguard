#!/bin/bash
set -e

API_URL=${API_URL:-"http://localhost:3000"}
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@example.com"}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"12345678"}
ADMIN_NAME=${ADMIN_NAME:-"Seed Admin"}

NEW_USER_NAME=${NEW_USER_NAME:-"Demo User"}
NEW_USER_PASSWORD=${NEW_USER_PASSWORD:-"password123"}
NEW_USER_EMAIL=${NEW_USER_EMAIL:-"demo.$(date +%s)@example.com"}

echo "🚀 Testing API endpoints at $API_URL"

# Helper function to make HTTP requests with JWT
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4

    if [ -n "$data" ]; then
        if [ -n "$token" ]; then
            curl -s -X "$method" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data" \
                "$API_URL$endpoint"
        else
            curl -s -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_URL$endpoint"
        fi
    else
        if [ -n "$token" ]; then
            curl -s -X "$method" \
                -H "Authorization: Bearer $token" \
                "$API_URL$endpoint"
        else
            curl -s -X "$method" "$API_URL$endpoint"
        fi
    fi
}

echo -e "\n${GREEN}1. Login to get JWT${NC}"
LOGIN_PAYLOAD="{\"username\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"
LOGIN_RESPONSE=$(make_request "POST" "/auth/login" "$LOGIN_PAYLOAD")
echo "Login response: $LOGIN_RESPONSE"
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Login failed for $ADMIN_EMAIL. Attempting to seed admin user...${NC}"
    SIGNUP_PAYLOAD="{\"name\":\"$ADMIN_NAME\",\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"
    SIGNUP_RESPONSE=$(make_request "POST" "/auth/signup" "$SIGNUP_PAYLOAD")
    if [[ $SIGNUP_RESPONSE == *"signup_success"* ]]; then
        echo "✅ Seeded admin user via /auth/signup"
    else
        echo -e "${RED}❌ Failed to seed admin user: $SIGNUP_RESPONSE${NC}"
        exit 1
    fi

    LOGIN_RESPONSE=$(make_request "POST" "/auth/login" "$LOGIN_PAYLOAD")
    echo "Retry login response: $LOGIN_RESPONSE"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

    if [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ Unable to obtain JWT after seeding admin user.${NC}"
        exit 1
    fi
fi
echo "✅ Got JWT token"

echo -e "\n${GREEN}2. Create a new user with POST /users${NC}"
CREATE_USER_PAYLOAD="{\"name\":\"$NEW_USER_NAME\",\"email\":\"$NEW_USER_EMAIL\",\"password\":\"$NEW_USER_PASSWORD\"}"
CREATE_USER_RESPONSE=$(make_request "POST" "/users" "$CREATE_USER_PAYLOAD" "$TOKEN")
NEW_USER_ID=$(echo "$CREATE_USER_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ -n "$NEW_USER_ID" ]; then
    echo "✅ Created user $NEW_USER_EMAIL with ID: $NEW_USER_ID"
else
    echo -e "${RED}❌ Failed to create user: $CREATE_USER_RESPONSE${NC}"
    exit 1
fi

echo -e "\n${GREEN}3. Create a driver${NC}"
DRIVER_RESPONSE=$(make_request "POST" "/drivers" \
    '{"name":"John Driver","licenseNumber":"ABC123"}' \
    "$TOKEN")
DRIVER_ID=$(echo "$DRIVER_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ -n "$DRIVER_ID" ]; then
    echo "✅ Created driver with ID: $DRIVER_ID"
else
    echo -e "${RED}❌ Failed to create driver: $DRIVER_RESPONSE${NC}"
    exit 1
fi

echo -e "\n${GREEN}4. Create a load${NC}"
LOAD_RESPONSE=$(make_request "POST" "/loads" \
    '{"origin":"New York","destination":"Los Angeles","cargoType":"Electronics","status":0}' \
    "$TOKEN")
LOAD_ID=$(echo "$LOAD_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ -n "$LOAD_ID" ]; then
    echo "✅ Created load with ID: $LOAD_ID"
else
    echo -e "${RED}❌ Failed to create load: $LOAD_RESPONSE${NC}"
    exit 1
fi

echo -e "\n${GREEN}5. List loads (first request - should miss cache)${NC}"
LOADS_FIRST=$(make_request "GET" "/loads" "" "$TOKEN")
echo "$LOADS_FIRST"
if [[ $LOADS_FIRST == *"\"success\":true"* ]]; then
    echo -e "\n✅ Listed loads (first time)"
else
    echo -e "${RED}❌ Unexpected response when listing loads: $LOADS_FIRST${NC}"
    exit 1
fi

echo -e "\n${GREEN}6. List loads again (should hit cache)${NC}"
LOADS_SECOND=$(make_request "GET" "/loads" "" "$TOKEN")
echo "$LOADS_SECOND"
if [[ $LOADS_SECOND == *"\"success\":true"* ]]; then
    echo -e "\n✅ Listed loads (second time - should be faster)"
else
    echo -e "${RED}❌ Unexpected response when listing loads again: $LOADS_SECOND${NC}"
    exit 1
fi

echo -e "\n${GREEN}7. Create assignment${NC}"
ASSIGNMENT_RESPONSE=$(make_request "POST" "/assignments" \
    "{\"driverId\":$DRIVER_ID,\"loadId\":$LOAD_ID}" \
    "$TOKEN")
ASSIGNMENT_ID=$(echo "$ASSIGNMENT_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ -n "$ASSIGNMENT_ID" ]; then
    echo "✅ Created assignment with ID: $ASSIGNMENT_ID"
else
    echo -e "${RED}❌ Failed to create assignment: $ASSIGNMENT_RESPONSE${NC}"
    exit 1
fi

echo -e "\n${GREEN}8. Get assignment details${NC}"
ASSIGNMENT_DETAILS=$(make_request "GET" "/assignments/$ASSIGNMENT_ID" "" "$TOKEN")
echo "$ASSIGNMENT_DETAILS"
if [[ $ASSIGNMENT_DETAILS == *"\"success\":true"* ]]; then
    echo -e "\n✅ Got assignment details"
else
    echo -e "${RED}❌ Failed to fetch assignment details: $ASSIGNMENT_DETAILS${NC}"
    exit 1
fi

echo -e "\n${GREEN}9. Try to assign another load to same driver (should fail)${NC}"
SECOND_LOAD_RESPONSE=$(make_request "POST" "/loads" \
    '{"origin":"Miami","destination":"Chicago","cargoType":"Furniture","status":0}' \
    "$TOKEN")
SECOND_LOAD_ID=$(echo "$SECOND_LOAD_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ -z "$SECOND_LOAD_ID" ]; then
    echo -e "${RED}❌ Failed to create second load: $SECOND_LOAD_RESPONSE${NC}"
    exit 1
fi

FAIL_RESPONSE=$(make_request "POST" "/assignments" \
    "{\"driverId\":$DRIVER_ID,\"loadId\":$SECOND_LOAD_ID}" \
    "$TOKEN")
if [[ $FAIL_RESPONSE == *"\"success\":false"* ]]; then
    echo "Response: $FAIL_RESPONSE"
    echo "✅ Successfully prevented double assignment"
else
    echo -e "${RED}❌ Warning: Was able to assign second load to driver${NC}"
fi

echo -e "\n${GREEN}10. Update assignment status to COMPLETED${NC}"
STATUS_RESPONSE=$(make_request "PATCH" "/assignments/$ASSIGNMENT_ID/status" \
    '{"status":"COMPLETED"}' \
    "$TOKEN")
echo "$STATUS_RESPONSE"
if [[ $STATUS_RESPONSE == *"\"affected\":1"* ]]; then
    echo -e "\n✅ Updated assignment status"
else
    echo -e "${RED}❌ Failed to update assignment status: $STATUS_RESPONSE${NC}"
    exit 1
fi

echo -e "\n✅ ${GREEN}All tests completed!${NC}"
