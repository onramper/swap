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
  for_each = fileset("${path.module}/iframe/build/", "*")
  bucket = "onramper-swap-dev"
  key    = each.value
  source = "${path.module}/iframe/build/${each.value}"
  etag = filemd5("${path.module}/iframe/build/${each.value}")
}
