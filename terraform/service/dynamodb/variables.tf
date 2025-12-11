variable "table_name" {
  description = "Name of the DynamoDB table"
  type        = string
}

variable "create_dynamodb_table" {
  description = "Whether to create the DynamoDB table"
  type        = bool
  default     = false
}

variable "tags" {
  description = "A map of tags to assign to the resource"
  type        = map(string)
  default     = {}
}
