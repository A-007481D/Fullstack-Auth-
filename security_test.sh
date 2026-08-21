#!/bin/bash

API_URL="http://localhost:3000/api"
printf "\n=============================================\n"
printf "SECURITY TESTING SCRIPT (MALICIOUS ACTOR)\n"
printf "=============================================\n\n"

# 1. Login as Client to get token
echo "[*] Logging in as Client (client@app.com)..."
CLIENT_RESPONSE=$(curl -s -X POST $API_URL/auth/login -H "Content-Type: application/json" -d '{"email":"client@app.com","password":"password"}')
CLIENT_TOKEN=$(echo $CLIENT_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$CLIENT_TOKEN" ]; then
    echo "[!] Failed to get client token!"
    exit 1
fi
echo "[+] Token acquired."

# 2. Login as Worker to get token
echo "[*] Logging in as Worker (worker@app.com)..."
WORKER_RESPONSE=$(curl -s -X POST $API_URL/auth/login -H "Content-Type: application/json" -d '{"email":"worker@app.com","password":"password"}')
WORKER_TOKEN=$(echo $WORKER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "[+] Token acquired."

printf "\n--- TEST 1: Client tries to list all users (Admin only) ---\n"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET $API_URL/users -H "Authorization: Bearer $CLIENT_TOKEN" -H "Accept: application/json")
BODY=$(curl -s -X GET $API_URL/users -H "Authorization: Bearer $CLIENT_TOKEN" -H "Accept: application/json")
echo "Expected: 403 Forbidden | Actual: $HTTP_STATUS"
echo "Response: $BODY"

printf "\n--- TEST 2: Worker tries to create a user (Admin only) ---\n"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API_URL/users -H "Authorization: Bearer $WORKER_TOKEN" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"name":"Hacker","email":"hack@hack.com","password":"password","role":"admin"}')
BODY=$(curl -s -X POST $API_URL/users -H "Authorization: Bearer $WORKER_TOKEN" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"name":"Hacker","email":"hack@hack.com","password":"password","role":"admin"}')
echo "Expected: 403 Forbidden | Actual: $HTTP_STATUS"
echo "Response: $BODY"

printf "\n--- TEST 3: Client tries to create a task assigned to someone else (IDOR) ---\n"
# We'll pass a valid description to get past validation, but try to set client_id to 999.
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API_URL/tasks -H "Authorization: Bearer $CLIENT_TOKEN" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"title":"Malicious Task","description":"Hacked task description","client_id":999}')
BODY=$(curl -s -X POST $API_URL/tasks -H "Authorization: Bearer $CLIENT_TOKEN" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"title":"Malicious Task","description":"Hacked task description","client_id":999}')
echo "Expected: Should create task but force client_id to current user (ignoring 999), OR 403. | Actual: $HTTP_STATUS"
echo "Response: $BODY"

printf "\n--- TEST 4: Worker tries to edit a task title (Workers can only edit status) ---\n"
# Using a known valid Task ID (18)
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $API_URL/tasks/18 -H "Authorization: Bearer $WORKER_TOKEN" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"title":"HACKED TITLE"}')
BODY=$(curl -s -X PATCH $API_URL/tasks/18 -H "Authorization: Bearer $WORKER_TOKEN" -H "Content-Type: application/json" -H "Accept: application/json" -d '{"title":"HACKED TITLE"}')
echo "Expected: 403 Forbidden | Actual: $HTTP_STATUS"
echo "Response: $BODY"

printf "\n--- TEST 5: Unauthenticated access to tasks ---\n"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET $API_URL/tasks -H "Accept: application/json")
BODY=$(curl -s -X GET $API_URL/tasks -H "Accept: application/json")
echo "Expected: 401 Unauthorized | Actual: $HTTP_STATUS"
echo "Response: $BODY"

printf "\n=============================================\n"
echo "TESTING COMPLETE"
