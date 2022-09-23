provider "aws" {
   region = "us-east-1"
}

variable "website_root" {
  type        = string
  description = "Path to the root of website content"
  default     = "../iframe/build"
}

locals {
  website_files = fileset(var.website_root, "**")
  mime_types = jsondecode(file("/var/lib/jenkins/jobs/Swap/jobs/Swap-pre-production/workspace/terraform_dev//mime.json"))
}

resource "aws_s3_bucket" "onramper-swap-dev" {
  bucket = "onramper-swap-dev"
  acl    = "private" 
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

resource "aws_s3_bucket_policy" "b" {
  bucket = aws_s3_bucket.onramper-swap-dev.id

  policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Statement1",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::onramper-swap-dev/*"
        }
    ]
}
POLICY
}

resource "aws_s3_bucket_object" "object" {
  for_each = local.website_files
  bucket = "onramper-swap-dev"
  key    = each.key
  source = "${var.website_root}/${each.key}"
  etag = filemd5("${var.website_root}/${each.key}")
  acl         = "public-read"
  content_type = lookup(local.mime_types, regex("\\.[^.]+$", each.key), null)
}
