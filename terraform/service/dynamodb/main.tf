data "aws_dynamodb_table" "articles" {
  name = var.articles_table
}
