provider "aws" {
   region = "us-east-1"
}

resource "aws_s3_bucket" "swap-dev" {
  bucket = "swap-dev"
}

resource "aws_s3_bucket_public_access_block" "swap-dev-acl" {
  bucket = aws_s3_bucket.swap-dev.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}