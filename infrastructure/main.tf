locals {
  key_vault_name                = var.key_vault_name != "" ? var.key_vault_name : "${var.product}-kv-${var.env}"
  key_vault_resource_group_name = var.key_vault_resource_group_name != "" ? var.key_vault_resource_group_name : "${var.product}-${var.env}-rg"
  secret_expiry                 = "2026-03-01T01:00:00Z"
}

data "azurerm_subnet" "iaas" {
  name                 = var.subnet_name
  resource_group_name  = "${var.network_prefix}-${var.env}-network-rg"
  virtual_network_name = "${var.network_prefix}-${var.env}-vnet"
}

data "azurerm_key_vault" "app_kv" {
  name                = local.key_vault_name
  resource_group_name = local.key_vault_resource_group_name
}
