data "aws_iam_policy_document" "assume_role_costs" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "iam_for_lambda_costs" {
  name               = "iam_for_lambda_costs"
  assume_role_policy = data.aws_iam_policy_document.assume_role_costs.json
}

# IAM policy for Cost Explorer access
resource "aws_iam_policy" "lambda_cost_explorer" {
  name        = "lambda_cost_explorer_policy"
  description = "Allow Lambda to access AWS Cost Explorer"

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
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Attach Cost Explorer policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_costs_ce_policy" {
  role       = aws_iam_role.iam_for_lambda_costs.name
  policy_arn = aws_iam_policy.lambda_cost_explorer.arn
}

data "archive_file" "lambda_zip_costs" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/example.zip"
}

resource "aws_lambda_function" "lambda_costs" {
  filename         = data.archive_file.lambda_zip_costs.output_path
  function_name    = "cost-optimizer-costs"
  role             = aws_iam_role.iam_for_lambda_costs.arn
  handler          = "costs-lambda.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip_costs.output_base64sha256
  runtime          = "python3.13"
}

