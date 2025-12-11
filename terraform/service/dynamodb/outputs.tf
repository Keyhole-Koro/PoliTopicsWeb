output "table" {
  value = {
    name = var.create_dynamodb_table ? aws_dynamodb_table.politopics[0].name : data.aws_dynamodb_table.politopics[0].name
    arn  = var.create_dynamodb_table ? aws_dynamodb_table.politopics[0].arn : data.aws_dynamodb_table.politopics[0].arn
  }
}
