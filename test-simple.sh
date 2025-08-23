#!/bin/bash

echo "🧪 TESTING SIMPLE MIDDLEWARE"
echo "============================"

# Test localhost
echo "1. Testing localhost:"
curl -s http://localhost:3000/api/user/credits | jq '.' 2>/dev/null || curl -s http://localhost:3000/api/user/credits

echo -e "\n\n2. Testing headers endpoint:"
curl -s http://localhost:3000/api/test-headers | jq '.' 2>/dev/null || curl -s http://localhost:3000/api/test-headers

echo -e "\n\n3. Testing with verbose output:"
curl -v http://localhost:3000/api/user/credits 2>&1

echo -e "\n\n✅ Local test complete!"
echo ""
echo "Expected results:"
echo "- Should return 200 with credits data"
echo "- x-user-id should be 'simple-user-id-123'"
echo "- Check console for middleware logs"