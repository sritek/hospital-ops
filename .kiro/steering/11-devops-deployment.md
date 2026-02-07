---
# DevOps and Deployment - Docker, Terraform, CI/CD, AWS
inclusion: fileMatch
fileMatchPattern: "**/infrastructure/**/*.tf, **/docker/**/*, **/.github/**/*.yml, **/Dockerfile"
---

# DevOps & Deployment Guide

## Overview

This document covers infrastructure and deployment patterns for Hospital-Ops including Docker containerization, Terraform IaC, CI/CD pipelines, and AWS deployment on ap-south-1 (Mumbai).

---

## 1. Docker Configuration

### API Dockerfile

```dockerfile
# infrastructure/docker/api/Dockerfile
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN corepack enable pnpm && pnpm --filter api build

# Production
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify
```

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma

USER fastify
EXPOSE 3001
ENV PORT=3001

CMD ["node", "dist/server.js"]

````

### Web Dockerfile

```dockerfile
# infrastructure/docker/web/Dockerfile
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable pnpm && pnpm --filter web build

# Production
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
````

### Worker Dockerfile

```dockerfile
# infrastructure/docker/worker/Dockerfile
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

COPY --from=deps /app/node_modules ./node_modules
COPY apps/api/dist ./dist
COPY apps/api/package.json ./

USER worker
CMD ["node", "dist/jobs/index.js"]
```

### Docker Compose (Development)

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: hospital_ops
      POSTGRES_PASSWORD: hospital_ops_dev
      POSTGRES_DB: hospital_ops
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hospital_ops"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: infrastructure/docker/api/Dockerfile
      target: deps
    command: pnpm --filter api dev
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://hospital_ops:hospital_ops_dev@postgres:5432/hospital_ops
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-secret-change-in-production
      NODE_ENV: development
    volumes:
      - ./apps/api:/app/apps/api
      - ./packages:/app/packages
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  web:
    build:
      context: .
      dockerfile: infrastructure/docker/web/Dockerfile
      target: deps
    command: pnpm --filter web dev
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001/v1
    volumes:
      - ./apps/web:/app/apps/web
      - ./packages:/app/packages
      - /app/node_modules
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

---

## 2. Terraform Infrastructure

### Project Structure

```
infrastructure/terraform/
├── modules/
│   ├── vpc/
│   ├── ecs/
│   ├── rds/
│   ├── elasticache/
│   ├── alb/
│   ├── s3/
│   └── cloudfront/
├── environments/
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       └── terraform.tfvars
└── shared/
    └── backend.tf
```

### VPC Module

```hcl
# modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project}-${var.environment}-vpc"
    Environment = var.environment
    Project     = var.project
  }
}

# Public subnets (for ALB)
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project}-${var.environment}-public-${count.index + 1}"
    Type = "public"
  }
}

# Private subnets (for ECS, RDS)
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project}-${var.environment}-private-${count.index + 1}"
    Type = "private"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project}-${var.environment}-igw"
  }
}

# NAT Gateway
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? 1 : 0
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "${var.project}-${var.environment}-nat"
  }
}

# Route tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project}-${var.environment}-public-rt"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[0].id
    }
  }

  tags = {
    Name = "${var.project}-${var.environment}-private-rt"
  }
}
```

### ECS Module

```hcl
# modules/ecs/main.tf
resource "aws_ecs_cluster" "main" {
  name = "${var.project}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Environment = var.environment
    Project     = var.project
  }
}

# API Service
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project}-${var.environment}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "api"
      image = "${var.ecr_repository_url}:${var.api_image_tag}"

      portMappings = [
        {
          containerPort = 3001
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = var.environment },
        { name = "PORT", value = "3001" },
      ]

      secrets = [
        { name = "DATABASE_URL", valueFrom = "${var.secrets_arn}:DATABASE_URL::" },
        { name = "REDIS_URL", valueFrom = "${var.secrets_arn}:REDIS_URL::" },
        { name = "JWT_SECRET", valueFrom = "${var.secrets_arn}:JWT_SECRET::" },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.project}-${var.environment}/api"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}

resource "aws_ecs_service" "api" {
  name            = "${var.project}-${var.environment}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.api_target_group_arn
    container_name   = "api"
    container_port   = 3001
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}
```

### RDS Module

```hcl
# modules/rds/main.tf
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project}-${var.environment}-db-subnet"
  }
}

resource "aws_db_instance" "main" {
  identifier = "${var.project}-${var.environment}"

  engine         = "postgres"
  engine_version = "16.1"
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.database_name
  username = var.master_username
  password = var.master_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  multi_az               = var.environment == "production"
  publicly_accessible    = false
  deletion_protection    = var.environment == "production"
  skip_final_snapshot    = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.project}-${var.environment}-final" : null

  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn         = aws_iam_role.rds_monitoring.arn

  parameter_group_name = aws_db_parameter_group.main.name

  tags = {
    Environment = var.environment
    Project     = var.project
  }
}

resource "aws_db_parameter_group" "main" {
  family = "postgres16"
  name   = "${var.project}-${var.environment}"

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }
}
```

### Production Environment

```hcl
# environments/production/main.tf
terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    bucket         = "hospital-ops-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"

  default_tags {
    tags = {
      Project     = "hospital-ops"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}
```

module "vpc" {
source = "../../modules/vpc"

project = "hospital-ops"
environment = "production"
vpc_cidr = "10.0.0.0/16"
availability_zones = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
enable_nat_gateway = true
}

module "rds" {
source = "../../modules/rds"

project = "hospital-ops"
environment = "production"
private_subnet_ids = module.vpc.private_subnet_ids
vpc_id = module.vpc.vpc_id
instance_class = "db.r6g.large"
allocated_storage = 100
max_allocated_storage = 500
database_name = "hospital_ops"
master_username = var.db_username
master_password = var.db_password
}

module "elasticache" {
source = "../../modules/elasticache"

project = "hospital-ops"
environment = "production"
private_subnet_ids = module.vpc.private_subnet_ids
vpc_id = module.vpc.vpc_id
node_type = "cache.r6g.large"
num_cache_nodes = 2
}

module "ecs" {
source = "../../modules/ecs"

project = "hospital-ops"
environment = "production"
aws_region = "ap-south-1"
private_subnet_ids = module.vpc.private_subnet_ids
vpc_id = module.vpc.vpc_id
ecr_repository_url = var.ecr_repository_url
api_image_tag = var.api_image_tag
web_image_tag = var.web_image_tag
secrets_arn = var.secrets_arn
api_cpu = 1024
api_memory = 2048
api_desired_count = 3
web_cpu = 512
web_memory = 1024
web_desired_count = 2
api_target_group_arn = module.alb.api_target_group_arn
web_target_group_arn = module.alb.web_target_group_arn
}

````

---

## 3. CI/CD Pipelines

### GitHub Actions - CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '22'
  PNPM_VERSION: '9'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
````

test:
runs-on: ubuntu-latest
services:
postgres:
image: postgres:16
env:
POSTGRES_USER: test
POSTGRES_PASSWORD: test
POSTGRES_DB: hospital_ops_test
ports: - 5432:5432
options: >-
--health-cmd pg_isready
--health-interval 10s
--health-timeout 5s
--health-retries 5
redis:
image: redis:7
ports: - 6379:6379
steps: - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm db:migrate:test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/hospital_ops_test

      - run: pnpm test:coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/hospital_ops_test
          REDIS_URL: redis://localhost:6379

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

build:
runs-on: ubuntu-latest
needs: [lint, test]
steps: - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

````

### GitHub Actions - Deploy Staging

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging

on:
  push:
    branches: [develop]

env:
  AWS_REGION: ap-south-1
  ECR_REPOSITORY: hospital-ops
  ECS_CLUSTER: hospital-ops-staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
````

      - name: Build and push API image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY-api:$IMAGE_TAG \
            -f infrastructure/docker/api/Dockerfile .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY-api:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY-api:$IMAGE_TAG \
            $ECR_REGISTRY/$ECR_REPOSITORY-api:staging
          docker push $ECR_REGISTRY/$ECR_REPOSITORY-api:staging

      - name: Build and push Web image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY-web:$IMAGE_TAG \
            -f infrastructure/docker/web/Dockerfile .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY-web:$IMAGE_TAG

      - name: Run database migrations
        run: |
          aws ecs run-task \
            --cluster $ECS_CLUSTER \
            --task-definition hospital-ops-staging-migrate \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[${{ secrets.PRIVATE_SUBNETS }}],securityGroups=[${{ secrets.ECS_SG }}]}"

      - name: Deploy API to ECS
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service hospital-ops-staging-api \
            --force-new-deployment

      - name: Deploy Web to ECS
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service hospital-ops-staging-web \
            --force-new-deployment

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster $ECS_CLUSTER \
            --services hospital-ops-staging-api hospital-ops-staging-web

````

### GitHub Actions - Deploy Production

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production

on:
  push:
    tags:
      - 'v*'

env:
  AWS_REGION: ap-south-1
  ECR_REPOSITORY: hospital-ops
  ECS_CLUSTER: hospital-ops-production

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Get version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
````

      - name: Build and push images
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          VERSION: ${{ steps.version.outputs.VERSION }}
        run: |
          # API
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY-api:$VERSION \
            -f infrastructure/docker/api/Dockerfile .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY-api:$VERSION
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY-api:$VERSION \
            $ECR_REGISTRY/$ECR_REPOSITORY-api:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY-api:latest

          # Web
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY-web:$VERSION \
            -f infrastructure/docker/web/Dockerfile .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY-web:$VERSION

          # Worker
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY-worker:$VERSION \
            -f infrastructure/docker/worker/Dockerfile .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY-worker:$VERSION

      - name: Create deployment record
        run: |
          aws dynamodb put-item \
            --table-name deployments \
            --item '{
              "id": {"S": "${{ github.sha }}"},
              "version": {"S": "${{ steps.version.outputs.VERSION }}"},
              "environment": {"S": "production"},
              "timestamp": {"S": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"},
              "deployer": {"S": "${{ github.actor }}"}
            }'

      - name: Run database migrations
        run: |
          aws ecs run-task \
            --cluster $ECS_CLUSTER \
            --task-definition hospital-ops-production-migrate \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[${{ secrets.PRIVATE_SUBNETS }}],securityGroups=[${{ secrets.ECS_SG }}]}" \
            --wait

      - name: Deploy services
        run: |
          aws ecs update-service --cluster $ECS_CLUSTER --service hospital-ops-production-api --force-new-deployment
          aws ecs update-service --cluster $ECS_CLUSTER --service hospital-ops-production-web --force-new-deployment
          aws ecs update-service --cluster $ECS_CLUSTER --service hospital-ops-production-worker --force-new-deployment

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster $ECS_CLUSTER \
            --services hospital-ops-production-api hospital-ops-production-web hospital-ops-production-worker

      - name: Notify Slack
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Production deployment ${{ job.status }}: v${{ steps.version.outputs.VERSION }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Deployment*\nVersion: v${{ steps.version.outputs.VERSION }}\nStatus: ${{ job.status }}\nDeployer: ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

````

---

## 4. Monitoring & Alerts

### CloudWatch Alarms

```hcl
# modules/monitoring/alarms.tf
resource "aws_cloudwatch_metric_alarm" "api_cpu_high" {
  alarm_name          = "${var.project}-${var.environment}-api-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "API CPU utilization is high"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = "${var.project}-${var.environment}-api"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "${var.project}-${var.environment}-rds-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "RDS connections are high"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }
}
````
