#!/bin/bash

# Docker Deployment Script for Document Management Microservices
# Usage: ./scripts/deploy-docker.sh [environment]

set -e

ENVIRONMENT=${1:-development}
COMPOSE_FILE="docker-compose.microservices.yml"

echo "🚀 Deploying Document Management System - Environment: $ENVIRONMENT"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop or Docker daemon."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install Docker Compose."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating default environment file..."
    cat > .env << EOF
# Database Configuration
DB_PASSWORD=secure_password_123
PGADMIN_PASSWORD=admin123

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-$(date +%s)
JWT_EXPIRES_IN=1d

# External Services
PYTHON_BACKEND_URL=http://python-backend:8000
FRONTEND_URL=http://localhost:3001

# Environment
NODE_ENV=$ENVIRONMENT
EOF
    print_status "Created .env file with default values"
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p uploads
mkdir -p monitoring
mkdir -p logs

# Create Prometheus configuration
if [ ! -f monitoring/prometheus.yml ]; then
    print_status "Creating Prometheus configuration..."
    cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:3000']
  
  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:3001']
  
  - job_name: 'documents-service'
    static_configs:
      - targets: ['documents-service:3002']
  
  - job_name: 'ingestion-service'
    static_configs:
      - targets: ['ingestion-service:3003']
EOF
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down --remove-orphans || true

# Pull latest images (if not building)
print_status "Pulling base images..."
docker-compose -f $COMPOSE_FILE pull postgres rabbitmq consul jaeger prometheus grafana || true

# Build and start services
print_status "Building and starting services..."
docker-compose -f $COMPOSE_FILE up --build -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check service health
print_status "Checking service health..."
SERVICES=("rabbitmq" "consul" "auth-db" "documents-db" "ingestion-db")

for service in "${SERVICES[@]}"; do
    if docker-compose -f $COMPOSE_FILE ps | grep -q "$service.*Up.*healthy"; then
        print_status "$service is healthy"
    else
        print_warning "$service may not be healthy yet"
    fi
done

# Display service URLs
print_status "✅ Deployment completed! Services are available at:"
echo ""
echo "🌐 Application URLs:"
echo "   API Gateway:     http://localhost:3000"
echo "   Auth Service:    http://localhost:3001"
echo "   Documents Service: http://localhost:3002"
echo "   Ingestion Service: http://localhost:3003"
echo ""
echo "🛠️ Management URLs:"
echo "   RabbitMQ UI:     http://localhost:15672 (admin/admin123)"
echo "   Consul UI:       http://localhost:8500"
echo "   Jaeger UI:       http://localhost:16686"
echo "   Prometheus:      http://localhost:9090"
echo "   Grafana:         http://localhost:3001 (admin/admin123)"
echo ""
echo "📊 To view logs: docker-compose -f $COMPOSE_FILE logs -f [service-name]"
echo "🛑 To stop: docker-compose -f $COMPOSE_FILE down"
echo ""

# Test basic connectivity
print_status "Testing basic connectivity..."
sleep 10
if curl -s http://localhost:3000/api/v1 >/dev/null; then
    print_status "✅ API Gateway is responding"
else
    print_warning "⚠️ API Gateway may still be starting up"
fi

print_status "🎉 Deployment script completed successfully!" 