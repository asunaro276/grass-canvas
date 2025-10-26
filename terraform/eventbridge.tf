# EventBridge Scheduler for scheduled execution
# IAM role for EventBridge Scheduler
resource "aws_iam_role" "scheduler_role" {
  name = "grass-canvas-scheduler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "scheduler.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "Grass Canvas Scheduler Role"
  }
}

# IAM policy to allow Scheduler to invoke Lambda
resource "aws_iam_role_policy" "scheduler_lambda_invoke" {
  name = "scheduler-lambda-invoke"
  role = aws_iam_role.scheduler_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = "lambda:InvokeFunction"
      Effect   = "Allow"
      Resource = aws_lambda_function.grass_canvas.arn
    }]
  })
}

# EventBridge Scheduler schedules
resource "aws_scheduler_schedule" "grass_canvas_schedule" {
  for_each = { for s in var.schedule_times : s.name => s }

  name        = "grass-canvas-${each.value.name}"
  description = "Trigger Grass Canvas Lambda at ${each.value.hour}:${each.value.minute} JST"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(${each.value.minute} ${each.value.hour} * * ? *)"
  schedule_expression_timezone = "Asia/Tokyo"

  target {
    arn      = aws_lambda_function.grass_canvas.arn
    role_arn = aws_iam_role.scheduler_role.arn

    retry_policy {
      maximum_retry_attempts       = 2
      maximum_event_age_in_seconds = 3600
    }
  }

  state = "ENABLED"
}
