# EventBridge rules for scheduled execution
resource "aws_cloudwatch_event_rule" "grass_canvas_schedule" {
  for_each = { for s in var.schedule_times : s.name => s }

  name                = "grass-canvas-${each.value.name}"
  description         = "Trigger Grass Canvas Lambda at ${each.value.hour}:${each.value.minute} UTC"
  schedule_expression = "cron(${each.value.minute} ${each.value.hour} * * ? *)"

  tags = {
    Name = "Grass Canvas Schedule - ${each.value.name}"
  }
}

# EventBridge targets
resource "aws_cloudwatch_event_target" "lambda_target" {
  for_each = { for s in var.schedule_times : s.name => s }

  rule      = aws_cloudwatch_event_rule.grass_canvas_schedule[each.key].name
  target_id = "GrassCanvasLambda"
  arn       = aws_lambda_function.grass_canvas.arn
}

# Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  for_each = { for s in var.schedule_times : s.name => s }

  statement_id  = "AllowExecutionFromEventBridge-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.grass_canvas.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.grass_canvas_schedule[each.key].arn
}
