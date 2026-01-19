locals {
  key_vault_name                = "${var.product}-kv-${var.env}"
  key_vault_resource_group_name = data.azurerm_resource_group.fact_rg.name
  secret_expiry                 = timeadd(timestamp(), "17520h")
}

data "azurerm_key_vault" "app_kv" {
  name                = local.key_vault_name
  resource_group_name = local.key_vault_resource_group_name
}

data "azurerm_resource_group" "fact_rg" {
  name = "${var.product}-${var.env}"
}
