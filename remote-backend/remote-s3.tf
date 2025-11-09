module "s3_bucket" {
  source = "terraform-aws-modules/s3-bucket/aws"
  region = "eu-central-1"
  bucket = "my-remote-s3-bucket-5843205867340"
  acl    = "private"

  control_object_ownership = true
  object_ownership         = "ObjectWriter"

  versioning = {
    enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "reports_lifecycle" {
  bucket = module.s3_bucket.s3_bucket_id

  rule {
    id     = "reports-week2-expire"
    status = "Enabled"

    filter {
      prefix = "reports/week2/"
    }

    expiration {
      days = 7
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

output "s3-bucket-name" {
  value = "my-remote-s3-bucket-5843205867340"
}
