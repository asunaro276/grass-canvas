variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "github_username" {
  description = "GitHub username"
  type        = string
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

# SSM Parameter Store paths
variable "ssm_github_token_path" {
  description = "SSM Parameter Store path for GitHub token (optional)"
  type        = string
  default     = "github-token"
}

variable "ssm_line_channel_access_token_path" {
  description = "SSM Parameter Store path for LINE channel access token"
  type        = string
  default     = "/grass-canvas/line-channel-access-token"
}

variable "ssm_line_user_id_path" {
  description = "SSM Parameter Store path for LINE user ID"
  type        = string
  default     = "/grass-canvas/line-user-id"
}
