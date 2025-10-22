# Lambda function (managed by lambroll)
# This is a placeholder to manage Lambda permissions and triggers
# The actual function code is deployed via lambroll

resource "aws_lambda_function" "grass_canvas" {
  function_name = "grass-canvas-notifier"
  role          = aws_iam_role.lambda_role.arn

  # Placeholder image - will be replaced by lambroll
  package_type = "Image"
  image_uri    = "${aws_ecr_repository.grass_canvas.repository_url}:latest"

  timeout     = var.lambda_timeout
  memory_size = var.lambda_memory_size

  environment {
    variables = {
      GITHUB_USERNAME                      = var.github_username
      S3_BUCKET_NAME                       = aws_s3_bucket.grass_images.id
      SSM_GITHUB_TOKEN_PATH                = var.ssm_github_token_path
      SSM_LINE_CHANNEL_ACCESS_TOKEN_PATH   = var.ssm_line_channel_access_token_path
      SSM_LINE_USER_ID_PATH                = var.ssm_line_user_id_path
    }
  }

  tags = {
    Name = "Grass Canvas Notifier"
  }

  # Ignore changes to image_uri since it's managed by lambroll
  lifecycle {
    ignore_changes = [
      image_uri,
      environment,
    ]
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.grass_canvas.function_name}"
  retention_in_days = 7

  tags = {
    Name = "Grass Canvas Lambda Logs"
  }
}
