output "table" {
  value = {
    name = aws_dynamodb_table.politopics.name
    arn  = aws_dynamodb_table.politopics.arn
  }
}
