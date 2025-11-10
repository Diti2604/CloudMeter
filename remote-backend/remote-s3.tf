module "s3_bucket" {
  source = "terraform-aws-modules/s3-bucket/aws"
  region = "us-east-1"
  bucket = "my-remote-s3-bucket-5843205867340"
  acl    = "private"

  control_object_ownership = true
  object_ownership         = "ObjectWriter"

  versioning = {
    enabled = true
  }
}

output "s3-bucket-name" {
  value = "my-remote-s3-bucket-5843205867340"
}
