#!/bin/bash

# Replace with your production URL
PRODUCTION_URL="https://your-production-domain.com"

echo "🔍 COMPREHENSIVE PRODUCTION DEBUG TEST"
echo "======================================"
echo "Production URL: $PRODUCTION_URL"
echo ""

# Test 1: Debug endpoint to check environment
echo "1. Testing debug endpoint:"
curl -s "$PRODUCTION_URL/api/debug" | jq '.' 2>/dev/null || curl -s "$PRODUCTION_URL/api/debug"

echo -e "\n\n2. Testing headers endpoint:"
curl -s "$PRODUCTION_URL/api/test-headers" | jq '.' 2>/dev/null || curl -s "$PRODUCTION_URL/api/test-headers"

echo -e "\n\n3. Testing credits endpoint (should now work with fallback):"
curl -s "$PRODUCTION_URL/api/user/credits" | jq '.' 2>/dev/null || curl -s "$PRODUCTION_URL/api/user/credits"

echo -e "\n\n4. Testing with verbose output:"
curl -v "$PRODUCTION_URL/api/user/credits" 2>&1

echo -e "\n\n5. Testing middleware bypass:"
curl -s -H "x-user-id: manual-test-id" "$PRODUCTION_URL/api/user/credits" | jq '.' 2>/dev/null || curl -s -H "x-user-id: manual-test-id" "$PRODUCTION_URL/api/user/credits"

echo -e "\n\n✅ Debug test complete!"
echo ""
echo "Expected results:"
echo "- Debug endpoint should show environment variables"
echo "- Headers endpoint should show x-user-id header"
echo "- Credits endpoint should return 200 with fallback user ID"
echo "- Check production logs for middleware messages"