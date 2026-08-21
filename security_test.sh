#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "=== 1. Authenticating Users ==="
ADMIN_TOKEN=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"admin@app.com","password":"password"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
WORKER_TOKEN=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"worker@app.com","password":"password"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
WORKER2_TOKEN=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"worker2@app.com","password":"password"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
CLIENT_TOKEN=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"client@app.com","password":"password"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
CLIENT2_TOKEN=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email":"client2@app.com","password":"password"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Admin Token: ${ADMIN_TOKEN:0:10}..."
echo "Worker Token: ${WORKER_TOKEN:0:10}..."
echo "Worker2 Token: ${WORKER2_TOKEN:0:10}..."
echo "Client Token: ${CLIENT_TOKEN:0:10}..."
echo "Client2 Token: ${CLIENT2_TOKEN:0:10}..."

echo -e "\n=== 2. Testing Worker Access to Admin Endpoints ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/users -H "Authorization: Bearer $WORKER_TOKEN")
echo "Worker GET /api/users -> HTTP $STATUS (Expected 403)"

echo -e "\n=== 3. Testing Worker A accessing Task 1 (Assigned to Worker A) ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/tasks/1 -H "Authorization: Bearer $WORKER_TOKEN")
echo "Worker A GET /api/tasks/1 -> HTTP $STATUS (Expected 200)"

echo -e "\n=== 4. Testing Worker B modifying Worker A's Task ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $BASE_URL/tasks/1 -H "Authorization: Bearer $WORKER2_TOKEN" -H "Content-Type: application/json" -d '{"status":"completed"}')
echo "Worker B PATCH /api/tasks/1 -> HTTP $STATUS (Expected 403)"

echo -e "\n=== 5. Testing Worker A trying to change Task title (Unauthorized field update) ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $BASE_URL/tasks/1 -H "Authorization: Bearer $WORKER_TOKEN" -H "Content-Type: application/json" -d '{"title":"Hacked Title"}')
echo "Worker A PATCH /api/tasks/1 (Title) -> HTTP $STATUS (Expected 403)"

echo -e "\n=== 6. Testing Client accessing another Client's Task ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/tasks/3 -H "Authorization: Bearer $CLIENT_TOKEN")
echo "Client A GET /api/tasks/3 (Owned by Client 2) -> HTTP $STATUS (Expected 403)"
