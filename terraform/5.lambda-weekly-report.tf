data "aws_iam_policy_document" "assume_role_weekly_sender" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "iam_for_lambda_weekly_sender" {
  name               = "iam_for_lambda_weekly_sender"
  assume_role_policy = data.aws_iam_policy_document.assume_role_weekly_sender.json
}

resource "aws_iam_policy" "lambda_weekly_sender_policy" {
  name        = "lambda_weekly_sender_policy"
  description = "Allow Lambda to access Cost Explorer, SES, and CloudWatch Logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ce:GetCostAndUsage",
          "ce:GetCostForecast"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_weekly_sender_policy_attachment" {
  role       = aws_iam_role.iam_for_lambda_weekly_sender.name
  policy_arn = aws_iam_policy.lambda_weekly_sender_policy.arn
}

resource "aws_lambda_function" "lambda_weekly_sender" {
  filename         = data.archive_file.lambda_zip_weekly_sender.output_path
  function_name    = "cost-optimizer-weekly-sender"
  role             = aws_iam_role.iam_for_lambda_weekly_sender.arn
  handler          = "weekly-report.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip_weekly_sender.output_base64sha256
  runtime          = "python3.13"
  timeout          = 60

  environment {
    variables = {
      SENDER_EMAIL    = aws_ses_email_identity.reports_sender.email
      RECIPIENT_EMAIL = "indritferati04@gmail.com"
    }
  }
}

data "archive_file" "lambda_zip_weekly_sender" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/weekly-sender.zip"
  excludes    = ["costs-lambda.py", "reports-lambda.py"]
}

output "weekly_sender_lambda_arn" {
  description = "ARN of the weekly report sender Lambda function"
  value       = aws_lambda_function.lambda_weekly_sender.arn
}