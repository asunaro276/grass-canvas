# ECR repository for Lambda container image
resource "aws_ecr_repository" "grass_canvas" {
  name                 = "grass-canvas"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "Grass Canvas Lambda Image"
  }
}

# Lifecycle policy to keep only recent images
resource "aws_ecr_lifecycle_policy" "grass_canvas" {
  repository = aws_ecr_repository.grass_canvas.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
