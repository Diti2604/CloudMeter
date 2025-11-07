terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    tls = { 
    source = "hashicorp/tls", version = "~> 4.0" 
    }
    acme = { 
    source = "vancluever/acme", version = ">= 2.18.0" 
    }
  }
  backend "s3" {
     bucket = "my-s3-bucket-183945808571"

     key = "backend"
     region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  alias  = "us_east_1"
}

provider "acme" {
  server_url = "https://acme-v02.api.letsencrypt.org/directory"
}