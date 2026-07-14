locals {
  key_vault_name                = "${var.product}-kv-${var.env}"
  key_vault_resource_group_name = data.azurerm_resource_group.fact_rg.name
  secret_expiry                 = timeadd(timestamp(), "17520h")
}

data "azurerm_key_vault" "app_kv" {
  name                = local.key_vault_name
  resource_group_name = local.key_vault_resource_group_name
}

data "azurerm_client_config" "current" {}

data "azurerm_user_assigned_identity" "jenkins_preview" {
  count               = var.env == "aat" ? 1 : 0
  name                = "jenkins-preview-mi"
  resource_group_name = "managed-identities-preview-rg"
}

data "azurerm_key_vault" "bootstrap" {
  count               = var.env == "aat" ? 1 : 0
  name                = "fact-bstrap-${var.env}-kv"
  resource_group_name = "fact-bstrap-${var.env}-rg"
}

resource "azurerm_key_vault_access_policy" "jenkins_preview" {
  count        = var.env == "aat" ? 1 : 0
  key_vault_id = data.azurerm_key_vault.bootstrap[0].id
  object_id    = data.azurerm_user_assigned_identity.jenkins_preview[0].principal_id
  tenant_id    = data.azurerm_client_config.current.tenant_id

  key_permissions         = ["Get", "List"]
  certificate_permissions = ["Get", "List"]
  secret_permissions      = ["Get", "List"]
}

data "azurerm_resource_group" "fact_rg" {
  name = "${var.product}-${var.env}"
}
