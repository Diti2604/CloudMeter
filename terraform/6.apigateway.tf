resource "aws_apigatewayv2_api" "api" {
  name          = "http-api"
  protocol_type = "HTTP"
}

output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = "${aws_apigatewayv2_api.api.api_endpoint}/prod"
}


# Costs Lambda Integration
resource "aws_apigatewayv2_integration" "api_costs" {
  api_id           = aws_apigatewayv2_api.api.id
  integration_type = "AWS_PROXY"
  description      = "Lambda example"
  integration_method = "POST"
  integration_uri  = aws_lambda_function.lambda_costs.invoke_arn
}

resource "aws_lambda_permission" "api_gw_costs" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_costs.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}
resource "aws_apigatewayv2_route" "api_costs" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "ANY /api/costs"
  target = "integrations/${aws_apigatewayv2_integration.api_costs.id}"
}
