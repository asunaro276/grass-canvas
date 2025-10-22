terraform {
  required_version = ">= 1.0"
  
  backend "s3" {
    bucket = "tfstate-nakano"
    key = "grass-canvas.tfstate"
    region = "ap-northeast-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "grass-canvas"
      ManagedBy = "Terraform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
