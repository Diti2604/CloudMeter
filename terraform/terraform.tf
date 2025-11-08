terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    tls = { 
    source = "hashicorp/tls", version = "~> 4.0" 
    }
  }
  backend "s3" {
     bucket = "my-remote-s3-bucket-5843205867340"
     key = "backend"
     region = "eu-central-1"
  }
}

provider "aws" {
  alias  = "eu"
  region = "eu-central-1"
}
provider "aws" {
  alias  = "us"
  region = "us-east-1"
}
