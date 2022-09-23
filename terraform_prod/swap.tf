provider "aws" {
   region = "us-east-1"
}

variable "website_root" {
  type        = string
  description = "Path to the root of website content"
  default     = "/var/lib/jenkins/jobs/Swap/jobs/Swap-production/workspace/iframe/build"
}

locals {
  website_files = fileset(var.website_root, "**")
  mime_types = jsondecode(file("/var/lib/jenkins/jobs/Swap/jobs/Swap-production/workspace/terraform_prod/mime.json"))
}

resource "aws_s3_bucket" "onramper-swap-prod" {
  bucket = "onramper-swap-prod"
  acl    = "private" 
  tags = {
    Name        = "swap"
    Environment = "Prod"
  }
  website {
    index_document = "index.html"
  }
}

output "website_endpoint" {
  value = aws_s3_bucket.onramper-swap-prod.website_endpoint
}

resource "aws_s3_bucket_policy" "b" {
  bucket = aws_s3_bucket.onramper-swap-prod.id

  policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Statement1",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::onramper-swap-prod/*"
        }
    ]
}
POLICY
}

resource "aws_s3_bucket_object" "object" {
  for_each = local.website_files
  bucket = "onramper-swap-prod"
  key    = each.key
  source = "${var.website_root}/${each.key}"
  etag = filemd5("${var.website_root}/${each.key}")
  acl         = "public-read"
  content_type = lookup(local.mime_types, regex("\\.[^.]+$", each.key), null)
}
