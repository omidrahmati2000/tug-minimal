# MyFuel - Digital Fleet Management Platform

A comprehensive NestJS-based backend system for managing fuel transactions, fleet cards, and organization balances. Built for the TUG Technical Assessment.

## 🚀 Features

### Core Functionality
- **🔐 JWT Authentication & Authorization** - Role-based access control (Super Admin, Organization Admin)
- **🏢 Organization Management** - Multi-tenant organization support with balance tracking
- **💳 Fleet Card Management** - Card lifecycle management with daily/monthly limits
- **⛽ Transaction Processing** - Real-time fuel transaction validation and processing
- **🔒 Concurrency Control** - Database-level locking to prevent double spending
- **📊 Redis Caching** - Performance optimization for frequently accessed data
- **🎯 Event-Driven Architecture** - Transaction events with listeners for notifications and analytics
- **🧪 Comprehensive Testing** - Unit tests and E2E tests with 60%+ coverage
- **📖 API Documentation** - Auto-generated Swagger documentation with typed Response DTOs
- **🔧 CI/CD Pipeline** - GitHub Actions for automated testing and deployment
- **🐳 Docker Support** - Full containerization with automatic database seeding

### Security Features
- Pessimistic locking for transaction processing
- API key authentication for fuel stations
- Input validation and sanitization
- Global exception handling
- Request/response logging

## 🏗️ Architecture

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Fuel Station  │    │   Admin Panel   │    │  Organization   │
│    (Webhook)    │    │  (Super Admin)  │    │     Admin       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │                      │                      │
          v                      v                      v
┌─────────────────────────────────────────────────────────────────┐
│                      NestJS API Gateway                        │
├─────────────────────────────────────────────────────────────────┤
│  Auth │ Users │ Organizations │ Cards │ Transactions │ Events  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          v                       v
┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │      Redis      │
│   (Database)    │    │    (Cache)      │
└─────────────────┘    └─────────────────┘
```

### Database Schema
```
Users ──────┐
            │
            v
Organizations ←──── Cards ←──── Transactions
            │                      │
            │                      v
            └──────────────→ Fuel Stations
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- npm or yarn

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd TUG-minimal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy `.env` file and update the values:

```bash
cp .env.example .env
```

Example `.env`:
```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=myfuel

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# API Keys for fuel stations
FUEL_STATION_API_KEYS=station_key_1,station_key_2,station_key_3
```

### 4. Database Setup
```bash
# Create database
createdb myfuel

# Run database migrations (tables will be created automatically due to synchronize: true in development)
npm run seed
```

### 5. Start the Application
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### 6. Access the Application
- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api

## 🧪 Testing

### Test Credentials (from seeder)
```
Super Admin: admin@myfuel.com / admin123
Acme Admin: admin@acme.com / acme123
Global Admin: admin@global.com / global123
Fast Admin: admin@fast.com / fast123
```

### Fuel Station API Keys
```
station_key_shell_001
station_key_bp_002
station_key_exxon_003
station_key_chevron_004
```

### Sample Cards for Testing
```
1234567890123456 - John Driver (Acme Corp)
1234567890123457 - Sarah Trucker (Acme Corp)
2234567890123456 - Mike Transport (Global Logistics)
2234567890123457 - Lisa Fleet (Global Logistics)
3234567890123456 - Tom Delivery (Fast Transport)
```

## 🐳 Docker Quick Start

### Development Environment
```bash
# Start with hot reload
npm run docker:dev

# Access services
# API: http://localhost:3001
# Swagger: http://localhost:3001/api  
# pgAdmin: http://localhost:5050 (dev@myfuel.com/dev123)

# Run seeder
npm run docker:seed:dev

# View logs
npm run docker:logs

# Stop
npm run docker:dev:down
```

### Production Environment  
```bash
# Start production stack
npm run docker:prod

# Access services
# API: http://localhost:3001  
# pgAdmin: http://localhost:5050 (admin@myfuel.com/secure-admin-password)

# Run seeder
npm run docker:seed:prod

# Stop
npm run docker:prod:down
```

## 📋 Test Flows

### Flow 1: Super Admin Operations
```bash
# Login as Super Admin
POST /auth/login
{
  "email": "admin@myfuel.com",
  "password": "admin123"
}

# Create Organization
POST /organizations
Authorization: Bearer <token>
{
  "name": "New Transport Co",
  "code": "NEWTRANS001",
  "balance": 15000.00
}

# Create User
POST /users
Authorization: Bearer <token>
{
  "email": "admin@newtrans.com",
  "password": "password123",
  "firstName": "New",
  "lastName": "Admin",
  "role": "organization_admin",
  "organizationId": "<organization-id>"
}

# Update Organization Balance
PUT /organizations/<org-id>/balance
Authorization: Bearer <token>
{
  "balance": 25000.00
}
```

### Flow 2: Organization Admin Operations
```bash
# Login as Organization Admin
POST /auth/login
{
  "email": "admin@acme.com",
  "password": "acme123"
}

# Create Fleet Card
POST /cards
Authorization: Bearer <token>
{
  "cardNumber": "4444555566667777",
  "holderName": "New Driver",
  "dailyLimit": 400.00,
  "monthlyLimit": 8000.00,
  "organizationId": "<org-id>"
}

# Update Card Limits
PUT /cards/<card-id>/limits
Authorization: Bearer <token>
{
  "dailyLimit": 600.00,
  "monthlyLimit": 12000.00
}

# View Organization Cards
GET /cards/organization/<org-id>
Authorization: Bearer <token>
```

### Flow 3: Fuel Station Transaction Processing
```bash
# Successful Transaction
POST /transactions/process
x-api-key: station_key_shell_001
{
  "cardNumber": "1234567890123456",
  "amount": 75.50,
  "transactionDate": "2024-01-15T10:30:00Z"
}

# Transaction exceeding card daily limit
POST /transactions/process
x-api-key: station_key_shell_001
{
  "cardNumber": "1234567890123456",
  "amount": 600.00,
  "transactionDate": "2024-01-15T11:30:00Z"
}

# Transaction exceeding organization balance
POST /transactions/process
x-api-key: station_key_shell_001
{
  "cardNumber": "1234567890123456",
  "amount": 100000.00,
  "transactionDate": "2024-01-15T12:30:00Z"
}
```

### Flow 4: Event System Testing

The application includes a comprehensive event system for transaction monitoring:

```bash
# Transaction events are automatically emitted during processing:
# - transaction.created - When a transaction is successfully processed
# - transaction.approved - When a transaction is approved
# - transaction.rejected - When a transaction is rejected (insufficient balance, limits exceeded)

# These events are captured by listeners for:
# - Logging and monitoring
# - Analytics processing
# - Future notification systems
```

### Flow 5: Double Spending Prevention Test
To test concurrent transactions:

1. **Setup**: Use two cards from the same organization with low organization balance
2. **Execute**: Send simultaneous requests to process transactions
3. **Verify**: Only transactions that don't exceed balance are approved

```bash
# Terminal 1
curl -X POST http://localhost:3000/transactions/process \
  -H "x-api-key: station_key_shell_001" \
  -H "Content-Type: application/json" \
  -d '{
    "cardNumber": "1234567890123456",
    "amount": 1000.00,
    "transactionDate": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'

# Terminal 2 (run simultaneously)
curl -X POST http://localhost:3000/transactions/process \
  -H "x-api-key: station_key_bp_002" \
  -H "Content-Type: application/json" \
  -d '{
    "cardNumber": "1234567890123457",
    "amount": 1000.00,
    "transactionDate": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

## 🧪 Running Tests

### Current Test Coverage
- **Statements**: 59.37%
- **Branches**: 32.65%
- **Functions**: 60.42%
- **Lines**: 59.74%

### Test Commands
```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch

# Docker environment testing
npm run docker:test
```

### Test Architecture
- **Repository Tests**: Complete coverage for all data access patterns
- **Service Tests**: Business logic validation with mocked dependencies
- **Controller Tests**: HTTP layer testing with role-based access control
- **E2E Tests**: Full integration testing through HTTP endpoints

## 📦 Available Scripts

```bash
npm run build         # Build the application
npm run start         # Start production server
npm run start:dev     # Start development server with hot reload
npm run start:debug   # Start server in debug mode
npm run lint          # Run ESLint
npm run test          # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run test:cov      # Run tests with coverage
npm run test:watch    # Run tests in watch mode
npm run seed          # Run database seeder

# Docker commands
npm run docker:dev    # Start development environment
npm run docker:prod   # Start production environment
npm run docker:test   # Run tests in Docker environment
npm run docker:seed:dev   # Run seeder in dev environment
npm run docker:seed:prod  # Run seeder in prod environment
```

## 🔧 Configuration

### Database Configuration
Located in `src/config/database.config.ts`:
- Supports PostgreSQL with TypeORM
- Auto-synchronization in development
- Migration support for production

### Redis Configuration
Located in `src/config/redis.config.ts`:
- Caching for performance optimization
- Session storage capabilities
- Job queue support

### JWT Configuration
Located in `src/config/jwt.config.ts`:
- Configurable secret and expiration
- Role-based token payload

### API Documentation Configuration
Located in `src/main.ts` and `nest-cli.json`:
- Automatic DTO introspection for Swagger
- Type-safe response schemas
- Enhanced API documentation with auth support

## 🏗️ Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── dto/             # Data transfer objects
│   ├── strategies/      # Passport strategies (JWT, Local)
│   └── guards/          # Authentication guards
├── users/               # User management module
├── organizations/       # Organization management module
├── cards/              # Fleet card management module
├── transactions/        # Transaction processing module
│   ├── events/         # Event system (events, listeners)
│   ├── listeners/      # Event listeners for transaction events
│   ├── dto/           # Transaction DTOs and response types
│   └── repositories/ # Data access layer
├── fuel-stations/      # Fuel station management
├── common/             # Shared components
│   ├── decorators/     # Custom decorators
│   ├── filters/        # Exception filters
│   ├── guards/         # Authorization guards
│   ├── interceptors/   # Request/response interceptors
│   ├── pipes/          # Validation pipes
│   ├── services/       # Shared services (Cache, Logger, etc.)
│   └── dto/           # Shared response DTOs
├── config/             # Configuration files
├── database/           # Database related files
│   └── seeders/       # Database seeders
└── main.ts            # Application entry point
```

## 🚀 Deployment

## 🐳 Docker Deployment

### Quick Start with Docker

#### Development Environment (with Hot Reload)
```bash
# Start development environment
npm run docker:dev

# View logs
npm run docker:logs

# Stop and remove containers
npm run docker:dev:down

# Run database seeder
npm run docker:seed:dev
```

#### Production Environment
```bash
# Start production environment
npm run docker:prod

# View logs
npm run docker:logs

# Stop and remove containers
npm run docker:prod:down

# Run database seeder
npm run docker:seed:prod
```

### Available Services

#### Development (Port 3001)
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api
- **pgAdmin**: http://localhost:5050
  - Email: dev@myfuel.com
  - Password: dev123
- **PostgreSQL**: Internal only (not exposed)
- **Redis**: Internal only (not exposed)

#### Production (Port 3001)
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api
- **pgAdmin**: http://localhost:5050
  - Email: admin@myfuel.com
  - Password: secure-admin-password
- **PostgreSQL**: Internal only (not exposed)
- **Redis**: Internal only (not exposed)

### Docker Configuration Files

#### Environment Files
- `.env.docker.dev` - Development environment variables
- `.env.docker.prod` - Production environment variables

#### Docker Files
- `Dockerfile` - Multi-stage production build
- `Dockerfile.dev` - Development with hot reload
- `docker-compose.dev.yml` - Development services
- `docker-compose.prod.yml` - Production services

### Docker Features

#### Security
- **Internal Networks**: Database and Redis are isolated from external access
- **Non-root User**: Application runs as non-privileged user
- **Multi-stage Build**: Minimal production image
- **Health Checks**: Automatic service health monitoring

#### Performance
- **Volume Optimization**: Efficient volume mounting for development
- **Layer Caching**: Optimized Docker layer caching
- **Resource Limits**: Configurable resource constraints

#### Development Features
- **Hot Reload**: Code changes are reflected immediately
- **Volume Mounting**: Source code is mounted for live updates
- **Debug Support**: Easy debugging with exposed ports
- **Database Access**: pgAdmin for database management
- **Automatic Seeding**: Database automatically seeded on startup
- **Event System**: Transaction events working in containerized environment

### Manual Docker Commands

#### Build Images
```bash
# Production build
docker build -t myfuel-api .

# Development build
docker build -f Dockerfile.dev -t myfuel-api:dev .
```

#### Run Containers
```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml --env-file .env.docker.dev up --build

# Production
docker-compose -f docker-compose.prod.yml --env-file .env.docker.prod up --build -d
```

#### Database Operations
```bash
# Run migrations (if needed)
docker-compose exec backend npm run typeorm migration:run

# Run seeder
docker-compose exec backend npm run seed

# Access database
docker-compose exec postgres psql -U postgres -d myfuel
```

### Environment Variables for Docker

#### Required Variables (.env.docker.prod)
```env
NODE_ENV=production
PORT=3001
DB_PASSWORD=your-secure-production-password
REDIS_PASSWORD=your-redis-password
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
PGADMIN_PASSWORD=secure-admin-password
```

#### Development Variables (.env.docker.dev)
```env
NODE_ENV=development
PORT=3001
DB_PASSWORD=postgres
JWT_SECRET=dev-secret-key-change-in-production
PGADMIN_PASSWORD=dev123
```

## 📊 Performance Considerations

### Database Optimization
- **Pessimistic Locking**: Prevents race conditions in transactions
- **Indexing**: Proper indexes on frequently queried fields
- **Connection Pooling**: Efficient database connection management

### Caching Strategy
- **Redis Integration**: Caching for user sessions and frequently accessed data
- **Cache Keys**: Organized cache key structure for easy invalidation
- **TTL Management**: Appropriate time-to-live for different data types

### Concurrency Control
- **Database Transactions**: ACID compliance for financial operations
- **Row-level Locking**: Granular locking to maximize concurrent operations
- **Retry Logic**: Handles temporary lock conflicts

## 🔍 Monitoring & Logging

### Logging
- **Structured Logging**: JSON formatted logs for easy parsing
- **Request Logging**: All HTTP requests are logged with timing
- **Error Tracking**: Comprehensive error logging with stack traces

### Health Checks
- Database connectivity
- Redis connectivity
- Application health endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the TUG Technical Assessment and is for evaluation purposes.

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Redis Connection Error**
   - Verify Redis is running
   - Check Redis configuration in `.env`

3. **Transaction Processing Issues**
   - Verify API key is correct
   - Check organization balance
   - Verify card limits and status

4. **Authentication Issues**
   - Ensure JWT secret is configured
   - Check token expiration
   - Verify user credentials

### Debug Mode
Run the application in debug mode to get detailed logs:
```bash
npm run start:debug
```

---

**Built with ❤️ for TUG Technical Assessment**

For any questions or issues, please check the API documentation at `/api` when the server is running.