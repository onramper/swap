terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "3.60.0"
    }
  }
}

provider "aws" {
   region = "us-east-1"
}

resource "aws_s3_bucket" "onramper-swap-dev" {
  bucket = "onramper-swap-dev"
  acl    = "public-read" 
  tags = {
    Name        = "swap"
    Environment = "Dev"
  }
}

resource "aws_s3_bucket_object" "object" {
  for_each = fileset("${path.module}/iframe/build/", "**")
  bucket = "onramper-swap-dev"
  key    = each.key
  source = "${path.module}/iframe/build/${each.key}"
  etag = filemd5("${path.module}/iframe/build/${each.key}")
  acl         = "public-read"
}
