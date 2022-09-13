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
  for_each = fileset("iframe/build/", "*")
  bucket = aws_s3_bucket.onramper-swap-dev.id
  key    = "each.value"
  acl    = "public-read" 
  source = "iframe/build/${each.value}"
}