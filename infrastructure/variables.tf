variable "product" {
  type = string
}

variable "component" {
  type = string
}

variable "location" {
  type    = string
  default = "UK South"
}

variable "env" {
  type = string
}

variable "common_tags" {
  type = map(string)
}

variable "sku_name" {
  type        = string
  default     = "Basic"
  description = "The SKU of Redis to use. Possible values are `Basic`, `Standard` and `Premium`."
}

variable "family" {
  type        = string
  default     = "C"
  description = "The SKU family/pricing group to use. Valid values are `C` (Basic/Standard) and `P` (Premium)."
}

variable "capacity" {
  type        = string
  default     = "1"
  description = "The size of the Redis cache to deploy. Valid values are 1, 2, 3, 4, 5"
}

variable "key_vault_name" {
  type        = string
  default     = ""
  description = "Existing Key Vault name. Defaults to <product>-kv-<env> when empty."
}

variable "key_vault_resource_group_name" {
  type        = string
  default     = ""
  description = "Resource group containing the Key Vault. Defaults to <product>-<env>-rg when empty."
}
