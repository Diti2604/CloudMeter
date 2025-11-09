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
