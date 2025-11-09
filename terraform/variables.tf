
variable "aws_region" {
  type        = string
  description = "Value for specifying AWS Region"
  default     = "eu-central-1"
}

variable "remote_backend_bucket_name" {
  description = "Name of the remote backend S3 bucket which will hold reports (reports/week1, reports/week2)"
  type        = string
  default     = "my-remote-s3-bucket-5843205867340" 
}