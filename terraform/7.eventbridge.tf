resource "aws_cloudwatch_event_rule" "weekly_report_schedule" {
  name                = "cost-optimizer-weekly-report"
  description         = "Trigger weekly cost report every Monday at 9 AM UTC"
  schedule_expression = "cron(0 9 ? * MON *)"  # Every Monday at 9 AM 
}

resource "aws_cloudwatch_event_target" "weekly_report_target" {
  rule      = aws_cloudwatch_event_rule.weekly_report_schedule.name
  target_id = "WeeklyReportLambda"
  arn       = aws_lambda_function.lambda_weekly_sender.arn
}

resource "aws_lambda_permission" "allow_eventbridge_weekly" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_weekly_sender.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.weekly_report_schedule.arn
}

output "eventbridge_rule_name" {
  description = "Name of the EventBridge rule for weekly reports"
  value       = aws_cloudwatch_event_rule.weekly_report_schedule.name
}