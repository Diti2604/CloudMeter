data "aws_iam_policy_document" "assume_role_audit" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "iam_for_lambda_audit" {
  name               = "iam_for_lambda_audit"
  assume_role_policy = data.aws_iam_policy_document.assume_role_audit.json
}

data "archive_file" "lambda_zip_audit" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/example.zip"
}

resource "aws_lambda_function" "lambda_audit" {
  filename         = data.archive_file.lambda_zip_audit.output_path
  function_name    = "cost-optimizer-audit"
  role             = aws_iam_role.iam_for_lambda_audit.arn
  handler          = "audit-lambda.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip_audit.output_base64sha256
  runtime          = "python3.13"
}

