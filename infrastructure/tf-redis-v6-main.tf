locals {
  is_prod                   = var.env == "prod"
  redis_memory_reserve_mb   = local.is_prod ? "642" : "200"
  redis_availability_zones  = local.is_prod ? ["1", "2", "3"] : null
}

module "redis-v6" {
  source        = "git@github.com:hmcts/cnp-module-redis?ref=master"
  product       = "${var.product}-${var.component}"
  location      = var.location
  env           = var.env
  subnetid      = data.azurerm_subnet.iaas.id
  common_tags   = var.common_tags
  business_area = "cft"
  redis_version = "6"
  sku_name      = var.sku_name
  family        = var.family
  capacity      = var.capacity
  availability_zones = local.redis_availability_zones

  private_endpoint_enabled      = true
  public_network_access_enabled = false

  maxmemory_reserved              = local.redis_memory_reserve_mb
  maxfragmentationmemory_reserved = local.redis_memory_reserve_mb
  maxmemory_delta                 = local.redis_memory_reserve_mb
}

module "keyvault_redis_v6_secrets" {
  source = "./modules/kv_secrets"

  key_vault_id = data.azurerm_key_vault.app_kv.id
  tags         = var.common_tags
  secrets = [
    {
      name  = "REDIS-V6-HOST"
      value = module.redis-v6.host_name
      tags = {
        "source" : "Redis"
      }
      content_type    = ""
      expiration_date = local.secret_expiry
    },
    {
      name  = "REDIS-V6-PORT"
      value = module.redis-v6.redis_port
      tags = {
        "source" : "Redis"
      }
      content_type    = "",
      expiration_date = local.secret_expiry
    },
    {
      name  = "REDIS-V6-PASSWORD"
      value = module.redis-v6.access_key
      tags = {
        "source" : "Redis"
      }
      content_type    = ""
      expiration_date = local.secret_expiry
    }
  ]

  depends_on = [
    module.redis-v6
  ]
}
