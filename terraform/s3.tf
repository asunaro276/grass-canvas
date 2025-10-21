# S3 bucket for grass images
resource "aws_s3_bucket" "grass_images" {
  bucket = "grass-canvas-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "Grass Canvas Images"
  }
}

# Enable versioning (optional)
resource "aws_s3_bucket_versioning" "grass_images" {
  bucket = aws_s3_bucket.grass_images.id

  versioning_configuration {
    status = "Disabled"
  }
}

# Lifecycle rule to delete old images
resource "aws_s3_bucket_lifecycle_configuration" "grass_images" {
  bucket = aws_s3_bucket.grass_images.id

  rule {
    id     = "delete-old-images"
    status = "Enabled"

    expiration {
      days = 30
    }
  }
}

# CORS configuration
resource "aws_s3_bucket_cors_configuration" "grass_images" {
  bucket = aws_s3_bucket.grass_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

# Public access block configuration
resource "aws_s3_bucket_public_access_block" "grass_images" {
  bucket = aws_s3_bucket.grass_images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Bucket policy for public read access
resource "aws_s3_bucket_policy" "grass_images" {
  bucket = aws_s3_bucket.grass_images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.grass_images.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.grass_images]
}
