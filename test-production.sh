#!/bin/bash

# Replace with your production URL
PRODUCTION_URL="https://your-production-domain.com"

echo "Testing Production /api/user/credits endpoint..."
echo "================================================"
echo "Production URL: $PRODUCTION_URL"
echo ""

# Test without authentication
echo "1. Testing without authentication:"
curl -v "$PRODUCTION_URL/api/user/credits" 2>&1

echo -e "\n\n2. Testing with manual x-user-id header:"
curl -v -H "x-user-id: test-user-123" "$PRODUCTION_URL/api/user/credits" 2>&1

echo -e "\n\n3. Testing with session cookie (if you have one):"
# You can add your session cookie here
# curl -v -H "Cookie: your-session-cookie-here" "$PRODUCTION_URL/api/user/credits" 2>&1

echo -e "\n\n4. Testing middleware bypass (should show fallback headers):"
curl -v "$PRODUCTION_URL/api/user/credits" -H "Accept: application/json" 2>&1

echo -e "\n\nDone. Check the production server logs for middleware output."
echo "Look for these log messages:"
echo "- 🔥 MIDDLEWARE IS RUNNING ON:"
echo "- 🌍 NODE_ENV:"
echo "- ❌ Auth error:"
echo "- 🔗 Added fallback headers"