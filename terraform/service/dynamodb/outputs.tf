output "table" {
  value = {
    name = data.aws_dynamodb_table.articles.name
    arn  = data.aws_dynamodb_table.articles.arn
  }
}
