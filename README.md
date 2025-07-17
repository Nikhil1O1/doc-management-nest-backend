# Document Management System with NestJS Backend

A comprehensive document management system built with NestJS backend, PostgreSQL database, and React frontend. This system provides user authentication, document upload/management, and integration points for RAG-based Q&A systems.

## 🏗️ Architecture

### Backend (NestJS)
- **Authentication**: JWT-based authentication with role-based authorization
- **User Management**: Admin-only user management with role assignments
- **Document Management**: File upload, storage, and metadata management
- **Ingestion Management**: Job management for document processing pipeline
- **Database**: PostgreSQL with TypeORM
- **API Documentation**: Swagger/OpenAPI integration

### Frontend (React)
- **Authentication**: Login/Register with protected routes
- **Dashboard**: Role-based dashboard with navigation
- **Document Interface**: Basic document management interface
- **User Management**: Admin interface for user management
- **Responsive Design**: Mobile-friendly interface

## 🚀 Features

### Authentication & Authorization
- ✅ User registration and login
- ✅ JWT token-based authentication
- ✅ Role-based access control (Admin, Editor, Viewer)
- ✅ Protected routes and API endpoints
- ✅ Password hashing with bcrypt

### User Management
- ✅ Admin-only user management
- ✅ User role assignment
- ✅ User activation/deactivation
- ✅ User statistics and pagination
- ✅ Profile management

### Document Management
- ✅ File upload with validation
- ✅ Support for PDF, Word, Text, HTML, Markdown
- ✅ Document metadata management
- ✅ File size limits and type restrictions
- ✅ Document status tracking
- ✅ Download functionality
- ✅ Document statistics

### Ingestion Management
- ✅ Job creation and tracking
- ✅ Integration with Python backend
- ✅ Retry and cancellation functionality
- ✅ Job statistics and monitoring
- ✅ Asynchronous processing

### Technical Features
- ✅ PostgreSQL database with proper relationships
- ✅ TypeORM with migrations support
- ✅ Swagger API documentation
- ✅ Docker containerization
- ✅ Environment configuration
- ✅ Error handling and validation
- ✅ File upload with Multer
- ✅ CORS configuration
- ✅ Security headers with Helmet

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### Quick Start with Docker

1. **Clone the repository**
```bash
git clone <repository-url>
cd doc-management-nest-backend
```

2. **Set up environment variables**
```bash
# Create .env file (optional - defaults provided)
cp .env.example .env
```

3. **Start with Docker Compose**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- NestJS backend on port 3000
- pgAdmin on port 5050 (optional, use `--profile debug`)

### Manual Setup

1. **Install dependencies**
```bash
npm install
cd frontend && npm install
```

2. **Set up PostgreSQL database**
```bash
# Create database
createdb doc_management_db
```

3. **Run database migrations**
```bash
npm run migration:run
```

4. **Start the backend**
```bash
npm run start:dev
```

5. **Start the frontend**
```bash
cd frontend
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Swagger Documentation
```
http://localhost:3000/api/docs
```

### Key Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get current user profile
- `POST /auth/refresh` - Refresh JWT token

#### Users (Admin only)
- `GET /users` - List users with pagination
- `POST /users` - Create new user
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `PATCH /users/:id/role` - Update user role
- `DELETE /users/:id` - Delete user
- `GET /users/stats` - User statistics

#### Documents
- `POST /documents/upload` - Upload document
- `GET /documents` - List documents with pagination
- `GET /documents/:id` - Get document by ID
- `GET /documents/:id/download` - Download document
- `PATCH /documents/:id` - Update document metadata
- `DELETE /documents/:id` - Delete document
- `GET /documents/stats` - Document statistics

#### Ingestion Jobs
- `POST /ingestion/jobs` - Create ingestion job
- `GET /ingestion/jobs` - List ingestion jobs
- `GET /ingestion/jobs/:id` - Get job by ID
- `PATCH /ingestion/jobs/:id/retry` - Retry failed job
- `PATCH /ingestion/jobs/:id/cancel` - Cancel job
- `GET /ingestion/jobs/stats` - Job statistics

## 🗄️ Database Schema

### Tables
- **users**: User accounts and authentication
- **documents**: Document metadata and file information
- **ingestion_jobs**: Document processing jobs

### Key Relationships
- Users can upload multiple documents
- Documents can have multiple ingestion jobs
- Ingestion jobs are triggered by users

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based authorization guards
- Input validation with class-validator
- File type and size validation
- CORS configuration
- Security headers with Helmet
- SQL injection prevention with TypeORM

## 🐳 Docker Configuration

### Services
- **postgres**: PostgreSQL 15 database
- **app**: NestJS application
- **pgadmin**: Database management tool (optional)

### Volumes
- `postgres_data`: Database persistence
- `uploads_data`: File upload persistence

### Environment Variables
```env
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
PYTHON_BACKEND_URL=http://python-backend:8000
PGADMIN_PASSWORD=admin_password
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Deployment

### Production Deployment

1. **Build the application**
```bash
npm run build
cd frontend && npm run build
```

2. **Set production environment variables**
```bash
export NODE_ENV=production
export JWT_SECRET=your-production-secret
export DB_PASSWORD=secure-password
```

3. **Deploy with Docker**
```bash
docker-compose -f docker-compose.yml up -d
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Application port | `3000` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_USERNAME` | Database user | `doc_management` |
| `DB_PASSWORD` | Database password | `password` |
| `DB_NAME` | Database name | `doc_management_db` |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | Token expiration | `1d` |
| `PYTHON_BACKEND_URL` | Python service URL | `http://localhost:8000` |

## 🔧 Development

### Project Structure
```
├── src/
│   ├── auth/          # Authentication module
│   ├── users/         # User management module
│   ├── documents/     # Document management module
│   ├── ingestion/     # Ingestion job management
│   ├── database/      # Database configuration
│   └── main.ts        # Application entry point
├── frontend/          # React frontend
├── uploads/           # File upload directory
├── docker-compose.yml # Docker configuration
└── Dockerfile         # Container configuration
```

### Adding New Features

1. Create module using NestJS CLI
```bash
nest g module feature-name
nest g service feature-name
nest g controller feature-name
```

2. Add entities and DTOs
3. Update module imports
4. Add tests
5. Update documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation at `/api/docs`
- Review the logs in Docker containers
- Ensure environment variables are properly configured

## 🔮 Future Enhancements

- Complete React frontend implementation
- Real-time updates with WebSockets
- Advanced file processing
- Search functionality
- Email notifications
- Audit logging
- Rate limiting
- File versioning
- Backup and restore functionality 