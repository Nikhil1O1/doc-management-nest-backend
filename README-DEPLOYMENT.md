# 🚀 Deployment Guide

This guide covers deploying the Document Management System microservices using Docker and Kubernetes across different cloud providers.

## 📋 Prerequisites

### Required Tools
- **Docker** (>= 20.0) & Docker Compose
- **kubectl** (>= 1.24) for Kubernetes deployments
- **Node.js** (>= 18) for local development
- **jq** for JSON parsing in scripts

### Cloud Provider Setup
- **AWS**: EKS cluster, ECR registry
- **Azure**: AKS cluster, ACR registry  
- **GCP**: GKE cluster, GCR registry

## 🐳 Docker Deployment

### Quick Start
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy all services
./scripts/deploy-docker.sh production

# Check status
docker-compose -f docker-compose.microservices.yml ps
```

### Services
The Docker deployment includes:
- **API Gateway** (port 3000)
- **Auth Service** (port 3001) 
- **Documents Service** (port 3002)
- **Ingestion Service** (port 3003)
- **PostgreSQL** databases (separate per service)
- **RabbitMQ** message queue
- **Consul** service discovery
- **Monitoring** (Prometheus, Grafana, Jaeger)

### Environment Configuration
Create `.env` file:
```env
# Database
DB_PASSWORD=secure_password_123
PGADMIN_PASSWORD=admin123

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1d

# External Services
PYTHON_BACKEND_URL=http://python-backend:8000
FRONTEND_URL=http://localhost:3001

# Environment
NODE_ENV=production
```

### Useful Commands
```bash
# View logs
docker-compose -f docker-compose.microservices.yml logs -f api-gateway

# Scale service
docker-compose -f docker-compose.microservices.yml up --scale auth-service=3 -d

# Stop everything
docker-compose -f docker-compose.microservices.yml down
```

## ☸️ Kubernetes Deployment

### Local Development (minikube/kind)
```bash
# Deploy to local cluster
./scripts/deploy-k8s.sh development local

# Port forward to access services
kubectl port-forward service/api-gateway 8080:3000 -n doc-management
```

### AWS EKS
```bash
# Configure AWS CLI
aws configure

# Create EKS cluster (if needed)
eksctl create cluster --name doc-management --region us-west-2

# Deploy
./scripts/deploy-k8s.sh production aws
```

### Azure AKS
```bash
# Login to Azure
az login

# Create AKS cluster (if needed)
az aks create --resource-group doc-management --name doc-management --node-count 3

# Deploy
./scripts/deploy-k8s.sh production azure
```

### Google GKE
```bash
# Setup gcloud
gcloud auth login
gcloud config set project your-project-id

# Create GKE cluster (if needed)
gcloud container clusters create doc-management --zone us-central1-a

# Deploy
./scripts/deploy-k8s.sh production gcp
```

### Kubernetes Resources
The deployment creates:
- **Namespace**: `doc-management`
- **Deployments**: One per microservice (2 replicas each)
- **Services**: ClusterIP for inter-service communication
- **Secrets**: Database passwords, JWT secrets
- **PVCs**: Persistent storage for uploads
- **Ingress**: External access (cloud provider specific)

### Scaling
```bash
# Scale individual service
kubectl scale deployment auth-service --replicas=5 -n doc-management

# Auto-scaling
kubectl autoscale deployment auth-service --cpu-percent=50 --min=2 --max=10 -n doc-management
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
The `.github/workflows/ci-cd.yml` pipeline includes:

1. **Test Stage**
   - Unit tests
   - E2E tests
   - Coverage reporting

2. **Security Stage**
   - NPM audit
   - Snyk security scanning

3. **Build Stage**
   - Multi-service Docker builds
   - Push to container registry

4. **Deploy Stages**
   - Staging deployment (`develop` branch)
   - Production deployment (`main` branch)

5. **Validation**
   - Smoke tests
   - Performance tests
   - Health checks

### Required Secrets
Set these in GitHub repository settings:
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
SNYK_TOKEN
SLACK_WEBHOOK_URL
```

### Triggering Deployments
```bash
# Deploy to staging
git push origin develop

# Deploy to production
git push origin main
```

## 🏥 Health Monitoring

### Health Check Script
```bash
# Check production health
./scripts/health-check.sh production

# Check staging
./scripts/health-check.sh staging

# Check local
./scripts/health-check.sh local
```

### Monitoring URLs
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686
- **RabbitMQ**: http://localhost:15672 (admin/admin123)

## 🛠️ Troubleshooting

### Docker Issues
```bash
# Check container logs
docker-compose -f docker-compose.microservices.yml logs service-name

# Restart single service
docker-compose -f docker-compose.microservices.yml restart auth-service

# Clean rebuild
docker-compose -f docker-compose.microservices.yml down -v
docker system prune -f
./scripts/deploy-docker.sh
```

### Kubernetes Issues
```bash
# Check pod status
kubectl get pods -n doc-management

# View pod logs
kubectl logs -f deployment/auth-service -n doc-management

# Describe problematic pod
kubectl describe pod <pod-name> -n doc-management

# Check events
kubectl get events -n doc-management --sort-by='.lastTimestamp'
```

### Common Problems

1. **Database Connection Errors**
   - Check if PostgreSQL pods are running
   - Verify secrets are correctly applied
   - Check network policies

2. **Service Discovery Issues**
   - Ensure Consul is healthy
   - Check service registration
   - Verify DNS resolution

3. **Image Pull Errors**
   - Check registry credentials
   - Verify image tags exist
   - Check network connectivity

## 🔒 Security Considerations

### Production Checklist
- [ ] Change default passwords
- [ ] Use strong JWT secrets
- [ ] Enable TLS/SSL certificates
- [ ] Configure network policies
- [ ] Set up monitoring alerts
- [ ] Regular security updates
- [ ] Backup strategies

### Secrets Management
```bash
# Create secrets from files
kubectl create secret generic jwt-secret \
  --from-literal=secret="$(openssl rand -base64 32)" \
  -n doc-management

# Update existing secret
kubectl patch secret jwt-secret \
  -p='{"data":{"secret":"'$(echo -n "new-secret" | base64)'"}}' \
  -n doc-management
```

## 📊 Performance Tuning

### Resource Requests/Limits
Adjust in Kubernetes manifests:
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Database Optimization
- Configure connection pooling
- Tune PostgreSQL settings
- Set up read replicas for heavy read workloads

### Caching Strategy
- Redis for session storage
- CDN for static assets
- Application-level caching

## 🔄 Backup and Recovery

### Database Backups
```bash
# Automated backup script
kubectl create cronjob pg-backup \
  --image=postgres:15 \
  --schedule="0 2 * * *" \
  -- /bin/bash -c "pg_dump -h postgres-service -U username dbname > /backup/backup-$(date +%Y%m%d).sql"
```

### Application Data
- Regular file system snapshots
- Document uploads backup
- Configuration backup

This deployment setup provides a robust, scalable, and maintainable microservices architecture ready for production use across any cloud provider. 