#!/bin/bash

echo "Testing /api/user/credits endpoint..."
echo "========================================="

# Test without authentication
echo "1. Testing without authentication:"
curl -v http://localhost:3000/api/user/credits 2>&1

echo -e "\n\n2. Testing with manual x-user-id header:"
curl -v -H "x-user-id: test-user-123" http://localhost:3000/api/user/credits 2>&1

echo -e "\n\nDone. Check the server console for middleware logs."