.PHONY: help build docker-build docker-push deploy-lambda deploy-all tf-init tf-plan tf-apply tf-destroy setup-ssm clean

# Variables
AWS_REGION ?= ap-northeast-1
AWS_ACCOUNT_ID := $(shell aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY_NAME := grass-canvas
ECR_REPOSITORY_URL := $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com/$(ECR_REPOSITORY_NAME)
IMAGE_TAG ?= latest
GITHUB_USERNAME ?= $(shell grep github_username terraform/terraform.tfvars 2>/dev/null | cut -d'"' -f2)

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

build: ## Build TypeScript source
	npm run build

docker-build: build ## Build Docker image locally
	docker build -t $(ECR_REPOSITORY_NAME):$(IMAGE_TAG) .
	docker tag $(ECR_REPOSITORY_NAME):$(IMAGE_TAG) $(ECR_REPOSITORY_URL):$(IMAGE_TAG)

ecr-login: ## Login to ECR
	aws ecr get-login-password --region $(AWS_REGION) | \
		docker login --username AWS --password-stdin $(ECR_REPOSITORY_URL)

docker-push: ecr-login ## Push Docker image to ECR
	docker push $(ECR_REPOSITORY_URL):$(IMAGE_TAG)
	@echo "Image pushed: $(ECR_REPOSITORY_URL):$(IMAGE_TAG)"

deploy-lambda: ## Deploy Lambda function using lambroll
	@echo "Deploying Lambda function..."
	@export LAMBDA_ROLE_ARN=$$(cd terraform && terraform output -raw lambda_role_arn 2>/dev/null) && \
	export S3_BUCKET_NAME=$$(cd terraform && terraform output -raw s3_bucket_name 2>/dev/null) && \
	export GITHUB_USERNAME=$(GITHUB_USERNAME) && \
	export IMAGE_URI=$(ECR_REPOSITORY_URL):$(IMAGE_TAG) && \
	cd .lambroll && $(HOME)/.local/bin/lambroll deploy
	@echo "Lambda deployment completed!"

codebuild-start: ## Trigger CodeBuild to build and push Docker image
	@echo "Starting CodeBuild project..."
	@BUILD_ID=$$(aws codebuild start-build \
		--project-name grass-canvas-builder \
		--region $(AWS_REGION) \
		--query 'build.id' \
		--output text) && \
	echo "$$BUILD_ID" > .codebuild-id && \
	echo "Started build: $$BUILD_ID"

codebuild-wait: ## Wait for latest CodeBuild to complete
	@echo "Waiting for CodeBuild to complete..."
	@if [ ! -f .codebuild-id ]; then \
		echo "Error: No build ID found. Run 'make codebuild-start' first."; \
		exit 1; \
	fi
	@BUILD_ID=$$(cat .codebuild-id) && \
	echo "Monitoring build: $$BUILD_ID" && \
	while true; do \
		STATUS=$$(aws codebuild batch-get-builds \
			--ids "$$BUILD_ID" \
			--region $(AWS_REGION) \
			--query 'builds[0].buildStatus' \
			--output text 2>/dev/null || echo "ERROR"); \
		if [ "$$STATUS" = "ERROR" ] || [ "$$STATUS" = "None" ] || [ -z "$$STATUS" ]; then \
			echo "Failed to get build status. Retrying..."; \
			sleep 5; \
			continue; \
		fi; \
		echo "Current status: $$STATUS"; \
		if [ "$$STATUS" = "SUCCEEDED" ]; then \
			echo "CodeBuild completed successfully!"; \
			rm -f .codebuild-id; \
			break; \
		elif [ "$$STATUS" = "FAILED" ] || [ "$$STATUS" = "FAULT" ] || [ "$$STATUS" = "TIMED_OUT" ] || [ "$$STATUS" = "STOPPED" ]; then \
			echo "CodeBuild failed with status: $$STATUS"; \
			rm -f .codebuild-id; \
			exit 1; \
		fi; \
		sleep 10; \
	done

deploy-all: docker-build docker-push deploy-lambda ## Full deployment (build, push, deploy Lambda) - Local build
	@echo "✓ Full deployment completed successfully!"

deploy-all-codebuild: codebuild-start codebuild-wait deploy-lambda ## Full deployment using CodeBuild
	@echo "✓ Full deployment with CodeBuild completed successfully!"

tf-init: ## Initialize Terraform
	cd terraform && terraform init

tf-plan: ## Plan Terraform changes
	cd terraform && terraform plan

tf-apply: ## Apply Terraform changes
	cd terraform && terraform apply

tf-destroy: ## Destroy Terraform resources
	cd terraform && terraform destroy

setup-ssm: ## Setup SSM Parameter Store secrets
	@echo "Setting up SSM Parameter Store parameters..."
	./scripts/setup-ssm-parameters.sh

test-lambda: ## Test Lambda function locally (requires AWS SAM CLI)
	@echo "Testing Lambda function locally..."
	@echo "Note: This requires Docker and AWS SAM CLI to be installed"
	sam local invoke -t sam-template.yaml

clean: ## Clean build artifacts
	rm -rf dist/
	rm -rf lambda-package/

clean-all: clean ## Clean all artifacts including node_modules
	rm -rf node_modules/

.DEFAULT_GOAL := help
