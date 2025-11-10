
resource "aws_ses_email_identity" "reports_sender" {
  email = "indritferati04@gmail.com"  
}

resource "aws_ses_configuration_set" "reports" {
  name = "cost-optimizer-reports"
}

output "ses_sender_email" {
  description = "SES sender email address"
  value       = aws_ses_email_identity.reports_sender.email
}