#!/bin/bash
set -e

API_URL=${API_URL:-"http://localhost:3000"}
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

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

echo -e "\n${GREEN}1. Create a new user with signup${NC}"
SIGNUP_RESPONSE=$(make_request "POST" "/auth/signup" \
    '{"name":"Test Admin","email":"admin@example.com","password":"12345678"}')
echo "✅ Created admin user: $SIGNUP_RESPONSE"

echo -e "\n${GREEN}2. Login to get JWT${NC}"
LOGIN_RESPONSE=$(make_request "POST" "/auth/login" \
    '{"username":"admin@example.com","password":"12345678"}')
echo "Login response: $LOGIN_RESPONSE"
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get token${NC}"
    exit 1
fi
echo "✅ Got JWT token"

echo -e "\n${GREEN}3. Create a driver${NC}"
DRIVER_RESPONSE=$(make_request "POST" "/drivers" \
    '{"name":"John Driver","licenseNumber":"ABC123"}' \
    "$TOKEN")
DRIVER_ID=$(echo $DRIVER_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "✅ Created driver with ID: $DRIVER_ID"

echo -e "\n${GREEN}4. Create a load${NC}"
LOAD_RESPONSE=$(make_request "POST" "/loads" \
    '{"origin":"New York","destination":"Los Angeles","cargoType":"Electronics","status":0}' \
    "$TOKEN")
LOAD_ID=$(echo $LOAD_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "✅ Created load with ID: $LOAD_ID"

echo -e "\n${GREEN}5. List loads (first request - should miss cache)${NC}"
make_request "GET" "/loads" "" "$TOKEN"
echo -e "\n✅ Listed loads (first time)"

echo -e "\n${GREEN}6. List loads again (should hit cache)${NC}"
make_request "GET" "/loads" "" "$TOKEN"
echo -e "\n✅ Listed loads (second time - should be faster)"

echo -e "\n${GREEN}7. Create assignment${NC}"
ASSIGNMENT_RESPONSE=$(make_request "POST" "/assignments" \
    "{\"driverId\":$DRIVER_ID,\"loadId\":$LOAD_ID}" \
    "$TOKEN")
ASSIGNMENT_ID=$(echo $ASSIGNMENT_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "✅ Created assignment with ID: $ASSIGNMENT_ID"

echo -e "\n${GREEN}8. Get assignment details${NC}"
make_request "GET" "/assignments/$ASSIGNMENT_ID" "" "$TOKEN"
echo -e "\n✅ Got assignment details"

echo -e "\n${GREEN}9. Try to assign another load to same driver (should fail)${NC}"
SECOND_LOAD_RESPONSE=$(make_request "POST" "/loads" \
    '{"origin":"Miami","destination":"Chicago","cargoType":"Furniture","status":0}' \
    "$TOKEN")
SECOND_LOAD_ID=$(echo $SECOND_LOAD_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)

FAIL_RESPONSE=$(make_request "POST" "/assignments" \
    "{\"driverId\":$DRIVER_ID,\"loadId\":$SECOND_LOAD_ID}" \
    "$TOKEN")
if [[ $FAIL_RESPONSE == *"error"* ]]; then
    echo "✅ Successfully prevented double assignment"
else
    echo -e "${RED}❌ Warning: Was able to assign second load to driver${NC}"
fi

echo -e "\n${GREEN}10. Update assignment status to COMPLETED${NC}"
make_request "PATCH" "/assignments/$ASSIGNMENT_ID" \
    '{"status":1}' \
    "$TOKEN"
echo -e "\n✅ Updated assignment status"

echo -e "\n✅ ${GREEN}All tests completed!${NC}"
