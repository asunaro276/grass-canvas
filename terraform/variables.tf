variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "github_username" {
  description = "GitHub username"
  type        = string
}

variable "github_token" {
  description = "GitHub personal access token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "line_channel_access_token" {
  description = "LINE Messaging API channel access token"
  type        = string
  sensitive   = true
}

variable "line_user_id" {
  description = "LINE user ID to send notifications"
  type        = string
  sensitive   = true
}

variable "lambda_memory_size" {
  description = "Lambda function memory size (MB)"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda function timeout (seconds)"
  type        = number
  default     = 30
}

variable "schedule_times" {
  description = "Cron schedule times (UTC)"
  type = list(object({
    name   = string
    hour   = string
    minute = string
  }))
  default = [
    {
      name   = "morning"
      hour   = "0"
      minute = "0"
    },
    {
      name   = "noon"
      hour   = "3"
      minute = "0"
    },
    {
      name   = "evening"
      hour   = "9"
      minute = "0"
    },
    {
      name   = "night"
      hour   = "12"
      minute = "0"
    }
  ]
}
