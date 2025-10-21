.PHONY: help build push deploy tf-init tf-plan tf-apply tf-destroy clean

# Variables
AWS_REGION ?= ap-northeast-1
AWS_ACCOUNT_ID := $(shell aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY := $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com/grass-canvas
IMAGE_TAG ?= latest

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

build: ## Build TypeScript source
	npm run build

docker-build: build ## Build Docker image
	docker build -t grass-canvas:$(IMAGE_TAG) .

ecr-login: ## Login to ECR
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_REPOSITORY)

docker-tag: ## Tag Docker image for ECR
	docker tag grass-canvas:$(IMAGE_TAG) $(ECR_REPOSITORY):$(IMAGE_TAG)

docker-push: ecr-login docker-tag ## Push Docker image to ECR
	docker push $(ECR_REPOSITORY):$(IMAGE_TAG)

tf-init: ## Initialize Terraform
	cd terraform && terraform init

tf-plan: ## Plan Terraform changes
	cd terraform && terraform plan

tf-apply: ## Apply Terraform changes
	cd terraform && terraform apply

tf-destroy: ## Destroy Terraform resources
	cd terraform && terraform destroy

lambroll-deploy: ## Deploy Lambda function using lambroll
	@export LAMBDA_ROLE_ARN=$$(cd terraform && terraform output -raw lambda_role_arn) && \
	export S3_BUCKET_NAME=$$(cd terraform && terraform output -raw s3_bucket_name) && \
	lambroll deploy --image-uri $(ECR_REPOSITORY):$(IMAGE_TAG)

deploy: docker-build docker-push lambroll-deploy ## Full deployment (build, push, deploy)
	@echo "Deployment completed successfully!"

clean: ## Clean build artifacts
	rm -rf dist/
	rm -rf node_modules/

.DEFAULT_GOAL := help
