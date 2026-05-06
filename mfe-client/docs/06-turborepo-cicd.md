# Turborepo CI/CD Integration

## Overview

Integrating Turborepo with CI/CD pipelines dramatically improves build times through intelligent caching and parallel execution. This guide covers integration with popular CI/CD platforms.

## GitHub Actions

### Basic Setup

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  build:
    name: Build and Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm turbo build

      - name: Test
        run: pnpm turbo test

      - name: Lint
        run: pnpm turbo lint
```

### Advanced GitHub Actions Setup

```yaml
name: Advanced CI

on:
  push:
    branches: [main, develop]
  pull_request:

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}
  FORCE_COLOR: 1

jobs:
  # Detect changed packages
  changes:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.filter.outputs.changes }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            admin:
              - 'admin/**'
              - 'shared/**'
            dashboard:
              - 'dashboard/**'
              - 'shared/**'
            user:
              - 'user/**'
              - 'shared/**'
            host:
              - 'host/**'
              - 'shared/**'

  # Build only changed packages
  build:
    needs: changes
    if: ${{ needs.changes.outputs.packages != '[]' }}
    runs-on: ubuntu-latest

    strategy:
      matrix:
        package: ${{ fromJson(needs.changes.outputs.packages) }}

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build package
        run: pnpm turbo build --filter=${{ matrix.package }}

      - name: Test package
        run: pnpm turbo test --filter=${{ matrix.package }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.package }}-dist
          path: |
            ${{ matrix.package }}/dist
            ${{ matrix.package }}/build

  # Deploy to different environments
  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Download artifacts
        uses: actions/download-artifact@v3

      - name: Deploy to production
        run: |
          # Deploy logic here
          echo "Deploying to production..."
```

### GitHub Actions with Docker

```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.turbo
          push: true
          tags: |
            myapp/mfe:latest
            myapp/mfe:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            TURBO_TOKEN=${{ secrets.TURBO_TOKEN }}
            TURBO_TEAM=${{ vars.TURBO_TEAM }}
```

## GitLab CI

### Basic .gitlab-ci.yml

```yaml
image: node:18-alpine

variables:
  TURBO_TOKEN: ${CI_TURBO_TOKEN}
  TURBO_TEAM: ${CI_TURBO_TEAM}

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .pnpm-store/
    - .turbo/

before_script:
  - npm install -g pnpm
  - pnpm config set store-dir .pnpm-store
  - pnpm install --frozen-lockfile

stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - pnpm turbo build
  artifacts:
    paths:
      - '*/dist'
      - '*/build'
    expire_in: 1 week

test:
  stage: test
  script:
    - pnpm turbo test
  coverage: '/Lines\s*:\s*([0-9.]+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

lint:
  stage: test
  script:
    - pnpm turbo lint

deploy:
  stage: deploy
  script:
    - pnpm turbo deploy
  only:
    - main
  environment:
    name: production
    url: https://your-app.com
```

### GitLab CI with Parallel Jobs

```yaml
stages:
  - prepare
  - build
  - test
  - deploy

variables:
  TURBO_TOKEN: ${CI_TURBO_TOKEN}
  TURBO_TEAM: ${CI_TURBO_TEAM}
  FF_USE_FASTZIP: 'true'
  ARTIFACT_COMPRESSION_LEVEL: 'fast'

.base:
  image: node:18-alpine
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - .pnpm-store/
      - .turbo/
  before_script:
    - npm install -g pnpm turbo
    - pnpm config set store-dir .pnpm-store
    - pnpm install --frozen-lockfile

# Parallel package builds
build:admin:
  extends: .base
  stage: build
  script:
    - turbo run build --filter=admin
  artifacts:
    paths:
      - admin/dist/

build:dashboard:
  extends: .base
  stage: build
  script:
    - turbo run build --filter=dashboard
  artifacts:
    paths:
      - dashboard/dist/

build:user:
  extends: .base
  stage: build
  script:
    - turbo run build --filter=user
  artifacts:
    paths:
      - user/dist/

build:host:
  extends: .base
  stage: build
  needs:
    - build:admin
    - build:dashboard
    - build:user
  script:
    - turbo run build --filter=host
  artifacts:
    paths:
      - host/dist/
```

## Jenkins

### Jenkinsfile

```groovy
pipeline {
    agent any

    environment {
        TURBO_TOKEN = credentials('turbo-token')
        TURBO_TEAM = 'my-team'
        NODE_VERSION = '18'
    }

    tools {
        nodejs "${NODE_VERSION}"
    }

    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g pnpm turbo'
                sh 'pnpm install --frozen-lockfile'
            }
        }

        stage('Build') {
            steps {
                sh 'turbo run build --cache-dir=.turbo'
            }
        }

        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'turbo run test:unit'
                    }
                }
                stage('Lint') {
                    steps {
                        sh 'turbo run lint'
                    }
                }
                stage('Type Check') {
                    steps {
                        sh 'turbo run type-check'
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'turbo run deploy'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '**/dist/**', fingerprint: true
            publishHTML([
                reportDir: 'coverage',
                reportFiles: 'index.html',
                reportName: 'Coverage Report'
            ])
        }
    }
}
```

## CircleCI

### .circleci/config.yml

```yaml
version: 2.1

orbs:
  node: circleci/node@5.1.0

executors:
  node-executor:
    docker:
      - image: cimg/node:18.0
    working_directory: ~/repo

jobs:
  install:
    executor: node-executor
    steps:
      - checkout
      - restore_cache:
          keys:
            - pnpm-{{ checksum "pnpm-lock.yaml" }}
      - run:
          name: Install pnpm
          command: npm install -g pnpm
      - run:
          name: Install dependencies
          command: pnpm install --frozen-lockfile
      - save_cache:
          paths:
            - node_modules
            - ~/.pnpm-store
          key: pnpm-{{ checksum "pnpm-lock.yaml" }}
      - persist_to_workspace:
          root: .
          paths:
            - .

  build:
    executor: node-executor
    environment:
      TURBO_TOKEN: $TURBO_TOKEN
      TURBO_TEAM: $TURBO_TEAM
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Build
          command: npx turbo run build
      - persist_to_workspace:
          root: .
          paths:
            - '*/dist'
            - '*/build'

  test:
    executor: node-executor
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Test
          command: npx turbo run test -- --coverage
      - store_test_results:
          path: test-results
      - store_artifacts:
          path: coverage

  deploy:
    executor: node-executor
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Deploy
          command: npx turbo run deploy

workflows:
  version: 2
  build-test-deploy:
    jobs:
      - install
      - build:
          requires:
            - install
      - test:
          requires:
            - build
      - deploy:
          requires:
            - test
          filters:
            branches:
              only: main
```

## Docker Integration

### Dockerfile.turbo

```dockerfile
# Build stage
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm turbo

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY admin/package.json ./admin/
COPY dashboard/package.json ./dashboard/
COPY user/package.json ./user/
COPY host/package.json ./host/
COPY shared/package.json ./shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build with Turborepo
ARG TURBO_TOKEN
ARG TURBO_TEAM
ENV TURBO_TOKEN=${TURBO_TOKEN}
ENV TURBO_TEAM=${TURBO_TEAM}

RUN turbo run build

# Production stage for admin
FROM nginx:alpine AS admin
COPY --from=builder /app/admin/dist /usr/share/nginx/html
COPY admin/nginx.conf /etc/nginx/conf.d/default.conf

# Production stage for dashboard
FROM nginx:alpine AS dashboard
COPY --from=builder /app/dashboard/dist /usr/share/nginx/html
COPY dashboard/nginx.conf /etc/nginx/conf.d/default.conf

# Production stage for user
FROM nginx:alpine AS user
COPY --from=builder /app/user/dist /usr/share/nginx/html
COPY user/nginx.conf /etc/nginx/conf.d/default.conf

# Production stage for host
FROM nginx:alpine AS host
COPY --from=builder /app/host/dist /usr/share/nginx/html
COPY host/nginx.conf /etc/nginx/conf.d/default.conf
```

### Docker Compose

```yaml
version: '3.8'

services:
  admin:
    build:
      context: .
      dockerfile: Dockerfile.turbo
      target: admin
      args:
        TURBO_TOKEN: ${TURBO_TOKEN}
        TURBO_TEAM: ${TURBO_TEAM}
    ports:
      - '3001:80'

  dashboard:
    build:
      context: .
      dockerfile: Dockerfile.turbo
      target: dashboard
      args:
        TURBO_TOKEN: ${TURBO_TOKEN}
        TURBO_TEAM: ${TURBO_TEAM}
    ports:
      - '3002:80'

  user:
    build:
      context: .
      dockerfile: Dockerfile.turbo
      target: user
      args:
        TURBO_TOKEN: ${TURBO_TOKEN}
        TURBO_TEAM: ${TURBO_TEAM}
    ports:
      - '3003:80'

  host:
    build:
      context: .
      dockerfile: Dockerfile.turbo
      target: host
      args:
        TURBO_TOKEN: ${TURBO_TOKEN}
        TURBO_TEAM: ${TURBO_TEAM}
    ports:
      - '3000:80'
    depends_on:
      - admin
      - dashboard
      - user
```

## Kubernetes Deployment

### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mfe-admin
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mfe-admin
  template:
    metadata:
      labels:
        app: mfe-admin
    spec:
      containers:
        - name: admin
          image: myapp/mfe-admin:latest
          ports:
            - containerPort: 80
          env:
            - name: NODE_ENV
              value: 'production'
---
apiVersion: v1
kind: Service
metadata:
  name: mfe-admin-service
spec:
  selector:
    app: mfe-admin
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
```

## Performance Optimization

### 1. Cache Configuration

```yaml
# GitHub Actions cache
- uses: actions/cache@v3
  with:
    path: |
      .turbo
      node_modules/.cache
    key: ${{ runner.os }}-turbo-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-turbo-
```

### 2. Parallel Execution

```yaml
# Run tests in parallel
test:
  parallel:
    matrix:
      - admin
      - dashboard
      - user
      - host
  script:
    - turbo run test --filter=${{ matrix }}
```

### 3. Conditional Builds

```bash
# Only build changed packages
turbo run build --filter=[origin/main]

# Build and dependents
turbo run build --filter=...^[origin/main]
```

## Monitoring and Reporting

### Build Time Tracking

```yaml
- name: Track build time
  run: |
    START_TIME=$(date +%s)
    turbo run build
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    echo "Build took ${DURATION} seconds"

    # Send to monitoring service
    curl -X POST https://metrics.example.com/build-time \
      -H "Content-Type: application/json" \
      -d "{\"duration\": ${DURATION}, \"branch\": \"${GITHUB_REF}\"}"
```

### Cache Hit Rate

```yaml
- name: Report cache statistics
  run: |
    turbo run build --dry-run=json > turbo-dry-run.json
    CACHE_HITS=$(jq '[.tasks[] | select(.cache.status == "HIT")] | length' turbo-dry-run.json)
    TOTAL_TASKS=$(jq '.tasks | length' turbo-dry-run.json)
    HIT_RATE=$((CACHE_HITS * 100 / TOTAL_TASKS))
    echo "Cache hit rate: ${HIT_RATE}%"
```

## Security Best Practices

### 1. Secure Token Storage

```yaml
# Never hardcode tokens
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}  # GitHub
  TURBO_TOKEN: ${CI_TURBO_TOKEN}           # GitLab
  TURBO_TOKEN: $TURBO_TOKEN                # CircleCI
```

### 2. Dependency Scanning

```yaml
- name: Security scan
  run: |
    npm audit
    pnpm audit
    turbo run security-scan
```

### 3. Image Scanning

```yaml
- name: Scan Docker image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'myapp/mfe:${{ github.sha }}'
    format: 'sarif'
    output: 'trivy-results.sarif'
```

## Next Steps

- [Troubleshooting Guide](./07-troubleshooting.md)
- [Performance Tuning](./08-performance-tuning.md)
- [Advanced Patterns](./09-advanced-patterns.md)
