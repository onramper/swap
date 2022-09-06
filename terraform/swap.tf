provider "aws" {
   region = "us-east-1"
}

resource "aws_s3_bucket" "swap_dev" {
  bucket = "swap_dev"
  acl    = public
}