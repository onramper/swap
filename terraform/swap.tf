provider "aws" {
   region = "us-east-1"
}

resource "aws_s3_bucket" "swap" {
    bucket = "${var.bucket_name}" 
    acl = "${var.acl_value}"   
}

resource "aws_s3_bucket" "swap" {
  bucket = "swap_dev"
  acl    = public
}