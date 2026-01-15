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

variable "redis_sku" {
  type        = string
  default     = "Basic"
  description = "The SKU of Redis to use. Possible values are `Basic`, `Standard` and `Premium`."
}

variable "network_prefix" {
  type        = string
  default     = "cft"
  description = "Prefix for shared network resources (e.g. cft)."
}

variable "subnet_name" {
  type        = string
  default     = "iaas"
  description = "Subnet used for the Redis private endpoint."
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
