provider "aws" {
   region = "us-east-1"
}

variable "website_root" {
  type        = string
  description = "Path to the root of website content"
  default     = "/var/lib/jenkins/workspace/Swap/Swap-pre-production/iframe/build"
}

resource "aws_s3_bucket" "onramper-swap-dev" {
  bucket = "onramper-swap-dev"
  acl    = "public-read" 
  tags = {
    Name        = "swap"
    Environment = "Dev"
  }
  website {
    index_document = "index.html"
  }
}

output "website_endpoint" {
  value = aws_s3_bucket.onramper-swap-dev.website_endpoint
}

resource "aws_s3_bucket_object" "object" {
  for_each = fileset(var.website_root, "**")
  bucket = "onramper-swap-dev"
  key    = each.key
  source = "${var.website_root}/${each.key}"
  etag = filemd5("${var.website_root}/${each.key}")
  acl         = "public-read"
}
