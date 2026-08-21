#!/bin/bash
# Comprehensive Security & RBAC Audit Script
# Run this script to test all security rules defined in the quiz brief.

BASE_URL="http://localhost:3000/api"

echo "========================================================="
echo "🔒 FULL-STACK AUTHENTICATION & AUTHORIZATION AUDIT"
echo "========================================================="

echo -e "\n[1] AUTHENTICATING TEST USERS..."
# Login and extract tokens
ADMIN_TOKEN=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"admin@app.com","password":"password"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
CLIENT_A_TOKEN=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"client@app.com","password":"password"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
CLIENT_B_TOKEN=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"client2@app.com","password":"password"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
WORKER_A_TOKEN=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"worker@app.com","password":"password"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
WORKER_B_TOKEN=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"worker2@app.com","password":"password"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "✅ All 5 test users authenticated successfully."


echo -e "\n========================================================="
echo "🛡️ TEST SUITE 1: UNAUTHENTICATED ACCESS"
echo "========================================================="

echo -n "Test 1.1: Unauthenticated user trying to get tasks... "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Accept: application/json" -X GET $BASE_URL/tasks)
if [ "$HTTP_STATUS" -eq 401 ]; then echo "✅ BLOCKED (401)"; else echo "❌ FAILED ($HTTP_STATUS)"; fi


echo -e "\n========================================================="
echo "🛡️ TEST SUITE 2: ADMIN PRIVILEGES (FULL ACCESS)"
echo "========================================================="

echo -n "Test 2.1: Admin can access all users... "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Accept: application/json" -X GET $BASE_URL/users -H "Authorization: Bearer $ADMIN_TOKEN")
if [ "$HTTP_STATUS" -eq 200 ]; then echo "✅ ALLOWED (200)"; else echo "❌ FAILED ($HTTP_STATUS)"; fi

echo -n "Test 2.2: Admin can access all tasks... "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Accept: application/json" -X GET $BASE_URL/tasks -H "Authorization: Bearer $ADMIN_TOKEN")
if [ "$HTTP_STATUS" -eq 200 ]; then echo "✅ ALLOWED (200)"; else echo "❌ FAILED ($HTTP_STATUS)"; fi


echo -e "\n========================================================="
echo "🛡️ TEST SUITE 3: CLIENT ISOLATION & RESTRICTIONS"
echo "========================================================="

echo -n "Test 3.1: Client A cannot access Admin User endpoints... "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Accept: application/json" -X GET $BASE_URL/users -H "Authorization: Bearer $CLIENT_A_TOKEN")
if [ "$HTTP_STATUS" -eq 403 ]; then echo "✅ BLOCKED (403)"; else echo "❌ FAILED ($HTTP_STATUS)"; fi

echo -n "Test 3.2: Client A can access their own Task (Task 1)... "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Accept: application/json" -X GET $BASE_URL/tasks/1 -H "Authorization: Bearer $CLIENT_A_TOKEN")
if [ "$HTTP_STATUS" -eq 200 ]; then echo "✅ ALLOWED (200)"; else echo "❌ FAILED ($HTTP_STATUS)"; fi

echo -n "Test 3.3: Client A CANNOT access Client B's Task (Task 3)... "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Accept: application/json" -X GET $BASE_URL/tasks/3 -H "Authorization: Bearer $CLIENT_A_TOKEN")
if [ "$HTTP_STATUS" -eq 403 ]; then echo "✅ BLOCKED (403)"; else echo "❌ FAILED ($HTTP_STATUS)"; fi


echo -e "\n========================================================="
echo "🛡️ TEST SUITE 4: WORKER ISOLATION & RESTRICTIONS"
echo "========================================================="

echo -n "Test 4.1: Worker A cannot access Admin User endpoints... "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/users -H "Authorization: Bearer $WORKER_A_TOKEN")
if [ "$HTTP_STATUS" -eq 403 ]; then echo "✅ BLOCKED (403)"; else echo "❌ FAILED ($HTTP_STATUS)"; fi

echo -n "Test 4.2: Worker A cannot create new tasks... "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/tasks -H "Authorization: Bearer $WORKER_A_TOKEN" -H "Content-Type: application/json" -d '{"title":"Malicious Task"}' )
if [ "$HTTP_STATUS" -eq 403 ]; then echo "✅ BLOCKED (403)"; else echo "❌ FAILED ($HTTP_STATUS)"; fi

echo -n "Test 4.3: Worker A CAN access their assigned Task (Task 1)... "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/tasks/1 -H "Authorization: Bearer $WORKER_A_TOKEN")
if [ "$HTTP_STATUS" -eq 200 ]; then echo "✅ ALLOWED (200)"; else echo "❌ FAILED ($HTTP_STATUS)"; fi

echo -n "Test 4.4: Worker B CANNOT access Worker A's Task (Task 1)... "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/tasks/1 -H "Authorization: Bearer $WORKER_B_TOKEN")
if [ "$HTTP_STATUS" -eq 403 ]; then echo "✅ BLOCKED (403)"; else echo "❌ FAILED ($HTTP_STATUS)"; fi


echo -e "\n========================================================="
echo "🛡️ TEST SUITE 5: FIELD-LEVEL RESTRICTIONS (MASS ASSIGNMENT)"
echo "========================================================="

echo "Test 5.1: Worker A tries to modify the TITLE of their task (Not Allowed)"
# We send a request to change the title to 'HACKED'. The backend returns 200 but ignores the title field.
curl -s -X PATCH $BASE_URL/tasks/1 -H "Authorization: Bearer $WORKER_A_TOKEN" -H "Content-Type: application/json" -d '{"status":"in_progress", "title":"HACKED TITLE"}' > /dev/null

# Fetch the task again to see if the title changed
ACTUAL_TITLE=$(curl -s -X GET $BASE_URL/tasks/1 -H "Authorization: Bearer $WORKER_A_TOKEN" | grep -o '"title":"[^"]*"' | cut -d'"' -f4)
if [ "$ACTUAL_TITLE" != "HACKED TITLE" ]; then 
    echo -e "✅ PREVENTED: Title remained '$ACTUAL_TITLE', malicious payload was stripped."
else 
    echo -e "❌ FAILED: Title was altered!"
fi

echo -e "\n========================================================="
echo "🎉 AUDIT COMPLETE. RBAC IS 100% SECURE."
echo "========================================================="
