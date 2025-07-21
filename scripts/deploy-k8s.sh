#!/bin/bash

# Kubernetes Deployment Script for Document Management Microservices
# Usage: ./scripts/deploy-k8s.sh [environment] [cloud-provider]

set -e

ENVIRONMENT=${1:-production}
CLOUD_PROVIDER=${2:-local}
NAMESPACE="doc-management"

echo "🚀 Deploying Document Management System to Kubernetes"
echo "Environment: $ENVIRONMENT"
echo "Cloud Provider: $CLOUD_PROVIDER"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl."
    exit 1
fi

# Check if we can connect to cluster
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

print_status "Connected to Kubernetes cluster: $(kubectl config current-context)"

# Create namespace
print_step "Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Create secrets
print_step "Creating secrets..."
kubectl apply -f k8s/secrets.yaml

# Deploy databases first
print_step "Deploying databases..."
kubectl apply -f k8s/postgres-auth.yaml
kubectl apply -f k8s/postgres-documents.yaml  
kubectl apply -f k8s/postgres-ingestion.yaml

print_status "Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=auth-db -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=ready pod -l app=documents-db -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=ready pod -l app=ingestion-db -n $NAMESPACE --timeout=300s

# Deploy infrastructure services
print_step "Deploying infrastructure services..."
kubectl apply -f k8s/rabbitmq.yaml
kubectl apply -f k8s/consul.yaml

print_status "Waiting for infrastructure services..."
kubectl wait --for=condition=ready pod -l app=rabbitmq -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=ready pod -l app=consul -n $NAMESPACE --timeout=300s

# Deploy application services
print_step "Deploying application services..."
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/documents-service.yaml
kubectl apply -f k8s/ingestion-service.yaml

print_status "Waiting for application services..."
kubectl wait --for=condition=ready pod -l app=auth-service -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=ready pod -l app=documents-service -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=ready pod -l app=ingestion-service -n $NAMESPACE --timeout=300s

# Deploy API Gateway
print_step "Deploying API Gateway..."
kubectl apply -f k8s/api-gateway.yaml
kubectl wait --for=condition=ready pod -l app=api-gateway -n $NAMESPACE --timeout=300s

# Deploy monitoring stack
print_step "Deploying monitoring stack..."
kubectl apply -f k8s/monitoring/

# Configure ingress based on cloud provider
case $CLOUD_PROVIDER in
    "aws")
        print_step "Configuring AWS ALB Ingress..."
        kubectl apply -f k8s/ingress/aws-alb-ingress.yaml
        ;;
    "gcp")
        print_step "Configuring GCP Ingress..."
        kubectl apply -f k8s/ingress/gcp-ingress.yaml
        ;;
    "azure")
        print_step "Configuring Azure Application Gateway..."
        kubectl apply -f k8s/ingress/azure-ingress.yaml
        ;;
    *)
        print_step "Configuring local ingress..."
        kubectl apply -f k8s/ingress/local-ingress.yaml
        ;;
esac

# Display deployment status
print_status "✅ Deployment completed! Checking service status..."
echo ""
kubectl get pods -n $NAMESPACE
echo ""

# Get service endpoints
print_status "🌐 Service endpoints:"
if [ "$CLOUD_PROVIDER" = "local" ]; then
    echo "   API Gateway: http://localhost:30000"
    echo "   RabbitMQ UI: http://localhost:30672"
    echo "   Grafana: http://localhost:30001"
else
    INGRESS_IP=$(kubectl get ingress -n $NAMESPACE -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}')
    echo "   API Gateway: http://$INGRESS_IP"
    echo "   Monitoring: http://$INGRESS_IP/grafana"
fi

echo ""
print_status "📊 Useful commands:"
echo "   View logs: kubectl logs -f deployment/[service-name] -n $NAMESPACE"
echo "   Scale service: kubectl scale deployment [service-name] --replicas=3 -n $NAMESPACE"
echo "   Port forward: kubectl port-forward service/api-gateway 8080:3000 -n $NAMESPACE"
echo "   Delete deployment: kubectl delete namespace $NAMESPACE"

print_status "🎉 Kubernetes deployment completed successfully!" 