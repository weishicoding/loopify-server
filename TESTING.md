# API Validation Test Suite

This document describes the comprehensive API validation test suite for the Express/GraphQL/TypeScript project. The test suite verifies that ALL endpoints are working without errors and provides comprehensive validation of the entire system.

## Overview

The test suite includes 8 major components:

1. **Environment Validation** - Validates external service connections
2. **API Integration Tests** - Tests all GraphQL endpoints with real database
3. **End-to-End Test Flows** - Complete user journey testing
4. **Error Scenario Testing** - Comprehensive error handling validation
5. **Load Testing** - Performance and scalability testing
6. **API Documentation Generator** - Auto-generated API docs
7. **Health Check Endpoints** - Monitoring and health validation
8. **CI/CD Ready Scripts** - Production-ready deployment pipeline

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- AWS credentials (for S3/SES testing)

### Environment Setup

1. Copy environment variables:
```bash
cp .env.example .env
```

2. Set required variables:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="your-bucket"
SES_FROM_EMAIL="noreply@yourdomain.com"
```

### Running Tests

```bash
# Quick validation (recommended first run)
npm run test:validate-env

# Individual test suites
npm run test:api-integration
npm run test:e2e
npm run test:error-scenarios
npm run test:load:quick

# Comprehensive test suite
npm run test:comprehensive

# CI/CD pipeline
./scripts/ci-cd-pipeline.sh full
```

## Test Components

### 1. Environment Validation (`src/test/validate-environment.ts`)

Validates all external service connections and environment configuration.

**What it tests:**
- Database connectivity and schema validation
- Redis connection and read/write operations
- AWS S3 bucket access
- AWS SES service availability
- Environment variable completeness

**Usage:**
```bash
npm run test:validate-env
# or
tsx src/test/validate-environment.ts
```

### 2. API Integration Tests (`src/test/api-integration.test.ts`)

Tests all GraphQL resolvers with real database operations.

**What it tests:**
- Authentication endpoints (sendEmailCode, loginWithCode)
- User queries and mutations (me, user, profile operations)
- Item CRUD operations
- Comment system
- File upload endpoints
- Messaging system

**Usage:**
```bash
npm run test:api-integration
# or
tsx src/test/api-integration.test.ts
```

### 3. End-to-End Test Flows (`src/test/e2e-flows.test.ts`)

Complete user journey testing from authentication to complex operations.

**Test flows:**
- Complete authentication flow
- Item creation and management
- Comment and interaction flows
- Messaging between users
- User profile and follow system

**Usage:**
```bash
npm run test:e2e
# or
tsx src/test/e2e-flows.test.ts
```

### 4. Error Scenario Testing (`src/test/error-scenarios.test.ts`)

Comprehensive testing of error conditions and security measures.

**What it tests:**
- Authentication errors (invalid tokens, missing auth)
- Input validation errors
- Security vulnerabilities (SQL injection, XSS prevention)
- Rate limiting and abuse prevention
- Database connection errors
- Resource access errors

**Usage:**
```bash
npm run test:error-scenarios
# or
tsx src/test/error-scenarios.test.ts
```

### 5. Load Testing (`src/test/load-test.ts`)

Performance and scalability testing using Artillery.

**Test scenarios:**
- Basic load testing (5-20 requests/second)
- Stress testing (50-200 requests/second)
- Spike testing (sudden traffic spikes)
- Authenticated endpoint testing

**Usage:**
```bash
# All load tests
npm run test:load

# Individual tests
npm run test:load:basic
npm run test:load:stress
npm run test:load:quick

# Direct execution
tsx src/test/load-test.ts [basic|stress|spike|auth|quick]
```

### 6. API Documentation Generator (`src/test/generate-api-docs.ts`)

Automatically generates comprehensive API documentation.

**Generated outputs:**
- `docs/api/api-reference.md` - Complete API documentation
- `docs/api/api-schema.json` - OpenAPI-compatible schema
- `docs/api/schema.graphql` - GraphQL schema SDL

**Usage:**
```bash
npm run docs:generate
# or
tsx src/test/generate-api-docs.ts
```

### 7. Health Check System (`src/health/health-check.ts`)

Production-ready health monitoring endpoints.

**Available endpoints:**
- `/health` - Comprehensive health check
- `/health?details=true` - Detailed service status
- `/health/quick` - Fast health check for load balancers
- `/health/ready` - Kubernetes readiness probe
- `/health/live` - Kubernetes liveness probe
- `/health/startup` - Kubernetes startup probe

**Usage:**
```bash
# Test health endpoint
npm run health:check
# or
curl http://localhost:4000/health
```

### 8. CI/CD Pipeline (`scripts/ci-cd-pipeline.sh`)

Production-ready CI/CD pipeline with multiple execution modes.

**Pipeline types:**
- `fast` - Quality checks + unit tests
- `validate` - Fast + environment validation
- `test` - Validate + integration/e2e/error tests
- `deploy` - Test + build + security + documentation
- `full` - Complete pipeline with load testing

**Usage:**
```bash
# Full pipeline
./scripts/ci-cd-pipeline.sh

# Specific pipeline
./scripts/ci-cd-pipeline.sh fast
./scripts/ci-cd-pipeline.sh validate
./scripts/ci-cd-pipeline.sh test
./scripts/ci-cd-pipeline.sh deploy

# CI mode (skips services that require external dependencies)
CI=true ./scripts/ci-cd-pipeline.sh validate
```

## Docker Support

### Development Testing

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d test-db test-redis

# Run comprehensive tests
docker-compose -f docker-compose.test.yml --profile testing up test-runner

# Run environment validation
docker-compose -f docker-compose.test.yml --profile validation up env-validator

# Run load tests
docker-compose -f docker-compose.test.yml --profile load-testing up load-tester
```

### Production Build

```bash
# Build production image
docker build -t your-app:latest .

# Build development image
docker build --target development -t your-app:dev .
```

## GitHub Actions CI/CD

The repository includes comprehensive GitHub Actions workflows:

- **Fast Checks** - Runs on every push/PR
- **Comprehensive Tests** - Runs with database services
- **Build and Security** - Build validation and security scanning
- **Documentation Generation** - Auto-generated API docs
- **Deployment Readiness** - Full validation for main branch
- **Performance Tests** - Scheduled load testing

## Test Results and Reports

All test results are saved to the `test-results/` directory:

```
test-results/
├── coverage/              # Jest coverage reports
├── load-tests/           # Artillery load test results
├── test-summary.md       # Overall test summary
└── *.json               # Individual test results
```

## Environment Variables for CI/CD

Control test execution with these environment variables:

```bash
CI=true                          # Enables CI mode
SKIP_ENV_VALIDATION=true        # Skips environment validation
SKIP_INTEGRATION_TESTS=true     # Skips integration tests
SKIP_E2E_TESTS=true            # Skips E2E tests
SKIP_ERROR_TESTS=true          # Skips error scenario tests
SKIP_LOAD_TESTS=true           # Skips load tests
SKIP_DOCS_GENERATION=true      # Skips documentation generation
```

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL format
   - Verify user permissions

2. **Redis connection failed**
   - Ensure Redis is running
   - Check REDIS_URL format
   - Verify network connectivity

3. **AWS services failing**
   - Check AWS credentials
   - Verify IAM permissions
   - Check S3 bucket exists and is accessible

4. **Load tests failing**
   - Ensure application is running
   - Check API_URL environment variable
   - Verify Artillery is installed

5. **Jest tests not running**
   - Check jest.config.cjs configuration
   - Ensure test files have correct extensions
   - Verify TypeScript setup

### Performance Considerations

- Integration tests require database connections
- Load tests can impact system performance
- E2E tests take longer to execute
- Documentation generation requires GraphQL introspection

## Contributing

When adding new features:

1. Add corresponding tests to integration test suite
2. Update error scenario tests for new error conditions
3. Add example queries to documentation generator
4. Update health checks if new services are added
5. Update CI/CD pipeline if new dependencies are required

## Security Considerations

The test suite includes security validation:

- SQL injection prevention testing
- Authentication/authorization testing
- Input validation testing
- Rate limiting testing
- Secret detection (when git-secrets is available)

Never commit real credentials or sensitive data to the test suite.