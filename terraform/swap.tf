provider "aws" {
   region = "us-east-1"
}

resource "aws_s3_bucket" "onramper-swap-dev" {
  bucket = "onramper-swap-dev"
}

resource "aws_s3_bucket_public_access_block" "swap-dev-acl" {
  bucket = aws_s3_bucket.onramper-swap-dev.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}