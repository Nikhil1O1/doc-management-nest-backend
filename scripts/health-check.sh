#!/bin/bash

# Health Check Script for Document Management System
# Usage: ./scripts/health-check.sh [environment]

set -e

ENVIRONMENT=${1:-production}

if [ "$ENVIRONMENT" = "production" ]; then
    BASE_URL="https://api.docmanagement.com"
elif [ "$ENVIRONMENT" = "staging" ]; then
    BASE_URL="https://api-staging.docmanagement.com"
else
    BASE_URL="http://localhost:3000"
fi

echo "🔍 Running health checks for $ENVIRONMENT environment"
echo "Base URL: $BASE_URL"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

FAILED_CHECKS=0

# Function to check HTTP endpoint
check_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    echo -n "Checking $name... "
    
    response=$(curl -s -w "%{http_code}" -o /dev/null "$url" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        print_success "$name is healthy (HTTP $response)"
    else
        print_error "$name failed (HTTP $response)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Function to check authenticated endpoint
check_auth_endpoint() {
    local name="$1"
    local url="$2"
    local token="$3"
    local expected_status="${4:-200}"
    
    echo -n "Checking $name... "
    
    response=$(curl -s -w "%{http_code}" -o /dev/null -H "Authorization: Bearer $token" "$url" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        print_success "$name is healthy (HTTP $response)"
    else
        print_error "$name failed (HTTP $response)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

echo "🏥 Starting health checks..."
echo "=========================="

# Basic connectivity
check_endpoint "API Gateway" "$BASE_URL/api/v1"

# Authentication service
check_endpoint "Auth Service Health" "$BASE_URL/api/v1/auth/health" 404

# Get authentication token for protected endpoints
echo "🔐 Getting authentication token..."
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@g.com","password":"admin123"}' || echo "{}")

TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.access_token // empty' 2>/dev/null || echo "")

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    print_success "Authentication successful"
    
    # Protected endpoints
    check_auth_endpoint "Documents Service" "$BASE_URL/api/v1/documents" "$TOKEN"
    check_auth_endpoint "Ingestion Service" "$BASE_URL/api/v1/ingestion/jobs" "$TOKEN"
    check_auth_endpoint "Users Service" "$BASE_URL/api/v1/users" "$TOKEN"
    
    # Test document upload (simple)
    echo -n "Testing document upload... "
    UPLOAD_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
        -H "Authorization: Bearer $TOKEN" \
        -F "file=@test-document.txt" \
        -F "title=Health Check Test" \
        -F "description=Automated health check upload" \
        "$BASE_URL/api/v1/documents/upload" 2>/dev/null || echo "000")
    
    if [ "$UPLOAD_RESPONSE" = "201" ]; then
        print_success "Document upload test passed"
    else
        print_warning "Document upload test failed (HTTP $UPLOAD_RESPONSE)"
    fi
else
    print_error "Failed to authenticate - skipping protected endpoint checks"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Database connectivity (indirect check through API responses)
echo -n "Checking database connectivity... "
DB_RESPONSE=$(curl -s "$BASE_URL/api/v1" || echo "")
if echo "$DB_RESPONSE" | grep -q "Document Management"; then
    print_success "Database connectivity appears healthy"
else
    print_error "Database connectivity issues detected"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Check external dependencies
check_endpoint "RabbitMQ Management" "http://localhost:15672" 200 || true
check_endpoint "Consul UI" "http://localhost:8500" 200 || true

echo ""
echo "=========================="
echo "🏥 Health check summary"
echo "=========================="

if [ $FAILED_CHECKS -eq 0 ]; then
    print_success "All health checks passed! 🎉"
    echo "System is healthy and ready for traffic."
    exit 0
else
    print_error "$FAILED_CHECKS health check(s) failed!"
    echo "System may not be ready for traffic."
    exit 1
fi 