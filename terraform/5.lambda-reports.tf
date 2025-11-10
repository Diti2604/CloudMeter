data "aws_iam_policy_document" "assume_role_reports" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "iam_for_lambda_reports" {
  name               = "iam_for_lambda_reports"
  assume_role_policy = data.aws_iam_policy_document.assume_role_reports.json
}

resource "aws_iam_policy" "lambda_reports_s3" {
  name        = "lambda_reports_s3_policy"
  description = "Allow Lambda to read from S3 reports bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::my-reports-bucket-ko01",
          "arn:aws:s3:::my-reports-bucket-ko01/*"
        ]
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

resource "aws_iam_role_policy_attachment" "lambda_reports_s3_policy" {
  role       = aws_iam_role.iam_for_lambda_reports.name
  policy_arn = aws_iam_policy.lambda_reports_s3.arn
}

data "archive_file" "lambda_zip_reports" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/example.zip"
}

resource "aws_lambda_function" "lambda_reports" {
  filename         = data.archive_file.lambda_zip_reports.output_path
  function_name    = "cost-optimizer-reports"
  role             = aws_iam_role.iam_for_lambda_reports.arn
  handler          = "reports-lambda.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip_reports.output_base64sha256
  runtime          = "python3.13"  
}
