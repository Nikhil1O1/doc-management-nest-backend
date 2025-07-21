# Document Management System

A comprehensive document management system built with NestJS backend and PostgreSQL database. This system provides user authentication, document upload/management, and integration points for RAG-based Q&A systems using a microservices architecture.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Performance](#performance)
- [Monitoring](#monitoring)
- [Contributing](#contributing)
- [License](#license)

## Architecture Overview

### Microservices Architecture

The system is designed with a microservices architecture pattern, featuring:

- **API Gateway**: Centralized routing and authentication
- **Auth Service**: JWT-based authentication with role-based authorization
- **Documents Service**: File upload, storage, and metadata management
- **Ingestion Service**: Job management for document processing pipeline
- **Infrastructure Services**: RabbitMQ, Consul, PostgreSQL per service

### Technology Stack

**Backend (NestJS)**
- Authentication: JWT-based authentication with role-based authorization
- User Management: Admin-only user management with role assignments
- Document Management: File upload, storage, and metadata management
- Ingestion Management: Job management for document processing pipeline
- Database: PostgreSQL with TypeORM
- API Documentation: Swagger/OpenAPI integration

**Infrastructure**
- Message Queue: RabbitMQ for event-driven communication
- Service Discovery: Consul for dynamic service location
- Monitoring: Prometheus, Grafana, Jaeger for observability
- Containerization: Docker with multi-stage builds
- Orchestration: Kubernetes with Helm charts

## Features

### Authentication & Authorization
- User registration and login
- JWT token-based authentication
- Role-based access control (Admin, Editor, Viewer)
- Protected routes and API endpoints
- Password hashing with bcrypt

### User Management
- Admin-only user management
- User role assignment
- User activation/deactivation
- User statistics and pagination
- Profile management

### Document Management
- File upload with validation
- Support for PDF, Word, Text, HTML, Markdown
- Document metadata management
- File size limits and type restrictions
- Document status tracking
- Download functionality
- Document statistics

### Ingestion Management
- Job creation and tracking
- Integration with Python backend
- Retry and cancellation functionality
- Job statistics and monitoring
- Asynchronous processing

### Technical Features
- PostgreSQL database with proper relationships
- TypeORM with migrations support
- Swagger API documentation
- Docker containerization
- Environment configuration
- Error handling and validation
- File upload with Multer
- CORS configuration
- Security headers with Helmet

## Project Structure

```
doc-management-nest-backend/
├── src/                              # NestJS backend source code
│   ├── auth/                         # Authentication module
│   │   ├── decorators/               # Custom decorators (roles, public)
│   │   ├── dto/                      # Data Transfer Objects
│   │   ├── guards/                   # Auth guards (JWT, local, roles)
│   │   ├── strategies/               # Passport strategies
│   │   ├── auth.controller.ts        # Auth endpoints
│   │   ├── auth.service.ts           # Auth business logic
│   │   └── auth.module.ts            # Auth module configuration
│   ├── users/                        # User management module
│   │   ├── dto/                      # User DTOs
│   │   ├── entities/                 # User entity
│   │   ├── users.controller.ts       # User endpoints
│   │   ├── users.service.ts          # User business logic
│   │   └── users.module.ts           # User module configuration
│   ├── documents/                    # Document management module
│   │   ├── dto/                      # Document DTOs
│   │   ├── entities/                 # Document entity
│   │   ├── documents.controller.ts   # Document endpoints
│   │   ├── documents.service.ts      # Document business logic
│   │   └── documents.module.ts       # Document module configuration
│   ├── ingestion/                    # Ingestion job management
│   │   ├── dto/                      # Ingestion DTOs
│   │   ├── entities/                 # Ingestion job entity
│   │   ├── ingestion.controller.ts   # Ingestion endpoints
│   │   ├── ingestion.service.ts      # Ingestion business logic
│   │   └── ingestion.module.ts       # Ingestion module configuration
│   ├── database/                     # Database configuration
│   │   └── data-source.ts            # TypeORM configuration
│   ├── app.controller.ts             # Application root controller
│   ├── app.module.ts                 # Application root module
│   ├── app.service.ts                # Application root service
│   └── main.ts                       # Application entry point
├── test/                             # End-to-end tests
│   ├── setup-e2e.ts                 # Test setup configuration
│   ├── documents.e2e-spec.ts        # Document upload tests
│   ├── ingestion.e2e-spec.ts        # Ingestion job tests
│   └── jest-e2e.json                # Jest E2E configuration
├── performance/                      # Performance testing
│   └── doc-upload.k6.js             # K6 load testing script
├── scripts/                          # Deployment scripts
│   ├── deploy-docker.sh             # Docker deployment script
│   ├── deploy-k8s.sh                # Kubernetes deployment script
│   └── health-check.sh              # Health check script
├── k8s/                              # Kubernetes manifests
│   ├── namespace.yaml               # Kubernetes namespace
│   ├── secrets.yaml                 # Kubernetes secrets
│   ├── auth-service.yaml            # Auth service deployment
│   ├── documents-service.yaml       # Documents service deployment
│   └── ingestion-service.yaml       # Ingestion service deployment
├── .github/                          # GitHub Actions workflows
│   └── workflows/
│       └── ci-cd.yml                # CI/CD pipeline
├── uploads/                          # File upload directory
├── data/                             # SQLite database for development
├── docker-compose.yml               # Original Docker Compose
├── docker-compose.microservices.yml # Microservices Docker Compose
├── Dockerfile.auth                   # Auth service Dockerfile
├── Dockerfile.documents             # Documents service Dockerfile
├── Dockerfile.ingestion             # Ingestion service Dockerfile
├── Dockerfile.gateway               # API Gateway Dockerfile
├── package.json                      # Backend dependencies
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # Project documentation
```

## Prerequisites

### Required Software
- **Node.js** (>= 18.0.0)
- **npm** (>= 8.0.0)
- **PostgreSQL** (>= 15.0) for production
- **Docker** (>= 20.0) and Docker Compose for containerized deployment
- **kubectl** (>= 1.24) for Kubernetes deployments

### Development Tools
- **Git** for version control
- **VS Code** or preferred IDE
- **Postman** or similar for API testing
- **jq** for JSON parsing in scripts

### Cloud Provider Setup (Optional)
- **AWS**: EKS cluster, ECR registry
- **Azure**: AKS cluster, ACR registry
- **GCP**: GKE cluster, GCR registry

## Installation & Setup

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd doc-management-nest-backend
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following environment variables:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=doc_management
   DB_PASSWORD=password
   DB_NAME=doc_management_db
   USE_POSTGRES=true
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=1d
   
   # Application Configuration
   PORT=3000
   NODE_ENV=development
   PYTHON_BACKEND_URL=http://localhost:8000
   ```

4. **Database setup**
   
   For PostgreSQL:
   ```bash
   # Create database
   createdb doc_management_db
   
   # Run migrations
   npm run migration:run
   ```
   
   For SQLite (development only):
   ```bash
   # Database will be created automatically
   mkdir -p data
   ```

5. **Start the development server**
   ```bash
   npm run start:dev
   ```

### Docker Setup

1. **Quick start with Docker Compose**
   ```bash
   # Make scripts executable
   chmod +x scripts/*.sh
   
   # Deploy all services
   ./scripts/deploy-docker.sh development
   ```

2. **Individual service setup**
   ```bash
   # Build specific service
   docker build -f Dockerfile.auth -t doc-management/auth-service .
   
   # Run with Docker Compose
   docker-compose -f docker-compose.microservices.yml up -d
   ```

## Development

### Running the Application

**Development mode:**
```bash
npm run start:dev
```

**Production mode:**
```bash
npm run build
npm run start:prod
```

**Debug mode:**
```bash
npm run start:debug
```

### Code Generation

**Generate new module:**
```bash
nest g module feature-name
nest g service feature-name
nest g controller feature-name
```

**Generate migrations:**
```bash
npm run migration:generate -- src/database/migrations/migration-name
```

### Code Quality

**Linting:**
```bash
npm run lint
npm run lint:fix
```

**Formatting:**
```bash
npm run format
```

### Database Operations

**Run migrations:**
```bash
npm run migration:run
```

**Revert migrations:**
```bash
npm run migration:revert
```

**Generate new migration:**
```bash
npm run migration:generate -- src/database/migrations/add-new-feature
```

## Testing

### Unit Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run specific E2E test suite
npm run test:e2e -- --testNamePattern="Documents"
```

### Performance Tests
```bash
# Install k6
brew install k6  # macOS
# or download from https://k6.io/docs/getting-started/installation/

# Get authentication token
TOKEN=$(curl -s -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@g.com","password":"admin123"}' | jq -r '.access_token')

# Run performance tests
k6 run performance/doc-upload.k6.js \
  -e BASE_URL=http://localhost:3000 \
  -e TOKEN=$TOKEN
```

### Test Coverage Goals
- Overall coverage: >= 70%
- Critical paths: >= 90%
- New features: >= 80%

## Deployment

### Docker Deployment

**Local deployment:**
```bash
./scripts/deploy-docker.sh development
```

**Production deployment:**
```bash
./scripts/deploy-docker.sh production
```

**Services available:**
- API Gateway: http://localhost:3000
- Auth Service: http://localhost:3001
- Documents Service: http://localhost:3002
- Ingestion Service: http://localhost:3003
- RabbitMQ UI: http://localhost:15672 (admin/admin123)
- Consul UI: http://localhost:8500
- Grafana: http://localhost:3001 (admin/admin123)
- Prometheus: http://localhost:9090

### Kubernetes Deployment

**Local cluster (minikube/kind):**
```bash
./scripts/deploy-k8s.sh development local
```

**AWS EKS:**
```bash
# Configure AWS CLI
aws configure

# Deploy to EKS
./scripts/deploy-k8s.sh production aws
```

**Azure AKS:**
```bash
# Login to Azure
az login

# Deploy to AKS
./scripts/deploy-k8s.sh production azure
```

**Google GKE:**
```bash
# Setup gcloud
gcloud auth login

# Deploy to GKE
./scripts/deploy-k8s.sh production gcp
```

### CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **On Pull Requests:**
   - Runs unit and E2E tests
   - Performs security scans
   - Generates test coverage reports

2. **On Push to `develop`:**
   - Builds and pushes Docker images
   - Deploys to staging environment
   - Runs smoke tests and performance tests

3. **On Push to `main`:**
   - Deploys to production environment
   - Runs health checks
   - Sends deployment notifications

**Required GitHub Secrets:**
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
SNYK_TOKEN
SLACK_WEBHOOK_URL
```

### Health Monitoring

**Check application health:**
```bash
./scripts/health-check.sh production
```

**Monitor specific services:**
```bash
# View logs
docker-compose -f docker-compose.microservices.yml logs -f auth-service

# Check service status
kubectl get pods -n doc-management

# Scale services
kubectl scale deployment auth-service --replicas=3 -n doc-management
```

## API Documentation

### Swagger Documentation
Access the interactive API documentation at:
- Development: http://localhost:3000/api/docs
- Production: https://api.docmanagement.com/api/docs

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
All protected endpoints require a Bearer token:
```bash
# Get token
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@g.com","password":"admin123"}'

# Use token
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/v1/documents"
```

### Key Endpoints

**Authentication:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get current user profile

**Users (Admin only):**
- `GET /users` - List users with pagination
- `POST /users` - Create new user
- `PATCH /users/:id/role` - Update user role

**Documents:**
- `POST /documents/upload` - Upload document
- `GET /documents` - List documents with pagination
- `GET /documents/:id/download` - Download document
- `DELETE /documents/:id` - Delete document

**Ingestion Jobs:**
- `POST /ingestion/jobs` - Create ingestion job
- `GET /ingestion/jobs` - List ingestion jobs
- `PATCH /ingestion/jobs/:id/retry` - Retry failed job

## Security

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Protected routes and API endpoints

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Rate limiting (configurable)

### Data Protection
- Input validation with class-validator
- SQL injection prevention with TypeORM
- File type and size validation
- Secure file storage

### Production Security Checklist
- [ ] Change default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS/TLS
- [ ] Configure firewalls
- [ ] Regular security updates
- [ ] Backup strategies
- [ ] Monitor security logs

## Performance

### Optimization Strategies
- Database connection pooling
- Redis caching (configurable)
- File compression
- CDN for static assets
- Load balancing with multiple replicas

### Monitoring & Metrics
- Prometheus metrics collection
- Grafana dashboards
- Application performance monitoring
- Resource usage tracking

### Scalability
- Horizontal scaling with Kubernetes
- Database read replicas
- Microservices architecture
- Event-driven communication

## Monitoring

### Application Monitoring
- **Grafana**: Visual dashboards and alerts
- **Prometheus**: Metrics collection and storage
- **Jaeger**: Distributed tracing

### Log Management
- Structured logging with Winston
- Centralized log aggregation
- Log retention policies

### Health Checks
- Application health endpoints
- Database connectivity checks
- External service monitoring
- Automated alerting

### Monitoring URLs
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090
- Jaeger: http://localhost:16686

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test && npm run test:e2e`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write comprehensive tests
- Document new features
- Follow conventional commit messages

### Pull Request Process
1. Ensure CI/CD pipeline passes
2. Update documentation if needed
3. Request review from maintainers
4. Address feedback and suggestions
5. Merge after approval

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Check the API documentation at `/api/docs`
- Review the troubleshooting section in deployment guide
- Create an issue in the repository
- Contact the development team

## Acknowledgments

- NestJS framework for the robust backend architecture
- Docker and Kubernetes for containerization
- All contributors and maintainers 