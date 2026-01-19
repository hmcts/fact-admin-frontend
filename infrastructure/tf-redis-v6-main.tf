module "redis-v6" {
  source             = "git@github.com:hmcts/cnp-module-redis?ref=master"
  product            = "${var.product}-${var.component}"
  location           = var.location
  env                = var.env
  subnetid           = data.azurerm_subnet.iaas.id
  common_tags        = var.common_tags
  business_area      = "cft"
  redis_version      = "6"
  sku_name           = var.sku_name
  family             = var.family
  capacity           = var.capacity
  availability_zones = var.env == "prod" ? ["1", "2", "3"] : null

  private_endpoint_enabled      = true
  public_network_access_enabled = false

  maxmemory_reserved              = var.env == "prod" ? "642" : "200"
  maxfragmentationmemory_reserved = var.env == "prod" ? "642" : "200"
  maxmemory_delta                 = var.env == "prod" ? "642" : "200"
}

resource "azurerm_key_vault_secret" "redis_v6_host" {
  name            = "REDIS-V6-HOST"
  value           = module.redis-v6.host_name
  key_vault_id    = data.azurerm_key_vault.app_kv.id
  content_type    = ""
  expiration_date = local.secret_expiry
  tags            = merge(var.common_tags, { source = "Redis" })
}

resource "azurerm_key_vault_secret" "redis_v6_port" {
  name            = "REDIS-V6-PORT"
  value           = module.redis-v6.redis_port
  key_vault_id    = data.azurerm_key_vault.app_kv.id
  content_type    = ""
  expiration_date = local.secret_expiry
  tags            = merge(var.common_tags, { source = "Redis" })
}

resource "azurerm_key_vault_secret" "redis_v6_password" {
  name            = "REDIS-V6-PASSWORD"
  value           = module.redis-v6.access_key
  key_vault_id    = data.azurerm_key_vault.app_kv.id
  content_type    = ""
  expiration_date = local.secret_expiry
  tags            = merge(var.common_tags, { source = "Redis" })
}
